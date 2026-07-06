-- Журнал скорости запросов с телефонов (диагностика сетевых проблем).
-- Выполнить один раз в SQL Editor. Отключение записи — просто удалить
-- таблицу (приложение молча перестанет логировать).

create table if not exists diag_events (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid(),
  path text not null,
  method text not null,
  ms int not null,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists diag_events_time on diag_events (created_at desc);

alter table diag_events enable row level security;

drop policy if exists diag_insert on diag_events;
create policy diag_insert on diag_events for insert to authenticated with check (true);
drop policy if exists diag_read on diag_events;
create policy diag_read on diag_events for select to authenticated using (true);

-- чистка старых записей (запускать при желании)
create or replace function cleanup_diag_events()
returns void
language sql
security definer set search_path = public
as $$
  delete from diag_events where created_at < now() - interval '7 days';
$$;
