const { chromium } = require('playwright-core')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const C = {
  forest: '#1C3318', moss: '#2E5028', sage: '#5A8A52', sageL: '#8EBD86', sageXL: '#C4DEC0',
  cream: '#FAF7F2', parchment: '#F0EBE0', linen: '#EDE7D9', stone: '#C8BEA8',
  gold: '#B8935A', goldL: '#D9B36B', ink: '#1A1A14', muted: '#6B6B5E', light: '#9A9A8E',
  successBg: '#EAF3DE', success: '#27500A', white: '#FFFFFF',
}

// Эмблема-пламя (inline SVG)
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'
function flame(size, ring) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.goldL}"/><stop offset=".55" stop-color="${C.gold}"/><stop offset="1" stop-color="#9A6E2E"/></linearGradient>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7E4"/><stop offset="1" stop-color="#FCEAC0"/></linearGradient>
    </defs>
    ${ring ? `<circle cx="100" cy="100" r="94" fill="none" stroke="${C.forest}" stroke-width="5" opacity=".92"/><circle cx="100" cy="100" r="84" fill="none" stroke="${C.sage}" stroke-width="1.4" opacity=".5"/>` : ''}
    <g transform="translate(100,100) scale(${ring ? 0.62 : 0.86}) translate(-50,-70)"><path d="${FLAME}" fill="url(#fg)"/><path d="${CORE}" fill="url(#cg)"/></g>
  </svg>`
}

const svgIcon = (name, color) => {
  const p = {
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    heart: '<path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l1.7 1.7L12 22l7.1-7.1 1.7-1.7a5 5 0 0 0 0-7.1z"/>',
    bag: '<path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    camera: '<path d="M3 8h4l2-2h6l2 2h4v12H3z"/><circle cx="12" cy="13" r="3.5"/>',
    pin: '<path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="M12 3l2.9 6 6.1.9-4.5 4.3 1.1 6.1L12 17.8 6.4 20.4l1.1-6.1L3 9.9 9.1 9z"/>',
    flower: '<circle cx="12" cy="12" r="3"/><path d="M12 9V4M12 15v5M9 12H4M15 12h5M9.5 9.5 6 6M14.5 9.5 18 6M9.5 14.5 6 18M14.5 14.5 18 18"/>',
  }[name]
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
}

const statusBar = `<div class="statusbar"><span class="time">9:41</span><span class="sbicons"><span class="bars"></span><span class="wifi"></span><span class="batt"></span></span></div>`

function tabbar(active) {
  const tabs = [['home','Поиск'],['heart','Сохранённые'],['bag','Заказы'],['user','Профиль']]
  return `<div class="tabbar">${tabs.map(([ic,l],i)=>`<div class="tab ${i===active?'on':''}"><div class="tabic">${svgIcon(ic,i===active?C.forest:C.light)}</div><span>${l}</span></div>`).join('')}</div>`
}

const avatar = (initials, bg, fg) => `<div class="ava" style="background:${bg};color:${fg||C.white}">${initials}</div>`

// ЭКРАНЫ ------------------------------------------------------------
function searchScreen() {
  const cards = [
    ['ИП','Иванов Пётр Сергеевич','Троекуровское кладбище','1938 — 2019', C.sage],
    ['СА','Смирнова Анна Ивановна','Ваганьковское кладбище','1945 — 2021', C.gold],
    ['КМ','Ковалёв Михаил Петрович','Николо-Архангельское','1952 — 2020', C.moss],
  ]
  return `${statusBar}
  <div class="screen">
    <div class="row between pad-h mt">
      <div class="serif h1" style="color:${C.forest}">Память</div>
      <div class="ic24">${svgIcon('bell',C.sage)}</div>
    </div>
    <div class="pad-h mt">
      <div class="searchbar"><div class="ic22">${svgIcon('search',C.sage)}</div><span style="color:${C.ink}">Иванов</span></div>
    </div>
    <div class="pad-h chips mt-s">
      <div class="chip on">Москва</div>
      <div class="chip">Кладбище</div>
    </div>
    <div class="pad-h caption mt-s">Найдено 3 захоронения</div>
    <div class="pad-h list">
      ${cards.map(([in_,name,cem,life,bg])=>`
      <div class="card row">
        ${avatar(in_,bg)}
        <div class="grow">
          <div class="serif name">${name}</div>
          <div class="sub">${cem}</div>
          <div class="meta">${life}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>
  ${tabbar(0)}`
}

function graveScreen() {
  return `${statusBar}
  <div class="screen nopad">
    <div class="hero">
      <div class="portrait">${avatar('ИП', 'rgba(255,255,255,.12)', C.cream)}</div>
      <div class="serif heroName">Иванов Пётр Сергеевич</div>
      <div class="heroDates">1938 — 2019</div>
      <div class="badge">✦ Ухожена</div>
    </div>
    <div class="body">
      <div class="bio">Любящий отец и дедушка. Ветеран труда, всю жизнь проработал инженером. Светлая память.</div>
      <div class="tiles">
        <div class="tile"><div class="ic28">${svgIcon('camera',C.sage)}</div><span>8 фото</span></div>
        <div class="tile on"><div class="ic28">${svgIcon('heart',C.cream)}</div><span style="color:${C.cream}">Сохранено</span></div>
        <div class="tile"><div class="ic28">${svgIcon('bell',C.sage)}</div><span>Напомнить</span></div>
      </div>
      <div class="mapcard"><div class="ic28">${svgIcon('pin',C.sage)}</div><div><div class="mapt">Участок 14, ряд 3</div><div class="sub">Троекуровское кладбище</div></div></div>
    </div>
    <div class="sticky"><div class="cta">Заказать уход</div></div>
  </div>`
}

function catalogScreen() {
  const svc = [
    ['flower','Комплексная уборка','Уборка, мытьё памятника, покраска ограды','2 500 ₽', C.successBg],
    ['flower','Возложение цветов','Свежие цветы к памятной дате','1 200 ₽', C.parchment],
    ['flower','Уход за газоном','Стрижка травы, прополка','1 800 ₽', C.parchment],
    ['flower','Реставрация памятника','Обновление надписи, шлифовка','8 900 ₽', C.parchment],
  ]
  return `${statusBar}
  <div class="screen">
    <div class="pad-h mt"><div class="serif h1" style="color:${C.forest}">Услуги</div>
    <div class="sub" style="margin-top:8px">Иванов Пётр Сергеевич · Троекуровское</div></div>
    <div class="pad-h list mt">
      ${svc.map(([ic,name,desc,price,bg])=>`
      <div class="card svc">
        <div class="svcrow">
          <div class="svcic" style="background:${bg}">${svgIcon(ic,C.sage)}</div>
          <div class="grow"><div class="svsname">${name}</div><div class="sub">${desc}</div></div>
        </div>
        <div class="svcfoot"><span class="price">${price}</span><div class="addbtn">Добавить</div></div>
      </div>`).join('')}
    </div>
  </div>`
}

function candleScreen() {
  return `${statusBar}
  <div class="screen">
    <div class="pad-h mt"><div class="serif h1" style="color:${C.forest}">Иванов Пётр</div></div>
    <div class="pad-h mt">
      <div class="candlecard">
        <div class="candleGlow">${flame(120,false)}</div>
        <div class="serif candleTitle">Свеча памяти горит</div>
        <div class="sub center">Зажжена 128 раз близкими</div>
        <div class="candlebtn">Зажечь свечу</div>
      </div>
    </div>
    <div class="pad-h mt-s"><div class="seclabel">Книга воспоминаний</div></div>
    <div class="pad-h list">
      <div class="card mem"><div class="row between"><span class="memauthor serif">Анна</span><span class="meta">2 дня назад</span></div><div class="memtext">Папа, мы очень скучаем. Каждый день вспоминаем твою улыбку и добрые советы.</div></div>
      <div class="card mem"><div class="row between"><span class="memauthor serif">Михаил</span><span class="meta">неделю назад</span></div><div class="memtext">Светлая память дорогому человеку. Ты навсегда в наших сердцах.</div></div>
    </div>
  </div>`
}

function reportScreen() {
  return `${statusBar}
  <div class="screen">
    <div class="pad-h mt"><div class="serif h1" style="color:${C.forest}">Фотоотчёт</div>
    <div class="sub" style="margin-top:8px">Комплексная уборка · 28 июня</div></div>
    <div class="pad-h mt">
      <div class="beforeafter">
        <div class="ba"><div class="baimg" style="background:linear-gradient(135deg,#8a8577,#6f6a5c)"><div class="balabel">До</div></div></div>
        <div class="ba"><div class="baimg" style="background:linear-gradient(135deg,${C.sageL},${C.sage})"><div class="balabel">После</div></div></div>
      </div>
    </div>
    <div class="pad-h mt">
      <div class="card">
        <div class="row between"><span class="svsname">Работа выполнена</span><div class="donebadge"><div class="ic18">${svgIcon('check',C.success)}</div>Готово</div></div>
        <div class="stars">${[1,1,1,1,1].map(()=>`<div class="staric"><svg width="100%" height="100%" viewBox="0 0 24 24" fill="${C.gold}" stroke="${C.gold}" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3l2.9 6 6.1.9-4.5 4.3 1.1 6.1L12 17.8 6.4 20.4l1.1-6.1L3 9.9 9.1 9z"/></svg></div>`).join('')}</div>
        <div class="sub">Ваша оценка работы</div>
      </div>
    </div>
    <div class="pad-h mt-s"><div class="card cmt"><div class="memtext">«Всё сделано аккуратно, памятник как новый. Спасибо за заботу и подробные фото.»</div></div></div>
  </div>`
}

// РАМКА-СКРИНШОТ ----------------------------------------------------
function page(headline, sub, bg, dark, screenHTML) {
  const headColor = dark ? C.cream : C.forest
  const subColor = dark ? 'rgba(250,247,242,.75)' : C.muted
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
  :root{--serif:Georgia,'Times New Roman',serif;--sans:-apple-system,'Helvetica Neue',Arial,sans-serif}
  body{width:1290px;height:2796px;font-family:var(--sans);${bg};overflow:hidden;position:relative}
  .headline{padding:150px 110px 0;text-align:center}
  .headline h1{font-family:var(--serif);font-size:104px;line-height:1.05;color:${headColor};font-weight:700;letter-spacing:-1px}
  .headline p{font-size:46px;color:${subColor};margin-top:34px;line-height:1.35}
  .phonewrap{position:absolute;left:50%;top:640px;transform:translateX(-50%)}
  .phone{width:952px;height:2040px;background:#0c0c0c;border-radius:104px;padding:22px;box-shadow:0 60px 120px rgba(20,30,15,.35)}
  .scr{width:100%;height:100%;background:${C.cream};border-radius:84px;overflow:hidden;position:relative;display:flex;flex-direction:column}
  /* статус-бар */
  .statusbar{height:96px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 62px 14px;flex:0 0 auto}
  .time{font-size:34px;font-weight:600;color:${C.ink}}
  .sbicons{display:flex;gap:12px;align-items:center}
  .bars,.wifi,.batt{display:inline-block}
  .bars{width:34px;height:24px;background:${C.ink};clip-path:polygon(0 100%,20% 100%,20% 55%,0 55%,0 100%,30% 100%,30% 40%,50% 40%,50% 100%,60% 100%,60% 22%,80% 22%,80% 100%,90% 100%,90% 5%,100% 5%,100% 100%)}
  .wifi{width:34px;height:24px;background:${C.ink};clip-path:circle(50% at 50% 100%)}
  .batt{width:50px;height:24px;border:3px solid ${C.ink};border-radius:6px;position:relative}
  .batt:after{content:'';position:absolute;inset:3px;background:${C.ink};border-radius:2px}
  .screen{flex:1;display:flex;flex-direction:column;min-height:0}
  .screen.nopad{}
  /* утилиты */
  .serif{font-family:var(--serif)}
  .pad-h{padding-left:52px;padding-right:52px}
  .mt{margin-top:40px}.mt-s{margin-top:28px}
  .row{display:flex;align-items:center;gap:34px}
  .between{justify-content:space-between}
  .grow{flex:1;min-width:0}
  .center{text-align:center}
  .h1{font-size:74px;font-weight:700}
  .ic24{width:52px;height:52px}.ic22{width:50px;height:50px}.ic28{width:60px;height:60px}.ic18{width:36px;height:36px}
  .caption{font-size:34px;color:${C.muted}}
  .sub{font-size:36px;color:${C.muted};margin-top:6px;overflow:hidden;text-overflow:ellipsis}
  .meta{font-size:32px;color:${C.light};margin-top:6px}
  .searchbar{height:112px;background:${C.parchment};border-radius:22px;display:flex;align-items:center;gap:26px;padding:0 40px;font-size:40px}
  .chips{display:flex;gap:22px}
  .chip{height:74px;padding:0 40px;border-radius:999px;background:${C.parchment};border:1.5px solid ${C.linen};display:flex;align-items:center;font-size:34px;color:${C.muted};font-weight:500}
  .chip.on{background:${C.forest};color:${C.cream};border-color:${C.forest}}
  .list{display:flex;flex-direction:column;gap:28px;margin-top:24px}
  .card{background:${C.white};border:1px solid ${C.linen};border-radius:30px;padding:40px;box-shadow:0 8px 24px rgba(28,51,24,.05)}
  .ava{width:104px;height:104px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:600;flex:0 0 auto;font-family:var(--serif)}
  .name{font-size:44px;color:${C.ink};font-weight:700}
  /* hero */
  .hero{background:linear-gradient(150deg,${C.forest},${C.moss});padding:120px 52px 68px;border-bottom-left-radius:64px;border-bottom-right-radius:64px;display:flex;flex-direction:column;align-items:center}
  .portrait{padding:8px;border:4px solid rgba(250,247,242,.3);border-radius:999px}
  .portrait .ava{width:200px;height:200px;font-size:80px}
  .heroName{font-size:70px;color:${C.cream};font-weight:700;margin-top:34px;text-align:center;line-height:1.1}
  .heroDates{font-size:38px;color:rgba(250,247,242,.75);margin-top:16px}
  .badge{margin-top:30px;background:${C.successBg};color:${C.success};font-size:32px;font-weight:600;padding:14px 34px;border-radius:999px}
  .body{padding:48px 52px;display:flex;flex-direction:column;gap:40px}
  .bio{font-size:40px;line-height:1.5;color:${C.ink}}
  .tiles{display:flex;gap:24px}
  .tile{flex:1;background:${C.white};border:1px solid ${C.linen};border-radius:28px;padding:36px 12px;display:flex;flex-direction:column;align-items:center;gap:18px;font-size:30px;color:${C.muted}}
  .tile.on{background:${C.forest};border-color:${C.forest}}
  .mapcard{display:flex;align-items:center;gap:30px;background:${C.white};border:1px solid ${C.linen};border-radius:28px;padding:40px}
  .mapt{font-size:40px;color:${C.ink};font-weight:600}
  .sticky{margin-top:auto;padding:36px 52px;background:${C.cream};border-top:1px solid ${C.linen}}
  .cta{height:118px;background:${C.forest};color:${C.cream};border-radius:26px;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:600}
  /* catalog */
  .svc{padding:36px 40px}
  .svcrow{display:flex;gap:30px;align-items:center}
  .svcic{width:96px;height:96px;border-radius:24px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;padding:24px}
  .svsname{font-size:42px;color:${C.ink};font-weight:600}
  .svcfoot{display:flex;justify-content:space-between;align-items:center;margin-top:30px}
  .price{font-size:48px;color:${C.forest};font-weight:700;font-family:var(--serif)}
  .addbtn{height:78px;padding:0 44px;background:${C.sageXL};color:${C.forest};border-radius:20px;display:flex;align-items:center;font-size:34px;font-weight:600}
  /* candle */
  .candlecard{background:linear-gradient(160deg,#fff,${C.parchment});border:1px solid ${C.linen};border-radius:40px;padding:64px 40px;display:flex;flex-direction:column;align-items:center;box-shadow:0 12px 34px rgba(184,147,90,.14)}
  .candleGlow{filter:drop-shadow(0 0 40px rgba(217,179,107,.6))}
  .candleTitle{font-size:52px;color:${C.forest};font-weight:700;margin-top:30px}
  .candlebtn{margin-top:40px;height:104px;padding:0 70px;background:${C.gold};color:#fff;border-radius:24px;display:flex;align-items:center;font-size:40px;font-weight:600}
  .seclabel{font-size:32px;letter-spacing:2px;text-transform:uppercase;color:${C.sage};font-weight:600}
  .mem{padding:38px}
  .memauthor{font-size:44px;color:${C.forest};font-weight:700}
  .memtext{font-size:38px;line-height:1.5;color:${C.ink};margin-top:18px}
  /* report */
  .beforeafter{display:flex;gap:24px}
  .ba{flex:1}
  .baimg{height:520px;border-radius:30px;position:relative;overflow:hidden}
  .balabel{position:absolute;left:28px;top:28px;background:rgba(0,0,0,.45);color:#fff;font-size:34px;padding:10px 28px;border-radius:16px}
  .donebadge{display:flex;align-items:center;gap:12px;background:${C.successBg};color:${C.success};font-size:32px;font-weight:600;padding:12px 28px;border-radius:999px}
  .stars{display:flex;gap:16px;margin-top:30px}
  .staric{width:66px;height:66px}
  .cmt{margin-top:6px}
  /* tabbar */
  .tabbar{height:150px;border-top:1px solid ${C.linen};background:${C.white};display:flex;padding-bottom:26px;flex:0 0 auto}
  .tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-size:26px;color:${C.light}}
  .tab.on{color:${C.forest};font-weight:600}
  .tabic{width:52px;height:52px}
  </style></head><body>
    <div class="headline"><h1>${headline}</h1><p>${sub}</p></div>
    <div class="phonewrap"><div class="phone"><div class="scr">${screenHTML}</div></div></div>
  </body></html>`
}

const SHOTS = [
  { name:'01-search', headline:'Найдите место<br>памяти близких', sub:'Поиск по имени, городу и кладбищу',
    bg:`background:radial-gradient(120% 80% at 50% 0%, ${C.parchment}, ${C.cream})`, dark:false, screen: searchScreen() },
  { name:'02-grave', headline:'Всё о родном<br>человеке', sub:'Биография, место, фотографии и уход',
    bg:`background:linear-gradient(180deg, ${C.sageXL}, ${C.cream})`, dark:false, screen: graveScreen() },
  { name:'03-catalog', headline:'Закажите уход<br>в пару касаний', sub:'Уборка, цветы, реставрация — с фотоотчётом',
    bg:`background:radial-gradient(120% 80% at 50% 0%, ${C.parchment}, ${C.cream})`, dark:false, screen: catalogScreen() },
  { name:'04-candle', headline:'Зажгите свечу<br>памяти', sub:'Тёплые слова и воспоминания вместе с близкими',
    bg:`background:linear-gradient(180deg, ${C.forest}, ${C.moss})`, dark:true, screen: candleScreen() },
  { name:'05-report', headline:'Фотоотчёт<br>о каждой работе', sub:'Вы всегда видите результат заботы',
    bg:`background:linear-gradient(180deg, ${C.sageXL}, ${C.cream})`, dark:false, screen: reportScreen() },
]

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME })
  const page_ = await browser.newPage({ viewport: { width: 1290, height: 2796 }, deviceScaleFactor: 1 })
  for (const s of SHOTS) {
    await page_.setContent(page(s.headline, s.sub, s.bg, s.dark, s.screen), { waitUntil: 'networkidle' })
    await page_.screenshot({ path: `out/${s.name}.png` })
    console.log('✓', s.name)
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
