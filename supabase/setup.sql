-- ============================================================
--  «Память» — схема базы данных Supabase (Postgres) + справочник услуг.
--  Выполнить целиком один раз: Supabase → SQL Editor → Run.
--  Повторный запуск безопасен (idempotent).
-- ============================================================

create extension if not exists pg_trgm;

-- ─── Таблицы ─────────────────────────────────────────────────

-- Профиль пользователя (1:1 с auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  phone text,
  name text not null default 'Гость',
  avatar_url text,
  plan text not null default 'basic' check (plan in ('basic', 'standard', 'premium')),
  plan_valid_until date,
  push_token text,
  push_platform text,
  created_at timestamptz not null default now()
);

create table if not exists cities (
  id text primary key,
  name text not null
);

create table if not exists cemeteries (
  id text primary key,
  name text not null,
  city_id text not null references cities
);

create table if not exists graves (
  id text primary key default ('grave-' || gen_random_uuid()),
  full_name text not null,
  birth_date date,
  death_date date,
  cemetery_id text not null references cemeteries,
  plot text,
  biography text,
  photos jsonb not null default '[]',
  lat double precision,
  lng double precision,
  status text not null default 'moderation'
    check (status in ('digitized', 'moderation', 'not_digitized')),
  -- стартовый счётчик свечей для витрины (реальные свечи прибавляются к нему)
  candle_base int not null default 0,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);

create index if not exists graves_full_name_trgm on graves using gin (full_name gin_trgm_ops);
create index if not exists graves_cemetery on graves (cemetery_id);

create table if not exists services (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  category text not null check (category in ('quick', 'major')),
  price_from int not null,
  fixed_price boolean not null default true,
  sort int not null default 100
);

create table if not exists saved_graves (
  user_id uuid not null references profiles on delete cascade,
  grave_id text not null references graves on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, grave_id)
);

create table if not exists orders (
  id text primary key default ('order-' || gen_random_uuid()),
  user_id uuid not null references profiles on delete cascade,
  grave_id text not null references graves,
  service_id text not null references services,
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'on_the_way', 'working', 'completed', 'cancelled', 'refund')),
  date date not null,
  amount int,
  notes text,
  is_recurring boolean not null default false,
  recurring_period text not null default 'once'
    check (recurring_period in ('once', 'monthly', 'quarterly')),
  executor_name text,
  executor_rating numeric,
  rating int check (rating between 1 and 5),
  review text,
  photos_before jsonb not null default '[]',
  photos_after jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists orders_user on orders (user_id, created_at desc);
create index if not exists orders_grave on orders (grave_id);

-- Свечи памяти: одна свеча на пользователя на могилу в день
create table if not exists candles (
  user_id uuid not null references profiles on delete cascade,
  grave_id text not null references graves on delete cascade,
  lit_on date not null default current_date,
  primary key (user_id, grave_id, lit_on)
);

create index if not exists candles_grave on candles (grave_id);

create table if not exists memories (
  id text primary key default ('mem-' || gen_random_uuid()),
  grave_id text not null references graves on delete cascade,
  user_id uuid references profiles,
  author_name text not null,
  text text not null,
  photos jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists memories_grave on memories (grave_id, created_at desc);

create table if not exists grave_members (
  grave_id text not null references graves on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  primary key (grave_id, user_id)
);

create table if not exists reminders (
  id text primary key default ('rem-' || gen_random_uuid()),
  user_id uuid not null references profiles on delete cascade,
  grave_id text not null references graves on delete cascade,
  type text not null check (type in ('birthday', 'anniversary', 'custom')),
  date date not null,
  label text not null,
  is_enabled boolean not null default true,
  auto_order jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists reminders_user on reminders (user_id);

create table if not exists notifications (
  id text primary key default ('ntf-' || gen_random_uuid()),
  user_id uuid not null references profiles on delete cascade,
  type text not null check (type in ('order', 'date', 'candle', 'system')),
  title text not null,
  body text not null,
  order_id text,
  grave_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user on notifications (user_id, created_at desc);

-- ─── Автосоздание профиля при регистрации ────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;

  insert into notifications (user_id, type, title, body)
  values (
    new.id,
    'system',
    'Добро пожаловать в «Память»',
    'Найдите место памяти близкого человека и закажите уход с фотоотчётом.'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Свеча памяти: атомарные операции ────────────────────────

create or replace function candle_status(p_grave text)
returns json
language sql
security definer set search_path = public
as $$
  select json_build_object(
    'count', coalesce((select candle_base from graves where id = p_grave), 0)
             + (select count(*) from candles where grave_id = p_grave),
    'litToday', exists (
      select 1 from candles
      where grave_id = p_grave and user_id = auth.uid() and lit_on = current_date
    )
  );
$$;

create or replace function light_candle(p_grave text)
returns json
language plpgsql
security definer set search_path = public
as $$
begin
  insert into candles (user_id, grave_id)
  values (auth.uid(), p_grave)
  on conflict do nothing;
  return candle_status(p_grave);
end;
$$;

-- ─── RLS ─────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table cities enable row level security;
alter table cemeteries enable row level security;
alter table graves enable row level security;
alter table services enable row level security;
alter table saved_graves enable row level security;
alter table orders enable row level security;
alter table candles enable row level security;
alter table memories enable row level security;
alter table grave_members enable row level security;
alter table reminders enable row level security;
alter table notifications enable row level security;

-- справочники и общий контент — читают все авторизованные
drop policy if exists cities_read on cities;
create policy cities_read on cities for select to authenticated using (true);
drop policy if exists cemeteries_read on cemeteries;
create policy cemeteries_read on cemeteries for select to authenticated using (true);
drop policy if exists services_read on services;
create policy services_read on services for select to authenticated using (true);
drop policy if exists graves_read on graves;
create policy graves_read on graves for select to authenticated using (true);
drop policy if exists memories_read on memories;
create policy memories_read on memories for select to authenticated using (true);
drop policy if exists members_read on grave_members;
create policy members_read on grave_members for select to authenticated using (true);

-- добавлять захоронения и воспоминания может любой авторизованный
drop policy if exists graves_insert on graves;
create policy graves_insert on graves for insert to authenticated
  with check (created_by = auth.uid());
drop policy if exists memories_insert on memories;
create policy memories_insert on memories for insert to authenticated
  with check (user_id = auth.uid());

-- личные данные — только свои
drop policy if exists profiles_own on profiles;
create policy profiles_own on profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists saved_own on saved_graves;
create policy saved_own on saved_graves for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists orders_own on orders;
create policy orders_own on orders for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists reminders_own on reminders;
create policy reminders_own on reminders for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_own on notifications;
create policy notifications_own on notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- свечи: считают все, зажигает каждый от своего имени
drop policy if exists candles_read on candles;
create policy candles_read on candles for select to authenticated using (true);
drop policy if exists candles_insert on candles;
create policy candles_insert on candles for insert to authenticated
  with check (user_id = auth.uid());

-- ─── Сиды: справочники ───────────────────────────────────────

-- Города, демо-кладбища и придуманные люди вынесены в demo-seed.sql:
-- в боевой базе им не место (решение владельца 23.10.2026).

insert into services (id, name, description, icon, category, price_from, fixed_price, sort) values
  ('svc-cleaning', 'Уборка могилы', 'Уборка мусора, листвы, протирка памятника и ограды, покос травы', 'Broom', 'quick', 800, true, 10),
  ('svc-flowers', 'Цветы и венки', 'Возложение живых цветов или венка по вашему выбору', 'Flower', 'quick', 500, true, 20),
  ('svc-candles', 'Свечи и лампадки', 'Установка и зажжение свечей, лампадок', 'Flame', 'quick', 300, true, 30),
  ('svc-headstone', 'Надгробная плита', 'Изготовление и установка памятника из гранита или мрамора', 'Square', 'major', 15000, false, 40),
  ('svc-bench', 'Скамейка и стол', 'Установка скамейки и столика на участке', 'Armchair', 'major', 8000, false, 50),
  ('svc-fence', 'Ограда', 'Изготовление и монтаж металлической ограды', 'GridFour', 'major', 6000, false, 60)
on conflict (id) do nothing;
