-- Убрать демо-данные из боевой базы (решение владельца 23.10.2026).
-- Остаётся только настоящее кладбище д. Даймище. Сами демо-записи живут
-- в demo-seed.sql — для отдельного тестового проекта. Повторный запуск безопасен.

-- Тестовые заказы на придуманных людей: 7 из них «ожидают исполнителя»,
-- и исполнитель видел их как настоящие. У заказа нет каскада от могилы.
delete from notifications
 where order_id in (select o.id from orders o join graves g on g.id = o.grave_id
                     where g.cemetery_id <> 'daymische' and g.created_by is null);
delete from orders
 where grave_id in (select id from graves where cemetery_id <> 'daymische' and created_by is null);

-- 12 придуманных людей. Свечи, воспоминания, напоминания, сохранённые
-- и участники семейных страниц уходят каскадом. Могилы, добавленные
-- пользователями (created_by заполнен), не трогаем.
delete from notifications
 where grave_id in (select id from graves where cemetery_id <> 'daymische' and created_by is null);
delete from graves where cemetery_id <> 'daymische' and created_by is null;

-- Кладбища и города, на которых не осталось ни одной могилы и ни одного плана
delete from cemeteries c
 where not c.has_map and not exists (select 1 from graves g where g.cemetery_id = c.id);
delete from cities ci
 where not exists (select 1 from cemeteries c where c.city_id = ci.id);

-- Платные тарифы включались бесплатно одним нажатием (оплаты нет) —
-- у тестировщиков их 6. Возвращаем всех на «Базовый».
update profiles set plan = 'basic', plan_valid_until = null where plan <> 'basic';

-- ─── Контроль ───
-- select count(*) from cemeteries;                               -- 1
-- select count(*) from graves where cemetery_id <> 'daymische';  -- 0
-- select plan, count(*) from profiles group by plan;             -- только basic
