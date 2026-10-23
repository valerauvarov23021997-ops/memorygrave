"""Готовит фото памятников для страниц памяти.

    python tools/cemetery/prepare_photos.py

Берёт снимки из photos/daymische/ по колонке photos ведомости, уменьшает
до 1280 px в photos/для-загрузки/ и пишет photos/photo-map.json
(dg-id → файлы, крупный план первым — он идёт в аватар карточки).
Повторяет правила import_names.py (пропуски, dg-N / dg-N-2), чтобы id
совпали с базой. Файлы загружает владелец в Supabase → Storage → monuments,
ссылки в graves.photos прописывает Claude (см. docs/HANDOFF.md).

Зависимость: pip install pillow
"""
import csv
import json
import pathlib
import re

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / 'photos/daymische'
OUT = ROOT / 'photos/для-загрузки'
OUT.mkdir(exist_ok=True)
MAX_SIDE = 1280
MAX_PER_PERSON = 4

rows = list(csv.DictReader((ROOT / 'docs/cemetery/daymische-names.csv').open(encoding='utf-8-sig', newline='')))
seen, mapping = {}, {}
for r in rows:
    name, num = (r['full_name'] or '').strip(), (r['number'] or '').strip()
    if not name or not num or '?' in name or len(name.split()) < 2:
        continue
    n = int(num)
    seen[n] = seen.get(n, 0) + 1
    gid = f'dg-{n}' if seen[n] == 1 else f'dg-{n}-{seen[n]}'
    files = [p.strip() for p in r['photos'].split(';') if p.strip()]
    # дубли вида «76 (1).jpg» — побайтовые копии, не нужны
    files = [f for f in dict.fromkeys(files) if not re.search(r' \(\d\)\.jpg$', f)]
    # крупный план надписи — первым: он идёт в круглый аватар карточки, обзор — следом
    files.sort(key=lambda f: 0 if re.search(r'-\d\.jpg$', f) else 1)
    mapping[gid] = files[:MAX_PER_PERSON]

need = sorted({f for fs in mapping.values() for f in fs})
missing = [f for f in need if not (SRC / f).exists()]
for f in need:
    dst = OUT / f
    if dst.exists() or not (SRC / f).exists():
        continue
    im = ImageOps.exif_transpose(Image.open(SRC / f)).convert('RGB')
    im.thumbnail((MAX_SIDE, MAX_SIDE))
    im.save(dst, 'JPEG', quality=80, optimize=True, progressive=True)

(ROOT / 'photos/photo-map.json').write_text(json.dumps(mapping, ensure_ascii=False, indent=1), encoding='utf-8')
size = sum((OUT / f).stat().st_size for f in need if (OUT / f).exists())
print(f'людей: {len(mapping)}, без фото: {sum(1 for v in mapping.values() if not v)}')
print(f'файлов: {len(need)}, отсутствуют: {missing}, объём: {size // 1024 // 1024} МБ')
