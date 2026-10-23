import type { Reminder } from '../types'

export const remindersMock: Reminder[] = [
  {
    id: 'rem-1',
    graveId: 'grave-1',
    graveName: 'Соколов Пётр Андреевич',
    cemeteryName: 'Новодевичье кладбище',
    type: 'birthday',
    date: '1941-05-02',
    label: 'День рождения',
    isEnabled: true,
    autoOrder: ['svc-flowers', 'svc-cleaning'],
  },
  {
    id: 'rem-2',
    graveId: 'grave-1',
    graveName: 'Соколов Пётр Андреевич',
    cemeteryName: 'Новодевичье кладбище',
    type: 'anniversary',
    date: '2003-11-14',
    label: 'Годовщина памяти',
    isEnabled: true,
    autoOrder: [],
  },
  {
    id: 'rem-3',
    graveId: 'grave-2',
    graveName: 'Соколова Мария Ивановна',
    cemeteryName: 'Новодевичье кладбище',
    type: 'anniversary',
    date: '2018-03-07',
    label: 'Годовщина памяти',
    isEnabled: false,
    autoOrder: [],
  },
]
