/**
 * Статический сервер для веб-сборки с SPA-fallback: любой неизвестный путь
 * отдаёт index.html — так прямые адреса (/grave/grave-1) открываются, а не 404.
 *
 *   node spa-server.js <папка> <порт>
 */
const fs = require('fs')
const http = require('http')
const path = require('path')

const root = path.resolve(process.argv[2] || 'dist')
const port = Number(process.argv[3] || 8099)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0])
    let file = path.join(root, url)
    if (!file.startsWith(root)) return res.writeHead(403).end()
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      // ресурсы с расширением — честный 404, страницы — index.html
      if (path.extname(url) && url !== '/') return res.writeHead(404).end()
      file = path.join(root, 'index.html')
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  .listen(port, () => console.log(`SPA ${root} → http://localhost:${port}`))
