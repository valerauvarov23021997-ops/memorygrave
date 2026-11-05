// Иллюстрации «до» и «после» для демонстрации фотоотчёта (стилизация, не фото)
const { chromium } = require('/home/user/memorygrave/node_modules/playwright-core')
const OUT = '/tmp/claude-0/-home-user-memorygrave/161cbaa8-21fa-569b-9695-258b38836354/scratchpad/video'

const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()

function scene(after) {
  const W = 1200, H = 900
  let g = ''
  // небо и земля
  g += `<rect width="${W}" height="${H}" fill="${after ? '#DDE9D3' : '#D9DCCB'}"/>`
  g += `<rect y="300" width="${W}" height="600" fill="${after ? '#8DB27E' : '#8E9468'}"/>`
  // деревья на заднем плане
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 140 + rnd() * 30, r = 70 + rnd() * 40
    g += `<circle cx="${x}" cy="${250 - rnd() * 40}" r="${r}" fill="${after ? '#5E8A55' : '#69744E'}" opacity="0.85"/>`
  }
  // дорожка
  g += `<path d="M0,880 L1200,780 L1200,900 L0,900Z" fill="${after ? '#D8CDB2' : '#BDB49A'}"/>`
  // участок: цоколь оградки
  g += `<rect x="300" y="430" width="600" height="380" rx="6" fill="${after ? '#A9C99A' : '#7F8A5A'}"/>`
  // надгробие
  g += `<rect x="520" y="300" width="160" height="230" rx="70" fill="#8D8A84"/>`
  g += `<rect x="520" y="300" width="160" height="230" rx="70" fill="url(#shine)" opacity="0.5"/>`
  g += `<rect x="490" y="520" width="220" height="40" rx="6" fill="#77746E"/>`
  // насыпь
  g += `<rect x="470" y="570" width="260" height="190" rx="40" fill="${after ? '#6E9C62' : '#6B6A48'}"/>`
  // оградка
  for (let x = 300; x <= 900; x += 30) g += `<rect x="${x - 3}" y="400" width="6" height="90" fill="#2F3330"/>`
  g += `<rect x="296" y="404" width="608" height="7" fill="#2F3330"/><rect x="296" y="470" width="608" height="7" fill="#2F3330"/>`
  if (!after) {
    // высокая трава, сорняки, листва
    for (let i = 0; i < 260; i++) {
      const x = 300 + rnd() * 600, y = 470 + rnd() * 340, h = 30 + rnd() * 70
      const c = ['#5F6B3B', '#7A7F45', '#9A9152', '#4E5A33'][Math.floor(rnd() * 4)]
      g += `<path d="M${x},${y} q${(rnd() - 0.5) * 30},${-h / 2} ${(rnd() - 0.5) * 24},${-h}" stroke="${c}" stroke-width="${2 + rnd() * 3}" fill="none" stroke-linecap="round"/>`
    }
    for (let i = 0; i < 90; i++) {
      const x = 300 + rnd() * 600, y = 480 + rnd() * 330
      const c = ['#B5732E', '#C9923B', '#8C5A2B'][Math.floor(rnd() * 3)]
      g += `<ellipse cx="${x}" cy="${y}" rx="${8 + rnd() * 8}" ry="${4 + rnd() * 4}" transform="rotate(${rnd() * 180} ${x} ${y})" fill="${c}"/>`
    }
    // поваленная ветка
    g += `<path d="M560,640 L760,600" stroke="#5B4632" stroke-width="10" stroke-linecap="round"/>`
  } else {
    // аккуратный газон и цветы
    for (let i = 0; i < 120; i++) {
      const x = 300 + rnd() * 600, y = 480 + rnd() * 330
      g += `<path d="M${x},${y} l${(rnd() - 0.5) * 6},-10" stroke="#5E8A55" stroke-width="2" stroke-linecap="round"/>`
    }
    // ваза с цветами
    g += `<rect x="565" y="505" width="26" height="40" rx="4" fill="#3D4A3A"/>`
    const flowers = [[578, 470, '#C2453F'], [560, 480, '#E8C547'], [596, 478, '#F2F0E8'], [570, 458, '#C2453F'], [588, 460, '#E8C547']]
    for (const [x, y, c] of flowers) {
      g += `<path d="M578,505 L${x},${y + 6}" stroke="#4E7A45" stroke-width="3"/>`
      g += `<circle cx="${x}" cy="${y}" r="11" fill="${c}"/><circle cx="${x}" cy="${y}" r="4" fill="#B8935A"/>`
    }
    // лампадка
    g += `<rect x="610" y="515" width="24" height="30" rx="4" fill="#B8935A"/>`
    g += `<path d="M622,486 C628,498 632,504 632,510 C632,516 628,520 622,520 C616,520 612,516 612,510 C612,504 616,498 622,486Z" fill="#F2B544"/>`
    // венок на насыпи
    g += `<circle cx="600" cy="660" r="52" fill="none" stroke="#4E7A45" stroke-width="20"/>`
    for (let a = 0; a < 12; a++) {
      const x = 600 + 52 * Math.cos(a / 2), y = 660 + 52 * Math.sin(a / 2)
      g += `<circle cx="${x}" cy="${y}" r="7" fill="${a % 2 ? '#C2453F' : '#F2F0E8'}"/>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>${g}</svg>`
}

;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
  for (const [name, after] of [['plot-before', false], ['plot-after', true]]) {
    await p.setContent(`<html><body style="margin:0">${scene(after)}</body></html>`)
    await p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 90 })
  }
  await b.close()
  console.log('ok')
})()
