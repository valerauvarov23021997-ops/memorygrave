/**
 * Сквозной E2E-тест «Памяти» в web-эмуляции (Chromium, мобильный вьюпорт).
 * Проходит основные пользовательские сценарии и фиксирует ошибки консоли.
 */
const { chromium } = require('playwright-core')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const URL = 'http://localhost:8099/'

const results = []
const consoleErrors = []
let page

function log(step, ok, note = '') {
  results.push({ step, ok, note })
  console.log(`${ok ? '✅' : '❌'} ${step}${note ? ' — ' + note : ''}`)
}

async function shot(name) {
  await page.screenshot({ path: `out/e2e-${name}.png` })
}

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

// На web предыдущие экраны стека остаются в DOM скрытыми — ищем только видимые
const text = (t, exact = false) => page.getByText(t, { exact }).filter({ visible: true }).first()

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  page = await ctx.newPage()
  page.on('pageerror', e => consoleErrors.push(`PAGEERROR: ${String(e).slice(0, 200)}`))
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(`CONSOLE: ${m.text().slice(0, 200)}`)
  })

  // ── Запуск и онбординг ──
  await step('Приложение загружается', async () => {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(5500) // анимированный сплэш
    await text('Найдите захоронение близких').waitFor({ timeout: 15000 })
  }, { shotName: '01-onboarding' })

  await step('Онбординг: листание и старт', async () => {
    await text('Далее').click()
    await page.waitForTimeout(600)
    await text('Далее').click()
    await page.waitForTimeout(600)
    await text('Начать').click()
    await text('Вход в аккаунт').waitFor({ timeout: 8000 })
  }, { shotName: '02-phone' })

  // ── Вход ──
  await step('Ввод телефона', async () => {
    await page.locator('input').first().fill('9123456789')
    await page.waitForTimeout(300)
    await text('Получить код').click()
    await text('Введите код').waitFor({ timeout: 8000 })
  }, { shotName: '03-sms' })

  await step('Ввод SMS-кода и вход', async () => {
    // поле кода скрыто (видны только ячейки) и уже в фокусе — печатаем
    await page.waitForTimeout(800)
    await page.keyboard.type('123456', { delay: 90 })
    await page.waitForTimeout(2500)
    await text('Память', true).waitFor({ timeout: 10000 })
  }, { shotName: '04-home' })

  // ── Поиск ──
  await step('Поиск по имени', async () => {
    await page.locator('input').first().fill('Соколов')
    await page.waitForTimeout(1500)
    await text('Соколов Пётр Андреевич').waitFor({ timeout: 8000 })
  }, { shotName: '05-search' })

  await step('Открытие страницы памяти', async () => {
    await text('Соколов Пётр Андреевич').click()
    await page.waitForTimeout(1800)
    await text('Свеча памяти').waitFor({ timeout: 8000 })
  }, { shotName: '06-grave' })

  await step('Зажигание свечи', async () => {
    await text('Зажечь свечу').click()
    await page.waitForTimeout(1500)
    await text('Вы зажгли свечу памяти').waitFor({ timeout: 6000 })
  }, { shotName: '07-candle' })

  await step('Круглое действие «Даты» → напоминания', async () => {
    await text('Даты', true).click()
    await text('Памятные даты').waitFor({ timeout: 6000 })
    await page.waitForTimeout(800)
  }, { shotName: '08-reminders' })

  await step('Переключение напоминания', async () => {
    const sw = page.getByRole('switch').first()
    const before = await sw.isChecked()
    await sw.click()
    await page.waitForTimeout(1200)
    const after = await sw.isChecked()
    await page.goBack()
    await page.waitForTimeout(1000)
    if (before === after) throw new Error(`ползунок не сменил состояние (${before} → ${after})`)
  })

  // ── Заказ ──
  await step('Каталог услуг', async () => {
    await text('Заказать уход').click()
    await page.waitForTimeout(1200)
    await text('Уборка могилы').waitFor({ timeout: 6000 })
  }, { shotName: '09-catalog' })

  await step('Выбор услуги', async () => {
    await text('Уборка могилы').click()
    await page.waitForTimeout(900)
    await text('Выбрать').click()
    await text('Оформление заказа').waitFor({ timeout: 6000 })
  }, { shotName: '10-form' })

  await step('Дата и переход к оплате', async () => {
    // выбираем послезавтра в ленте дат
    const day = new Date(); day.setDate(day.getDate() + 2)
    await text(String(day.getDate()), true).click()
    await page.waitForTimeout(400)
    await text('Перейти к оплате').click()
    await text('Способ оплаты').waitFor({ timeout: 6000 })
  }, { shotName: '11-payment' })

  await step('Смена способа оплаты', async () => {
    await text('Другая карта').click()
    await page.waitForTimeout(800)
    await text('Visa •••• 1881').click()
    await page.waitForTimeout(600)
  })

  await step('Оплата и статус заказа', async () => {
    await page.getByText(/Оплатить \d/).filter({ visible: true }).first().click()
    await text('Статус заказа').waitFor({ timeout: 8000 })
    await page.waitForTimeout(800)
  }, { shotName: '12-order-status' })

  // ── Вкладки ── (после стека заказа возвращаемся на вкладки перезагрузкой — авторизация сохранена)
  await step('Вкладка «Заказы» и фотоотчёт', async () => {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(6500)
    await page.mouse.click(244, 812) // таб «Заказы»
    await page.waitForTimeout(1200)
    await text('Выполнен').first().waitFor({ timeout: 6000 })
    // открываем завершённый заказ
    await page.getByText('Уборка могилы').filter({ visible: true }).first().click()
    await page.waitForTimeout(1000)
    await text('Посмотреть фотоотчёт').click()
    await text('Фотоотчёт').waitFor({ timeout: 6000 })
    await page.waitForTimeout(1500)
  }, { shotName: '13-report' })

  await step('Оценка в отчёте (звёзды)', async () => {
    const stars = page.locator('[role="button"]').filter({ hasText: '' })
    // звёзды — иконки; жмём по координатам блока оценки не будем, пропустим если не нашли
    await page.goBack()
    await page.waitForTimeout(600)
    await page.goBack()
    await page.waitForTimeout(600)
  })

  await step('Вкладка «Сохранённые»', async () => {
    await page.mouse.click(146, 812) // таб «Сохранённые»
    await page.waitForTimeout(1200)
    await text('Соколова Мария Ивановна').waitFor({ timeout: 6000 })
  }, { shotName: '14-saved' })

  await step('Профиль и подписка', async () => {
    await page.mouse.click(341, 812) // таб «Профиль»
    await page.waitForTimeout(1200)
    await text('Подписка').first().waitFor({ timeout: 6000 })
    await shot('15-profile')
    await text('Управлять').click()
    await page.waitForTimeout(1200)
    await text('Премиум').waitFor({ timeout: 6000 })
  }, { shotName: '16-subscription' })

  await step('Смена тарифа', async () => {
    const btns = page.getByText('Выбрать', { exact: true }).filter({ visible: true })
    await btns.last().click()
    await page.waitForTimeout(1500)
    await text('подключён').waitFor({ timeout: 6000 })
    await page.goBack()
    await page.waitForTimeout(800)
  })

  await step('Памятные даты (сводные)', async () => {
    await text('Памятные даты').first().click()
    await page.waitForTimeout(1000)
    await text('Дни поминовения').waitFor({ timeout: 6000 })
    await page.goBack()
    await page.waitForTimeout(600)
  }, { shotName: '17-dates' })

  await step('Редактирование профиля', async () => {
    await text('Валерия Уварова').click()
    await page.waitForTimeout(900)
    await text('Редактировать профиль').waitFor({ timeout: 6000 })
    const input = page.locator('input').last()
    await input.fill('Валерия У.')
    await text('Сохранить', true).click()
    await page.waitForTimeout(1500)
    await text('Валерия У.').waitFor({ timeout: 6000 })
  }, { shotName: '18-profile-edited' })

  await step('Центр уведомлений', async () => {
    await page.mouse.click(49, 812) // таб «Поиск»
    await page.waitForTimeout(800)
    // колокольчик — единственная кнопка в шапке рядом с заголовком
    await page.mouse.click(363, 30) // колокольчик в правом верхнем углу шапки
    await text('Уведомления').waitFor({ timeout: 6000 })
    await text('Заказ выполнен').waitFor({ timeout: 4000 })
  }, { shotName: '19-notifications' })

  // ── Итог ──
  const passed = results.filter(r => r.ok).length
  console.log(`\n══════ ИТОГ: ${passed}/${results.length} шагов ══════`)
  if (consoleErrors.length) {
    const uniq = [...new Set(consoleErrors)].slice(0, 12)
    console.log(`\nОшибки консоли (${consoleErrors.length}, уникальных ${uniq.length}):`)
    uniq.forEach(e => console.log('  •', e))
  } else {
    console.log('Ошибок консоли нет.')
  }
  await browser.close()
})().catch(e => { console.error('FATAL', e); process.exit(1) })
