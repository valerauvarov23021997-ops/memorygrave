/**
 * Генератор инвестиционной презентации «Память» → PDF.
 * 14 слайдов 1280×720, Apple-стиль, фирменная палитра Warm Minimal.
 */
const { chromium } = require('playwright-core')
const fs = require('fs')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const C = {
  forest: '#1C3318', moss: '#2E5028', deep: '#12200E', sage: '#5A8A52', sageL: '#8EBD86', sageXL: '#C4DEC0',
  cream: '#FAF7F2', creamHi: '#FDFBF6', parchment: '#F0EBE0', linen: '#EDE7D9', stone: '#C8BEA8',
  gold: '#B8935A', goldL: '#D9B36B', ink: '#1A1A14', muted: '#6B6B5E', light: '#9A9A8E',
  error: '#9B1C1C',
}

const b64 = p => fs.readFileSync(p).toString('base64')
const font = (name, file) =>
  `@font-face{font-family:'${name}';src:url(data:font/ttf;base64,${b64(`/home/user/memorygrave/node_modules/@expo-google-fonts/${file}`)}) format('truetype')}`

const img = p => `data:image/png;base64,${b64(`/tmp/claude-0/-home-user-memorygrave/161cbaa8-21fa-569b-9695-258b38836354/scratchpad/shots/${p}`)}`

// ── Эмблема-пламя ──────────────────────────────────────────────
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'
function flame(size) {
  return `<svg width="${size}" height="${size * 1.4}" viewBox="0 0 100 140">
    <defs><linearGradient id="fg${size}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.goldL}"/><stop offset=".55" stop-color="${C.gold}"/><stop offset="1" stop-color="#9A6E2E"/></linearGradient>
    <linearGradient id="cg${size}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7E4"/><stop offset="1" stop-color="#FCEAC0"/></linearGradient></defs>
    <path d="${FLAME}" fill="url(#fg${size})"/><path d="${CORE}" fill="url(#cg${size})"/>
  </svg>`
}

// ── Графики (SVG, статичные — прямые подписи вместо ховера) ──
// Выручка по годам: одна серия, лес на креме, подпись на каждом из 4 баров
function revenueChart() {
  const data = [ ['2026', 12], ['2027', 85], ['2028', 330], ['2029', 720] ]
  const W = 640, H = 360, padL = 20, padB = 44, padT = 46
  const max = 750
  const bw = 92, gap = (W - padL * 2 - bw * 4) / 3
  const bars = data.map(([year, v], i) => {
    const h = Math.round((v / max) * (H - padT - padB))
    const x = padL + i * (bw + gap)
    const y = H - padB - h
    return `
      <rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" fill="${C.forest}"/>
      <rect x="${x}" y="${H - padB - 2}" width="${bw}" height="2" fill="${C.forest}"/>
      <text x="${x + bw / 2}" y="${y - 12}" text-anchor="middle" class="chart-val">${v}</text>
      <text x="${x + bw / 2}" y="${H - padB + 28}" text-anchor="middle" class="chart-cat">${year}</text>`
  }).join('')
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <line x1="${padL}" y1="${H - padB}" x2="${W - padL}" y2="${H - padB}" stroke="${C.linen}" stroke-width="1"/>
    ${bars}
  </svg>`
}

// Накопленный денежный поток: полярность вокруг нуля (divergent: sage/терракота, нейтральный ноль)
function paybackChart() {
  const pts = [[0, -8], [3, -20], [6, -31], [9, -40], [12, -47], [15, -52], [18, -50], [21, -42], [24, -25], [26, 0], [30, 38], [33, 78], [36, 130]]
  const W = 640, H = 360, padL = 56, padR = 24, padT = 30, padB = 40
  const xMax = 36, yMin = -70, yMax = 140
  const X = m => padL + (m / xMax) * (W - padL - padR)
  const Y = v => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB)
  const line = pts.map(([m, v], i) => `${i ? 'L' : 'M'}${X(m).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  const zero = Y(0)
  // области выше/ниже нуля
  const areaNeg = `M${X(0)},${zero} ` + pts.filter(p => p[1] <= 0).map(([m, v]) => `L${X(m)},${Y(v)}`).join(' ') + ` L${X(26)},${zero} Z`
  const areaPos = `M${X(26)},${zero} ` + pts.filter(p => p[0] >= 26).map(([m, v]) => `L${X(m)},${Y(v)}`).join(' ') + ` L${X(36)},${zero} Z`
  const grid = [-50, 0, 50, 100].map(v =>
    `<line x1="${padL}" y1="${Y(v)}" x2="${W - padR}" y2="${Y(v)}" stroke="${v === 0 ? C.stone : C.linen}" stroke-width="${v === 0 ? 1.5 : 1}"/>
     <text x="${padL - 10}" y="${Y(v) + 5}" text-anchor="end" class="chart-cat">${v}</text>`).join('')
  const months = [0, 12, 24, 36].map(m =>
    `<text x="${X(m)}" y="${H - padB + 26}" text-anchor="middle" class="chart-cat">${m === 0 ? 'старт' : m + ' мес'}</text>`).join('')
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${grid}${months}
    <path d="${areaNeg}" fill="${C.error}" opacity="0.10"/>
    <path d="${areaPos}" fill="${C.sage}" opacity="0.16"/>
    <path d="${line}" fill="none" stroke="${C.forest}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${X(26)}" cy="${zero}" r="6" fill="${C.gold}" stroke="${C.cream}" stroke-width="2"/>
    <text x="${X(26)}" y="${zero - 16}" text-anchor="middle" class="chart-note">окупаемость · 26-й месяц</text>
    <circle cx="${X(36)}" cy="${Y(130)}" r="5" fill="${C.forest}"/>
    <text x="${X(36) - 8}" y="${Y(130) - 12}" text-anchor="end" class="chart-val">+130 млн ₽</text>
  </svg>`
}

// TAM/SAM/SOM: последовательная шкала одного тона (магнитуда), горизонтальные бары
function marketChart() {
  const rows = [
    ['TAM · ритуальный рынок РФ', 300, '300 млрд ₽/год', C.sageXL],
    ['SAM · уход и благоустройство', 30, '≈30 млрд ₽/год', C.sage],
    ['SOM · план 2028, GMV', 1.2, '1,2 млрд ₽', C.forest],
  ]
  const W = 560, H = 240, padL = 0, rowH = 66, barH = 30
  const max = 300
  const min = 8 // видимый минимум для SOM
  const bars = rows.map(([label, v, val, color], i) => {
    const w = Math.max((Math.log10(v + 1) / Math.log10(max + 1)) * (W - 150), min)
    const y = i * rowH + 24
    return `
      <text x="0" y="${y - 6}" class="chart-cat" style="font-size:15px">${label}</text>
      <rect x="0" y="${y}" width="${w}" height="${barH}" rx="4" fill="${color}"/>
      <text x="${w + 12}" y="${y + barH / 2 + 5}" class="chart-val" style="font-size:17px">${val}</text>`
  }).join('')
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bars}
    <text x="0" y="${H - 2}" class="chart-note" style="fill:${C.light}">логарифмическая шкала · оценки: ФАС, отраслевые исследования 2023–2025</text>
  </svg>`
}

// ── Слайды ─────────────────────────────────────────────────────
const kicker = (text, dark) => `<div class="kicker ${dark ? 'kicker-dark' : ''}">${text}</div>`

const slides = []

// 1 · Обложка
slides.push(`
<section class="slide dark cover">
  <div class="cover-inner">
    <div class="cover-flame">${flame(72)}</div>
    <h1 class="cover-title">Память</h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">Сервис заботы о местах памяти близких —<br/>по всей России, с обязательным фотоотчётом</p>
    <p class="cover-meta">Инвестиционная презентация · Редакция от 1 июля 2026 г.</p>
  </div>
</section>`)

// 2 · Проблема
slides.push(`
<section class="slide light">
  ${kicker('Проблема')}
  <h2 class="h2">Могилы близких — за сотни километров.<br/>Ухаживать за ними некому.</h2>
  <div class="tiles3">
    <div class="tile"><div class="tile-num">1,8 млн</div><div class="tile-cap">человек уходит из жизни в России ежегодно — у каждого остаётся место памяти, требующее ухода</div></div>
    <div class="tile"><div class="tile-num">50%+</div><div class="tile-cap">россиян живут не там, где родились, — навестить могилу родителей часто означает поездку в другой регион</div></div>
    <div class="tile"><div class="tile-num">до 60%</div><div class="tile-cap">ритуального рынка — в серой зоне: «бригады по объявлению» без договора, гарантий и подтверждения работ</div></div>
  </div>
  <p class="foot">Источники: Росстат (2023–2025), оценки ФАС России по ритуальной отрасли</p>
</section>`)

// 3 · Решение
slides.push(`
<section class="slide dark statement">
  ${kicker('Решение', true)}
  <h2 class="h2-dark">Закажите уход за могилой<br/>из любой точки страны —<br/><span class="gold">и увидите результат на фото.</span></h2>
  <div class="row3-dark">
    <div><div class="mini-t">Заказ в два касания</div><div class="mini-c">Поиск захоронения, каталог услуг, онлайн-оплата</div></div>
    <div><div class="mini-t">Фотоотчёт — стандарт</div><div class="mini-c">Каждая работа подтверждается снимками «до» и «после»</div></div>
    <div><div class="mini-t">Память как сервис</div><div class="mini-c">Напоминания о датах, свеча памяти, семейный доступ</div></div>
  </div>
</section>`)

// 4 · Рынок
slides.push(`
<section class="slide light">
  ${kicker('Рынок')}
  <h2 class="h2">Огромный офлайн-рынок<br/>без цифрового лидера</h2>
  <div class="split">
    <div class="split-l">${marketChart()}</div>
    <div class="split-r">
      <div class="fact"><div class="fact-num">70 000+</div><div class="fact-cap">официальных кладбищ в России; с учётом сельских и неучтённых — до 500 000 объектов</div></div>
      <div class="fact"><div class="fact-num">250–300 <span class="unit">млрд ₽</span></div><div class="fact-cap">годовой объём ритуального рынка РФ — при этом уход за захоронениями почти не оцифрован</div></div>
    </div>
  </div>
</section>`)

// 5 · MVP готов
slides.push(`
<section class="slide light mvp">
  ${kicker('Продукт')}
  <h2 class="h2">MVP готов и работает</h2>
  <div class="phones">
    <img class="phone tilt-l" src="${img('phone-01-search.png')}"/>
    <img class="phone center" src="${img('phone-02-grave.png')}"/>
    <img class="phone tilt-r" src="${img('phone-04-candle.png')}"/>
  </div>
  <div class="badges">
    <span class="badge">16 экранов</span><span class="badge">iOS + Android</span><span class="badge">2 приложения: клиент и исполнитель</span><span class="badge">Яндекс.Карты</span><span class="badge">готов к публикации в сторах</span>
  </div>
</section>`)

// 6 · Как это работает
slides.push(`
<section class="slide light">
  ${kicker('Как это работает')}
  <h2 class="h2">Замкнутый цикл заботы</h2>
  <div class="steps">
    <div class="step"><div class="step-n">01</div><div class="step-t">Клиент находит захоронение</div><div class="step-c">Поиск по имени, городу, кладбищу — или добавляет своё</div></div>
    <div class="step"><div class="step-n">02</div><div class="step-t">Заказывает услугу</div><div class="step-c">Уборка, цветы, реставрация — фиксированная цена, онлайн-оплата</div></div>
    <div class="step"><div class="step-n">03</div><div class="step-t">Исполнитель выполняет</div><div class="step-c">Приложение ведёт по чек-листу и требует фото «до/после»</div></div>
    <div class="step"><div class="step-n">04</div><div class="step-t">Клиент возвращается</div><div class="step-c">Напоминания о годовщинах и днях поминовения приводят к повторным заказам</div></div>
  </div>
</section>`)

// 7 · Монетизация
slides.push(`
<section class="slide dark">
  ${kicker('Монетизация', true)}
  <h2 class="h2-dark">Четыре источника выручки</h2>
  <div class="mono-grid">
    <div class="mono"><div class="mono-n gold">25–30%</div><div class="mono-t">Комиссия платформы</div><div class="mono-c">с каждого заказа услуг — ядро модели</div></div>
    <div class="mono"><div class="mono-n gold">299–699 ₽/мес</div><div class="mono-t">Подписка</div><div class="mono-c">напоминания, автозаказ к датам, приоритетные исполнители</div></div>
    <div class="mono"><div class="mono-n gold">10–15%</div><div class="mono-t">Партнёрская программа</div><div class="mono-c">памятники (ср. чек 60 000 ₽), цветочные сети, ритуальные агентства</div></div>
    <div class="mono"><div class="mono-n gold">B2G / B2B</div><div class="mono-t">Цифровизация реестров</div><div class="mono-c">SaaS для муниципалитетов и управляющих кладбищами</div></div>
  </div>
</section>`)

// 8 · Юнит-экономика
slides.push(`
<section class="slide light">
  ${kicker('Юнит-экономика')}
  <h2 class="h2">Сервис с естественной повторяемостью</h2>
  <div class="tiles4">
    <div class="tile"><div class="tile-num">2 900 ₽</div><div class="tile-cap">средний чек заказа</div></div>
    <div class="tile"><div class="tile-num">3,2</div><div class="tile-cap">заказа на клиента в год — годовщины, Радоница, сезонные уборки</div></div>
    <div class="tile"><div class="tile-num">7 400 ₽</div><div class="tile-cap">LTV за 24 месяца (комиссия + подписка)</div></div>
    <div class="tile"><div class="tile-num">×8</div><div class="tile-cap">LTV / CAC при стоимости привлечения ≈ 900 ₽</div></div>
  </div>
  <p class="foot">Прогнозная модель; допущения: take rate 27%, конверсия в подписку 18%, ретеншн 12 мес — 55%</p>
</section>`)

// 9 · Финансовый прогноз
slides.push(`
<section class="slide light">
  ${kicker('Финансовый прогноз')}
  <h2 class="h2">Выручка платформы, млн ₽</h2>
  <div class="split">
    <div class="split-l">${revenueChart()}</div>
    <div class="split-r">
      <div class="fact"><div class="fact-num">2 <span class="arrow">→</span> 40</div><div class="fact-cap">городов присутствия: пилот в Москве и Санкт-Петербурге, масштабирование на миллионники к 2028</div></div>
      <div class="fact"><div class="fact-num">2,6 <span class="unit">млрд ₽</span></div><div class="fact-cap">GMV платформы в 2029 году при 420 000 активных клиентов</div></div>
    </div>
  </div>
</section>`)

// 10 · Инвестиции и окупаемость
slides.push(`
<section class="slide light">
  ${kicker('Инвестиционное предложение')}
  <h2 class="h2">Раунд 45 млн ₽ · окупаемость 26 месяцев</h2>
  <div class="split">
    <div class="split-l">${paybackChart()}<p class="chart-legend">Накопленный денежный поток, млн ₽</p></div>
    <div class="split-r">
      <div class="use"><span class="use-p">40%</span><span>продукт и разработка</span></div>
      <div class="use"><span class="use-p">30%</span><span>маркетинг и привлечение</span></div>
      <div class="use"><span class="use-p">20%</span><span>запуск городов, операции</span></div>
      <div class="use"><span class="use-p">10%</span><span>юридическое сопровождение, резерв</span></div>
      <div class="roi">Целевой возврат для инвестора — <b>×5–8</b> к 2029 г. при консервативной оценке 3–4× выручки</div>
    </div>
  </div>
</section>`)

// 11 · Конкуренция
slides.push(`
<section class="slide light">
  ${kicker('Конкурентное поле')}
  <h2 class="h2">Почему выиграем мы</h2>
  <table class="cmp">
    <tr><th></th><th>Частники «по объявлению»</th><th>Ритуальные агентства</th><th class="us">Память</th></tr>
    <tr><td>Фотоотчёт о работе</td><td>—</td><td>иногда</td><td class="us">стандарт, «до/после»</td></tr>
    <tr><td>Заказ онлайн из другого города</td><td>—</td><td>по телефону</td><td class="us">2 касания в приложении</td></tr>
    <tr><td>Гарантия и возврат средств</td><td>—</td><td>договор</td><td class="us">платформа + договор оферты</td></tr>
    <tr><td>Напоминания и повторные заказы</td><td>—</td><td>—</td><td class="us">даты, Радоница, автозаказ</td></tr>
    <tr><td>Эмоциональная ценность</td><td>—</td><td>—</td><td class="us">свеча памяти, книга воспоминаний, семейный доступ</td></tr>
  </table>
</section>`)

// 12 · Дорожная карта
slides.push(`
<section class="slide dark">
  ${kicker('Дорожная карта', true)}
  <h2 class="h2-dark">От пилота к федеральному сервису</h2>
  <div class="road">
    <div class="ritem"><div class="rq gold">Q3 2026</div><div class="rt">Запуск</div><div class="rc">App Store и Google Play, Москва и Санкт-Петербург, первые 50 исполнителей</div></div>
    <div class="ritem"><div class="rq gold">Q4 2026</div><div class="rt">10 000 клиентов</div><div class="rc">интеграция ЮKassa, партнёрка с гранитными мастерскими</div></div>
    <div class="ritem"><div class="rq gold">2027</div><div class="rt">12 городов</div><div class="rc">миллионники, B2B-каналы, 100 000 клиентов</div></div>
    <div class="ritem"><div class="rq gold">2028</div><div class="rt">Федеральный охват</div><div class="rc">40 городов, B2G-реестры, операционная прибыль</div></div>
  </div>
</section>`)

// 13 · Команда
slides.push(`
<section class="slide light">
  ${kicker('Команда')}
  <h2 class="h2">Трое основателей</h2>
  <div class="team">
    <div class="member"><div class="ava">УВ</div><div class="m-name">Уваров Валерий Витальевич</div><div class="m-role">Руководитель проекта, CEO</div></div>
    <div class="member"><div class="ava">ПД</div><div class="m-name">Пчеленков Дмитрий Сергеевич</div><div class="m-role">Идейный вдохновитель</div></div>
    <div class="member"><div class="ava">КП</div><div class="m-name">Краснощеков Павел Алексеевич</div><div class="m-role">Финансовый руководитель</div></div>
  </div>
  <p class="foot">Команда усилена продуктовой разработкой: MVP спроектирован и собран за собственный счёт основателей</p>
</section>`)

// 14 · Финал
slides.push(`
<section class="slide dark cover">
  <div class="cover-inner">
    <div class="cover-flame">${flame(56)}</div>
    <h1 class="final-title">Сохраним память вместе</h1>
    <p class="cover-sub">Приглашаем к участию в раунде</p>
    <p class="cover-meta">Память · pamyat.app · Редакция от 1 июля 2026 г.</p>
  </div>
</section>`)

// ── HTML ───────────────────────────────────────────────────────
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
${font('Playfair', 'playfair-display/PlayfairDisplay_500Medium.ttf')}
${font('PlayfairR', 'playfair-display/PlayfairDisplay_400Regular.ttf')}
${font('DMSans', 'dm-sans/DMSans_400Regular.ttf')}
${font('DMSansM', 'dm-sans/DMSans_500Medium.ttf')}
*{margin:0;padding:0;box-sizing:border-box}
@page{size:1280px 720px;margin:0}
body{font-family:'DMSans',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide{width:1280px;height:720px;page-break-after:always;overflow:hidden;position:relative;padding:64px 84px;display:flex;flex-direction:column}
.light{background:linear-gradient(180deg,${C.creamHi},${C.cream} 60%,${C.parchment});color:${C.ink}}
.dark{background:radial-gradient(120% 100% at 50% 0%, ${C.moss}, ${C.forest} 55%, ${C.deep});color:${C.cream}}
.kicker{font-family:'DMSansM';font-size:15px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};margin-bottom:18px}
.kicker-dark{color:${C.goldL}}
.h2{font-family:'Playfair';font-size:46px;line-height:1.15;letter-spacing:-0.5px;color:${C.forest};margin-bottom:40px}
.h2-dark{font-family:'Playfair';font-size:46px;line-height:1.2;letter-spacing:-0.5px;color:${C.cream};margin-bottom:44px}
.gold{color:${C.goldL}}
.foot{margin-top:auto;font-size:13px;color:${C.light}}
/* обложка */
.cover{align-items:center;justify-content:center;text-align:center}
.cover-inner{display:flex;flex-direction:column;align-items:center}
.cover-flame{filter:drop-shadow(0 0 44px rgba(217,179,107,.5));margin-bottom:26px}
.cover-title{font-family:'Playfair';font-size:96px;letter-spacing:-1px;font-weight:500}
.final-title{font-family:'Playfair';font-size:64px;letter-spacing:-0.5px;max-width:900px;line-height:1.15}
.cover-rule{width:56px;height:1px;background:${C.gold};margin:30px 0}
.cover-sub{font-size:22px;line-height:1.5;color:rgba(250,247,242,.78)}
.cover-meta{margin-top:56px;font-family:'DMSansM';font-size:13px;letter-spacing:3px;text-transform:uppercase;color:rgba(250,247,242,.45)}
/* плитки-статы */
.tiles3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:8px}
.tiles4{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:8px}
.tile{background:#fff;border:1px solid ${C.linen};border-radius:20px;padding:32px 28px;box-shadow:0 10px 30px rgba(28,51,24,.06)}
.tile-num{font-family:'PlayfairR';font-size:52px;color:${C.forest};letter-spacing:-1px;margin-bottom:14px}
.tiles4 .tile-num{font-size:44px}
.tile-cap{font-size:16px;line-height:1.5;color:${C.muted}}
/* тёмный statement */
.statement .row3-dark{display:grid;grid-template-columns:repeat(3,1fr);gap:44px;margin-top:auto;padding-top:40px;border-top:1px solid rgba(250,247,242,.14)}
.mini-t{font-family:'DMSansM';font-size:19px;margin-bottom:8px;color:${C.sageXL}}
.mini-c{font-size:15px;line-height:1.5;color:rgba(250,247,242,.65)}
/* сплит с графиком */
.split{display:flex;gap:64px;align-items:flex-start;flex:1}
.split-l{flex:0 0 640px}
.split-r{flex:1;display:flex;flex-direction:column;gap:34px;padding-top:8px}
.fact-num{font-family:'PlayfairR';font-size:56px;color:${C.forest};letter-spacing:-1px}
.fact-num .unit{font-size:30px;color:${C.muted}}
.fact-num .arrow{font-family:'DMSans';font-size:38px;color:${C.gold}}
.fact-cap{font-size:16px;line-height:1.5;color:${C.muted};margin-top:8px;max-width:380px}
.chart-val{font-family:'DMSansM';font-size:19px;fill:${C.forest}}
.chart-cat{font-family:'DMSans';font-size:16px;fill:${C.muted}}
.chart-note{font-family:'DMSansM';font-size:14px;fill:${C.gold}}
.chart-legend{font-size:14px;color:${C.light};margin-top:6px}
/* MVP */
.mvp{padding-bottom:0}
.phones{flex:1;display:flex;justify-content:center;align-items:flex-start;gap:36px;margin-top:-6px}
.phone{width:236px;border-radius:26px;box-shadow:0 30px 60px rgba(20,30,15,.28)}
.phone.center{width:252px;margin-top:-8px}
.tilt-l{transform:rotate(-4deg) translateY(16px)}
.tilt-r{transform:rotate(4deg) translateY(16px)}
.badges{position:absolute;left:84px;right:84px;bottom:44px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.badge{background:#fff;border:1px solid ${C.linen};border-radius:999px;padding:10px 22px;font-family:'DMSansM';font-size:14px;color:${C.forest};box-shadow:0 6px 18px rgba(28,51,24,.07)}
/* шаги */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:12px}
.step{border-top:2px solid ${C.gold};padding-top:22px}
.step-n{font-family:'PlayfairR';font-size:30px;color:${C.gold};margin-bottom:12px}
.step-t{font-family:'DMSansM';font-size:19px;color:${C.forest};margin-bottom:10px;line-height:1.3}
.step-c{font-size:15px;line-height:1.55;color:${C.muted}}
/* монетизация */
.mono-grid{display:grid;grid-template-columns:1fr 1fr;gap:26px;flex:1}
.mono{background:rgba(250,247,242,.05);border:1px solid rgba(250,247,242,.12);border-radius:20px;padding:30px 34px}
.mono-n{font-family:'PlayfairR';font-size:38px;letter-spacing:-0.5px;margin-bottom:10px}
.mono-t{font-family:'DMSansM';font-size:20px;margin-bottom:8px}
.mono-c{font-size:15px;line-height:1.5;color:rgba(250,247,242,.62)}
/* инвестиции */
.use{display:flex;align-items:center;gap:18px;font-size:17px;color:${C.ink};padding:10px 0;border-bottom:1px solid ${C.linen}}
.use-p{font-family:'PlayfairR';font-size:30px;color:${C.forest};width:86px;flex:0 0 auto}
.roi{margin-top:22px;background:${C.forest};color:${C.cream};border-radius:16px;padding:20px 24px;font-size:16px;line-height:1.5}
.roi b{color:${C.goldL}}
/* сравнение */
.cmp{width:100%;border-collapse:collapse;font-size:16px}
.cmp th{font-family:'DMSansM';text-align:left;color:${C.muted};font-weight:500;padding:14px 18px;border-bottom:2px solid ${C.linen};font-size:15px}
.cmp td{padding:16px 18px;border-bottom:1px solid ${C.linen};color:${C.muted}}
.cmp td:first-child{color:${C.ink};font-family:'DMSansM'}
.cmp .us{background:rgba(90,138,82,.08);color:${C.forest};font-family:'DMSansM'}
.cmp th.us{color:${C.forest};font-size:17px}
/* дорожная карта */
.road{display:grid;grid-template-columns:repeat(4,1fr);gap:30px;margin-top:14px}
.ritem{border-top:1px solid rgba(250,247,242,.2);padding-top:22px}
.rq{font-family:'DMSansM';font-size:15px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
.rt{font-family:'Playfair';font-size:26px;margin-bottom:10px}
.rc{font-size:15px;line-height:1.55;color:rgba(250,247,242,.62)}
/* команда */
.team{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:10px}
.member{background:#fff;border:1px solid ${C.linen};border-radius:20px;padding:40px 32px;text-align:center;box-shadow:0 10px 30px rgba(28,51,24,.06)}
.ava{width:92px;height:92px;border-radius:50%;background:${C.sageXL};color:${C.forest};font-family:'PlayfairR';font-size:34px;display:flex;align-items:center;justify-content:center;margin:0 auto 22px}
.m-name{font-family:'Playfair';font-size:22px;color:${C.forest};line-height:1.3;margin-bottom:10px}
.m-role{font-family:'DMSansM';font-size:14px;letter-spacing:1.5px;text-transform:uppercase;color:${C.gold}}
</style></head><body>${slides.join('\n')}</body></html>`

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 })
  await page.setContent(html, { waitUntil: 'networkidle' })
  // превью нескольких слайдов для проверки глазами
  for (const i of [0, 3, 4, 8, 9, 12]) {
    await page.locator('.slide').nth(i).screenshot({ path: `out/deck-${i}.png` })
  }
  await page.pdf({
    path: '/home/user/memorygrave/docs/pitch/Pamyat-Invest-Deck.pdf',
    width: '1280px',
    height: '720px',
    printBackground: true,
    preferCSSPageSize: true,
  })
  await browser.close()
  console.log('PDF done')
})().catch(e => { console.error(e); process.exit(1) })
