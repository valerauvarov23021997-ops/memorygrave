# API — Полный контракт

Base URL: `https://api.pamyat.app/v1`
Auth: `Authorization: Bearer <accessToken>`
Формат ответа: `{ data: T, error: string | null, meta?: { total, page, limit } }`

## Авторизация

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| POST | /auth/send-code | `{ phone }` | `{ success, expiresIn }` |
| POST | /auth/verify-code | `{ phone, code }` | `{ accessToken, refreshToken, user }` |
| POST | /auth/refresh | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | /auth/logout | — | `{ success }` |
| DELETE | /auth/account | — | `{ success }` |
| POST | /user/push-token | `{ token, platform }` | `{ success }` |

## Захоронения

| Метод | Путь | Параметры / Тело | Ответ |
|-------|------|------|-------|
| GET | /graves/search | `?q&city&cemeteryId&page&limit` | `{ data: Grave[], meta }` |
| GET | /graves/:id | — | `{ data: Grave }` |
| POST | /graves | `{ fullName, birthDate, deathDate, cemeteryId, plot, photos, biography }` | `{ data: Grave }` |
| GET | /graves/:id/orders | `?limit` | `{ data: Order[] }` |
| GET | /cities | — | `{ data: City[] }` |
| GET | /cemeteries | `?cityId` | `{ data: Cemetery[] }` |
| GET | /user/saved-graves | — | `{ data: Grave[] }` |
| POST | /user/saved-graves | `{ graveId }` | `{ success }` |
| DELETE | /user/saved-graves/:id | — | `{ success }` |

## Услуги

| Метод | Путь | Параметры | Ответ |
|-------|------|------|-------|
| GET | /services | `?category` | `{ data: Service[] }` |
| GET | /services/:id | — | `{ data: Service }` |

## Заказы

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| POST | /orders | `{ graveId, serviceId, date, notes, isRecurring, recurringPeriod }` | `{ data: Order }` |
| GET | /orders | `?status&page&limit` | `{ data: Order[], meta }` |
| GET | /orders/:id | — | `{ data: Order }` |
| DELETE | /orders/:id | — | `{ success }` |
| POST | /orders/:id/review | `{ rating, comment }` | `{ success }` |
| GET | /orders/:id/report | — | `{ data: { photosBefore, photosAfter } }` |

## Оплата

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| POST | /payments/create | `{ orderId, methodId }` | `{ paymentId, confirmationUrl }` |
| GET | /payments/:id/status | — | `{ status, amount }` |
| POST | /payments/receipt | `{ orderId, email }` | `{ success }` |
| GET | /user/payment-methods | — | `{ data: PaymentMethod[] }` |
| DELETE | /user/payment-methods/:id | — | `{ success }` |

## Исполнитель

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| GET | /executor/orders | `?status` | `{ data: ExecutorOrder[] }` |
| POST | /executor/orders/:id/accept | — | `{ success }` |
| POST | /executor/orders/:id/reject | `{ reason }` | `{ success }` |
| POST | /executor/orders/:id/arrive | — | `{ success }` |
| POST | /executor/orders/:id/photos/before | `{ urls }` | `{ success }` |
| POST | /executor/orders/:id/photos/after | `{ urls }` | `{ success }` |
| POST | /executor/orders/:id/complete | — | `{ success }` |
| PUT | /executor/profile | `{ isOnline }` | `{ success }` |
| GET | /executor/orders/history | `?page&limit` | `{ data: Order[], meta }` |

## Напоминания

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| GET | /reminders | `?graveId` | `{ data: Reminder[] }` |
| POST | /reminders | `{ graveId, type, date, label, autoOrder }` | `{ data: Reminder }` |
| PUT | /reminders/:id | `{ isEnabled, autoOrder }` | `{ data: Reminder }` |
| DELETE | /reminders/:id | — | `{ success }` |

## Профиль

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| GET | /user/profile | — | `{ data: UserProfile }` |
| PUT | /user/profile | `{ name, avatarUrl }` | `{ data: UserProfile }` |
| GET | /user/subscription | — | `{ data: Subscription }` |
| POST | /subscriptions/activate | `{ receipt }` | `{ success }` |
| POST | /subscriptions/restore | — | `{ success }` |

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверный запрос (невалидные данные) |
| 401 | Не авторизован (истёк токен) |
| 403 | Нет прав (например, нет нужной подписки) |
| 404 | Объект не найден |
| 409 | Конфликт (например, заказ уже принят) |
| 422 | Ошибка валидации (details в error) |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |
