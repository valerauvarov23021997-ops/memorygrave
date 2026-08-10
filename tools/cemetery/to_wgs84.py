"""Пересчёт съёмки из МСК-47 зона 2 (GS47Z2) в WGS-84. Результат — GeoJSON."""
import json, math
from pyproj import CRS, Transformer

MSK47_Z2 = ('+proj=tmerc +lat_0=0 +lon_0=30.95 +k=1 +x_0=2250000 +y_0=-6211057.628 '
            '+ellps=krass +towgs84=23.57,-140.95,-79.8,0,0.35,0.79,-0.22 +units=m +no_defs')
TR = Transformer.from_crs(CRS.from_proj4(MSK47_Z2), CRS.from_epsg(4326), always_xy=True)

def wgs(x, y):
    lon, lat = TR.transform(x, y)
    return [round(lon, 8), round(lat, 8)]

def minrect(poly):
    best = None
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i+1) % n]
        if abs(x2-x1) < 1e-9 and abs(y2-y1) < 1e-9: continue
        a = math.atan2(y2-y1, x2-x1)
        ca, sa = math.cos(-a), math.sin(-a)
        us = [p[0]*ca - p[1]*sa for p in poly]; vs = [p[0]*sa + p[1]*ca for p in poly]
        w, h = max(us)-min(us), max(vs)-min(vs)
        if best is None or w*h < best[0]:
            best = (w*h, a, w, h, (min(us)+max(us))/2, (min(vs)+max(vs))/2)
    _, a, w, h, uc, vc = best
    ca, sa = math.cos(a), math.sin(a)
    return uc*ca - vc*sa, uc*sa + vc*ca, w, h, a

src = json.load(open('cemetery.json'))
feats = []
graves = []
for plot in src['plots']:
    cx, cy, w, h, ang = minrect(plot['poly'])
    nums = plot.get('nums', []) or [None]
    n = len(nums)
    across, along = (w, h) if w <= h else (h, w)
    swap = w > h
    for i, num in enumerate(nums):
        off = (i - (n-1)/2) * (across / n)
        du, dv = (0, off) if swap else (off, 0)
        ca, sa = math.cos(ang), math.sin(ang)
        gx, gy = cx + du*ca - dv*sa, cy + du*sa + dv*ca
        lon, lat = wgs(gx, gy)
        graves.append(dict(number=num, lon=lon, lat=lat))
        feats.append({'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [lon, lat]},
                      'properties': {'kind': 'grave', 'number': num,
                                     'plot_area': plot['area'], 'in_plot': n}})
    feats.append({'type': 'Feature',
                  'geometry': {'type': 'Polygon', 'coordinates': [[wgs(*p) for p in plot['poly']] + [wgs(*plot['poly'][0])]]},
                  'properties': {'kind': 'plot', 'numbers': [x for x in nums if x], 'area': plot['area']}})

for lay, rs in src['roads'].items():
    for r in rs:
        feats.append({'type': 'Feature',
                      'geometry': {'type': 'Polygon', 'coordinates': [[wgs(*p) for p in r] + [wgs(*r[0])]]},
                      'properties': {'kind': 'road', 'surface': lay}})

gj = {'type': 'FeatureCollection', 'crs_source': 'МСК-47 зона 2 (GS47Z2)',
      'features': feats}
json.dump(gj, open('cemetery-wgs84.geojson', 'w'), ensure_ascii=False)
json.dump(graves, open('graves-wgs84.json', 'w'), ensure_ascii=False)

lats = [g['lat'] for g in graves]; lons = [g['lon'] for g in graves]
print(f'могил пересчитано: {len(graves)}')
print(f'широта  {min(lats):.6f} … {max(lats):.6f}')
print(f'долгота {min(lons):.6f} … {max(lons):.6f}')
print(f'центр:  {(min(lats)+max(lats))/2:.6f}, {(min(lons)+max(lons))/2:.6f}')
print(f'объектов в GeoJSON: {len(feats)}')
