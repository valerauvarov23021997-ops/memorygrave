-- ============================================================
--  «Память» — исполнители и фотоотчёты.
--  Выполняется после setup.sql и telegram-auth.sql.
--  Повторный запуск безопасен (idempotent).
-- ============================================================

-- ─── Исполнители ─────────────────────────────────────────────
-- Список ведёт владелец сервиса: исполнителем становится только тот,
-- чей телефон сюда внесён. Аккаунты в приложении анонимные, поэтому
-- user_id привязывается при входе — после проверки кода из Telegram.
create table if not exists executors (
  phone text primary key,
  user_id uuid unique references profiles on delete set null,
  name text not null,
  rating numeric not null default 5,
  is_online boolean not null default true,
  -- доля исполнителя от стоимости заказа (решение владельца 22.10.2026 — 80%)
  reward_share numeric not null default 0.8 check (reward_share between 0 and 1),
  cities text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table executors enable row level security;
drop policy if exists executors_self on executors;
create policy executors_self on executors for select to authenticated
  using (user_id = auth.uid());

alter table orders add column if not exists executor_id uuid references profiles;
alter table orders add column if not exists assigned_at timestamptz;
alter table orders add column if not exists arrived_at timestamptz;
alter table orders add column if not exists completed_at timestamptz;
create index if not exists orders_executor on orders (executor_id, status);
create index if not exists orders_pending on orders (status) where executor_id is null;

create or replace function is_executor()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (select 1 from executors where user_id = auth.uid());
$$;

-- Исполнитель видит свободные заказы и свои. Менять заказы напрямую
-- он не может — только через функции ниже, которые соблюдают порядок этапов.
drop policy if exists orders_executor_read on orders;
create policy orders_executor_read on orders for select to authenticated
  using (
    is_executor()
    and ((status = 'pending' and executor_id is null) or executor_id = auth.uid())
  );

-- ─── Вход исполнителя ────────────────────────────────────────
-- Код проверяется той же функцией, что и вход клиента. В отличие от
-- клиента, без кода не пускаем никогда: исполнитель видит чужие заказы.
create or replace function executor_claim(p_phone text, p_code text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then
    raise exception 'Нет сессии';
  end if;
  if not verify_tg_code(p_phone, p_code) then
    return json_build_object('ok', false, 'reason', 'bad_code');
  end if;
  -- новый телефон исполнителя = новый анонимный аккаунт; старый отвязываем
  update executors set user_id = v_uid where phone = p_phone returning name into v_name;
  if v_name is null then
    return json_build_object('ok', false, 'reason', 'not_executor');
  end if;
  update profiles set phone = p_phone, name = v_name where id = v_uid;
  return json_build_object('ok', true, 'name', v_name);
end;
$$;

-- ─── Этапы заказа ────────────────────────────────────────────

create or replace function executor_notify(p_order orders, p_title text, p_body text)
returns void
language sql
security definer set search_path = public
as $$
  insert into notifications (user_id, type, title, body, order_id, grave_id)
  values (p_order.user_id, 'order', p_title, p_body, p_order.id, p_order.grave_id);
$$;

create or replace function executor_accept(p_order text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_ex executors;
  v_row orders;
begin
  select * into v_ex from executors where user_id = auth.uid();
  if v_ex is null then raise exception 'Вы не исполнитель'; end if;
  update orders
  set status = 'assigned', executor_id = auth.uid(), executor_name = v_ex.name,
      executor_rating = v_ex.rating, assigned_at = now()
  where id = p_order and status = 'pending' and executor_id is null
  returning * into v_row;
  if v_row is null then raise exception 'Заказ уже взял другой исполнитель'; end if;
  perform executor_notify(v_row, 'Исполнитель назначен',
    v_ex.name || ' выполнит ваш заказ ' || to_char(v_row.date, 'DD.MM.YYYY'));
end;
$$;

-- Отказ от взятого заказа возвращает его в общий список
create or replace function executor_release(p_order text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update orders
  set status = 'pending', executor_id = null, executor_name = null,
      executor_rating = null, assigned_at = null
  where id = p_order and executor_id = auth.uid() and status = 'assigned';
  if not found then raise exception 'От заказа нельзя отказаться на этом этапе'; end if;
end;
$$;

create or replace function executor_arrive(p_order text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_row orders;
begin
  update orders set status = 'working', arrived_at = now()
  where id = p_order and executor_id = auth.uid() and status in ('assigned', 'on_the_way')
  returning * into v_row;
  if v_row is null then raise exception 'Заказ не найден или уже начат'; end if;
  perform executor_notify(v_row, 'Исполнитель на месте', 'Работа началась, скоро пришлём фото');
end;
$$;

-- p_paths — пути файлов в хранилище reports: <order_id>/<kind>/<имя>
create or replace function executor_set_photos(p_order text, p_kind text, p_paths text[])
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_kind not in ('before', 'after') then raise exception 'Неизвестный тип фото'; end if;
  if exists (select 1 from unnest(p_paths) p where p not like p_order || '/' || p_kind || '/%') then
    raise exception 'Фото не от этого заказа';
  end if;
  update orders
  set photos_before = case when p_kind = 'before' then to_jsonb(p_paths) else photos_before end,
      photos_after = case when p_kind = 'after' then to_jsonb(p_paths) else photos_after end
  where id = p_order and executor_id = auth.uid() and status = 'working';
  if not found then raise exception 'Фото можно загрузить только во время работы'; end if;
end;
$$;

-- Без фото «до» и «после» заказ не закрыть: фотоотчёт — обещание сервиса
create or replace function executor_complete(p_order text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_row orders;
begin
  update orders set status = 'completed', completed_at = now()
  where id = p_order and executor_id = auth.uid() and status = 'working'
    and jsonb_array_length(photos_before) >= 2 and jsonb_array_length(photos_after) >= 2
  returning * into v_row;
  if v_row is null then raise exception 'Нужны минимум 2 фото до и 2 фото после работы'; end if;
  perform executor_notify(v_row, 'Фотоотчёт готов', 'Работа выполнена — посмотрите фото до и после');
end;
$$;

create or replace function executor_set_online(p_online boolean)
returns void
language sql
security definer set search_path = public
as $$
  update executors set is_online = p_online where user_id = auth.uid();
$$;

create or replace function executor_profile()
returns json
language sql stable
security definer set search_path = public
as $$
  select json_build_object(
    'id', e.user_id,
    'name', e.name,
    'rating', e.rating,
    'isOnline', e.is_online,
    'rewardShare', e.reward_share,
    'cities', e.cities,
    'totalOrders', (select count(*) from orders o
                    where o.executor_id = e.user_id and o.status = 'completed'),
    'monthEarnings', (select coalesce(round(sum(o.amount * e.reward_share)), 0) from orders o
                      where o.executor_id = e.user_id and o.status = 'completed'
                        and o.completed_at >= date_trunc('month', now()))
  )
  from executors e where e.user_id = auth.uid();
$$;

-- Без входа (роль anon) функции исполнителя недоступны
revoke execute on function executor_notify(orders, text, text) from public, anon, authenticated;
revoke execute on function is_executor() from public, anon;
revoke execute on function executor_claim(text, text) from public, anon;
revoke execute on function executor_accept(text) from public, anon;
revoke execute on function executor_release(text) from public, anon;
revoke execute on function executor_arrive(text) from public, anon;
revoke execute on function executor_set_photos(text, text, text[]) from public, anon;
revoke execute on function executor_complete(text) from public, anon;
revoke execute on function executor_set_online(boolean) from public, anon;
revoke execute on function executor_profile() from public, anon;
grant execute on function is_executor() to authenticated;
grant execute on function executor_claim(text, text) to authenticated;
grant execute on function executor_accept(text) to authenticated;
grant execute on function executor_release(text) to authenticated;
grant execute on function executor_arrive(text) to authenticated;
grant execute on function executor_set_photos(text, text, text[]) to authenticated;
grant execute on function executor_complete(text) to authenticated;
grant execute on function executor_set_online(boolean) to authenticated;
grant execute on function executor_profile() to authenticated;

-- ─── Хранилище фотоотчётов ───────────────────────────────────
-- Закрытое: фото видят только заказчик и исполнитель заказа
-- (по временным ссылкам). Путь файла: <order_id>/<before|after>/<имя>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 10485760, array['image/jpeg', 'image/png', 'image/heic'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists reports_upload on storage.objects;
create policy reports_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'reports'
    and exists (select 1 from orders o
                where o.id = (storage.foldername(name))[1]
                  and o.executor_id = auth.uid() and o.status = 'working')
  );

drop policy if exists reports_read on storage.objects;
create policy reports_read on storage.objects for select to authenticated
  using (
    bucket_id = 'reports'
    and exists (select 1 from orders o
                where o.id = (storage.foldername(name))[1]
                  and (o.user_id = auth.uid() or o.executor_id = auth.uid()))
  );
