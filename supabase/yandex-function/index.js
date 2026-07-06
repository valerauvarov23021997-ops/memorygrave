/**
 * Прокси «Память» → Supabase (Yandex Cloud Function).
 * Пересылает запрос целиком: метод, путь, query, заголовки, тело.
 * Вызывается через API Gateway (интеграция cloud_functions).
 */
const UPSTREAM = 'https://ajctgzzvoxrakbjvcpbt.supabase.co'

// эти заголовки нельзя пробрасывать как есть
const SKIP_REQ = new Set(['host', 'content-length', 'connection', 'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip', 'x-trace-id', 'x-request-id'])
const SKIP_RES = new Set(['content-length', 'transfer-encoding', 'connection', 'content-encoding'])

module.exports.handler = async function (event) {
  const path = (event.params && event.params.url) || ''
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

  const resp = await fetch(url, { method, headers, body })
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
