#!/usr/bin/env python3
"""Заводит людей на оцифрованные места захоронений.

    python3 tools/cemetery/import_names.py docs/cemetery/daymische-names.csv

Читает ведомость «номер места → ФИО → даты» и пишет
supabase/import-daymische-names.sql: записи в graves, привязанные к
burial_places, с координатами, подтянутыми с плана.

Формат CSV (разделитель — запятая, кодировка UTF-8, первая строка — заголовок):

    number,full_name,birth_date,death_date,note
    301,Иванов Иван Петрович,1937-05-12,2009-11-03,
    302,Иванова Мария Сергеевна,,2011-04-18,год рождения не читается

Обязательны только number и full_name. Пустая дата — так и запишется пустой:
на памятниках даты часто затёрты, и придумывать их нельзя.
Даты принимаются как ГГГГ-ММ-ДД и как ДД.ММ.ГГГГ.
"""

import csv
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PLACES = ROOT / 'supabase/import-daymische.sql'
OUT = ROOT / 'supabase/import-daymische-names.sql'
CEMETERY_ID = 'daymische'


def load_places():
    """Номер места → (id, широта, долгота) из уже готового импорта съёмки."""
    sql = PLACES.read_text(encoding='utf-8')
    rows = re.findall(r"\('(dm-[\w-]+)', 'daymische', (\d+), ([\d.]+), ([\d.]+),", sql)
    return {int(n): (pid, float(la), float(lo)) for pid, n, la, lo in rows}


def parse_date(raw):
    """ГГГГ-ММ-ДД или ДД.ММ.ГГГГ → ГГГГ-ММ-ДД. Пусто — значит неизвестно."""
    raw = (raw or '').strip()
    if not raw:
        return None
    if re.fullmatch(r'\d{4}-\d{2}-\d{2}', raw):
        return raw
    m = re.fullmatch(r'(\d{1,2})\.(\d{1,2})\.(\d{4})', raw)
    if m:
        d, mo, y = m.groups()
        return f'{y}-{int(mo):02d}-{int(d):02d}'
    raise SystemExit(f'не разобрать дату: {raw!r} — нужен формат ГГГГ-ММ-ДД или ДД.ММ.ГГГГ')


def esc(s):
    return s.replace("'", "''")


def main():
    if len(sys.argv) < 2:
        raise SystemExit('укажите CSV с ведомостью: python3 tools/cemetery/import_names.py <файл.csv>')
    src = pathlib.Path(sys.argv[1])
    places = load_places()
    print(f'мест на плане: {len(places)}')

    rows, skipped, seen = [], [], {}
    with src.open(encoding='utf-8-sig', newline='') as f:
        for i, rec in enumerate(csv.DictReader(f), start=2):
            name = (rec.get('full_name') or '').strip()
            num_raw = (rec.get('number') or '').strip()
            if not name or not num_raw:
                skipped.append(f'строка {i}: пустой номер или ФИО')
                continue
            num = int(num_raw)
            if num not in places:
                skipped.append(f'строка {i}: места № {num} нет на плане')
                continue

            pid, lat, lon = places[num]
            # на одном месте бывает несколько человек — родственные захоронения
            seen[num] = seen.get(num, 0) + 1
            gid = f'dg-{num}' if seen[num] == 1 else f'dg-{num}-{seen[num]}'
            bd = parse_date(rec.get('birth_date'))
            dd = parse_date(rec.get('death_date'))
            note = (rec.get('note') or '').strip()

            q = lambda v: f"'{esc(v)}'" if v else 'null'  # noqa: E731
            rows.append(
                f"  ('{gid}', '{esc(name)}', {q(bd)}, {q(dd)}, "
                f"'{CEMETERY_ID}', 'место № {num}', {lat:.8f}, {lon:.8f}, "
                f"'digitized', '{pid}', {q(note)})"
            )

    if not rows:
        raise SystemExit('нечего импортировать')
    for s in skipped:
        print(' пропуск —', s)

    body = ',\n'.join(rows)
    OUT.write_text(
        f"""-- ============================================================
--  Кладбище д. Даймище — люди на местах захоронений.
--  Источник: фотофиксация памятников, ведомость {src.name}.
--  Файл сгенерирован: tools/cemetery/import_names.py
--  Выполнить после import-daymische.sql. Повторный запуск безопасен.
-- ============================================================

-- Заметка о том, что не читается на памятнике: пригодится тому,
-- кто поедет уточнять на месте
alter table graves add column if not exists survey_note text;

-- ─── Люди: {len(rows)} записей ───
insert into graves (id, full_name, birth_date, death_date, cemetery_id, plot,
                    lat, lng, status, burial_place_id, survey_note) values
{body}
on conflict (id) do update set
  full_name = excluded.full_name,
  birth_date = excluded.birth_date,
  death_date = excluded.death_date,
  plot = excluded.plot,
  lat = excluded.lat,
  lng = excluded.lng,
  status = excluded.status,
  burial_place_id = excluded.burial_place_id,
  survey_note = excluded.survey_note;

-- ─── Контроль ───
-- select count(*) from graves where cemetery_id = 'daymische';  -- {len(rows)}
-- select full_name, plot from graves where cemetery_id = 'daymische' order by full_name;
""",
        encoding='utf-8',
    )
    print(f'записей: {len(rows)}, пропущено: {len(skipped)}')
    print(f'{OUT.relative_to(ROOT)} — {OUT.stat().st_size // 1024} КБ')


if __name__ == '__main__':
    main()
