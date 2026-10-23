-- Защита и скорость базы по замечаниям советника Supabase (23.10.2026).
-- Запускать после setup.sql, telegram-auth.sql, diagnostics.sql, executor.sql.
-- Безопасно запускать повторно.

-- Служебные функции: по умолчанию Postgres даёт EXECUTE всем, и их можно
-- было дёрнуть через /rest/v1/rpc. Чистку и триггер вызывает только сама база.
revoke execute on function cleanup_auth_codes() from public, anon, authenticated;
revoke execute on function cleanup_diag_events() from public, anon, authenticated;
revoke execute on function handle_new_user() from public, anon, authenticated;

-- Журнал скорости: каждый видит только свои замеры, не чужие.
drop policy if exists diag_read on diag_events;
create policy diag_read on diag_events for select to authenticated
  using (user_id = (select auth.uid()));

-- (select auth.uid()) вместо auth.uid(): иначе функция считается заново
-- на каждой строке, а не один раз на запрос.
drop policy if exists candles_insert on candles;
create policy candles_insert on candles for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists graves_insert on graves;
create policy graves_insert on graves for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists memories_insert on memories;
create policy memories_insert on memories for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists notifications_own on notifications;
create policy notifications_own on notifications for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists orders_own on orders;
create policy orders_own on orders for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists orders_executor_read on orders;
create policy orders_executor_read on orders for select to authenticated
  using ((select is_executor()) and (
    (status = 'pending' and executor_id is null) or executor_id = (select auth.uid())
  ));

drop policy if exists profiles_own on profiles;
create policy profiles_own on profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists reminders_own on reminders;
create policy reminders_own on reminders for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists saved_own on saved_graves;
create policy saved_own on saved_graves for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists executors_self on executors;
create policy executors_self on executors for select to authenticated
  using (user_id = (select auth.uid()));

-- Индексы под внешние ключи: без них удаление пользователя или могилы
-- просматривает таблицу целиком.
create index if not exists cemeteries_city_id on cemeteries (city_id);
create index if not exists cemetery_paths_cemetery_id on cemetery_paths (cemetery_id);
create index if not exists grave_members_user_id on grave_members (user_id);
create index if not exists graves_burial_place_id on graves (burial_place_id);
create index if not exists graves_created_by on graves (created_by);
create index if not exists memories_user_id on memories (user_id);
create index if not exists orders_service_id on orders (service_id);
create index if not exists reminders_grave_id on reminders (grave_id);
create index if not exists saved_graves_grave_id on saved_graves (grave_id);
