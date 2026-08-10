"""
План кладбища: каждая могила — отдельный объект (оградка, насыпь, надгробие).
Выдаёт обзорный лист и 4 сектора крупным планом.
"""
import json, math

d = json.load(open('cemetery.json'))
PLOTS, ROADS, SURVEY = d['plots'], d['roads'], d['survey']

C = dict(grass='#DCE6D0', grassDark='#CFDCC1', plot='#EFEADC', plotLine='#A89C82',
         mound='#DED5C0', moundLine='#BCB199', stone='#8C8981', stoneTop='#ABA79E',
         asphalt='#9C9C96', gravel='#D3C8B0', dirt='#D8CDB2', ink='#1C3318', num='#33321E')

def minrect(poly):
    """Минимальный ориентированный прямоугольник: центр, стороны, угол."""
    best = None
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        if abs(x2-x1) < 1e-9 and abs(y2-y1) < 1e-9:
            continue
        a = math.atan2(y2 - y1, x2 - x1)
        ca, sa = math.cos(-a), math.sin(-a)
        us = [p[0]*ca - p[1]*sa for p in poly]
        vs = [p[0]*sa + p[1]*ca for p in poly]
        w, h = max(us) - min(us), max(vs) - min(vs)
        if best is None or w * h < best[0]:
            best = (w*h, a, w, h, (min(us)+max(us))/2, (min(vs)+max(vs))/2)
    _, a, w, h, uc, vc = best
    ca, sa = math.cos(a), math.sin(a)
    return (uc*ca - vc*sa, uc*sa + vc*ca, w, h, a)

def graves_of(plot):
    """Раскладка отдельных могил внутри участка: полосы вдоль короткой стороны."""
    cx, cy, w, h, a = minrect(plot['poly'])
    nums = plot.get('nums', []) or [None]
    n = len(nums)
    # могилы лежат бок о бок поперёк короткой стороны
    across, along = (w, h) if w <= h else (h, w)
    swap = w > h
    lane = across / n
    out = []
    for i, num in enumerate(nums):
        off = (i - (n - 1) / 2) * lane
        du, dv = (0, off) if swap else (off, 0)
        ca, sa = math.cos(a), math.sin(a)
        gx = cx + du*ca - dv*sa
        gy = cy + du*sa + dv*ca
        gw = min(lane * 0.62, 1.15)          # ширина могилы
        gl = min(along * 0.56, 2.30)          # длина могилы
        ang = a + (math.pi/2 if swap else 0)  # длинная ось могилы
        out.append(dict(x=gx, y=gy, w=gw, l=gl, a=ang, num=num))
    return out, (cx, cy, w, h, a)

PREP = []
for p in PLOTS:
    g, rect = graves_of(p)
    PREP.append(dict(poly=p['poly'], graves=g, rect=rect))

def svg(minx, miny, maxx, maxy, scale, numbers=True, dots=False, uid='x'):
    W = round((maxx - minx) * scale); H = round((maxy - miny) * scale)
    def T(x, y): return ((x - minx) * scale, H - (y - miny) * scale)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
         '<defs>',
         f'<clipPath id="fr{uid}"><rect width="{W}" height="{H}"/></clipPath>',
         f'<linearGradient id="gm{uid}" x1="0" y1="0" x2="0" y2="1">'
         f'<stop offset="0" stop-color="#E8E0CD"/><stop offset="1" stop-color="{C["mound"]}"/></linearGradient>',
         f'<linearGradient id="gs{uid}" x1="0" y1="0" x2="0" y2="1">'
         f'<stop offset="0" stop-color="{C["stoneTop"]}"/><stop offset="1" stop-color="{C["stone"]}"/></linearGradient>',
         f'<pattern id="grass{uid}" width="26" height="26" patternUnits="userSpaceOnUse">'
         f'<rect width="26" height="26" fill="{C["grass"]}"/>'
         f'<circle cx="6" cy="7" r="1.3" fill="{C["grassDark"]}"/><circle cx="19" cy="17" r="1.3" fill="{C["grassDark"]}"/>'
         f'<circle cx="13" cy="24" r="1.1" fill="{C["grassDark"]}"/></pattern>',
         '</defs>',
         f'<rect width="{W}" height="{H}" fill="url(#grass{uid})"/>', '<g clip-path="url(#fr{uid})">']

    def poly_d(pts):
        return 'M ' + ' '.join(f'{T(*p)[0]:.1f},{T(*p)[1]:.1f}' for p in pts) + ' Z'

    for lay, col in (('ГРУНТОВАЯ ДОРОГА', C['dirt']), ('ЩЕБЕНЬ', C['gravel']), ('ДОРОГА АСФ', C['asphalt'])):
        for r in ROADS.get(lay, []):
            o.append(f'<path d="{poly_d(r)}" fill="{col}" stroke="{col}" stroke-width="2" stroke-linejoin="round"/>')

    for pr in PREP:
        cx, cy, w, h, a = pr['rect']
        if not (minx - 8 < cx < maxx + 8 and miny - 8 < cy < maxy + 8):
            continue
        # оградка участка
        o.append(f'<path d="{poly_d(pr["poly"])}" fill="{C["plot"]}" fill-opacity=".9" '
                 f'stroke="{C["plotLine"]}" stroke-width="{max(0.8, scale*0.035):.1f}" stroke-linejoin="round"/>')
        for g in pr['graves']:
            px, py = T(g['x'], g['y'])
            gw, gl = g['w'] * scale, g['l'] * scale
            deg = -math.degrees(g['a'])
            r = min(gw, gl) * 0.22
            hs_h = gl * 0.26                      # надгробие
            body_y = -gl / 2 + hs_h
            body_h = gl - hs_h
            o.append(f'<g transform="translate({px:.1f},{py:.1f}) rotate({deg:.1f})">')
            o.append(f'<rect x="{-gw/2:.1f}" y="{body_y+1.2:.1f}" width="{gw:.1f}" height="{body_h:.1f}" '
                     f'rx="{r:.1f}" fill="#000" opacity=".07"/>')
            o.append(f'<rect x="{-gw/2:.1f}" y="{body_y:.1f}" width="{gw:.1f}" height="{body_h:.1f}" '
                     f'rx="{r:.1f}" fill="url(#gm{uid})" stroke="{C["moundLine"]}" stroke-width="{max(0.5,scale*0.02):.1f}"/>')
            o.append(f'<rect x="{-gw*0.42:.1f}" y="{-gl/2+0.8:.1f}" width="{gw*0.84:.1f}" height="{hs_h:.1f}" '
                     f'rx="{hs_h*0.42:.1f}" fill="#000" opacity=".10"/>')
            o.append(f'<rect x="{-gw*0.42:.1f}" y="{-gl/2:.1f}" width="{gw*0.84:.1f}" height="{hs_h:.1f}" '
                     f'rx="{hs_h*0.42:.1f}" fill="url(#gs{uid})"/>')
            if numbers and g['num'] is not None:
                fs = min(gw * 0.66, body_h * 0.52, 16)
                fs = max(fs, 6.5)
                o.append(f'<g transform="rotate({-deg:.1f})">'
                         f'<text y="{fs*0.36:.1f}" text-anchor="middle" font-family="DejaVu Sans" '
                         f'font-size="{fs:.1f}" font-weight="700" fill="#FAF7F2" stroke="#FAF7F2" '
                         f'stroke-width="{fs*0.34:.1f}" stroke-linejoin="round" opacity=".85">{g["num"]}</text>'
                         f'<text y="{fs*0.36:.1f}" text-anchor="middle" font-family="DejaVu Sans" '
                         f'font-size="{fs:.1f}" font-weight="700" fill="{C["num"]}">{g["num"]}</text></g>')
            o.append('</g>')

    if dots:
        for p in SURVEY[::2]:
            if minx < p[0] < maxx and miny < p[1] < maxy:
                x, y = T(p[0], p[1])
                o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.4" fill="#B8935A" fill-opacity=".45"/>')
    o.append('</g>')
    return o, W, H, T

def frame(o, W, H, scale, north=True, bar=20):
    if north:
        o.append(f'<g transform="translate({W-46},44)"><circle r="21" fill="#FAF7F2" fill-opacity=".8"/>'
                 f'<path d="M0,-15 L7,9 L0,3.5 L-7,9 Z" fill="{C["ink"]}"/>'
                 f'<text y="19" font-family="DejaVu Sans" font-size="11" font-weight="600" fill="{C["ink"]}" '
                 f'text-anchor="middle">С</text></g>')
    bx, by = 30, H - 30
    L = bar * scale
    o.append(f'<g><rect x="{bx-6}" y="{by-20}" width="{L+12}" height="30" rx="5" fill="#FAF7F2" fill-opacity=".82"/>'
             f'<rect x="{bx}" y="{by-4}" width="{L/2:.0f}" height="4.5" fill="{C["ink"]}"/>'
             f'<rect x="{bx+L/2:.0f}" y="{by-4}" width="{L/2:.0f}" height="4.5" fill="none" stroke="{C["ink"]}" stroke-width="1"/>'
             f'<text x="{bx}" y="{by-8}" font-family="DejaVu Sans" font-size="10" fill="{C["ink"]}">0</text>'
             f'<text x="{bx+L:.0f}" y="{by-8}" font-family="DejaVu Sans" font-size="10" fill="{C["ink"]}" '
             f'text-anchor="middle">{bar} м</text></g>')
    o.append(f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" fill="none" stroke="#B9AE95" stroke-width="1"/>')
    o.append('</svg>')
    return '\n'.join(o)

px = [p[0] for pl in PLOTS for p in pl['poly']]; py = [p[1] for pl in PLOTS for p in pl['poly']]
X0, X1, Y0, Y1 = min(px), max(px), min(py), max(py)
M = 6
X0 -= M; X1 += M; Y0 -= M; Y1 += M
mx, my = (X0 + X1) / 2, (Y0 + Y1) / 2

# Захоронения лежат диагональной полосой — режем её на 4 последовательных
# сектора вдоль главной оси, тогда листы не перекрываются и равны по нагрузке.
# участки-одиночки вдали от массива искажают кадр сектора — выносим отдельно
ALL = PREP[:]
def nn(i):
    xi, yi = ALL[i]['rect'][0], ALL[i]['rect'][1]
    return min(math.hypot(xi-q['rect'][0], yi-q['rect'][1]) for j, q in enumerate(ALL) if j != i)
OUT = [p for i, p in enumerate(ALL) if nn(i) > 25]
PREP = [p for p in ALL if p not in OUT]
if OUT:
    print('обособленные участки:', [g['num'] for p in OUT for g in p['graves']])
cs = [(p['rect'][0], p['rect'][1]) for p in PREP]
mx0 = sum(c[0] for c in cs)/len(cs); my0 = sum(c[1] for c in cs)/len(cs)
sxx = sum((c[0]-mx0)**2 for c in cs); syy = sum((c[1]-my0)**2 for c in cs)
sxy = sum((c[0]-mx0)*(c[1]-my0) for c in cs)
theta = 0.5 * math.atan2(2*sxy, sxx - syy)          # главная ось облака точек
ax, ay = math.cos(theta), math.sin(theta)
order = sorted(range(len(PREP)), key=lambda i: (cs[i][0]-mx0)*ax + (cs[i][1]-my0)*ay)
names = ['А', 'Б', 'В', 'Г']
groups = {n: [] for n in names}
step = math.ceil(len(order) / 4)
for k, i in enumerate(order):
    groups[names[min(3, k // step)]].append(PREP[i])
    PREP[i]['sector'] = names[min(3, k // step)]
labels = []
for name in names:
    items = groups[name]
    xs = [q[0] for it in items for q in it['poly']]; ys = [q[1] for it in items for q in it['poly']]
    labels.append((name, min(xs)-5, min(ys)-5, max(xs)+5, max(ys)+5, len(items)))

# обзор
o, W, H, T = svg(X0, Y0, X1, Y1, 7.2, numbers=False, dots=True, uid='ov')
TINT = {'А': '#8EBD86', 'Б': '#B8935A', 'В': '#5A8A52', 'Г': '#9A8FB0'}
for name in names:
    items = groups[name]
    for it in items:
        pts = ' '.join(f'{T(*q)[0]:.1f},{T(*q)[1]:.1f}' for q in it['poly'])
        o.append(f'<path d="M {pts} Z" fill="{TINT[name]}" fill-opacity=".42" stroke="none"/>')
    gx = sum(it['rect'][0] for it in items)/len(items); gy = sum(it['rect'][1] for it in items)/len(items)
    bx2, by2 = T(gx, gy)
    o.append(f'<g transform="translate({bx2:.1f},{by2:.1f})"><circle r="19" fill="{C["ink"]}" opacity=".9"/>'
             f'<text y="7" font-family="DejaVu Sans" font-size="21" font-weight="700" fill="#FAF7F2" '
             f'text-anchor="middle">{name}</text></g>')
open('plan-overview.svg', 'w').write(frame(o, W, H, 7.2, bar=20))

# секторы — каждый в своём масштабе, кадр по содержимому
SECT = []
for name, a0, b0, a1, b1, cnt in labels:
    wm, hm = a1-a0, b1-b0
    sc = 1450 / max(wm, hm * 0.78)      # целимся в лист A3
    o, W, H, T = svg(a0, b0, a1, b1, sc, numbers=True, uid=str(ord(name)))
    open(f'plan-{name}.svg', 'w').write(frame(o, W, H, sc, bar=10))
    SECT.append((name, wm, hm, cnt, W, H))
    print(f'сектор {name}: {wm:.0f} × {hm:.0f} м · {cnt} участков · масштаб {sc:.1f} px/м')
import json as _j; _j.dump(SECT, open('sectors.json','w'), ensure_ascii=False)
print('обзор готов')
