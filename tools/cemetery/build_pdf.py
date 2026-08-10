"""Сборка печатного плана: обзорный лист + 4 сектора → A3 PDF."""
import json, re, subprocess, os

sect = json.load(open('sectors.json'))
d = json.load(open('cemetery.json'))
n_nums = len({x['n'] for x in d['numbers']})
n_plots = len(d['plots'])
n_multi = sum(1 for p in d['plots'] if len(p.get('nums', [])) > 1)
px = [p[0] for pl in d['plots'] for p in pl['poly']]
py = [p[1] for pl in d['plots'] for p in pl['poly']]
W_M, H_M = max(px) - min(px), max(py) - min(py)

def parts(fn):
    s = open(fn).read()
    return s.split('>', 1)[1].rsplit('</svg>', 1)[0], re.search(r'viewBox="([^"]+)"', s).group(1)

TINT = {'А': '#8EBD86', 'Б': '#B8935A', 'В': '#5A8A52', 'Г': '#9A8FB0'}
pages = []
ov, ovb = parts('plan-overview.svg')
chips = ''.join(f'<div class="item"><span class="dot" style="background:{TINT[n]}"></span>Сектор {n} — {c} уч.</div>'
                for n, _, _, c, _, _ in sect)
pages.append(f'''<section class="page">
 <div class="head"><div><h1>План кладбища · схема оцифровки</h1>
  <div class="sub">Геодезическая съёмка · система координат GS47Z2 · территория {W_M:.0f} × {H_M:.0f} м · перепад рельефа 5,7 м</div></div>
  <div class="stats"><b>{n_nums}</b> захоронений<br><b>{n_plots}</b> участков<br><b>{n_multi}</b> семейных</div></div>
 <div class="planbox"><svg class="plan" preserveAspectRatio="xMidYMid meet" viewBox="{ovb}" xmlns="http://www.w3.org/2000/svg">{ov}</svg></div>
 <div class="legend">{chips}
  <div class="item"><span class="ln" style="background:#9C9C96"></span>Асфальт</div>
  <div class="item"><span class="ln" style="background:#D3C8B0"></span>Щебень</div>
  <div class="item"><span class="ln" style="background:#D8CDB2"></span>Грунт</div></div>
 <div class="foot"><span>Лист 1 из 5 · обзорный план</span><span>Номера захоронений — на листах секторов</span></div>
</section>''')

for i, (name, wm, hm, cnt, _, _) in enumerate(sect, start=2):
    sv, svb = parts(f'plan-{name}.svg')
    land = ' land' if wm > hm * 1.05 else ''
    pages.append(f'''<section class="page{land}">
 <div class="head"><div><h1>Сектор {name}</h1>
  <div class="sub">{wm:.0f} × {hm:.0f} м · {cnt} участков · номера захоронений подписаны</div></div>
  <div class="stats"><span class="badge" style="background:{TINT[name]}">{name}</span></div></div>
 <div class="planbox"><svg class="plan" preserveAspectRatio="xMidYMid meet" viewBox="{svb}" xmlns="http://www.w3.org/2000/svg">{sv}</svg></div>
 <div class="legend">
  <div class="item"><span class="sw"></span>Участок (оградка)</div>
  <div class="item"><span class="grave"></span>Захоронение с надгробием</div>
  <div class="item">В одной оградке может быть несколько захоронений</div></div>
 <div class="foot"><span>Лист {i} из 5 · сектор {name}</span><span>Приложение «Память» · сервис ухода за захоронениями</span></div>
</section>''')

html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size:A3 portrait; margin:11mm 12mm 9mm }}
@page land {{ size:A3 landscape; margin:10mm 12mm 8mm }}
.page.land {{ page:land }}
* {{ margin:0; padding:0; box-sizing:border-box }}
html,body {{ height:100% }}
body {{ font-family:"DejaVu Sans",sans-serif; color:#1A1A14 }}
.page {{ height:100%; display:flex; flex-direction:column; break-inside:avoid }}
.page + .page {{ break-before:page }}
h1 {{ font-size:19pt; color:#1C3318; letter-spacing:-.3pt }}
.sub {{ font-size:9.5pt; color:#6B6B5E; margin-top:2mm }}
.head {{ display:flex; justify-content:space-between; align-items:flex-end;
        border-bottom:.6pt solid #C8BEA8; padding-bottom:3mm; margin-bottom:4mm; flex:none }}
.stats {{ text-align:right; font-size:9pt; color:#6B6B5E; line-height:1.6; white-space:nowrap }}
.stats b {{ color:#1C3318; font-size:11.5pt }}
.badge {{ display:inline-block; width:11mm; height:11mm; line-height:11mm; border-radius:50%;
         color:#fff; font-size:15pt; font-weight:700; text-align:center }}
.planbox {{ flex:1 1 auto; min-height:0; display:flex }}
svg.plan {{ width:100%; height:100% }}
.legend {{ display:flex; gap:6mm; flex-wrap:wrap; margin-top:4mm; border-top:.6pt solid #C8BEA8;
          padding-top:3mm; font-size:8.5pt; color:#3A3A32; flex:none }}
.item {{ display:flex; align-items:center; gap:1.8mm }}
.dot {{ width:3.6mm; height:3.6mm; border-radius:50%; opacity:.75 }}
.ln {{ width:7mm; height:2mm }}
.sw {{ width:5mm; height:4mm; background:#EFEADC; border:.6pt solid #A89C82 }}
.grave {{ width:3mm; height:4.6mm; background:#DED5C0; border:.5pt solid #BCB199; border-radius:.8mm }}
.foot {{ margin-top:2.5mm; font-size:7.5pt; color:#9A9A8E; display:flex; justify-content:space-between; flex:none }}
</style></head><body>{''.join(pages)}</body></html>'''
open('cemetery-plan.html', 'w').write(html)

CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
                '--print-to-pdf=cemetery-plan.pdf', 'file://' + os.path.abspath('cemetery-plan.html')],
               capture_output=True)
print(subprocess.run(['pdfinfo', 'cemetery-plan.pdf'], capture_output=True, text=True).stdout.split('Page size')[0].strip())
