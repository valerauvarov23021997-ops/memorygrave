/**
 * Съёмка «дубля» для промо-видео: живое приложение, хореография сцен.
 * Пишется видео 390×844 (webm), сцены с точным таймингом.
 */
const { chromium } = require('playwright-core')
const fs = require('fs')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: 'video-raw', size: { width: 390, height: 844 } },
  })
  const page = await ctx.newPage()

  // Красивые фото вместо заблокированных placehold.co
  const before = fs.readFileSync('ph-before.png')
  const after = fs.readFileSync('ph-after.png')
  const portrait = fs.readFileSync('ph-portrait.png')
  let photoIdx = 0
  await page.route('**placehold.co**', route => {
    const url = route.request().url()
    let body = portrait
    if (url.includes('F0EBE0') || url.includes('EDE7D9')) body = before
    else if (url.includes('EAF3DE') || url.includes('E8F0DC')) body = after
    else body = [portrait, before, after][photoIdx++ % 3]
    route.fulfill({ status: 200, contentType: 'image/png', body })
  })

  // Онбординг и авторизация уже пройдены — промо начинается со сплэша в приложение
  await ctx.addInitScript(() => {
    localStorage.setItem('onboarding_seen', 'true')
    localStorage.setItem('accessToken', 'mock-access-token')
    localStorage.setItem('refreshToken', 'mock-refresh-token')
  })

  const vis = t => page.getByText(t).filter({ visible: true }).first()

  // ── Сцена 1: сплэш (пламя наливается) → главная ──
  await page.goto('http://localhost:8099/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(7000)

  // ── Сцена 2: поиск по имени, печатаем по-живому ──
  await page.locator('input').first().click()
  await page.keyboard.type('Соколов', { delay: 150 })
  await page.waitForTimeout(1700)

  // ── Сцена 3: страница памяти ──
  await vis('Соколов Пётр Андреевич').click()
  await page.waitForTimeout(2200)
  // плавный скролл к свече
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 90)
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(900)

  // ── Сцена 4: зажигаем свечу ──
  await vis('Зажечь свечу').click()
  await page.waitForTimeout(3800)

  // ── Сцена 5: фотоотчёт (последний уход) ──
  for (let i = 0; i < 7; i++) {
    await page.mouse.wheel(0, 110)
    await page.waitForTimeout(100)
  }
  await page.waitForTimeout(700)
  await vis('Уборка могилы').click()
  await page.waitForTimeout(1500)
  await vis('Посмотреть фотоотчёт').click().catch(() => {})
  await page.waitForTimeout(3200)

  await ctx.close() // сохраняет видео
  const files = fs.readdirSync('video-raw')
  console.log('RAW:', files.join(', '))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
