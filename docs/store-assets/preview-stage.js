/**
 * Промо в стиле рекламы Apple: кинетическая типографика, телефон в 3D,
 * наезды на детали интерфейса, монтаж через тёмные склейки.
 * 886×1920, ~29.5 c.
 */
const { chromium } = require('playwright-core')
const fs = require('fs')
const path = require('path')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const font = (name, file) =>
  `@font-face{font-family:'${name}';src:url(data:font/ttf;base64,${fs.readFileSync(`/home/user/memorygrave/node_modules/@expo-google-fonts/${file}`).toString('base64')}) format('truetype')}`

const raw = fs.readdirSync('video-raw').find(f => f.endsWith('.webm'))
const takeB64 = fs.readFileSync(path.join('video-raw', raw)).toString('base64')

const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'
const flameSvg = (w) => `<svg width="${w}" height="${w * 1.4}" viewBox="0 0 100 140">
  <defs>
    <linearGradient id="ff${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9B36B"/><stop offset=".55" stop-color="#B8935A"/><stop offset="1" stop-color="#9A6E2E"/></linearGradient>
    <linearGradient id="fc${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7E4"/><stop offset="1" stop-color="#FCEAC0"/></linearGradient>
  </defs>
  <path d="${FLAME}" fill="url(#ff${w})"/><path d="${CORE}" fill="url(#fc${w})"/></svg>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font('Playfair', 'playfair-display/PlayfairDisplay_500Medium.ttf')}
${font('PlayfairR', 'playfair-display/PlayfairDisplay_400Regular.ttf')}
${font('DMSans', 'dm-sans/DMSans_400Regular.ttf')}
${font('DMSansM', 'dm-sans/DMSans_500Medium.ttf')}
*{margin:0;padding:0;box-sizing:border-box}
:root{--ease:cubic-bezier(.22,1,.36,1)}
body{width:886px;height:1920px;overflow:hidden;font-family:'DMSans';position:relative;background:#12200E}
/* два слоя фона с кроссфейдом */
.bg{position:absolute;inset:0;opacity:0;transition:opacity .8s var(--ease)}
#bgCream{background:radial-gradient(95% 70% at 50% 32%, #FDFBF6, #F3EDE0 62%, #E7DECA)}
#bgDark{background:radial-gradient(110% 85% at 50% 25%, #2E5028, #1C3318 55%, #10200C)}
.bg.on{opacity:1}
/* сцена телефона: 3D-пространство */
.space{position:absolute;inset:0;perspective:1700px;display:flex;align-items:center;justify-content:center}
.rig{transition:transform 1.1s var(--ease), opacity .6s var(--ease);opacity:0;transform-style:preserve-3d}
.rig.on{opacity:1}
.phone{width:620px;height:1338px;background:linear-gradient(160deg,#1a1a1a,#000 40%,#232323);border-radius:84px;padding:12px;
  box-shadow:0 80px 140px rgba(10,18,8,.5), 0 0 0 1px rgba(255,255,255,.06) inset}
.phone video{width:596px;height:1314px;border-radius:72px;object-fit:cover;background:#FAF7F2;display:none}
.phone video.live{display:block}
/* блик на стекле */
.glare{position:absolute;inset:12px;border-radius:72px;pointer-events:none;
  background:linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.03) 18%, transparent 32%)}
/* подписи сцен: маленький капс сверху */
.tag{position:absolute;top:118px;left:0;right:0;text-align:center;opacity:0;transition:opacity .5s var(--ease), transform .5s var(--ease);transform:translateY(10px)}
.tag.on{opacity:1;transform:none}
.tag span{font-family:'DMSansM';font-size:26px;letter-spacing:6px;color:#B8935A}
.tag.lighttxt span{color:#D9B36B}
/* кинетические слова */
.word{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transform:scale(1.12);transition:opacity .45s var(--ease), transform .7s var(--ease)}
.word.on{opacity:1;transform:scale(1)}
.word h1{font-family:'Playfair';font-size:132px;color:#FAF7F2;letter-spacing:-1px;text-align:center;line-height:1.1}
.word h1 em{font-style:normal;color:#D9B36B}
.word .sub{font-size:34px;color:rgba(250,247,242,.66);margin-top:26px}
/* тёмная склейка-затвор */
.cut{position:absolute;inset:0;background:#10200C;opacity:0;transition:opacity .22s ease;pointer-events:none}
.cut.on{opacity:1}
/* финал */
.outro{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .8s var(--ease)}
.outro.on{opacity:1}
.outro .fl{filter:drop-shadow(0 0 70px rgba(217,179,107,.6));transform:scale(.7);transition:transform 1.6s var(--ease)}
.outro.on .fl{transform:scale(1)}
.outro h2{font-family:'Playfair';font-size:130px;color:#FAF7F2;margin-top:40px;letter-spacing:-1px}
.outro .rule{width:74px;height:2px;background:#B8935A;margin:38px 0 0}
.outro p{font-size:36px;color:rgba(250,247,242,.75);margin-top:34px}
</style></head><body>

<div class="bg" id="bgDark"></div>
<div class="bg" id="bgCream"></div>

<div class="space">
  <div class="rig" id="rig">
    <div class="phone">
      <video id="v1" muted playsinline src="data:video/webm;base64,${takeB64}"></video>
      <video id="v2" muted playsinline src="data:video/webm;base64,${takeB64}"></video>
      <video id="v3" muted playsinline src="data:video/webm;base64,${takeB64}"></video>
      <video id="v4" muted playsinline src="data:video/webm;base64,${takeB64}"></video>
      <div class="glare"></div>
    </div>
  </div>
</div>

<div class="tag" id="tagSearch"><span>НАЙДИТЕ РОДНОЕ ИМЯ</span></div>
<div class="tag lighttxt" id="tagCandle"><span>СВЕЧА ПАМЯТИ</span></div>
<div class="tag" id="tagReport"><span>ФОТООТЧЁТ О КАЖДОЙ РАБОТЕ</span></div>

<div class="word" id="w1"><h1>Они далеко.</h1></div>
<div class="word" id="w2"><h1>Память — <em>рядом</em>.</h1><div class="sub">сервис заботы о местах памяти</div></div>
<div class="word" id="wFind"><h1><em>Найти.</em></h1></div>
<div class="word" id="wHonor"><h1><em>Почтить.</em></h1></div>
<div class="word" id="wTrust"><h1><em>Убедиться.</em></h1></div>

<div class="outro" id="outro">
  <div class="fl">${flameSvg(140)}</div>
  <h2>Память</h2>
  <div class="rule"></div>
  <p>Забота о близких — на расстоянии</p>
</div>

<div class="cut" id="cut"></div>

<script>
const $ = id => document.getElementById(id)
const rig = $('rig')
const vids = { v1: $('v1'), v2: $('v2'), v3: $('v3'), v4: $('v4') }

// Позы телефона: [transform, transform-origin]
const POSES = {
  splash: ['rotateY(-14deg) rotateX(3deg) scale(.94)', '50% 50%'],
  splashEnd: ['rotateY(-4deg) rotateX(1deg) scale(1)', '50% 50%'],
  search: ['rotateY(9deg) scale(1.32) translateY(120px)', '50% 0%'],
  candle: ['rotateY(-7deg) scale(1.62)', '50% 40%'],
  report: ['rotateY(7deg) scale(1.42) translateY(40px)', '50% 16%'],
}
function pose(name, dur) {
  rig.style.transitionDuration = (dur || 1.1) + 's'
  rig.style.transformOrigin = POSES[name][1]
  rig.style.transform = POSES[name][0]
}
function showVid(id, seekTo) {
  Object.values(vids).forEach(v => { v.classList.remove('live'); v.pause() })
  const v = vids[id]
  v.currentTime = seekTo
  v.classList.add('live')
  v.play()
}
// расписание: [секунда, действие]
const T = [
  // холодное открытие
  [0.0, () => { $('bgDark').classList.add('on'); $('w1').classList.add('on') }],
  [1.9, () => $('w1').classList.remove('on')],
  [2.2, () => $('w2').classList.add('on')],
  [4.4, () => $('w2').classList.remove('on')],
  // сплэш: телефон влетает
  [4.7, () => {
    $('bgCream').classList.add('on')
    showVid('v1', 1.2)
    pose('splash', 0.01)
    requestAnimationFrame(() => requestAnimationFrame(() => { rig.classList.add('on'); pose('splashEnd', 4.6) }))
  }],
  // склейка → поиск
  [9.6, () => $('cut').classList.add('on')],
  [9.8, () => { $('wFind').classList.add('on'); rig.classList.remove('on') }],
  [10.5, () => { $('wFind').classList.remove('on'); $('cut').classList.remove('on');
    showVid('v2', 7.0); pose('search', 0.01)
    requestAnimationFrame(() => requestAnimationFrame(() => { rig.classList.add('on'); $('tagSearch').classList.add('on') }))
  }],
  // склейка → свеча
  [13.9, () => { $('cut').classList.add('on'); $('tagSearch').classList.remove('on') }],
  [14.1, () => { $('wHonor').classList.add('on'); rig.classList.remove('on'); $('bgCream').classList.remove('on') }],
  [14.8, () => { $('wHonor').classList.remove('on'); $('cut').classList.remove('on')
    showVid('v3', 13.4); pose('candle', 0.01)
    requestAnimationFrame(() => requestAnimationFrame(() => { rig.classList.add('on'); $('tagCandle').classList.add('on') }))
  }],
  // склейка → отчёт
  [19.3, () => { $('cut').classList.add('on'); $('tagCandle').classList.remove('on') }],
  [19.5, () => { $('wTrust').classList.add('on'); rig.classList.remove('on'); $('bgCream').classList.add('on') }],
  [20.2, () => { $('wTrust').classList.remove('on'); $('cut').classList.remove('on')
    showVid('v4', 20.9); pose('report', 0.01)
    requestAnimationFrame(() => requestAnimationFrame(() => { rig.classList.add('on'); $('tagReport').classList.add('on') }))
  }],
  // финал
  [24.2, () => { $('cut').classList.add('on'); $('tagReport').classList.remove('on') }],
  [24.5, () => { rig.classList.remove('on'); $('bgCream').classList.remove('on'); $('cut').classList.remove('on'); $('outro').classList.add('on') }],
]
window.start = () => { const t0 = performance.now(); T.forEach(([t, fn]) => setTimeout(fn, t * 1000)) }
</script>
</body></html>`

fs.writeFileSync('stage2.html', html)

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 886, height: 1920 },
    recordVideo: { dir: 'video-stage2', size: { width: 886, height: 1920 } },
  })
  const page = await ctx.newPage()
  await page.goto('file://' + path.resolve('stage2.html'))
  await page.waitForTimeout(900)
  await page.evaluate(() => window.start())
  await page.waitForTimeout(29800)
  await ctx.close()
  console.log('STAGE2:', fs.readdirSync('video-stage2').join(', '))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
