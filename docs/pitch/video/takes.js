// Съёмка дублей живого приложения для видео «Как работает Память».
// Клиент и исполнитель — веб-сборки на тестовых данных; карта Даймища — реальная съёмка.
const { chromium } = require('/home/user/memorygrave/node_modules/playwright-core')
const fs = require('fs')
const V = '/tmp/claude-0/-home-user-memorygrave/161cbaa8-21fa-569b-9695-258b38836354/scratchpad/video'
const CLIENT = 'http://127.0.0.1:8111'
const EXEC = 'http://127.0.0.1:8110'
const before = fs.readFileSync(`${V}/plot-before.jpg`)
const after = fs.readFileSync(`${V}/plot-after.jpg`)
const marks = {}

// След касания: зелёный круг расходится от точки нажатия
const TOUCH = () => {
  addEventListener('pointerdown', e => {
    const d = document.createElement('div')
    d.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;` +
      'background:rgba(46,80,40,.28);border:2px solid rgba(46,80,40,.55);pointer-events:none;z-index:99999;' +
      'transition:transform .45s ease-out,opacity .45s ease-out'
    document.body.appendChild(d)
    requestAnimationFrame(() => { d.style.transform = 'scale(1.9)'; d.style.opacity = '0' })
    setTimeout(() => d.remove(), 600)
  }, true)
}

async function take(browser, name, init, fn) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ru-RU',
  })
  await ctx.route('**placehold.co**', r => {
    const u = r.request().url()
    r.fulfill({ status: 200, contentType: 'image/jpeg', body: u.includes('EAF3DE') ? after : before })
  })
  await ctx.addInitScript(TOUCH)
  if (init) await ctx.addInitScript(init)
  const page = await ctx.newPage()
  page.on('pageerror', e => console.log(`  [${name}]`, String(e).slice(0, 120)))
  const t0 = Date.now()
  // Запись через CDP-скринкаст: кадры JPEG с отметкой времени (ffmpeg Playwright в песочнице нет)
  const dir = `${V}/raw-${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir)
  const frames = []
  const cdp = await ctx.newCDPSession(page)
  cdp.on('Page.screencastFrame', f => {
    const file = `f${String(frames.length).padStart(5, '0')}.jpg`
    fs.writeFileSync(`${dir}/${file}`, Buffer.from(f.data, 'base64'))
    frames.push([file, (Date.now() - t0) / 1000])
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 })
  const mark = label => { (marks[name] ||= []).push([label, (Date.now() - t0) / 1000]) }
  const vis = (t, exact = false) => page.getByText(t, { exact }).filter({ visible: true }).first()
  const scroll = async (dy, steps = 8) => { for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await page.waitForTimeout(45) } }
  await fn({ page, mark, vis, scroll, wait: ms => page.waitForTimeout(ms) })
  mark('end')
  await cdp.send('Page.stopScreencast').catch(() => {})
  await ctx.close()
  fs.writeFileSync(`${dir}/frames.json`, JSON.stringify(frames))
  console.log(name, 'frames', frames.length)
  console.log(name, JSON.stringify(marks[name]))
}

const signedIn = () => {
  localStorage.setItem('onboarding_seen', 'true')
  localStorage.setItem('accessToken', 'mock-access-token')
  localStorage.setItem('refreshToken', 'mock-refresh-token')
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  const only = process.argv[2]
  const want = n => !only || only === n

  // 1. Поиск человека и страница памяти
  if (want('search')) await take(browser, 'search', signedIn, async ({ page, mark, vis, scroll, wait }) => {
    await page.goto(CLIENT, { waitUntil: 'networkidle' }); await wait(5500); mark('start')
    await page.locator('input').first().click(); await wait(500)
    await page.keyboard.type('Соколов', { delay: 160 }); await wait(1800)
    await vis('Соколов Пётр Андреевич').click(); await wait(3200)
    await scroll(520, 14); await wait(2200)
    await scroll(560, 14); await wait(1200)
    await vis('Зажечь свечу').click(); await wait(3200)
  })

  // 2. Карта кладбища: план, номер, маршрут
  if (want('map')) await take(browser, 'map', signedIn, async ({ page, mark, vis, wait }) => {
    await page.goto(CLIENT, { waitUntil: 'networkidle' }); await wait(5500); mark('start')
    await wait(800)
    await vis('Кладбище д. Даймище').click(); await wait(4200)
    await page.getByPlaceholder('Фамилия или номер места').click(); await wait(400)
    await page.keyboard.type('301', { delay: 260 }); await wait(4200)
  })

  // 3. Заказ ухода
  if (want('order')) await take(browser, 'order', signedIn, async ({ page, mark, vis, wait }) => {
    await page.goto(`${CLIENT}/grave/grave-1`, { waitUntil: 'networkidle' }); await wait(5500); mark('start')
    await wait(800)
    await vis('Заказать уход').click(); await wait(2600)
    await vis('Уборка могилы').click(); await wait(1800)
    await vis('Выбрать').click(); await wait(2200)
    const day = new Date(); day.setDate(day.getDate() + 2)
    await vis(String(day.getDate()), true).click(); await wait(1400)
    await vis('Далее', true).click(); await wait(3000)
    await vis('Оформить заказ', true).click(); await wait(3600)
  })

  // 4. Исполнитель: администрация кладбища выполняет заказ
  if (want('exec')) await take(browser, 'exec', null, async ({ page, mark, vis, wait }) => {
    let phase = 'before'
    page.on('filechooser', fc => fc.setFiles(`${V}/plot-${phase}.jpg`))
    await page.goto(EXEC, { waitUntil: 'networkidle' }); await wait(4000)
    await page.locator('input').first().click(); await page.keyboard.type('9211234567', { delay: 10 })
    await vis(/^Войти$/i).click(); await wait(1200)
    await page.locator('input').last().click(); await page.keyboard.type('123456', { delay: 10 }); await wait(800)
    await vis(/Подтвердить/i).click(); await wait(3500); mark('start')
    await wait(1800)
    await vis(/^Принять$/i).click(); await wait(2600)
    await vis(/Я на месте/i).click(); await wait(1800)
    for (let n = 0; n < 2; n++) { await page.mouse.click(66 + n * 108, 166); await wait(1500) }
    await wait(600)
    await vis(/Продолжить/i).click(); await wait(1800)
    const sw = page.getByRole('switch').filter({ visible: true })
    const nsw = await sw.count()
    for (let i = 0; i < nsw; i++) { await sw.nth(i).click(); await wait(750) }
    await wait(500)
    await vis(/Завершить работы/i).click(); await wait(2000)
    phase = 'after'
    for (let n = 0; n < 2; n++) { await page.mouse.click(66 + n * 108, 166); await wait(1500) }
    await wait(600)
    await vis(/Продолжить/i).click(); await wait(3200)
    mark('done')
    await wait(1500)
  })

  // 5. Фотоотчёт у семьи
  if (want('report')) await take(browser, 'report', signedIn, async ({ page, mark, vis, scroll, wait }) => {
    await page.goto(CLIENT, { waitUntil: 'networkidle' }); await wait(5500); mark('start')
    await wait(600)
    await page.mouse.click(244, 812); await wait(2200)
    await page.getByText('Уборка могилы').filter({ visible: true }).first().click(); await wait(2400)
    await vis('Посмотреть фотоотчёт').click(); await wait(3000)
    await scroll(420, 12); await wait(3500)
  })

  // 6. Памятные даты
  if (want('dates')) await take(browser, 'dates', signedIn, async ({ page, mark, vis, wait }) => {
    await page.goto(`${CLIENT}/grave/grave-1`, { waitUntil: 'networkidle' }); await wait(5500); mark('start')
    await wait(600)
    await vis('Даты', true).click(); await wait(2500)
    await page.getByRole('switch').first().click(); await wait(3000)
  })

  await browser.close()
  fs.writeFileSync(`${V}/marks${only ? '-' + only : ''}.json`, JSON.stringify(marks, null, 1))
})()
