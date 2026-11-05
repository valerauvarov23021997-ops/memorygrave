// Видео «Память» v3 — кинематографичный моушн. node film3.js preview 3,20 | node film3.js render out.mp4
const { chromium } = require('/home/user/memorygrave/node_modules/playwright-core')
const { spawn } = require('child_process')
const fs = require('fs')
const V = __dirname
const FPS = 30, END = 115
const take = (name, a, speed, maxTs = 1e9) => ({ dir: `raw-${name}`, a, speed, frames: JSON.parse(fs.readFileSync(`${V}/raw-${name}/frames.json`))
  .filter(([f, ts]) => ts <= maxTs && (ts < a - 1 || fs.statSync(`${V}/raw-${name}/${f}`).size > 4500)) })
const SHOTS = [take('search', 7.6, 1.75), take('map', 6.8, 1.5), take('order', 6.5, 1.9), take('exec', 11.3, 2.3), take('report', 6.9, 1.3), take('dates', 6.5, 1, 9.6)]
const C = [195, 422]
const TL = {
  sc: { A: [0, 8.6], B: [8.2, 17.4], C: [17.0, 25.6], D: [25.2, 31.6], E: [31.2, 38.6], F: [38, 84.4], G: [84, 93.4], H: [93, 105.4], I: [105, END] },
  ch: [[38, 47], [47, 54], [54, 62], [62, 73], [73, 79], [79, 84.4]],
  // [секунда главы, зум, фокус x, фокус y] — в координатах экрана 390×844
  cams: [
    [[0, 1.85, 195, 120], [1.7, 1.85, 195, 160], [2.8, 1, ...C], [6.6, 1, ...C], [7.7, 1.7, 195, 70], [9, 1.75, 195, 70]],
    [[0, 1, ...C], [4.4, 1, ...C], [5.4, 1.85, 195, 372], [7, 1.9, 195, 372]],
    [[0, 1, ...C], [0.9, 1.45, 195, 250], [3.4, 1.45, 195, 250], [4.3, 1, ...C], [4.9, 1, ...C], [5.6, 1.9, 195, 130], [6.6, 1.9, 195, 130], [7.3, 1, ...C], [8, 1, ...C]],
    [[0, 1, ...C], [2.3, 1, ...C], [3.0, 1.8, 150, 170], [4.4, 1.8, 150, 170], [5.0, 1.6, 195, 215], [6.6, 1.6, 195, 215], [7.3, 1.8, 150, 170], [8.9, 1.8, 150, 170], [9.5, 1.7, 195, 120], [11, 1.7, 195, 120]],
    [[0, 1, ...C], [4.1, 1, ...C], [5.0, 1.35, 195, 380], [6, 1.4, 195, 380]],
    [[0, 1, ...C], [1.2, 1, ...C], [2.2, 1.6, 195, 200], [5.4, 1.65, 195, 200]],
  ],
  stLen: 4.0,
}
const init = `window.SHOTS=${JSON.stringify(SHOTS)};window.TL=${JSON.stringify(TL)};
window.TL.fadeBlack=t=>{const c=x=>Math.min(1,Math.max(0,x));return Math.max(1-c(t/1.2), c((t-(${END}-2.2))/2.2))};`
;(async () => {
  const [mode, arg] = process.argv.slice(2)
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] })
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on('pageerror', e => console.log('ERR', String(e)))
  await page.addInitScript(init)
  await page.goto(`file://${V}/film3.html`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800)
  if (mode === 'preview') {
    for (const t of arg.split(',').map(Number)) { await page.evaluate(([t, f]) => window.render(t, f), [t, Math.round(t * FPS)]); await page.screenshot({ path: `${V}/p3-${t}.jpg`, type: 'jpeg', quality: 85 }) }
  } else {
    const out = arg || `${V}/film3-video.mp4`
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'grain', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] })
    const N = Math.round(END * FPS), t0 = Date.now()
    for (let f = 0; f < N; f++) {
      await page.evaluate(([t, f]) => window.render(t, f), [f / FPS, f])
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 })
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
      if (f % 300 === 0) console.log(`кадр ${f}/${N}, ${((Date.now() - t0) / 1000).toFixed(0)} с`)
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('готово', out)
  }
  await b.close()
})()
