// Рендер видео «Память»: node film.js preview 3,12,50  |  node film.js render out.mp4
const { chromium } = require('/home/user/memorygrave/node_modules/playwright-core')
const { spawn } = require('child_process')
const fs = require('fs')
const V = __dirname
const FPS = 30, END = 162

const take = (name, a, speed = 1, maxTs = Infinity) => ({ dir: `raw-${name}`, // белые кадры переходов между экранами убираем — остаётся чистая смена экрана
  frames: JSON.parse(fs.readFileSync(`${V}/raw-${name}/frames.json`)).filter(([f, ts]) => ts < a - 1 || fs.statSync(`${V}/raw-${name}/${f}`).size > 4500), a, speed, maxTs })
const SHOTS = [take('search', 7.6), take('map', 6.8), take('order', 6.5), take('exec', 11.3, 1.32), take('report', 6.9), take('dates', 6.5, 1, 9.6)]

const init = `
window.SHOTS = ${JSON.stringify(SHOTS)};
(function(){
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  const vis=(t,a,b,i,o)=>Math.min(ease((t-a)/i),ease((b-t)/o))
  const K=[[0,1],[7.6,1],[8.6,0],[18.6,0],[19.6,1],[27.6,1],[28.6,0],[35.6,0],[36.6,1],[42,1],[43.2,0],[132.6,0],[134,1],[999,1]]
  window.TIMELINE={
    scenes:{s1:[0,8],s2:[8.4,19],s3:[19.8,28],s4:[28.6,36],s5:[36.8,42.3],app:[42.8,123.5],s7:[123.6,133],s8:[133.6,152.2],s9:[152.4,${END}]},
    chapters:[[42.8,58],[58,69],[69,85],[85,104.5],[104.5,115.5],[115.5,123.5]],
    stLen:4.4,
    darkness:t=>{for(let i=1;i<K.length;i++){if(t<=K[i][0]){const[a,va]=K[i-1],[b,vb]=K[i];return va+(vb-va)*ease((t-a)/(b-a))}}return 1},
    dustK:t=>1-0.6*vis(t,133.6,152.2,1.5,1.5),
    dotsK:t=>vis(t,133.8,152.4,1.8,1.5),
    dotsLit:t=>clamp((t-134.5)/16),
  };
})();`

;(async () => {
  const [mode, arg] = process.argv.slice(2)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] })
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on('pageerror', e => console.log('ERR', String(e)))
  await page.addInitScript(init)
  // ограничение времени дубля (dates: до переключения тумблера)
  await page.addInitScript(() => { window.__clampShots = true })
  await page.goto(`file://${V}/film.html`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    const orig = window.SHOTS
    orig.forEach(s => { if (s.maxTs !== null && isFinite(s.maxTs)) s.frames = s.frames.filter(f => f[1] <= s.maxTs) })
    return document.fonts.ready
  })
  await page.waitForTimeout(800)
  if (mode === 'preview') {
    for (const t of arg.split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t)
      await page.screenshot({ path: `${V}/pv-${t}.jpg`, type: 'jpeg', quality: 80 })
    }
  } else {
    const out = arg || `${V}/film-video.mp4`
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] })
    const N = Math.round(END * FPS), t0 = Date.now()
    for (let f = 0; f < N; f++) {
      await page.evaluate(t => window.render(t), f / FPS)
      const buf = await page.screenshot({ type: 'jpeg', quality: 94 })
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
      if (f % 300 === 0) console.log(`кадр ${f}/${N}, ${((Date.now() - t0) / 1000).toFixed(0)} с`)
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r))
    console.log('готово', out)
  }
  await b.close()
})()
