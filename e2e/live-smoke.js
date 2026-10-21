/**
 * Боевой прогон на живой базе — в ВИДИМОМ окне браузера, чтобы видеть каждый шаг.
 *
 * Сессия хранится в e2e/.profile: в первый раз войдите своим кодом из Telegram
 * прямо в открывшемся окне (скрипт подождёт до 5 минут), дальше вход не нужен.
 * Скриншоты — e2e/out/live-*.png, видео прогона — e2e/out/video/.
 *
 *   cd apps/client && npx expo export --platform web --output-dir ../../e2e/dist-live
 *   sed -i 's|" defer>|" type="module">|' ../../e2e/dist-live/index.html
 *   cd ../../e2e && python -m http.server 8098 --directory dist-live &
 *   E2E_BROWSER="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" node live-smoke.js
 *
 * HEADLESS=1 — без окна (для повторных прогонов без наблюдения).
 */
const path = require('path')
const { chromium } = require('playwright-core')

const CHROME = process.env.E2E_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const URL = process.env.E2E_URL || 'http://localhost:8098/'
const LOGIN_WAIT_MS = 5 * 60 * 1000

const results = []
const consoleErrors = []
let page

function log(step, ok, note = '') {
  results.push({ step, ok })
  console.log(`${ok ? '✅' : '❌'} ${step}${note ? ' — ' + note : ''}`)
}
async function shot(name) {
  await page.screenshot({ path: `out/live-${name}.png` })
}
async function step(name, fn, { shotName } = {}) {
  try {
    await fn()
    if (shotName) await shot(shotName)
    log(name, true)
  } catch (e) {
    try {
      await shot(`FAIL-${name.replace(/[^a-zа-яё0-9]+/gi, '_').slice(0, 40)}`)
    } catch {}
    log(name, false, String(e.message || e).split('\n')[0].slice(0, 160))
  }
}
// На web экраны стека остаются в DOM скрытыми — ищем только видимые
const text = (t, exact = false) => page.getByText(t, { exact }).filter({ visible: true }).first()
const pause = ms => page.waitForTimeout(ms)

;(async () => {
  const ctx = await chromium.launchPersistentContext(path.join(__dirname, '.profile'), {
    executablePath: CHROME,
    headless: process.env.HEADLESS === '1',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: path.join(__dirname, 'out/video'), size: { width: 390, height: 844 } },
    args: ['--window-size=430,960'],
  })
  page = ctx.pages()[0] ?? (await ctx.newPage())
  page.on('pageerror', e => consoleErrors.push(`PAGEERROR: ${String(e).slice(0, 160)}`))
  page.on('console', m => {
    if (m.type() === 'error' && !/vibrate/.test(m.text())) consoleErrors.push(`CONSOLE: ${m.text().slice(0, 160)}`)
  })

  await step('Приложение открывается на живой базе', async () => {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
    await pause(1500)
  })

  // Онбординг и вход — только в первый раз, дальше сессия в профиле
  if (await text('Пропустить', true).isVisible().catch(() => false)) await text('Пропустить', true).click()
  if (page.url().includes('/phone') || (await text('Вход в аккаунт').isVisible().catch(() => false))) {
    console.log('\n👉 Войдите в открывшемся окне: номер → код из Telegram. Жду до 5 минут…\n')
    await page.waitForURL(u => !/phone|sms|onboarding/.test(String(u)), { timeout: LOGIN_WAIT_MS })
    await pause(2000)
  }

  await step('Режим — живая база (supabase)', async () => {
    await page.mouse.click(341, 812) // таб «Профиль»
    await text('supabase').waitFor({ timeout: 10000 })
  }, { shotName: '01-profile' })

  await step('Главная: обложка Даймища с фото и числом людей', async () => {
    await page.mouse.click(49, 812) // таб «Поиск»
    await text('Кладбище д. Даймище').waitFor({ timeout: 10000 })
    await text('человек').waitFor({ timeout: 10000 })
    await page.waitForFunction(
      () => [...document.querySelectorAll('img')].filter(i => i.src.includes('/monuments/') && i.complete && i.naturalWidth > 0).length >= 3,
      null,
      { timeout: 20000 }
    )
  }, { shotName: '02-home' })

  await step('Поиск по фамилии в общем поиске', async () => {
    await page.getByPlaceholder('Имя, кладбище или город').fill('Куликова')
    await text('Куликова Тамара Николаевна').waitFor({ timeout: 15000 })
  }, { shotName: '03-search' })

  await step('Страница памяти: фото памятника в портрете', async () => {
    await text('Куликова Тамара Николаевна').click()
    await text('04.08.1932').waitFor({ timeout: 15000 })
    await page.waitForFunction(
      () => [...document.querySelectorAll('img')].some(i => i.src.includes('/monuments/100') && i.complete && i.naturalWidth > 0),
      null,
      { timeout: 20000 }
    )
  }, { shotName: '04-grave' })

  await step('Тап по портрету открывает галерею', async () => {
    await page.mouse.click(195, 105) // центр круглого портрета в шапке
    await pause(1200)
    const big = await page.evaluate(
      () => [...document.querySelectorAll('img')].filter(i => i.src.includes('/monuments/') && i.getBoundingClientRect().width > 300).length
    )
    if (!big) throw new Error('галерея не открылась — нет фото во всю ширину')
  }, { shotName: '05-gallery' })

  await step('Карта: поиск по фамилии даёт список', async () => {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await text('Кладбище д. Даймище').click()
    await page.getByPlaceholder('Фамилия или номер места').waitFor({ timeout: 15000 })
    await page.getByPlaceholder('Фамилия или номер места').fill('Иванов')
    await text('Найдено').waitFor({ timeout: 10000 })
  }, { shotName: '06-map-search' })

  await step('Карта: из списка — на место и страницу памяти', async () => {
    await page.getByPlaceholder('Фамилия или номер места').fill('Куликова')
    await text('Страница памяти').waitFor({ timeout: 8000 })
    await text('Страница памяти').click()
    await text('04.08.1932').waitFor({ timeout: 15000 })
  }, { shotName: '07-map-to-grave' })

  const passed = results.filter(r => r.ok).length
  console.log(`\n══════ ИТОГ: ${passed}/${results.length} шагов ══════`)
  const uniq = [...new Set(consoleErrors)]
  if (uniq.length) {
    console.log(`\nОшибки консоли (${consoleErrors.length}, уникальных ${uniq.length}):`)
    uniq.slice(0, 10).forEach(e => console.log('  •', e))
  }
  await pause(1500)
  await ctx.close()
  process.exit(passed === results.length ? 0 : 1)
})()
