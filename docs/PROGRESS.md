# PROGRESS.md — Трекер разработки

> Это рабочая память проекта между сессиями Claude Code.
> **Читай этот файл первым.** Обновляй после каждой завершённой задачи.
> Формат статусов: `TODO` · `IN PROGRESS` · `DONE` · `BLOCKED`

Последнее обновление: _не начато_
Текущая задача: **`tasks/00-setup.md`**

---

## Общий прогресс

```
[ ] 00 · Setup            — инфраструктура, токены, API-клиент
[ ] 01 · Design System    — UI-компоненты
[ ] 02 · Auth             — онбординг, вход по SMS
[ ] 03 · Search           — поиск захоронений
[ ] 04 · Grave            — страница захоронения
[ ] 05 · Catalog          — каталог услуг, заказ
[ ] 06 · Orders           — оплата, статусы
[ ] 07 · Reports          — фотоотчёты, оценки
[ ] 08 · Reminders        — памятные даты, автозаказ
[ ] 09 · Profile          — профиль, подписка
[ ] 10 · Executor         — приложение исполнителя
[ ] 11 · Notifications    — push-уведомления
```

Прогресс MVP (P0): **0 / 12 задач**

---

## Журнал задач

### 00 · Setup — `TODO`
Зависимости: нет
Файл: `tasks/00-setup.md`

Что сделать:
- [ ] Инициализировать монорепо (Turborepo + Yarn Workspaces)
- [ ] Создать `apps/client` (Expo)
- [ ] Создать пакеты `ui`, `api`, `store`, `utils`
- [ ] Токены дизайн-системы в `packages/ui/src/tokens`
- [ ] Axios-клиент с interceptors в `packages/api`
- [ ] Мок-режим (USE_MOCKS)
- [ ] ESLint + Prettier + tsconfig strict
- [ ] Jest конфигурация

Резюме после выполнения: _—_

---

### 01 · Design System — `TODO`
Зависимости: 00
Файл: `tasks/01-design-system.md`
Резюме: _—_

### 02 · Auth — `TODO`
Зависимости: 00, 01
Файл: `tasks/02-auth.md`
Резюме: _—_

### 03 · Search — `TODO`
Зависимости: 02
Файл: `tasks/03-search.md`
Резюме: _—_

### 04 · Grave — `TODO`
Зависимости: 03
Файл: `tasks/04-grave.md`
Резюме: _—_

### 05 · Catalog — `TODO`
Зависимости: 04
Файл: `tasks/05-catalog.md`
Резюме: _—_

### 06 · Orders — `TODO`
Зависимости: 05
Файл: `tasks/06-orders.md`
Резюме: _—_

### 07 · Reports — `TODO`
Зависимости: 06
Файл: `tasks/07-reports.md`
Резюме: _—_

### 08 · Reminders — `TODO`
Зависимости: 04
Файл: `tasks/08-reminders.md`
Резюме: _—_

### 09 · Profile — `TODO`
Зависимости: 06
Файл: `tasks/09-profile.md`
Резюме: _—_

### 10 · Executor — `TODO`
Зависимости: 06
Файл: `tasks/10-executor.md`
Резюме: _—_

### 11 · Notifications — `TODO`
Зависимости: все
Файл: `tasks/11-notifications.md`
Резюме: _—_

---

## Заблокированные задачи / открытые вопросы

_(сюда агент записывает всё, что требует внимания человека)_

- Нет реальных API-ключей: Google Maps, Firebase, ЮКасса, Sentry, Amplitude, AWS S3.
  До их получения — работаем в мок-режиме (`USE_MOCKS=true`).

---

## Лог решений

_(краткие записи принятых архитектурных решений — подробно в docs/DECISIONS.md)_
