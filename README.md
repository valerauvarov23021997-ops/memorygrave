# Память

Мобильное приложение для поиска захоронений и заказа услуг по уходу за могилами.
React Native + TypeScript + Expo.

## Для разработчиков-агентов (Claude Code)

**Начни с `CLAUDE.md` в корне** — это управляющий файл.
Затем `docs/PROGRESS.md` — трекер задач.

## Быстрый старт

```bash
yarn install
cp .env.example .env        # заполни ключи (или оставь USE_MOCKS=true)
yarn workspace @pamyat/client start
```

## Структура

- `apps/client` — клиентское приложение
- `apps/executor` — приложение исполнителя
- `packages/*` — общий код (ui, api, store, utils)
- `docs/` — ТЗ, дизайн, API, прогресс
- `tasks/` — задачи разработки

## Документация

| Файл | Что внутри |
|------|-----------|
| `CLAUDE.md` | Управляющий файл для агента |
| `docs/PROGRESS.md` | Трекер выполнения задач |
| `docs/TZ.md` | Техническое задание |
| `docs/DESIGN.md` | Дизайн-система |
| `docs/API.md` | API-контракт |
| `docs/DECISIONS.md` | Журнал решений |
