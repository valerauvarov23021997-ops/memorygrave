#!/usr/bin/env python3
"""Готовит данные съёмки для приложения: SQL для боевой базы и мок для демо.

    python3 tools/cemetery/export_app.py

Читает docs/cemetery/cemetery-wgs84.geojson (результат to_wgs84.py) и пишет:
  supabase/import-daymische.sql            — импорт в Supabase
  packages/api/src/mocks/cemeteryMap.json  — те же данные для режима моков

Из съёмки исключаются условные обозначения — вынесенный за пределы участка
образец оградки с номером-примером. Геодезист рисует их в стороне от плана,
поэтому отличаем по разрыву: объект дальше LEGEND_GAP от любого соседа не
может быть настоящим захоронением (реальные стоят вплотную, 5–7 м).
"""

import json
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / 'docs/cemetery/cemetery-wgs84.geojson'
SQL_OUT = ROOT / 'supabase/import-daymische.sql'
MOCK_OUT = ROOT / 'packages/api/src/mocks/cemeteryMap.json'

CEMETERY_ID = 'daymische'
CEMETERY_NAME = 'Кладбище д. Даймище'
CITY_ID = 'lenobl'
CITY_NAME = 'Ленинградская область'

LEGEND_GAP = 25.0  # метров до ближайшего соседа
MLAT = 111_320.0


def meters(a, b):
    """Расстояние между точками (lon, lat) на широте кладбища."""
    mlon = MLAT * math.cos(math.radians((a[1] + b[1]) / 2))
    return math.hypot((a[0] - b[0]) * mlon, (a[1] - b[1]) * MLAT)


def load():
    fc = json.loads(SRC.read_text(encoding='utf-8'))
    graves, plots, roads = [], [], []
    for f in fc['features']:
        kind = f['properties'].get('kind')
        if kind == 'grave' and f['properties'].get('number') is not None:
            graves.append(f)
        elif kind == 'plot':
            plots.append(f)
        elif kind == 'road':
            roads.append(f)
    return graves, plots, roads


def drop_legend(graves, plots):
    """Убирает условные обозначения — точки в стороне от массива и их оградки."""
    pts = [tuple(g['geometry']['coordinates']) for g in graves]
    keep, dropped = [], []
    for i, g in enumerate(graves):
        gap = min((meters(pts[i], pts[j]) for j in range(len(pts)) if j != i), default=0.0)
        (dropped if gap > LEGEND_GAP else keep).append((g, gap))
    for g, gap in dropped:
        print(f"  исключено условное обозначение: № {g['properties']['number']} ({gap:.0f} м от массива)")

    # Оградку образца отсеиваем по геометрии, а не по номеру: тот же номер
    # носит и настоящее захоронение, поэтому по номеру удалилось бы лишнее.
    alive = [tuple(g['geometry']['coordinates']) for g, _ in keep]
    survived = []
    for p in plots:
        ring = polygon(p)
        cx = sum(x for x, _ in ring) / len(ring)
        cy = sum(y for _, y in ring) / len(ring)
        if min(meters((cx, cy), a) for a in alive) > LEGEND_GAP:
            print(f"  исключена оградка условного обозначения: № {p['properties'].get('numbers')}")
        else:
            survived.append(p)
    return [g for g, _ in keep], survived


def polygon(feature):
    """Внешний контур полигона как список [lon, lat] с округлением до ~1 см."""
    ring = feature['geometry']['coordinates'][0]
    return [[round(x, 8), round(y, 8)] for x, y in ring]


def build_sql(graves, plots, roads):
    # контур привязываем к первому номеру участка: у оградки на несколько
    # захоронений он один на всех
    plot_by_num = {}
    for p in plots:
        nums = p['properties'].get('numbers') or []
        if nums and nums[0] not in plot_by_num:
            plot_by_num[nums[0]] = polygon(p)

    seen, rows = {}, []
    for g in graves:
        n = g['properties']['number']
        seen[n] = seen.get(n, 0) + 1
        pid = f'dm-{n}' if seen[n] == 1 else f'dm-{n}-{seen[n]}'
        lon, lat = g['geometry']['coordinates']
        poly = plot_by_num.get(n) if seen[n] == 1 else None
        pj = f"'{json.dumps(poly, separators=(',', ':'))}'::jsonb" if poly else 'null'
        rows.append(
            f"  ('{pid}', '{CEMETERY_ID}', {n}, {lat:.8f}, {lon:.8f}, {pj}, "
            f"{g['properties'].get('in_plot', 1)})"
        )

    road_rows = [
        f"  ('{CEMETERY_ID}', '{r['properties'].get('surface', 'ДОРОЖКА')}', "
        f"'{json.dumps(polygon(r), separators=(',', ':'))}'::jsonb)"
        for r in roads
    ]
    with_poly = sum(1 for r in rows if '::jsonb' in r)
    place_rows = ',\n'.join(rows)
    path_rows = ',\n'.join(road_rows)

    return f"""-- ============================================================
--  Кладбище д. Даймище (Гатчинский р-н, Лен. обл.) — импорт съёмки.
--  Источник: DWG-съёмка геодезиста, МСК-47 зона 2 → WGS-84.
--  Файл сгенерирован: tools/cemetery/export_app.py — правки вносите там.
--  Выполнить в Supabase → SQL Editor после setup.sql. Повторный
--  запуск безопасен.
-- ============================================================

-- Место захоронения — физическая точка на местности. Человек (graves)
-- привязывается к месту, когда появится ведомость с ФИО.
create table if not exists burial_places (
  id text primary key,
  cemetery_id text not null references cemeteries,
  number int not null,
  lat double precision not null,
  lng double precision not null,
  plot_polygon jsonb,
  graves_in_plot int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists burial_places_cemetery on burial_places (cemetery_id, number);

alter table burial_places enable row level security;
drop policy if exists burial_places_read on burial_places;
create policy burial_places_read on burial_places for select to authenticated using (true);

-- Дорожки и проезды — слой карты кладбища
create table if not exists cemetery_paths (
  id bigint generated always as identity primary key,
  cemetery_id text not null references cemeteries,
  surface text not null,
  polygon jsonb not null
);
alter table cemetery_paths enable row level security;
drop policy if exists cemetery_paths_read on cemetery_paths;
create policy cemetery_paths_read on cemetery_paths for select to authenticated using (true);

-- Привязка человека к месту захоронения
alter table graves add column if not exists burial_place_id text references burial_places;

-- Приложение показывает вход на карту только для кладбищ с этим флагом,
-- иначе пользователь упирается в пустой экран
alter table cemeteries add column if not exists has_map boolean not null default false;

-- ─── Справочники ───
insert into cities (id, name) values ('{CITY_ID}', '{CITY_NAME}')
  on conflict (id) do nothing;
insert into cemeteries (id, name, city_id, has_map)
values ('{CEMETERY_ID}', '{CEMETERY_NAME}', '{CITY_ID}', true)
  on conflict (id) do update set name = excluded.name, has_map = true;

-- Условные обозначения из чертежа больше не считаются захоронениями
delete from burial_places where id = 'dm-125-2';

-- ─── Места захоронений: {len(rows)} шт. ({with_poly} с контурами оградок) ───
insert into burial_places (id, cemetery_id, number, lat, lng, plot_polygon, graves_in_plot) values
{place_rows}
on conflict (id) do update set lat = excluded.lat, lng = excluded.lng,
  plot_polygon = excluded.plot_polygon, graves_in_plot = excluded.graves_in_plot;

-- ─── Дорожки и проезды: {len(road_rows)} шт. ───
delete from cemetery_paths where cemetery_id = '{CEMETERY_ID}';
insert into cemetery_paths (cemetery_id, surface, polygon) values
{path_rows};

-- ─── Контроль ───
-- select count(*) from burial_places where cemetery_id = '{CEMETERY_ID}';   -- {len(rows)}
-- select count(*) from burial_places where plot_polygon is not null;        -- {with_poly}
-- select count(*) from cemetery_paths where cemetery_id = '{CEMETERY_ID}';  -- {len(road_rows)}
"""


def build_mock(graves, plots, roads):
    """Компактный формат: ключи в одну букву — файл едет в бандл приложения."""
    nums = [g['properties']['number'] for g in graves]
    dup = {n for n in nums if nums.count(n) > 1}
    if dup:
        # id меток в моке — dm-<номер>, дубль сломал бы ключи списка
        raise SystemExit(f'номера повторяются, id меток будут неуникальны: {sorted(dup)}')
    thin = lambda ring: [[round(x, 7), round(y, 7)] for x, y in ring]  # noqa: E731
    return {
        'places': [
            {
                'n': g['properties']['number'],
                'la': round(g['geometry']['coordinates'][1], 6),
                'lo': round(g['geometry']['coordinates'][0], 6),
            }
            for g in graves
        ],
        # в моках контуры лежат отдельным слоем: связывать их с местами не нужно
        'plots': [thin(polygon(p)) for p in plots],
        'paths': [{'s': r['properties'].get('surface', 'ДОРОЖКА'), 'p': thin(polygon(r))} for r in roads],
    }


def main():
    graves, plots, roads = load()
    print(f'из съёмки: {len(graves)} захоронений, {len(plots)} оградок, {len(roads)} дорожек')
    graves, plots = drop_legend(graves, plots)
    print(f'к загрузке: {len(graves)} захоронений, {len(plots)} оградок')

    SQL_OUT.write_text(build_sql(graves, plots, roads), encoding='utf-8')
    MOCK_OUT.write_text(
        json.dumps(build_mock(graves, plots, roads), ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8',
    )
    print(f'{SQL_OUT.relative_to(ROOT)} — {SQL_OUT.stat().st_size // 1024} КБ')
    print(f'{MOCK_OUT.relative_to(ROOT)} — {MOCK_OUT.stat().st_size // 1024} КБ')


if __name__ == '__main__':
    main()
