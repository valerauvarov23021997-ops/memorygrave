# E2E-смоук в web-эмуляции

Сквозной прогон клиентского приложения в Chromium (Playwright):
онбординг → вход по SMS → поиск → страница памяти → свеча →
напоминания → заказ → оплата → фотоотчёт → профиль → тариф →
уведомления → карта кладбища. 23 сценария.
Идёт на фикстурах (демо-режим): тестовые аккаунты в боевой базе не создаются.

## Запуск

```bash
# 1. Собрать web-версию
cd apps/client
npx expo export --platform web --output-dir ../../e2e/dist

# 2. Скрипт грузится как модуль (zustand использует import.meta)
sed -i 's|" defer>|" type="module">|' ../../e2e/dist/index.html

# 3. Поднять сервер и прогнать
cd ../../e2e
python3 -m http.server 8099 --directory dist &
node web-smoke.js   # требует playwright-core и Chromium
```

### На ноутбуке владельца (Windows, Git Bash)

```bash
cd apps/client
EXPO_PUBLIC_USE_MOCKS=true npx expo export --platform web --output-dir ../../e2e/dist --clear
sed -i 's|" defer>|" type="module">|' ../../e2e/dist/index.html
cd ../../e2e
npm install --no-save --no-package-lock playwright-core@1
python -m http.server 8099 --directory dist &
E2E_BROWSER="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" node web-smoke.js
```

Скриншоты шагов складываются в `out/`. Найденные этим прогоном баги:
белый экран web (import.meta), зависание онбординга на Android/web,
падение entering-анимаций reanimated на web.
