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

-- Чистка старых кодов (можно запускать вручную или по расписанию)
create or replace function cleanup_auth_codes()
returns void
language sql
security definer set search_path = public
as $$
  delete from auth_codes where created_at < now() - interval '1 day';
$$;
