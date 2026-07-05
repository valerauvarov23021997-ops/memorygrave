-- ============================================================
--  Вход по коду из Telegram-бота.
--  Выполнить один раз в Supabase → SQL Editor (после setup.sql).
-- ============================================================

create table if not exists auth_codes (
  token uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  chat_id bigint,
  sent boolean not null default false,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists auth_codes_phone on auth_codes (phone, created_at desc);

-- Прямого доступа к таблице нет ни у кого — только RPC ниже
alter table auth_codes enable row level security;

-- Запрос кода: создаёт запись, возвращает токен для deep-link в бота.
-- Не больше 5 запросов на номер в час.
create or replace function start_tg_auth(p_phone text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_token uuid;
  v_recent int;
begin
  select count(*) into v_recent
  from auth_codes
  where phone = p_phone and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Слишком много запросов кода. Попробуйте через час.';
  end if;

  insert into auth_codes (phone, code)
  values (p_phone, lpad(floor(random() * 1000000)::int::text, 6, '0'))
  returning token into v_token;

  return json_build_object('token', v_token);
end;
$$;

-- Проверка кода: одноразовая, живёт 10 минут.
create or replace function verify_tg_code(p_phone text, p_code text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_ok boolean;
begin
  update auth_codes
  set used = true
  where phone = p_phone
    and code = p_code
    and not used
    and created_at > now() - interval '10 minutes'
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- Доступны до входа (роль anon) — это и есть вход
grant execute on function start_tg_auth(text) to anon, authenticated;
grant execute on function verify_tg_code(text, text) to anon, authenticated;

-- Связка «телефон ↔ Telegram-чат»: после первого входа коды
-- отправляются автоматически, без нажатия Start
create table if not exists tg_links (
  phone text primary key,
  chat_id bigint not null,
  linked_at timestamptz not null default now()
);

-- Доступ только у service role (edge functions); RLS без политик
alter table tg_links enable row level security;

-- ─── Отправка кода прямо из базы (без edge function в пути входа) ───
-- Функции Supabase живут на инфраструктуре, которую некоторые российские
-- операторы душат. REST до базы при этом работает стабильно, поэтому код
-- создаёт RPC, а сообщение в Telegram уходит асинхронно через pg_net.

create extension if not exists pg_net;

-- Секреты приложения (бот-токен). RLS без политик: доступ только
-- у security definer функций и service role.
create table if not exists app_secrets (
  key text primary key,
  value text not null
);
alter table app_secrets enable row level security;

create or replace function send_login_code(p_phone text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_recent int;
  v_token uuid;
  v_code text;
  v_chat bigint;
  v_bot text;
begin
  select count(*) into v_recent
  from auth_codes
  where phone = p_phone and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Слишком много запросов кода. Попробуйте через час.';
  end if;

  v_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
  insert into auth_codes (phone, code) values (p_phone, v_code)
  returning token into v_token;

  select chat_id into v_chat from tg_links where phone = p_phone;
  select value into v_bot from app_secrets where key = 'telegram_bot_token';

  -- чат не связан или токен не настроен — первый вход через Start-ссылку
  if v_chat is null or v_bot is null then
    return json_build_object('token', v_token);
  end if;

  update auth_codes set sent = true, chat_id = v_chat where token = v_token;
  -- асинхронная отправка: RPC отвечает мгновенно, сообщение шлёт база
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || v_bot || '/sendMessage',
    body := jsonb_build_object(
      'chat_id', v_chat,
      'text', 'Ваш код входа в «Память»: ' || v_code || E'\n\nКод действует 10 минут. Никому его не сообщайте.'
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return json_build_object('sent', true);
end;
$$;

grant execute on function send_login_code(text) to anon, authenticated;

-- Чистка старых кодов (можно запускать вручную или по расписанию)
create or replace function cleanup_auth_codes()
returns void
language sql
security definer set search_path = public
as $$
  delete from auth_codes where created_at < now() - interval '1 day';
$$;
