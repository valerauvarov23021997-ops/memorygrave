"""План кладбища в SVG: кадр по участкам, дороги обрезаются рамкой."""
import json
d = json.load(open('cemetery.json'))
plots, roads, survey = d['plots'], d['roads'], d['survey']

# кадр — по участкам с полем 18 м (подъездная дорога уходит далеко за территорию)
px = [p[0] for pl in plots for p in pl['poly']]
py = [p[1] for pl in plots for p in pl['poly']]
M = 18
minx, maxx, miny, maxy = min(px)-M, max(px)+M, min(py)-M, max(py)+M
wm, hm = maxx-minx, maxy-miny

SCALE = 7.0          # пикселей на метр
W, H = round(wm*SCALE), round(hm*SCALE)
def T(p):
    return ((p[0]-minx)*SCALE, H - (p[1]-miny)*SCALE)
def path(poly):
    return 'M ' + ' '.join(f'{T(p)[0]:.1f},{T(p)[1]:.1f}' for p in poly) + ' Z'

o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
     f'<defs><clipPath id="frame"><rect x="0" y="0" width="{W}" height="{H}"/></clipPath></defs>',
     f'<rect width="{W}" height="{H}" fill="#FAF7F2"/>', '<g clip-path="url(#frame)">']
style = {'ДОРОГА АСФ': '#9A9A94', 'ЩЕБЕНЬ': '#CFC4AC', 'ГРУНТОВАЯ ДОРОГА': '#DED3BA'}
for lay, rs in roads.items():
    for r in rs:
        o.append(f'<path d="{path(r)}" fill="{style[lay]}" fill-opacity=".85" stroke="{style[lay]}" stroke-width="1.5"/>')
for pl in plots:
    fill = '#C4DEC0' if len(pl.get('nums', [])) > 1 else '#F3EEE2'
    o.append(f'<path d="{path(pl["poly"])}" fill="{fill}" stroke="#2E5028" stroke-width="1.3"/>')
for p in survey[::2]:
    x, y = T(p)
    o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.5" fill="#B8935A" fill-opacity=".5"/>')
for pl in plots:
    ns = pl.get('nums', [])
    cx, cy = T(pl['centroid'])
    for i, n in enumerate(ns):
        off = (i - (len(ns)-1)/2) * 13
        o.append(f'<text x="{cx:.1f}" y="{cy+off+4:.1f}" font-family="DejaVu Sans" font-size="11" '
                 f'fill="#1C3318" text-anchor="middle">{n}</text>')
o.append('</g>')
# север + масштабная линейка
o.append(f'<g transform="translate({W-52},46)"><path d="M0,-26 L8,10 L0,3 L-8,10 Z" fill="#1C3318"/>'
         f'<text y="26" font-family="DejaVu Sans" font-size="14" fill="#1C3318" text-anchor="middle">С</text></g>')
bx, by = 34, H-34
o.append(f'<g><rect x="{bx}" y="{by}" width="{20*SCALE:.0f}" height="5" fill="#1C3318"/>'
         f'<rect x="{bx+10*SCALE:.0f}" y="{by}" width="{10*SCALE:.0f}" height="5" fill="#FAF7F2" stroke="#1C3318" stroke-width="1"/>'
         f'<text x="{bx}" y="{by-7}" font-family="DejaVu Sans" font-size="13" fill="#1C3318">0</text>'
         f'<text x="{bx+20*SCALE:.0f}" y="{by-7}" font-family="DejaVu Sans" font-size="13" fill="#1C3318" text-anchor="middle">20 м</text></g>')
o.append(f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" fill="none" stroke="#C8BEA8" stroke-width="1"/>')
o.append('</svg>')
open('cemetery-plan.svg', 'w').write('\n'.join(o))
print(f'кадр {wm:.0f} × {hm:.0f} м → {W}×{H} px')
