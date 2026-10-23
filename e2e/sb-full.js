/**
 * ПОЛНЫЙ прогон против реальной базы через Яндекс-шлюз (сборка на :8098).
 * Весь путь клиента: вход → поиск → свеча → воспоминание → даты →
 * заказ → оплата → заказы → профиль → тариф → уведомления → перезаход.
 */
const { chromium } = require('playwright-core')
const { fetch: nodeFetch, EnvHttpProxyAgent } = require('undici')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const URL = 'http://localhost:8098/'
const SUPA_HOST = 'd5du3nsn7n7117io58ng.y3q8o1jq.apigw.yandexcloud.net'
const dispatcher = new EnvHttpProxyAgent()

const results = []
const consoleErrors = []
let page

function log(step, ok, note = '') {
  results.push({ step, ok })
  console.log(`${ok ? '✅' : '❌'} ${step}${note ? ' — ' + note : ''}`)
}
async function shot(name) { await page.screenshot({ path: `out/full-${name}.png` }) }
async function step(name, fn, { shotName } = {}) {
  try {
    await fn()
    if (shotName) await shot(shotName)
    log(name, true)
  } catch (e) {
    try { await shot(`FAIL-${name.replace(/[^a-zа-яё0-9]+/gi, '_').slice(0, 40)}`) } catch {}
    log(name, false, String(e.message || e).split('\n')[0].slice(0, 160))
  }
}
const text = (t, exact = false) => page.getByText(t, { exact }).filter({ visible: true }).first()

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  page = await ctx.newPage()

  await page.route(`https://${SUPA_HOST}/**`, async route => {
    const req = route.request()
    try {
      const resp = await nodeFetch(req.url(), {
        method: req.method(), headers: req.headers(), body: req.postDataBuffer() ?? undefined, dispatcher,
      })
      const body = Buffer.from(await resp.arrayBuffer())
      const headers = {}
      resp.headers.forEach((v, k) => {
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) headers[k] = v
      })
      await route.fulfill({ status: resp.status, headers, body })
    } catch (e) {
      console.log('RELAY ERR:', req.method(), req.url().slice(0, 90), String(e).slice(0, 100))
      await route.abort()
    }
  })
  page.on('pageerror', e => consoleErrors.push(`PAGEERROR: ${String(e).slice(0, 160)}`))
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`CONSOLE: ${m.text().slice(0, 160)}`) })

  await step('Вход (анонимная сессия через шлюз)', async () => {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(5500)
    await text('Найдите захоронение близких').waitFor({ timeout: 15000 })
    await text('Далее').click(); await page.waitForTimeout(400)
    await text('Далее').click(); await page.waitForTimeout(400)
    await text('Начать').click()
    await page.locator('input').first().fill('9990001122')
    await text('Получить код').click()
    await text('Введите код').waitFor({ timeout: 10000 })
    await page.waitForTimeout(800)
    await page.keyboard.type('123456', { delay: 80 })
    await text('Память', true).waitFor({ timeout: 20000 })
  }, { shotName: '01-home' })

  await step('Поиск и страница памяти', async () => {
    await page.locator('input').first().click()
    await page.keyboard.type('Соколов Пётр', { delay: 60 })
    await text('Соколов Пётр Андреевич').waitFor({ timeout: 15000 })
    await text('Соколов Пётр Андреевич').click()
    await text('Свеча памяти').waitFor({ timeout: 15000 })
  }, { shotName: '02-grave' })

  await step('Свеча памяти', async () => {
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 90); await page.waitForTimeout(80) }
    await text('Зажечь свечу').click()
    await text('Вы зажгли свечу памяти').waitFor({ timeout: 15000 })
  }, { shotName: '03-candle' })

  await step('Воспоминание в книгу (пишется в базу)', async () => {
    await text('Поделиться воспоминанием').click()
    await page.waitForTimeout(1000)
    await page.locator('input:visible').last().fill('Валерий')
    await page.getByPlaceholder(/Расскажите историю/).fill('Проверочное воспоминание через прокси')
    await text('Добавить в книгу').click()
    await text('Проверочное воспоминание через прокси').waitFor({ timeout: 15000 })
  }, { shotName: '04-memory' })

  await step('Заказ: каталог и услуга', async () => {
    await text('Заказать уход').click()
    await text('Уборка могилы').waitFor({ timeout: 15000 })
    await text('Уборка могилы').click()
    await page.waitForTimeout(800)
    await text('Выбрать').click()
    await text('Оформление заказа').waitFor({ timeout: 10000 })
  }, { shotName: '05-order-form' })

  await step('Заказ: дата и оплата (заказ в базе)', async () => {
    const day = new Date(); day.setDate(day.getDate() + 2)
    await text(String(day.getDate()), true).click()
    await page.waitForTimeout(400)
    await text('Перейти к оплате').click()
    await text('Способ оплаты').waitFor({ timeout: 10000 })
    await page.getByText(/Оплатить \d/).filter({ visible: true }).first().click()
    await text('Статус заказа').waitFor({ timeout: 20000 })
  }, { shotName: '06-order-status' })

  await step('Вкладка «Заказы»: реальный заказ из базы', async () => {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(6000)
    await page.mouse.click(244, 812)
    await text('Уборка могилы').waitFor({ timeout: 15000 })
  }, { shotName: '07-orders' })

  await step('Профиль: имя (пишется в базу)', async () => {
    await page.mouse.click(341, 812)
    await page.waitForTimeout(1500)
    await text('Гость').click()
    await text('Редактировать профиль').waitFor({ timeout: 10000 })
    const input = page.locator('input').last()
    await input.fill('Валерий Т.')
    await text('Сохранить', true).click()
    await text('Валерий Т.').waitFor({ timeout: 15000 })
  }, { shotName: '08-name' })

  await step('Смена тарифа (пишется в базу)', async () => {
    await text('Управлять').click()
    await text('Премиум').waitFor({ timeout: 10000 })
    const btns = page.getByText('Выбрать', { exact: true }).filter({ visible: true })
    await btns.first().click()
    await text('подключён').waitFor({ timeout: 15000 })
    await page.goBack()
    await page.waitForTimeout(800)
  }, { shotName: '09-plan' })

  await step('Уведомления: приветственное из базы', async () => {
    await page.mouse.click(49, 812)
    await page.waitForTimeout(800)
    await page.mouse.click(363, 30)
    await text('Уведомления').waitFor({ timeout: 10000 })
    await text('Добро пожаловать').waitFor({ timeout: 10000 })
  }, { shotName: '10-notifications' })

  await step('Перезаход: данные не теряются', async () => {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(6000)
    await page.mouse.click(341, 812)
    await page.waitForTimeout(1500)
    await text('Выйти из аккаунта').click()
    await text('Вход в аккаунт').waitFor({ timeout: 10000 })
    await page.locator('input').first().fill('9990001122')
    await text('Получить код').click()
    await text('Введите код').waitFor({ timeout: 10000 })
    await page.waitForTimeout(800)
    await page.keyboard.type('123456', { delay: 80 })
    await text('Память', true).waitFor({ timeout: 20000 })
    await page.mouse.click(341, 812)
    await page.waitForTimeout(1500)
    // то же имя и тот же тариф — пользователь не потерялся
    await text('Валерий Т.').waitFor({ timeout: 10000 })
  }, { shotName: '11-relogin' })

  const passed = results.filter(r => r.ok).length
  console.log(`\n══════ ИТОГ: ${passed}/${results.length} шагов ══════`)
  if (consoleErrors.length) {
    const uniq = [...new Set(consoleErrors)]
    console.log(`\nОшибки консоли (${consoleErrors.length}, уникальных ${uniq.length}):`)
    uniq.slice(0, 8).forEach(e => console.log('  • ' + e))
  }
  await browser.close()
  process.exit(passed === results.length ? 0 : 1)
})().catch(e => { console.error(e); process.exit(1) })
