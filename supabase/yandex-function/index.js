/**
 * Прокси «Память» → Supabase (Yandex Cloud Function).
 * Пересылает запрос целиком: метод, путь, query, заголовки, тело.
 * Вызывается через API Gateway (интеграция cloud_functions).
 */
const UPSTREAM = 'https://ajctgzzvoxrakbjvcpbt.supabase.co'

// эти заголовки нельзя пробрасывать как есть
const SKIP_REQ = new Set(['host', 'content-length', 'connection', 'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip', 'x-trace-id', 'x-request-id'])
// alt-svc вырезаем обязательно: реклама HTTP/3 переключает iOS на QUIC,
// который режут мобильные операторы — запросы замерзают намертво
const SKIP_RES = new Set(['content-length', 'transfer-encoding', 'connection', 'content-encoding', 'alt-svc', 'set-cookie'])

// Тестовая страница /nettest: делает те же запросы, что приложение,
// прямо из Safari — показывает время и статус каждого
const NETTEST_HTML = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Тест сети</title>
<body style="font-family:-apple-system;padding:16px">
<h3>Тест сети «Память»</h3><div id="log">запускаю...</div>
<script>
const KEY='sb_publishable_l7Wxfk7HaAI6osyPE69amA_riboCd9V'
const log=document.getElementById('log')
async function one(n,method,path,body){
  const t=Date.now()
  try{
    const r=await fetch(path,{method,headers:{apikey:KEY,'Content-Type':'application/json'},body})
    log.innerHTML+='<div>'+n+': <b>'+r.status+'</b> за '+(Date.now()-t)+' мс</div>'
  }catch(e){
    log.innerHTML+='<div>'+n+': <b style="color:red">ОШИБКА</b> за '+(Date.now()-t)+' мс</div>'
  }
}
;(async()=>{
  log.innerHTML=''
  for(let i=1;i<=3;i++) await one('GET города #'+i,'GET','/rest/v1/cities?select=id')
  for(let i=1;i<=3;i++) await one('GET захоронения #'+i,'GET','/rest/v1/graves?select=id&limit=5')
  for(let i=1;i<=2;i++) await one('POST rpc #'+i,'POST','/rest/v1/rpc/candle_status',JSON.stringify({p_grave:'grave-1'}))
  log.innerHTML+='<div><b>ГОТОВО</b></div>'
})()
</script>`

module.exports.handler = async function (event) {
  const path = (event.params && event.params.url) || ''

  if (path === 'nettest') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: NETTEST_HTML,
    }
  }
  const query = event.multiValueQueryStringParameters || {}
  const qs = Object.entries(query)
    .flatMap(([k, vals]) => vals.map(v => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`))
    .join('&')
  const url = `${UPSTREAM}/${path}${qs ? '?' + qs : ''}`

  const headers = {}
  for (const [k, v] of Object.entries(event.headers || {})) {
    if (!SKIP_REQ.has(k.toLowerCase())) headers[k] = v
  }

  const method = event.httpMethod || 'GET'
  const hasBody = !['GET', 'HEAD'].includes(method) && event.body
  const body = hasBody
    ? event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body
    : undefined

  // Сбой связи с Supabase раньше ронял функцию: шлюз отдавал безликий 502,
  // а приложение висело на загрузке. Теперь — таймаут, один повтор для
  // чтения и ответ с причиной, по которой видно, что сломалось
  let resp
  let lastError
  const attempts = method === 'GET' || method === 'HEAD' ? 2 : 1
  for (let i = 0; i < attempts && !resp; i++) {
    try {
      resp = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(12000) })
    } catch (e) {
      lastError = e
    }
  }
  if (!resp) {
    const cause = lastError && lastError.cause
    const detail = {
      error: 'upstream_unreachable',
      message: lastError ? String(lastError.message || lastError) : 'unknown',
      cause: cause ? String(cause.code || cause.message || cause) : null,
      upstream: UPSTREAM,
    }
    console.error('proxy upstream failed', JSON.stringify(detail))
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      body: JSON.stringify(detail),
    }
  }
  const buf = Buffer.from(await resp.arrayBuffer())

  const resHeaders = {}
  resp.headers.forEach((v, k) => {
    if (!SKIP_RES.has(k.toLowerCase())) resHeaders[k] = v
  })

  return {
    statusCode: resp.status,
    headers: resHeaders,
    body: buf.toString('base64'),
    isBase64Encoded: true,
  }
}
