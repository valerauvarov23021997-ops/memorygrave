-- Полное удаление аккаунта самим пользователем (23.10.2026).
-- Раньше приложение удаляло только профиль: пользователь оставался в
-- auth.users, а у тех, кто добавлял могилы или писал воспоминания, удаление
-- падало на внешних ключах. Apple требует удаление аккаунта в приложении,
-- 152-ФЗ — удаление персональных данных по просьбе человека.
-- Запускать после setup.sql, telegram-auth.sql, executor.sql. Повторный запуск безопасен.

create or replace function delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  my_phone text;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  -- У исполнителя на заказах висит история работ и фотоотчёты заказчиков:
  -- молча её не стираем, такой аккаунт удаляет владелец сервиса
  if exists (select 1 from orders where executor_id = uid) then
    raise exception 'executor account' using errcode = 'P0001';
  end if;

  select phone into my_phone from profiles where id = uid;

  -- Страницы памяти, которые человек добавил, нужны родственникам — остаются,
  -- но без автора. Свои воспоминания и замеры уходят вместе с ним.
  update graves set created_by = null where created_by = uid;
  delete from memories where user_id = uid;
  delete from diag_events where user_id = uid;

  -- Привязку Telegram держим, пока тем же номером входят с другого телефона
  if my_phone is not null
     and not exists (select 1 from profiles where phone = my_phone and id <> uid) then
    delete from tg_links where phone = my_phone;
    delete from auth_codes where phone = my_phone;
  end if;

  -- Каскадом уходят профиль, заказы, сохранённые, напоминания, свечи,
  -- уведомления, участие в семейных страницах
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
