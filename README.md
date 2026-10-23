# Память

Мобильное приложение для поиска захоронений и заказа услуг по уходу за могилами.
React Native + TypeScript + Expo.

## Для разработчиков-агентов (Claude Code)

**Начни с `CLAUDE.md` в корне** — это управляющий файл.
Затем `docs/PROGRESS.md` — трекер задач.

## Быстрый старт

```bash
# Установка зависимостей (npm или yarn — оба через workspaces).
npm install --legacy-peer-deps

# Настройка окружения (мок-режим включён по умолчанию).
cp .env.example apps/client/.env
cp .env.example apps/executor/.env

# Запуск на телефоне через Expo Go (отсканируй QR):
npm run client              # клиентское приложение
npm run executor            # приложение исполнителя
```

Проверки:

```bash
# Типы по всем пакетам
npm run -w @pamyat/client typecheck   # и т.д. по пакетам
# Тесты утилит
cd packages/utils && npx jest
# Сборка JS-бандла (проверка, что всё собирается)
cd apps/client && npx expo export --platform android --output-dir dist
```

> В мок-режиме (`EXPO_PUBLIC_USE_MOCKS=true`) оба приложения работают
> полностью без бэкенда — данные берутся из фикстур `packages/api/src/mocks`.

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
