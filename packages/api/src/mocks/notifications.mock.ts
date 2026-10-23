import type { AppNotification } from '../types'

const daysAgo = (n: number, h = 10) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, 24, 0, 0)
  return d.toISOString()
}

/** Мутируемый стор уведомлений (моки): markRead меняет isRead. */
export const notificationsMock: AppNotification[] = [
  {
    id: 'ntf-1',
    type: 'order',
    title: 'Заказ выполнен',
    body: 'Комплексная уборка завершена — фотоотчёт готов к просмотру',
    createdAt: daysAgo(0, 9),
    isRead: false,
    orderId: 'order-1',
  },
  {
    id: 'ntf-2',
    type: 'candle',
    title: 'Свеча памяти',
    body: 'Анна зажгла свечу на странице Иванова Петра Сергеевича',
    createdAt: daysAgo(1, 19),
    isRead: false,
    graveId: 'grave-1',
  },
  {
    id: 'ntf-3',
    type: 'date',
    title: 'Приближается годовщина',
    body: 'Через 5 дней — годовщина памяти Иванова Петра Сергеевича',
    createdAt: daysAgo(2, 12),
    isRead: true,
    graveId: 'grave-1',
  },
  {
    id: 'ntf-4',
    type: 'order',
    title: 'Исполнитель в пути',
    body: 'Сергей выехал на Троекуровское кладбище',
    createdAt: daysAgo(4, 8),
    isRead: true,
    orderId: 'order-2',
  },
  {
    id: 'ntf-5',
    type: 'system',
    title: 'Добро пожаловать',
    body: 'Спасибо, что доверили нам заботу о памяти близких',
    createdAt: daysAgo(9, 15),
    isRead: true,
  },
]
