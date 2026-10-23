/**
 * Проверка, что каждая иконка существует в Phosphor.
 *
 *   node tools/check-icons.js
 *
 * Компонент Icon молча рисовал пустоту на неизвестном имени — так в
 * «Ближайшей дате» появился пустой круг (Candle) и пустая «Оградка» (Fence).
 * Скрипт сверяет словарь icons.ts, алиасы, литералы name=/icon= в коде
 * и иконки услуг в моках с файлами phosphor-react-native.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PHOSPHOR = path.join(ROOT, 'node_modules/phosphor-react-native/src/icons')
const exists = name => fs.existsSync(path.join(PHOSPHOR, `${name}.tsx`))

const iconsSrc = fs.readFileSync(path.join(ROOT, 'packages/ui/src/tokens/icons.ts'), 'utf8')
const mapBody = iconsSrc.slice(iconsSrc.indexOf('export const icons'), iconsSrc.indexOf('} as const'))
const semantic = Object.fromEntries([...mapBody.matchAll(/^\s+(\w+): '(\w+)'/gm)].map(m => [m[1], m[2]]))
const aliasBody = iconsSrc.slice(iconsSrc.indexOf('export const iconAliases'))
const aliases = Object.fromEntries([...aliasBody.matchAll(/^\s+(\w+): '(\w+)'/gm)].map(m => [m[1], m[2]]))

const problems = []
for (const [key, name] of Object.entries(semantic)) if (!exists(name)) problems.push(`icons.${key} → ${name}`)
for (const [from, to] of Object.entries(aliases)) if (!exists(to)) problems.push(`алиас ${from} → ${to}`)

// Литералы в коде: name="…" у <Icon>, icon="…" у строк списков, icon: '…' в моках
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}
const files = ['apps/client/app', 'apps/client/src', 'apps/executor/app', 'apps/executor/src', 'packages/ui/src', 'packages/api/src/mocks']
  .map(d => path.join(ROOT, d))
  .filter(fs.existsSync)
  .flatMap(d => walk(d))

let checked = 0
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  // name= встречается и у экранов навигатора — берём только внутри <Icon …>
  const literals = [
    ...[...src.matchAll(/<Icon[^>]*?\bname="(\w+)"/g)].map(m => m[1]),
    ...[...src.matchAll(/\bicon="(\w+)"/g)].map(m => m[1]),
    ...[...src.matchAll(/\bicon: '(\w+)'/g)].map(m => m[1]),
  ]
  for (const name of literals) {
    checked++
    const target = aliases[semantic[name] ?? name] ?? semantic[name] ?? name
    if (!exists(target)) problems.push(`${path.relative(ROOT, file)}: «${name}»`)
  }
}

if (problems.length) {
  console.error(`❌ Иконки, которых нет в Phosphor (${problems.length}):`)
  problems.forEach(p => console.error('  •', p))
  process.exit(1)
}
console.log(`✅ Иконки: ${Object.keys(semantic).length} в словаре, ${checked} в коде — все есть в Phosphor`)
