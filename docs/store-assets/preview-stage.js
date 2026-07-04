/**
 * Монтажная сцена промо-видео: 886×1920 (App Store, портрет).
 * Дубль приложения в рамке телефона + фирменные титры + финальная заставка.
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

// Титры: [начало, конец, заголовок, подзаголовок]
const CAPTIONS = [
  [0.0, 6.5, '', ''],
  [6.5, 9.9, 'Найдите родное имя', 'по всей России'],
  [9.9, 13.8, 'Страница памяти', 'история, место, близкие'],
  [13.8, 17.6, 'Зажгите свечу', 'вместе с семьёй'],
  [17.6, 24.4, 'Фотоотчёт о каждой работе', 'вы всегда видите результат'],
]
const CUT = 24.4 // конец полезного дубля
const OUTRO = 4.8 // длительность финала

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font('Playfair', 'playfair-display/PlayfairDisplay_500Medium.ttf')}
${font('DMSans', 'dm-sans/DMSans_400Regular.ttf')}
${font('DMSansM', 'dm-sans/DMSans_500Medium.ttf')}
*{margin:0;padding:0;box-sizing:border-box}
body{width:886px;height:1920px;overflow:hidden;font-family:'DMSans';position:relative;
     background:radial-gradient(90% 70% at 50% 30%, #FDFBF6, #F3EDE0 60%, #E9E1CF)}
/* мягкое тёплое пятно за телефоном */
.glowbg{position:absolute;left:50%;top:56%;width:1100px;height:1100px;transform:translate(-50%,-50%);
  background:radial-gradient(circle,rgba(217,179,107,.18),rgba(217,179,107,0) 65%)}
/* титры */
.cap{position:absolute;top:96px;left:60px;right:60px;text-align:center;opacity:0;transition:opacity .5s ease, transform .5s ease;transform:translateY(14px)}
.cap.on{opacity:1;transform:translateY(0)}
.cap h1{font-family:'Playfair';font-size:64px;line-height:1.12;color:#1C3318;letter-spacing:-0.5px}
.cap p{font-family:'DMSansM';font-size:30px;color:#B8935A;margin-top:14px;letter-spacing:2px;text-transform:uppercase}
/* телефон */
.phone{position:absolute;left:50%;top:300px;transform:translateX(-50%);width:700px;height:1516px;
  background:#0c0c0c;border-radius:92px;padding:14px;box-shadow:0 60px 120px rgba(20,30,15,.32)}
.phone video{width:672px;height:1488px;border-radius:78px;object-fit:cover;background:#FAF7F2}
/* финал */
.outro{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:radial-gradient(110% 90% at 50% 20%, #2E5028, #1C3318 55%, #12200E);opacity:0;transition:opacity .9s ease}
.outro.on{opacity:1}
.outro .fl{filter:drop-shadow(0 0 60px rgba(217,179,107,.55));transform:scale(.85);transition:transform 1.4s ease}
.outro.on .fl{transform:scale(1)}
.outro h2{font-family:'Playfair';font-size:118px;color:#FAF7F2;margin-top:44px;letter-spacing:-1px}
.outro .rule{width:70px;height:2px;background:#B8935A;margin:40px 0}
.outro p{font-size:36px;color:rgba(250,247,242,.78)}
</style></head><body>
<div class="glowbg"></div>

${CAPTIONS.map(([a, b, h, s], i) => h ? `<div class="cap" id="cap${i}"><h1>${h}</h1><p>${s}</p></div>` : '').join('')}

<div class="phone" id="phone">
  <video id="v" muted playsinline src="data:video/webm;base64,${takeB64}"></video>
</div>

<div class="outro" id="outro">
  <svg class="fl" width="150" height="210" viewBox="0 0 100 140">
    <defs>
      <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9B36B"/><stop offset=".55" stop-color="#B8935A"/><stop offset="1" stop-color="#9A6E2E"/></linearGradient>
      <linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7E4"/><stop offset="1" stop-color="#FCEAC0"/></linearGradient>
    </defs>
    <path d="${FLAME}" fill="url(#f)"/><path d="${CORE}" fill="url(#c)"/>
  </svg>
  <h2>Память</h2>
  <div class="rule"></div>
  <p>Забота о близких — на расстоянии</p>
</div>

<script>
const v = document.getElementById('v')
const caps = ${JSON.stringify(CAPTIONS)}
function tick() {
  const t = v.currentTime
  caps.forEach(([a, b, h], i) => {
    if (!h) return
    const el = document.getElementById('cap' + i)
    el.classList.toggle('on', t >= a && t < b)
  })
  if (t >= ${CUT}) {
    v.pause()
    document.getElementById('outro').classList.add('on')
  } else {
    requestAnimationFrame(tick)
  }
}
window.start = () => { v.play(); requestAnimationFrame(tick) }
</script>
</body></html>`

fs.writeFileSync('stage.html', html)

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 886, height: 1920 },
    recordVideo: { dir: 'video-stage', size: { width: 886, height: 1920 } },
  })
  const page = await ctx.newPage()
  await page.goto('file://' + path.resolve('stage.html'))
  await page.waitForTimeout(700) // прогрев шрифтов/видео
  await page.evaluate(() => window.start())
  await page.waitForTimeout((CUT + OUTRO) * 1000)
  await ctx.close()
  console.log('STAGE:', fs.readdirSync('video-stage').join(', '))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
