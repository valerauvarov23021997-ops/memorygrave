# Бэкенд «Памяти» — Supabase

Приложение умеет работать в трёх режимах (`packages/api/src/config.ts`):

| Режим | Когда активен | Что это |
|-------|--------------|---------|
| `mocks` | `EXPO_PUBLIC_USE_MOCKS=true` (по умолчанию) | Фикстуры в коде, ничего не сохраняется |
| `supabase` | `USE_MOCKS=false` + ключи Supabase | **Реальная база**: пользователи, заказы, свечи — общие для всех |
| `rest` | `USE_MOCKS=false` без ключей | Собственный REST по `docs/API.md` (когда появится) |

## Запуск за 10 минут

### 1. Создай проект Supabase (бесплатно)

1. Зарегистрируйся на [supabase.com](https://supabase.com) (можно через GitHub)
2. **New project** → имя `pamyat`, регион **Frankfurt (eu-central-1)** (ближе к РФ),
   пароль базы — придумай и сохрани
3. Подожди ~2 минуты, пока проект поднимется

### 2. Разверни схему базы

1. В проекте слева: **SQL Editor** → **New query**
2. Вставь целиком содержимое файла [`supabase/setup.sql`](../supabase/setup.sql)
3. **Run**. Должно завершиться без ошибок — появятся таблицы, права доступа
   и стартовые данные (города, кладбища, услуги, 12 захоронений)

### 3. Включи анонимный вход

**Authentication → Sign In / Up → Anonymous sign-ins → Enable.**
Пока нет SMS-провайдера, вход работает так: телефон сохраняется в профиле,
код из SMS принимается любой, но каждый телефон получает настоящий
аккаунт в базе.

### 4. Подключи приложение

Создай файл `apps/client/.env` (он не коммитится) с ключами проекта.
Для проекта `pamyat` (ajctgzzvoxrakbjvcpbt) готовый вариант:

```
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_SUPABASE_URL=https://ajctgzzvoxrakbjvcpbt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_l7Wxfk7HaAI6osyPE69amA_riboCd9V
EXPO_PUBLIC_TG_BOT=pamyatcodebot
EXPO_PUBLIC_API_BASE_URL=https://api.pamyat.app/v1
```

Публичный (`sb_publishable_`) ключ безопасно хранить в приложении и доках —
данные защищает RLS. Секретный (`sb_secret_`) — никогда и никуда, кроме
серверных настроек Supabase.

`anon`-ключ публичный по дизайну — данные защищает Row Level Security
(каждый пользователь видит только своё; справочники и страницы памяти
общие). Секретный `service_role`-ключ в приложение не попадает никогда.

### 5. Проверь и опубликуй

```bash
npx expo start          # локально
eas update --branch preview --message "реальный бэкенд"   # тестерам
```

Проверка, что работает база, а не моки: зажги свечу на странице памяти
с двух разных телефонов — счётчик общий и растёт у обоих.

## Что уже на реальной базе

Авторизация (анонимная сессия + телефон), поиск и добавление захоронений,
избранное, услуги, заказы (создание, список, отмена, оценка, фотоотчёт),
свечи памяти (общий счётчик, 1 свеча/день на человека), книга воспоминаний,
напоминания, профиль и тариф, уведомления.

## Коды входа через Telegram (бесплатно, вместо SMS)

Приложение умеет присылать код входа через Telegram-бота. Настройка:

1. **Создай бота**: в Telegram открой [@BotFather](https://t.me/BotFather) →
   `/newbot` → имя «Память» → username вида `PamyatCodeBot`.
   BotFather выдаст **токен** — храни его у себя, никому не отправляй.
2. **Разверни SQL**: Supabase → SQL Editor → вставь целиком
   [`supabase/telegram-auth.sql`](../supabase/telegram-auth.sql) → Run.
3. **Создай две Edge Functions**: Supabase → Edge Functions → Create function.
   У обеих в настройках **выключи** «Verify JWT».
   - `tg-bot` — код из
     [`supabase/functions/tg-bot/index.ts`](../supabase/functions/tg-bot/index.ts)
     (вебхук бота: выдаёт код по Start, запоминает чат)
   - `send-code` — код из
     [`supabase/functions/send-code/index.ts`](../supabase/functions/send-code/index.ts)
     (создаёт код; если чат уже знаком — шлёт сразу, без Start)
4. **Добавь секрет**: Edge Functions → Secrets → `TELEGRAM_BOT_TOKEN` =
   токен от BotFather (общий для обеих функций).
5. **Привяжи вебхук** — открой в браузере (подставь своё):
   ```
   https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://ajctgzzvoxrakbjvcpbt.supabase.co/functions/v1/tg-bot
   ```
   Должно ответить `{"ok":true,...}`.
6. **Включи в приложении** — в `apps/client/.env` добавь строку
   (username бота без @):
   ```
   EXPO_PUBLIC_TG_BOT=pamyatcodebot
   ```
   и опубликуй: `eas update --branch preview`.

> Для проекта `pamyat` шаги 1–5 выполнены 05.07.2026: бот
> [@pamyatcodebot](https://t.me/pamyatcodebot), вебхук привязан,
> функции задеплоены, SQL применён.

### Отправка кода из базы (обход нестабильного пути к функциям)

Приложение запрашивает код через RPC `send_login_code` (обычный REST),
а Telegram-сообщение база шлёт асинхронно через `pg_net` — edge function
в пути входа не участвует (у части операторов она недоступна).
Для этого токен бота должен лежать в таблице `app_secrets`:

```sql
insert into app_secrets (key, value)
values ('telegram_bot_token', 'СЮДА_ТОКЕН_ОТ_BOTFATHER')
on conflict (key) do update set value = excluded.value;
```

Выполняется в SQL Editor один раз (и повторно — после смены токена).
Функция `send-code` остаётся как резерв, вебхук `tg-bot` обязателен —
его вызывает Telegram, а не телефон пользователя.

Как это выглядит. **Первый вход**: телефон → кнопка «Получить код
в Telegram» → Start у бота → код в чате. Бот запоминает связку
«телефон ↔ чат», поэтому **все следующие входы** — без нажатий:
ввёл номер → код мгновенно прилетает пушем из Telegram. Код живёт
10 минут, одноразовый, не больше 5 запросов на номер в час. Если
пользователь заблокировал бота, связка сбрасывается и снова
предлагается Start. Если `EXPO_PUBLIC_TG_BOT` пуст — код принимается
любой (режим разработки).

## Что осталось на моках (фаза 2)

- **Оплата** — ждёт ИП/ООО и договор с ЮКассой
- **Приложение исполнителя** — нужна логика назначения заказов (edge functions)
- **SMS-код** — как запасной путь для тех, у кого нет Telegram
  (нужен договор с SMS-провайдером)
- **Загрузка фото** — Supabase Storage, подключим следующим шагом

## Замечания по безопасности

- RLS включён на всех таблицах; политики — в конце `setup.sql`
- Профиль создаётся триггером при регистрации (`handle_new_user`)
- Свечи пишутся через RPC (`light_candle`) — накрутка одним пользователем
  невозможна (уникальный ключ user+grave+день)
