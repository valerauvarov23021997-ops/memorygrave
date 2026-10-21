/**
 * Стресс-обход: открывает каждый экран, нажимает КАЖДЫЙ нажимаемый элемент
 * и пишет отчёт о проблемах. Идёт на фикстурах — нажатия ничего не меняют в базе.
 *
 *   cd apps/client
 *   EXPO_PUBLIC_USE_MOCKS=true EXPO_PUBLIC_E2E=1 npx expo export --platform web --output-dir ../../e2e/dist --clear
 *   sed -i 's|" defer>|" type="module">|' ../../e2e/dist/index.html
 *   cd ../../e2e && node spa-server.js dist 8099 &
 *   node crawl.js            # SHOW=1 — в видимом окне
 *
 * Что ищет на каждом экране и после каждого нажатия:
 *   • ошибки JS и ответы 4xx/5xx;
 *   • «мёртвые» кнопки — нажатие ничего не меняет;
 *   • битые картинки, пустые иконки (svg без рисунка);
 *   • undefined / NaN / [object Object] / непереведённые ключи i18n в тексте;
 *   • вылезание за правый край экрана, кнопки меньше 44 pt.
 * Отчёт — out/crawl-report.md, скриншоты проблем — out/crawl-*.png.
 */
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-core')

const CHROME = process.env.E2E_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = process.env.E2E_URL || 'http://localhost:8099'
const MAX_CLICKS = Number(process.env.MAX_CLICKS || 40)

const ROUTES = [
  ['Главная', '/'],
  ['Сохранённые', '/saved'],
  ['Заказы', '/orders'],
  ['Профиль', '/profile'],
  ['Страница памяти', '/grave/grave-1'],
  ['Добавить захоронение', '/grave/add'],
  ['Карта кладбища', '/cemetery/daymische'],
  ['Каталог услуг', '/order/catalog?graveId=grave-1'],
  ['Статус заказа', '/order/order-1'],
  ['Фотоотчёт', '/report/order-1'],
  ['Напоминания', '/reminders/grave-1'],
  ['Памятные даты', '/dates'],
  ['Уведомления', '/notifications'],
  ['Подписка', '/subscription'],
  ['QR-код', '/qr/grave-1'],
  ['Приглашение', '/invite/grave-1'],
]

const issues = [] // { screen, kind, detail, shot? }
const stats = { screens: 0, clicks: 0, dead: 0 }
let page
let liveErrors = []

const out = p => path.join(__dirname, 'out', p)
const slug = s => s.replace(/[^a-zа-яё0-9]+/gi, '_').slice(0, 50)
function add(screen, kind, detail, shot) {
  if (issues.some(i => i.screen === screen && i.kind === kind && i.detail === detail)) return
  issues.push({ screen, kind, detail, shot })
  console.log(`   ⚠ ${kind}: ${detail}`)
}

/** Нажимаемые элементы экрана в стабильном порядке, только видимые и не перекрытые. */
async function clickables() {
  return page.evaluate(() => {
    const vis = el => {
      const r = el.getBoundingClientRect()
      const st = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0.05
    }
    // На web предыдущие экраны стека остаются в DOM, но скрыты/перекрыты —
    // проверяем, что элемент реально сверху в своей точке
    const onTop = el => {
      const r = el.getBoundingClientRect()
      const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1)
      const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1)
      if (r.top + r.height / 2 < 0 || r.top + r.height / 2 > innerHeight) return true // ниже экрана — проверим после прокрутки
      const hit = document.elementFromPoint(x, y)
      return !!hit && (el === hit || el.contains(hit))
    }
    const all = [...document.querySelectorAll('[role="button"],[role="link"],[role="tab"],[role="switch"],[role="checkbox"],[tabindex="0"],a[href],input,textarea')]
    return all
      .filter(el => vis(el) && onTop(el))
      .map(el => {
        const r = el.getBoundingClientRect()
        const label = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 50)
        return { label, tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), input: /INPUT|TEXTAREA/.test(el.tagName) }
      })
  })
}

/** Проверки содержимого текущего экрана. */
async function inspect(screen) {
  const found = await page.evaluate(() => {
    const res = []
    const visible = el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden'
    }
    for (const img of document.querySelectorAll('img')) {
      if (visible(img) && img.complete && img.naturalWidth === 0) res.push(['битая картинка', img.src.slice(0, 90)])
    }
    for (const svg of document.querySelectorAll('svg')) {
      if (!visible(svg)) continue
      const drawn = svg.querySelectorAll('path[d]:not([d=""]),circle,rect,line,polyline,polygon,ellipse,text,image').length
      if (!drawn) res.push(['пустая иконка', `svg ${Math.round(svg.getBoundingClientRect().width)}px`])
    }
    const text = document.body.innerText
    for (const m of text.matchAll(/\b(undefined|NaN|\[object Object\])\b/g)) res.push(['мусор в тексте', m[0]])
    // непереведённый ключ i18n: слово.слово без пробелов, не адрес и не дата
    for (const m of text.matchAll(/(^|\s)([a-z]+(?:\.[a-z][a-zA-Z]+)+)(?=\s|$)/g)) {
      if (!/\.(ru|com|app|co|net|org|me)$/.test(m[2])) res.push(['непереведённый ключ', m[2]])
    }
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.right > innerWidth + 2 && r.top < innerHeight && r.bottom > 0 && getComputedStyle(el).position !== 'fixed') {
        const t = (el.innerText || '').trim().slice(0, 40)
        if (t) {
          res.push(['вылезает за край', `«${t}» до ${Math.round(r.right)}px`])
          break
        }
      }
    }
    return res
  })
  for (const [kind, detail] of found) add(screen, kind, detail)
}

async function open(route) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1200)
}

const fingerprint = () =>
  page.evaluate(() => `${location.href}|${document.body.innerText.length}|${document.querySelectorAll('[role="dialog"],[aria-modal="true"]').length}|${document.body.innerText.slice(0, 400)}`)

;(async () => {
  fs.mkdirSync(out(''), { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: process.env.SHOW !== '1' })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  page = await ctx.newPage()
  page.on('pageerror', e => liveErrors.push(`JS: ${String(e.message || e).slice(0, 140)}`))
  page.on('console', m => {
    if (m.type() === 'error' && !/vibrate|Failed to load resource/.test(m.text())) liveErrors.push(`console: ${m.text().slice(0, 140)}`)
  })
  page.on('response', r => {
    if (r.status() >= 400 && !/favicon/.test(r.url())) liveErrors.push(`HTTP ${r.status()}: ${r.url().replace(BASE, '').slice(0, 100)}`)
  })
  page.on('dialog', d => void d.dismiss())
  ctx.on('page', p => void p.close()) // внешние ссылки (Яндекс.Карты, Telegram) — не уходим

  // Вход в демо-режиме — один раз, сессия в localStorage
  await open('/')
  const t = s => page.getByText(s, { exact: true }).filter({ visible: true }).first()
  for (let i = 0; i < 3 && (await t('Далее').isVisible().catch(() => false)); i++) await t('Далее').click()
  if (await t('Начать').isVisible().catch(() => false)) await t('Начать').click()
  await page.waitForTimeout(800)
  if (await page.locator('input').first().isVisible().catch(() => false)) {
    await page.locator('input').first().fill('9123456789')
    await t('Получить код').click()
    await page.waitForTimeout(1200)
    await page.keyboard.type('123456', { delay: 60 })
    await page.waitForTimeout(2500)
  }
  liveErrors = []

  for (const [screen, route] of ROUTES) {
    stats.screens++
    console.log(`\n▶ ${screen}  ${route}`)
    await open(route)
    await inspect(screen)
    for (const e of liveErrors) add(screen, 'ошибка при открытии', e)
    liveErrors = []
    await page.screenshot({ path: out(`crawl-${slug(screen)}.png`) })

    const items = await clickables()
    for (const it of items) if (!it.input && (it.w < 44 || it.h < 44)) add(screen, 'мелкая кнопка', `«${it.label}» ${it.w}×${it.h}`)
    console.log(`   нажимаемых: ${items.length}`)

    for (let i = 0; i < Math.min(items.length, MAX_CLICKS); i++) {
      await open(route)
      const now = await clickables()
      const target = now[i]
      if (!target || target.label !== items[i].label) continue // экран перестроился — пропускаем
      if (target.input) continue
      liveErrors = []
      const before = await fingerprint()
      try {
        const handles = await page.$$('[role="button"],[role="link"],[role="tab"],[role="switch"],[role="checkbox"],[tabindex="0"],a[href],input,textarea')
        // тот же порядок фильтрации, что в clickables(): ищем i-й видимый
        let k = -1
        let el = null
        for (const h of handles) {
          const ok = await h.evaluate(e => {
            const r = e.getBoundingClientRect()
            const st = getComputedStyle(e)
            if (!(r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0.05)) return false
            const cy = r.top + r.height / 2
            if (cy < 0 || cy > innerHeight) return true
            const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy)
            return !!hit && (e === hit || e.contains(hit))
          })
          if (ok && ++k === i) {
            el = h
            break
          }
        }
        if (!el) continue
        await el.scrollIntoViewIfNeeded()
        await el.click({ timeout: 3000 })
        stats.clicks++
        await page.waitForTimeout(900)
      } catch (e) {
        add(screen, 'не нажимается', `«${target.label}»: ${String(e.message).split('\n')[0].slice(0, 80)}`)
        continue
      }
      const after = await fingerprint()
      if (after === before) {
        stats.dead++
        const shot = `crawl-dead-${slug(screen)}-${i}.png`
        await page.screenshot({ path: out(shot) })
        add(screen, 'нажатие без реакции', `«${target.label}»`, shot)
      }
      await inspect(screen)
      for (const e of liveErrors) add(screen, `ошибка после «${target.label}»`, e)
    }
  }

  // ── Отчёт ──
  const byKind = {}
  for (const i of issues) (byKind[i.kind.replace(/ после «.*»$/, ' после нажатия')] ??= []).push(i)
  const lines = [
    `# Стресс-обход «Памяти» — ${new Date().toLocaleString('ru-RU')}`,
    '',
    `Экранов: ${stats.screens} · нажатий: ${stats.clicks} · без реакции: ${stats.dead} · проблем: ${issues.length}`,
    '',
  ]
  for (const [kind, list] of Object.entries(byKind)) {
    lines.push(`## ${kind} (${list.length})`, '')
    for (const i of list) lines.push(`- **${i.screen}** — ${i.detail}${i.shot ? ` ([скриншот](${i.shot}))` : ''}`)
    lines.push('')
  }
  fs.writeFileSync(out('crawl-report.md'), lines.join('\n'), 'utf8')
  console.log(`\n══════ Экранов ${stats.screens}, нажатий ${stats.clicks}, без реакции ${stats.dead}, проблем ${issues.length} ══════`)
  console.log('Отчёт: e2e/out/crawl-report.md')
  await browser.close()
})()
