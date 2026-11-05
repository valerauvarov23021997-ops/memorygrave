// Рендер видео «Память»: node film.js preview 3,12,50  |  node film.js render out.mp4
const { chromium } = require('/home/user/memorygrave/node_modules/playwright-core')
const { spawn } = require('child_process')
const fs = require('fs')
const V = __dirname
const FPS = 30, END = 132

const take = (name, a, speed = 1, maxTs = Infinity) => ({ dir: `raw-${name}`, // белые кадры переходов между экранами убираем — остаётся чистая смена экрана
  frames: JSON.parse(fs.readFileSync(`${V}/raw-${name}/frames.json`)).filter(([f, ts]) => ts < a - 1 || fs.statSync(`${V}/raw-${name}/${f}`).size > 4500), a, speed, maxTs })
const SHOTS = [take('search', 7.6, 1.25), take('map', 6.8, 1.15), take('order', 6.5, 1.3), take('exec', 11.3, 1.6), take('report', 6.9, 1.1), take('dates', 6.5, 1, 9.6)]

const init = `
window.SHOTS = ${JSON.stringify(SHOTS)};
(function(){
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  const vis=(t,a,b,i,o)=>Math.min(ease((t-a)/i),ease((b-t)/o))
  const K=[[0,1],[5.6,1],[6.4,0],[14.1,0],[14.9,1],[20.6,1],[21.4,0],[27.1,0],[27.9,1],[32.6,1],[33.4,0],[106.6,0],[107.6,1],[999,1]]
  window.TIMELINE={
    scenes:{s1:[0,6],s2:[6.2,14.4],s3:[14.6,20.9],s4:[21.1,27.3],s5:[27.5,32.9],app:[33,98.5],s7:[98.6,106.8],s8:[107,123],s9:[123.2,${END}]},
    chapters:[[33,46],[46,55],[55,67],[67,83],[83,92.5],[92.5,98.5]],
    // [глава, секунда от начала главы, текст, верх]
    chips:[[0,4.2,'Страница памяти',300],[0,10.9,'Свеча зажжена',560],
      [1,1.8,'382 места на плане',300],[1,5.8,'Место № 301 и маршрут',560],
      [2,1.3,'Каталог услуг',300],[2,7.2,'Оплата после результата',560],[2,9.6,'Заказ оформлен',300],
      [3,1.5,'Заказ принят кладбищем',300],[3,4.2,'Фото «до»',560],[3,7.6,'Чек-лист работ',300],[3,11.0,'Фото «после»',560],[3,13.3,'Заказ выполнен',300],
      [4,1.0,'Мои заказы',300],[4,5.5,'Фото до и после',560],
      [5,1.5,'Напомним заранее',300]],
    stLen:3.95,
    darkness:t=>{for(let i=1;i<K.length;i++){if(t<=K[i][0]){const[a,va]=K[i-1],[b,vb]=K[i];return va+(vb-va)*ease((t-a)/(b-a))}}return 1},
    dustK:t=>1-0.6*vis(t,107,123,1.2,1.2),
    dotsK:t=>vis(t,107.2,123.2,1.4,1.2),
    dotsLit:t=>clamp((t-107.5)/14),
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
  await page.goto(`file://${V}/film2.html`, { waitUntil: 'networkidle' })
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
    const out = arg || `${V}/film2-video.mp4`
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
