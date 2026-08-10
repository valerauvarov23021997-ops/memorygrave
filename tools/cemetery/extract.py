"""Разбор плана кладбища из DXF: участки, номера, дороги, съёмочные точки."""
import ezdxf, json, math

doc = ezdxf.readfile('cemetery.dxf')
msp = doc.modelspace()

def pts_of(pl):
    return [(round(p[0], 3), round(p[1], 3)) for p in pl.get_points()]

def centroid(poly):
    a = cx = cy = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % len(poly)]
        cr = x1 * y2 - x2 * y1
        a += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr
    if abs(a) < 1e-9:
        return (sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly))
    a *= 0.5
    return (cx / (6 * a), cy / (6 * a))

def area(poly):
    s = 0
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % len(poly)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2

def inside(pt, poly):
    x, y = pt; n = len(poly); ins = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            ins = not ins
        j = i
    return ins

plots = [{'poly': pts_of(e), 'handle': e.dxf.handle}
         for e in msp if e.dxf.layer == 'МОГИЛЫ' and e.dxftype() == 'LWPOLYLINE']
for p in plots:
    p['centroid'] = centroid(p['poly'])
    p['area'] = round(area(p['poly']), 2)

numbers = [{'n': int(e.text.strip()), 'xy': (e.dxf.insert[0], e.dxf.insert[1])}
           for e in msp if e.dxf.layer == 'название' and e.dxftype() == 'MTEXT' and e.text.strip().isdigit()]
counts = [{'c': int(e.text.strip()), 'xy': (e.dxf.insert[0], e.dxf.insert[1])}
          for e in msp if e.dxf.layer == 'кол-во могил' and e.text.strip().isdigit()]

def attach(items, key):
    """Привязка подписи к участку: внутри полигона, иначе к ближайшему центру."""
    hit = miss = 0
    for it in items:
        target = None
        for p in plots:
            if inside(it['xy'], p['poly']):
                target = p; hit += 1; break
        if target is None:
            target = min(plots, key=lambda p: (p['centroid'][0] - it['xy'][0]) ** 2 + (p['centroid'][1] - it['xy'][1]) ** 2)
            miss += 1
        target.setdefault(key, []).append(it[key[0] if key == 'nums' else 'c'] if key == 'nums' else it['c'])
    return hit, miss

hit_n = miss_n = 0
for it in numbers:
    tgt = next((p for p in plots if inside(it['xy'], p['poly'])), None)
    if tgt: hit_n += 1
    else:
        tgt = min(plots, key=lambda p: (p['centroid'][0]-it['xy'][0])**2 + (p['centroid'][1]-it['xy'][1])**2)
        miss_n += 1
    tgt.setdefault('nums', []).append(it['n'])

hit_c = miss_c = 0
for it in counts:
    tgt = next((p for p in plots if inside(it['xy'], p['poly'])), None)
    if tgt: hit_c += 1
    else:
        tgt = min(plots, key=lambda p: (p['centroid'][0]-it['xy'][0])**2 + (p['centroid'][1]-it['xy'][1])**2)
        miss_c += 1
    tgt.setdefault('counts', []).append(it['c'])

roads = {lay: [pts_of(e) for e in msp if e.dxf.layer == lay and e.dxftype() == 'LWPOLYLINE']
         for lay in ['ДОРОГА АСФ', 'ГРУНТОВАЯ ДОРОГА', 'ЩЕБЕНЬ']}
survey = [(round(e.dxf.location[0], 3), round(e.dxf.location[1], 3), round(e.dxf.location[2], 3))
          for e in msp if e.dxftype() == 'POINT']

print(f'участков: {len(plots)}')
print(f'номеров: {len(numbers)} (внутри полигона {hit_n}, привязано к ближайшему {miss_n})')
print(f'меток «кол-во»: {len(counts)} (внутри {hit_c}, к ближайшему {miss_c})')
with_num = [p for p in plots if p.get('nums')]
print(f'участков с номером: {len(with_num)}; без номера: {len(plots)-len(with_num)}')
multi = [p for p in plots if len(p.get('nums', [])) > 1]
print(f'участков с >1 номером: {len(multi)}')
print(f'дороги: ' + ', '.join(f'{k}: {len(v)}' for k, v in roads.items()))

json.dump({'plots': plots, 'roads': roads, 'survey': survey,
           'numbers': numbers, 'counts': counts}, open('cemetery.json', 'w'), ensure_ascii=False)
print('\n→ cemetery.json сохранён')
