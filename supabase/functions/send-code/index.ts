/**
 * Отправка кода входа. Вызывается приложением при вводе телефона.
 *
 * Если телефон уже связан с Telegram-чатом (пользователь когда-то
 * нажимал Start) — код улетает в Telegram сразу, отвечаем { sent: true }.
 * Иначе отвечаем { token } — приложение покажет кнопку со Start-ссылкой.
 *
 * Секреты: TELEGRAM_BOT_TOKEN. «Verify JWT» — выключить.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const TG = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const { phone } = await req.json().catch(() => ({}))
  if (typeof phone !== 'string' || phone.length < 10) return json({ error: 'Некорректный номер' }, 400)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // не больше 5 кодов на номер в час
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('auth_codes')
    .select('token', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', hourAgo)
  if ((count ?? 0) >= 5) return json({ error: 'Слишком много запросов кода. Попробуйте через час.' }, 429)

  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const { data: row, error } = await admin
    .from('auth_codes')
    .insert({ phone, code })
    .select('token')
    .single()
  if (error || !row) return json({ error: 'Не удалось создать код' }, 500)

  // телефон уже связан с чатом — шлём код сразу, без Start
  const { data: link } = await admin.from('tg_links').select('chat_id').eq('phone', phone).maybeSingle()
  if (link?.chat_id) {
    const resp = await fetch(`${TG}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: link.chat_id,
        text: `Ваш код входа в «Память»:\n\n<b>${code}</b>\n\nКод действует 10 минут. Никому его не сообщайте.`,
        parse_mode: 'HTML',
      }),
    })
    const ok = (await resp.json().catch(() => ({ ok: false }))).ok
    if (ok) {
      await admin.from('auth_codes').update({ sent: true, chat_id: link.chat_id }).eq('token', row.token)
      return json({ sent: true })
    }
    // чат недоступен (бот заблокирован) — связка устарела, вернёмся к Start
    await admin.from('tg_links').delete().eq('phone', phone)
  }

  return json({ token: row.token })
})
