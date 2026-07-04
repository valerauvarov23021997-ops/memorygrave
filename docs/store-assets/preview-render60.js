/**
 * Покадровый рендер промо 60 fps: одна непрерывная камера, без склеек.
 * Виртуальный таймлайн на кейфреймах — каждый кадр детерминирован.
 * Режимы: node render60.js preview | full
 */
const { chromium } = require('playwright-core')
const fs = require('fs')
const path = require('path')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const FPS = 60
const DUR = 30.0
const MODE = process.argv[2] || 'preview'

const font = (name, file) =>
  `@font-face{font-family:'${name}';src:url(data:font/ttf;base64,${fs.readFileSync(`/home/user/memorygrave/node_modules/@expo-google-fonts/${file}`).toString('base64')}) format('truetype')}`

const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'

const framesDir = path.resolve('app-frames')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font('Playfair', 'playfair-display/PlayfairDisplay_500Medium.ttf')}
${font('DMSans', 'dm-sans/DMSans_400Regular.ttf')}
${font('DMSansM', 'dm-sans/DMSans_500Medium.ttf')}
*{margin:0;padding:0;box-sizing:border-box}
body{width:886px;height:1920px;overflow:hidden;font-family:'DMSans';position:relative;background:#10200C}
.bg{position:absolute;inset:0}
#bgDark{background:radial-gradient(110% 85% at 50% 25%, #2E5028, #1C3318 55%, #10200C)}
#bgCream{background:radial-gradient(95% 70% at 50% 32%, #FDFBF6, #F3EDE0 62%, #E7DECA);opacity:0}
#space{position:absolute;inset:0;perspective:1750px;display:flex;align-items:center;justify-content:center}
#cam{will-change:transform}
#rig{will-change:transform;transform-style:preserve-3d}
.phone{width:620px;height:1338px;background:linear-gradient(160deg,#1b1b1b,#000 42%,#242424);border-radius:84px;padding:12px;
  box-shadow:0 80px 150px rgba(10,18,8,.5), 0 0 0 1px rgba(255,255,255,.07) inset;position:relative}
#app{width:596px;height:1314px;border-radius:72px;object-fit:cover;background:#FAF7F2;display:block}
.glare{position:absolute;inset:12px;border-radius:72px;pointer-events:none;
  background:linear-gradient(115deg, rgba(255,255,255,.10), rgba(255,255,255,.03) 18%, transparent 33%)}
/* заплатка: скрывает белую полосу рендера в кадрах сплэша */
#patch{position:absolute;top:12px;left:12px;right:12px;height:280px;border-radius:72px 72px 0 0;pointer-events:none;
  background:linear-gradient(#F9F5EC, #F9F5EC 60%, rgba(249,245,236,0))}
.word{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
.word h1{font-family:'Playfair';font-size:130px;color:#FAF7F2;letter-spacing:-1px;text-align:center;line-height:1.12}
.word h1 em{font-style:normal;color:#D9B36B}
.word .sub{font-size:34px;color:rgba(250,247,242,.66);margin-top:26px}
.cap{position:absolute;top:118px;left:0;right:0;text-align:center;opacity:0}
.cap span{font-family:'DMSansM';font-size:27px;letter-spacing:6px}
#cap1 span,#cap3 span{color:#B8935A}
#cap2 span{color:#D9B36B}
#outro{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
#outro .fl{filter:drop-shadow(0 0 70px rgba(217,179,107,.55))}
#outro h2{font-family:'Playfair';font-size:132px;color:#FAF7F2;margin-top:42px;letter-spacing:-1px}
#outro .rule{width:74px;height:2px;background:#B8935A;margin:38px 0 0}
#outro p{font-size:36px;color:rgba(250,247,242,.75);margin-top:34px}
</style></head><body>
<div class="bg" id="bgDark"></div>
<div class="bg" id="bgCream"></div>
<div id="space"><div id="cam"><div id="rig">
  <div class="phone"><img id="app" src="${framesDir}/f_0001.png"/><div id="patch"></div><div class="glare"></div></div>
</div></div></div>
<div class="word" id="w1"><h1>Они далеко.</h1></div>
<div class="word" id="w2"><h1>Память — <em>рядом</em>.</h1><div class="sub">сервис заботы о местах памяти</div></div>
<div class="cap" id="cap1"><span>НАЙДИТЕ РОДНОЕ ИМЯ</span></div>
<div class="cap" id="cap2"><span>ЗАЖГИТЕ СВЕЧУ — ВМЕСТЕ С СЕМЬЁЙ</span></div>
<div class="cap" id="cap3"><span>ФОТООТЧЁТ О КАЖДОЙ РАБОТЕ</span></div>
<div id="outro">
  <div class="fl" id="outroFl"><svg width="150" height="210" viewBox="0 0 100 140">
    <defs>
      <linearGradient id="of" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9B36B"/><stop offset=".55" stop-color="#B8935A"/><stop offset="1" stop-color="#9A6E2E"/></linearGradient>
      <linearGradient id="oc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7E4"/><stop offset="1" stop-color="#FCEAC0"/></linearGradient>
    </defs>
    <path d="${FLAME}" fill="url(#of)"/><path d="${CORE}" fill="url(#oc)"/></svg></div>
  <h2>Память</h2><div class="rule"></div><p>Забота о близких — на расстоянии</p>
</div>

<script>
const $ = id => document.getElementById(id)
// интерполяция по кейфреймам с мягкой кривой внутри сегмента
const smooth = u => u < .5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3) / 2
function kf(keys, t, ease = true) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i-1], [t1, v1] = keys[i]
      let u = (t - t0) / (t1 - t0)
      if (ease) u = smooth(u)
      return v0 + (v1 - v0) * u
    }
  }
  return keys[keys.length - 1][1]
}
const K = {
  appT:  [[4.0,1.2],[8.2,6.2],[11.6,10.4],[13.8,13.6],[17.6,17.9],[19.6,20.9],[23.8,24.6],[30,26.4]],
  bgMix: [[0,0],[3.2,0],[5.0,1],[10.6,1],[12.6,0],[17.4,0],[19.4,1],[23.2,1],[25.2,0],[30,0]],
  w1o:   [[0,0],[0.6,1],[1.9,1],[2.5,0]],
  w1s:   [[0,1.10],[2.6,1.0]],
  w2o:   [[2.3,0],[2.9,1],[4.3,1],[5.0,0]],
  w2s:   [[2.3,1.08],[5.2,1.0]],
  phO:   [[3.3,0],[4.4,1],[24.6,1],[25.9,0]],
  patchO:[[6.9,1],[7.5,0]],
  phTy:  [[3.3,980],[6.4,50],[8.2,0]],
  rotY:  [[3.3,-26],[6.4,-9],[9.5,-5],[12.6,7],[15.4,-6],[18.4,-6],[21.4,7],[24.4,3],[26.6,0]],
  rotX:  [[3.3,7],[6.4,2],[30,1]],
  camS:  [[3.3,0.84],[6.4,1.0],[9.4,1.30],[11.6,1.06],[14.6,1.58],[17.4,1.58],[19.0,1.22],[21.6,1.48],[23.8,1.42],[26.6,0.9]],
  camTy: [[6.4,0],[9.4,290],[11.6,20],[14.6,-30],[17.4,-30],[19.0,0],[21.6,190],[23.8,120],[26.6,190]],
  cap1:  [[8.8,0],[9.5,1],[10.7,1],[11.4,0]],
  cap2:  [[14.6,0],[15.3,1],[18.2,1],[18.9,0]],
  cap3:  [[20.4,0],[21.1,1],[23.6,1],[24.3,0]],
  outO:  [[25.5,0],[26.9,1]],
  outS:  [[25.5,0.66],[28.2,1.0]],
}
const pad = n => String(n).padStart(4, '0')
window.renderAt = async function(t) {
  $('bgCream').style.opacity = kf(K.bgMix, t)
  $('w1').style.opacity = kf(K.w1o, t)
  $('w1').style.transform = 'scale(' + kf(K.w1s, t, false) + ')'
  $('w2').style.opacity = kf(K.w2o, t)
  $('w2').style.transform = 'scale(' + kf(K.w2s, t, false) + ')'
  const rig = $('rig'), cam = $('cam')
  rig.style.opacity = kf(K.phO, t)
  $('patch').style.opacity = kf(K.patchO, t)
  rig.style.transform =
    'translateY(' + kf(K.phTy, t) + 'px) rotateY(' + kf(K.rotY, t) + 'deg) rotateX(' + kf(K.rotX, t) + 'deg)'
  cam.style.transform = 'translateY(' + kf(K.camTy, t) + 'px) scale(' + kf(K.camS, t) + ')'
  ;['cap1','cap2','cap3'].forEach(id => {
    const o = kf(K[id], t)
    $(id).style.opacity = o
    $(id).style.transform = 'translateY(' + (1 - o) * 12 + 'px)'
  })
  $('outro').style.opacity = kf(K.outO, t)
  $('outroFl').style.transform = 'scale(' + kf(K.outS, t) + ')'
  // кадр приложения
  const appT = kf(K.appT, t, false)
  const idx = Math.max(1, Math.min(633, Math.round((appT - 1.2) * 25) + 1))
  const img = $('app')
  const want = '${framesDir}/f_' + pad(idx) + '.png'
  if (!img.src.endsWith('f_' + pad(idx) + '.png')) {
    img.src = want
    try { await img.decode() } catch (e) {}
  }
  return true
}
</script></body></html>`

fs.writeFileSync('stage3.html', html)

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const page = await browser.newPage({ viewport: { width: 886, height: 1920 } })
  await page.goto('file://' + path.resolve('stage3.html'))
  await page.waitForTimeout(600)

  if (MODE === 'preview') {
    for (const t of [5.5, 7.2, 11.0, 22.4, 25.8, 26.5]) {
      await page.evaluate(tt => window.renderAt(tt), t)
      await page.waitForTimeout(60)
      await page.screenshot({ path: `out/kf-${t}.png`, type: 'png' })
      console.log('kf', t)
    }
  } else {
    fs.rmSync('stage-frames', { recursive: true, force: true })
    fs.mkdirSync('stage-frames')
    const total = Math.round(DUR * FPS)
    const t0 = Date.now()
    for (let i = 0; i < total; i++) {
      await page.evaluate(tt => window.renderAt(tt), i / FPS)
      await page.screenshot({ path: `stage-frames/s_${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 })
      if (i % 120 === 0) console.log(`frame ${i}/${total} · ${((Date.now() - t0) / 1000).toFixed(0)}s`)
    }
    console.log('FRAMES DONE', total)
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
