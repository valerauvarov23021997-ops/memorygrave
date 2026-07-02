import type { Member, Memory } from '../types'

export const memoriesMock: Memory[] = [
  {
    id: 'mem-1',
    graveId: 'grave-1',
    authorName: 'Валерия',
    text: 'Дедушка всегда брал меня на рыбалку на рассвете. Помню запах реки, термос с чаем и его тихие рассказы о войне. С ним было спокойно и надёжно.',
    createdAt: '2025-05-02T09:12:00Z',
    photos: [],
  },
  {
    id: 'mem-2',
    graveId: 'grave-1',
    authorName: 'Андрей',
    text: 'Отец научил меня всё делать на совесть. «Взялся — доведи до конца» — его слова. Я повторяю их своим детям.',
    createdAt: '2025-04-18T14:30:00Z',
    photos: [],
  },
  {
    id: 'mem-3',
    graveId: 'grave-2',
    authorName: 'Ольга',
    text: 'Мама читала нам вслух каждый вечер. Благодаря ей я полюбила книги на всю жизнь.',
    createdAt: '2025-03-07T19:00:00Z',
    photos: [],
  },
]

export const membersMock: Member[] = [
  { id: 'usr-1', name: 'Валерия Уварова', role: 'owner', avatarUrl: null },
  { id: 'usr-2', name: 'Андрей Соколов', role: 'editor', avatarUrl: null },
  { id: 'usr-3', name: 'Ольга Соколова', role: 'viewer', avatarUrl: null },
]
