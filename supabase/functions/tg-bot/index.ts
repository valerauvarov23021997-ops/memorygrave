/**
 * Telegram-бот «Памяти»: выдаёт коды входа.
 *
 * Пользователь жмёт в приложении «Получить код в Telegram» →
 * открывается t.me/<бот>?start=<token> → бот находит код по токену
 * и присылает его в чат.
 *
 * Секреты (Edge Functions → Secrets):
 *   TELEGRAM_BOT_TOKEN — токен от @BotFather
 * SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY подставляются платформой.
 *
 * После деплоя привязать вебхук (один раз, подставив свои значения):
 *   https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=<URL функции>
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const TG = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}`

async function send(chatId: number, text: string): Promise<void> {
  await fetch(`${TG}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

Deno.serve(async req => {
  const update = await req.json().catch(() => null)
  const msg = update?.message
  if (!msg?.text || !msg.chat?.id) return new Response('ok')

  const chatId: number = msg.chat.id
  const text: string = msg.text.trim()

  if (text.startsWith('/start')) {
    const token = text.split(/\s+/)[1]
    if (!token) {
      await send(
        chatId,
        'Здравствуйте! Это бот приложения «Память» 🕯\n\n' +
          'Чтобы получить код входа, откройте приложение и нажмите «Получить код в Telegram».'
      )
      return new Response('ok')
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data } = await admin
      .from('auth_codes')
      .select('code, used, created_at')
      .eq('token', token)
      .maybeSingle()

    const fresh =
      data && !data.used && Date.now() - new Date(data.created_at).getTime() < 10 * 60 * 1000

    if (!fresh) {
      await send(chatId, 'Ссылка устарела. Запросите код в приложении ещё раз.')
      return new Response('ok')
    }

    await admin.from('auth_codes').update({ sent: true, chat_id: chatId }).eq('token', token)
    await send(
      chatId,
      `Ваш код входа в «Память»:\n\n<b>${data.code}</b>\n\nКод действует 10 минут. Никому его не сообщайте.`
    )
    return new Response('ok')
  }

  await send(chatId, 'Чтобы получить код входа, нажмите «Получить код в Telegram» в приложении «Память».')
  return new Response('ok')
})
