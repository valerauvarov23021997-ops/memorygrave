/**
 * Реализация API поверх Supabase. Повторяет интерфейсы endpoints.ts —
 * UI не отличает этот слой от моков или REST.
 *
 * Вход пока без реальной SMS-проверки: verifyCode создаёт анонимную
 * сессию Supabase и сохраняет телефон в профиле. Реальный SMS-провайдер
 * подключается позже, интерфейс не изменится.
 */
import { queryWords, rankByName } from '@pamyat/utils'

import { kvStorage, tokenStorage } from '../client'
import { config } from '../config'
import { plansMock } from '../mocks'
import type {
  AppNotification,
  CemeteryMap,
  ExecutorOrder,
  ExecutorProfile,
  PlacePerson,
  AuthTokens,
  Cemetery,
  City,
  Grave,
  Member,
  Memory,
  Order,
  OrderStatus,
  PhotoReport,
  PlanInfo,
  Reminder,
  Service,
  ServiceCategory,
  Subscription,
  SubscriptionPlan,
  UserProfile,
} from '../types'
import { getSupabase, requireUserId } from './client'

// ─── Вспомогательные маппинги строк БД → доменные типы ────────

interface GraveRow {
  id: string
  full_name: string
  birth_date: string | null
  death_date: string | null
  birth_year: number | null
  death_year: number | null
  cemetery_id: string
  plot: string | null
  biography: string | null
  photos: string[]
  lat: number | null
  lng: number | null
  status: Grave['status']
  cemetery: { name: string; city: { name: string } | null } | null
}

const GRAVE_SELECT =
  'id, full_name, birth_date, death_date, birth_year, death_year, cemetery_id, plot, biography, photos, lat, lng, status, cemetery:cemeteries(name, city:cities(name))'

// Заглушки placehold.co в мобильных сетях грузятся вечно и «подвешивают»
// портреты — такие адреса отбрасываем, аватар покажет инициалы мгновенно
function realPhotos(photos: string[] | null): string[] {
  return (photos ?? []).filter(u => !u.includes('placehold.co'))
}

function mapGrave(row: GraveRow, savedIds: Set<string>): Grave {
  return {
    id: row.id,
    fullName: row.full_name,
    birthDate: row.birth_date,
    deathDate: row.death_date,
    birthYear: row.birth_year,
    deathYear: row.death_year,
    cemeteryId: row.cemetery_id,
    cemeteryName: row.cemetery?.name ?? '',
    city: row.cemetery?.city?.name ?? '',
    plot: row.plot,
    biography: row.biography,
    photos: realPhotos(row.photos),
    coordinates:
      row.lat != null && row.lng != null ? { latitude: row.lat, longitude: row.lng } : null,
    status: row.status,
    isSaved: savedIds.has(row.id),
    lastOrder: null,
  }
}

async function savedIdSet(): Promise<Set<string>> {
  const { data } = await getSupabase().from('saved_graves').select('grave_id')
  return new Set((data ?? []).map(r => r.grave_id as string))
}

interface OrderRow {
  id: string
  grave_id: string
  service_id: string
  status: OrderStatus
  date: string
  amount: number | null
  notes: string | null
  is_recurring: boolean
  recurring_period: Order['recurringPeriod']
  executor_name: string | null
  executor_rating: number | null
  rating: number | null
  created_at: string
  grave: { full_name: string; cemetery: { name: string } | null } | null
  service: { name: string; icon: string } | null
}

const ORDER_SELECT =
  'id, grave_id, service_id, status, date, amount, notes, is_recurring, recurring_period, executor_name, executor_rating, rating, created_at, grave:graves(full_name, cemetery:cemeteries(name)), service:services(name, icon)'

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    graveId: row.grave_id,
    graveName: row.grave?.full_name ?? '',
    cemeteryName: row.grave?.cemetery?.name ?? '',
    serviceId: row.service_id,
    serviceName: row.service?.name ?? '',
    serviceIcon: row.service?.icon ?? 'Broom',
    status: row.status,
    date: row.date,
    amount: row.amount,
    notes: row.notes,
    isRecurring: row.is_recurring,
    recurringPeriod: row.recurring_period,
    executor: row.executor_name
      ? {
          id: 'exec',
          name: row.executor_name,
          ordersCount: 0,
          rating: row.executor_rating ?? 5,
          avatarUrl: null,
        }
      : null,
    rating: row.rating,
    createdAt: row.created_at,
  }
}

function fail(error: { message: string } | null): never {
  throw new Error(error?.message ?? 'Ошибка сервера')
}

// ─── Авторизация ──────────────────────────────────────────────

export const authApi = {
  async sendCode(
    phone: string
  ): Promise<{ success: boolean; expiresIn: number; tgToken?: string; tgSent?: boolean }> {
    // Бот настроен: если телефон уже связан с чатом — код улетает сразу
    // (tgSent), иначе получаем токен для кнопки со Start-ссылкой (tgToken).
    // Через RPC, а не edge function: REST-путь стабильнее в мобильных сетях
    if (config.tgBot) {
      const { data, error } = await getSupabase().rpc('send_login_code', { p_phone: phone })
      if (error) fail(error)
      const d = data as { sent?: boolean; token?: string }
      return { success: true, expiresIn: 600, tgToken: d.token, tgSent: d.sent }
    }
    // бот не настроен — код принимается любой (режим разработки)
    return { success: true, expiresIn: 60 }
  },

  async verifyCode(phone: string, code: string): Promise<AuthTokens> {
    const sb = getSupabase()
    if (config.tgBot) {
      const { data: ok, error } = await sb.rpc('verify_tg_code', { p_phone: phone, p_code: code })
      if (error) fail(error)
      if (!ok) throw new Error('Неверный код')
    }
    // уже есть сессия (повторный вход) — используем её
    const existing = await sb.auth.getSession()
    let session = existing.data.session
    if (!session) {
      const { data, error } = await sb.auth.signInAnonymously()
      if (error || !data.session) fail(error)
      session = data.session
    }
    await sb.from('profiles').update({ phone }).eq('id', session.user.id)
    const { data: profile } = await sb
      .from('profiles')
      .select('name')
      .eq('id', session.user.id)
      .single()
    // зеркалим токены: гейт приложения проверяет tokenStorage
    await tokenStorage.setTokens(session.access_token, session.refresh_token)
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: { id: session.user.id, phone, name: profile?.name ?? 'Гость' },
    }
  },

  async logout(): Promise<{ success: boolean }> {
    // Сессию Supabase НЕ трогаем: аккаунт анонимный, и разрыв сессии
    // означал бы нового пользователя при следующем входе — со стёртыми
    // сохранёнными, именем и напоминаниями. «Выход» — только для гейта
    // приложения; повторный вход вернёт того же пользователя мгновенно.
    await tokenStorage.clear()
    return { success: true }
  },

  async deleteAccount(): Promise<{ success: boolean }> {
    // Удаляет сама база (supabase/account.sql): пользователя из auth.users
    // и каскадом всё личное. Исполнителя с историей заказов — отказ.
    await requireUserId()
    const { error } = await getSupabase().rpc('delete_my_account')
    if (error) {
      if (error.message.includes('executor account')) throw new Error('executor')
      fail(error)
    }
    // Сессия уже ничья: следующий запуск создаст нового анонимного пользователя
    await getSupabase().auth.signOut()
    await tokenStorage.clear()
    return { success: true }
  },

  async registerPushToken(
    token: string,
    platform: 'ios' | 'android'
  ): Promise<{ success: boolean }> {
    const uid = await requireUserId()
    const { error } = await getSupabase()
      .from('profiles')
      .update({ push_token: token, push_platform: platform })
      .eq('id', uid)
    if (error) fail(error)
    return { success: true }
  },
}

// ─── Захоронения ──────────────────────────────────────────────

export const gravesApi = {
  async search(params: {
    q?: string
    city?: string
    cemeteryId?: string
    page?: number
    limit?: number
  }): Promise<Grave[]> {
    const sb = getSupabase()
    const limit = params.limit ?? 30
    const words = queryWords(params.q ?? '')
    // База отбирает кандидатов по началу слов ФИО, порядок «фамилия первой»
    // ставит rankByName — поэтому берём с запасом, чтобы фамилии не отрезал limit.
    // «_» в ilike — любой символ: на памятниках «ё» и «е» вперемешку.
    let query = sb
      .from('graves')
      .select(GRAVE_SELECT)
      .limit(words.length ? limit * 3 : limit)
    for (const w of words) {
      const p = w.replace(/е/g, '_')
      query = query.or(`full_name.ilike."${p}%",full_name.ilike."% ${p}%"`)
    }
    if (params.cemeteryId) query = query.eq('cemetery_id', params.cemeteryId)
    const [{ data, error }, saved] = await Promise.all([query, savedIdSet()])
    if (error) fail(error)
    let rows = (data ?? []) as unknown as GraveRow[]
    // фильтр по городу — по имени города из связки (объём данных мал)
    if (params.city) rows = rows.filter(r => r.cemetery?.city?.name === params.city)
    if (words.length) rows = rankByName(rows, r => r.full_name, params.q ?? '')
    return rows.slice(0, limit).map(r => mapGrave(r, saved))
  },

  async getById(id: string): Promise<Grave> {
    const sb = getSupabase()
    // все три запроса — параллельно, а не цепочкой: экономим 1-2 RTT
    const [{ data, error }, saved, { data: last }] = await Promise.all([
      sb.from('graves').select(GRAVE_SELECT).eq('id', id).single(),
      savedIdSet(),
      sb
        .from('orders')
        .select('id, date, rating, service:services(name)')
        .eq('grave_id', id)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    if (error || !data) fail(error)
    const grave = mapGrave(data as unknown as GraveRow, saved)
    if (last) {
      const svc = last.service as unknown as { name: string } | null
      grave.lastOrder = {
        id: last.id,
        serviceName: svc?.name ?? '',
        date: last.date,
        rating: last.rating,
      }
    }
    return grave
  },

  async create(input: {
    fullName: string
    birthDate: string | null
    deathDate: string | null
    cemeteryId: string
    plot: string | null
    photos: string[]
    biography: string | null
  }): Promise<Grave> {
    const uid = await requireUserId()
    const { data, error } = await getSupabase()
      .from('graves')
      .insert({
        full_name: input.fullName,
        birth_date: input.birthDate,
        death_date: input.deathDate,
        cemetery_id: input.cemeteryId,
        plot: input.plot,
        biography: input.biography,
        photos: input.photos,
        status: 'moderation',
        created_by: uid,
      })
      .select(GRAVE_SELECT)
      .single()
    if (error || !data) fail(error)
    return mapGrave(data as unknown as GraveRow, new Set())
  },

  async getOrders(graveId: string, limit = 10): Promise<Order[]> {
    const { data, error } = await getSupabase()
      .from('orders')
      .select(ORDER_SELECT)
      .eq('grave_id', graveId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) fail(error)
    return ((data ?? []) as unknown as OrderRow[]).map(mapOrder)
  },

  async cities(): Promise<City[]> {
    const { data, error } = await getSupabase().from('cities').select('id, name').order('name')
    if (error) fail(error)
    return data ?? []
  },

  async cemeteries(cityId?: string): Promise<Cemetery[]> {
    const run = (cols: string) => {
      const q = getSupabase().from('cemeteries').select(cols).order('name')
      return cityId ? q.eq('city_id', cityId) : q
    }
    let { data, error } = await run('id, name, city_id, has_map, city:cities(name), graves(count)')
    // 42703 — колонки has_map ещё нет: база не обновлена импортом съёмки.
    // Список кладбищ важнее карты, поэтому просто отдаём его без флага.
    if (error?.code === '42703')
      ({ data, error } = await run('id, name, city_id, city:cities(name)'))
    if (error) fail(error)
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(r => ({
      id: r.id as string,
      name: r.name as string,
      cityId: r.city_id as string,
      cityName: (r.city as { name: string } | null)?.name ?? '',
      // колонка появляется вместе с импортом съёмки — на старой базе её ещё нет
      hasMap: r.has_map === true,
      peopleCount: (r.graves as { count: number }[] | undefined)?.[0]?.count,
    }))
  },

  async saved(): Promise<Grave[]> {
    const { data, error } = await getSupabase()
      .from('saved_graves')
      .select(`created_at, grave:graves(${GRAVE_SELECT})`)
      .order('created_at', { ascending: false })
    if (error) fail(error)
    const rows = (data ?? [])
      .map(r => r.grave as unknown as GraveRow | null)
      .filter((g): g is GraveRow => g != null)
    const savedIds = new Set(rows.map(r => r.id))
    return rows.map(r => mapGrave(r, savedIds))
  },

  async save(graveId: string): Promise<{ success: boolean }> {
    const uid = await requireUserId()
    const { error } = await getSupabase()
      .from('saved_graves')
      .upsert({ user_id: uid, grave_id: graveId })
    if (error) fail(error)
    return { success: true }
  },

  async unsave(graveId: string): Promise<{ success: boolean }> {
    const uid = await requireUserId()
    const { error } = await getSupabase()
      .from('saved_graves')
      .delete()
      .eq('user_id', uid)
      .eq('grave_id', graveId)
    if (error) fail(error)
    return { success: true }
  },
}

// ─── Услуги ───────────────────────────────────────────────────

export const servicesApi = {
  async list(category?: ServiceCategory): Promise<Service[]> {
    let query = getSupabase().from('services').select('*').order('sort')
    if (category) query = query.eq('category', category)
    const { data, error } = await query
    if (error) fail(error)
    return (data ?? []).map(r => ({
      id: r.id as string,
      name: r.name as string,
      description: r.description as string,
      icon: r.icon as string,
      category: r.category as ServiceCategory,
      priceFrom: r.price_from as number,
      fixedPrice: r.fixed_price as boolean,
      photos: [],
    }))
  },

  async getById(id: string): Promise<Service> {
    const { data, error } = await getSupabase().from('services').select('*').eq('id', id).single()
    if (error || !data) fail(error)
    return {
      id: data.id as string,
      name: data.name as string,
      description: data.description as string,
      icon: data.icon as string,
      category: data.category as ServiceCategory,
      priceFrom: data.price_from as number,
      fixedPrice: data.fixed_price as boolean,
      photos: [],
    }
  },
}

// ─── Карта кладбища ───────────────────────────────────────────

export const cemeteryMapApi = {
  async get(cemeteryId: string): Promise<CemeteryMap> {
    const sb = getSupabase()
    const [places, paths, fences, people] = await Promise.all([
      sb
        .from('burial_places')
        .select('id, number, lat, lng')
        .eq('cemetery_id', cemeteryId)
        .order('number'),
      sb.from('cemetery_paths').select('surface, polygon').eq('cemetery_id', cemeteryId),
      sb.from('cemetery_plots').select('polygon').eq('cemetery_id', cemeteryId),
      sb
        .from('graves')
        .select('id, full_name, birth_date, death_date, birth_year, death_year, burial_place_id')
        .eq('cemetery_id', cemeteryId)
        .not('burial_place_id', 'is', null),
    ])
    if (places.error) fail(places.error)
    // Слой оградок появился позже мест: пока его нет в базе, берём контуры
    // по-старому, с мест (там не хватает двух оградок без номеров внутри)
    let plots = (fences.data ?? []).map(r => r.polygon as [number, number][])
    if (!plots.length) {
      const legacy = await sb
        .from('burial_places')
        .select('plot_polygon')
        .eq('cemetery_id', cemeteryId)
        .not('plot_polygon', 'is', null)
      plots = (legacy.data ?? []).map(r => r.plot_polygon as [number, number][])
    }
    const byPlace = new Map<string, PlacePerson[]>()
    for (const g of people.data ?? []) {
      const list = byPlace.get(g.burial_place_id as string) ?? []
      list.push({
        graveId: g.id as string,
        fullName: g.full_name as string,
        birthDate: g.birth_date as string | null,
        deathDate: g.death_date as string | null,
        birthYear: g.birth_year as number | null,
        deathYear: g.death_year as number | null,
      })
      byPlace.set(g.burial_place_id as string, list)
    }
    return {
      places: (places.data ?? []).map(r => ({
        id: r.id as string,
        number: r.number as number,
        coordinates: { latitude: r.lat as number, longitude: r.lng as number },
        people: byPlace.get(r.id as string) ?? [],
      })),
      paths: (paths.data ?? []).map(r => ({
        surface: r.surface as string,
        polygon: r.polygon as [number, number][],
      })),
      plots,
    }
  },
}

// ─── Заказы ───────────────────────────────────────────────────

export const ordersApi = {
  async create(input: {
    graveId: string
    serviceId: string
    date: string
    notes: string | null
    isRecurring: boolean
    recurringPeriod: Order['recurringPeriod']
  }): Promise<Order> {
    const uid = await requireUserId()
    const sb = getSupabase()
    const { data: svc } = await sb
      .from('services')
      .select('price_from, fixed_price')
      .eq('id', input.serviceId)
      .single()
    const { data, error } = await sb
      .from('orders')
      .insert({
        user_id: uid,
        grave_id: input.graveId,
        service_id: input.serviceId,
        date: input.date,
        notes: input.notes,
        is_recurring: input.isRecurring,
        recurring_period: input.recurringPeriod,
        amount: svc?.fixed_price ? svc.price_from : null,
      })
      .select(ORDER_SELECT)
      .single()
    if (error || !data) fail(error)
    return mapOrder(data as unknown as OrderRow)
  },

  async list(
    status?: OrderStatus | 'active' | 'completed',
    _page = 1,
    limit = 50
  ): Promise<Order[]> {
    let query = getSupabase()
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (status === 'active')
      query = query.in('status', ['pending', 'assigned', 'on_the_way', 'working'])
    else if (status === 'completed')
      query = query.in('status', ['completed', 'cancelled', 'refund'])
    else if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) fail(error)
    return ((data ?? []) as unknown as OrderRow[]).map(mapOrder)
  },

  async getById(id: string): Promise<Order> {
    const { data, error } = await getSupabase()
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', id)
      .single()
    if (error || !data) fail(error)
    return mapOrder(data as unknown as OrderRow)
  },

  async cancel(id: string): Promise<{ success: boolean }> {
    const { error } = await getSupabase()
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) fail(error)
    return { success: true }
  },

  async review(id: string, rating: number, comment?: string): Promise<{ success: boolean }> {
    const { error } = await getSupabase()
      .from('orders')
      .update({ rating, review: comment ?? null })
      .eq('id', id)
    if (error) fail(error)
    return { success: true }
  },

  async report(id: string): Promise<PhotoReport> {
    const { data, error } = await getSupabase()
      .from('orders')
      .select('photos_before, photos_after')
      .eq('id', id)
      .single()
    if (error || !data) fail(error)
    const [photosBefore, photosAfter] = await Promise.all([
      signReportPhotos((data.photos_before ?? []) as string[]),
      signReportPhotos((data.photos_after ?? []) as string[]),
    ])
    return { photosBefore, photosAfter }
  },
}

// Фотоотчёты лежат в закрытом хранилище: в заказе — пути файлов,
// показываем по временным ссылкам. Старые демо-заказы хранят готовые URL.
const REPORTS_BUCKET = 'reports'
const SIGNED_URL_TTL_S = 60 * 60

async function signReportPhotos(items: string[]): Promise<string[]> {
  const paths = items.filter(p => !p.startsWith('http'))
  if (!paths.length) return items
  const { data, error } = await getSupabase()
    .storage.from(REPORTS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_S)
  if (error) fail(error)
  const signed = new Map((data ?? []).map(d => [d.path ?? '', d.signedUrl]))
  return items.map(p => signed.get(p) ?? p).filter(u => u.startsWith('http'))
}

// ─── Свеча памяти ─────────────────────────────────────────────

export const candlesApi = {
  async status(graveId: string): Promise<{ count: number; litToday: boolean }> {
    const { data, error } = await getSupabase().rpc('candle_status', { p_grave: graveId })
    if (error) fail(error)
    return data as { count: number; litToday: boolean }
  },

  async light(graveId: string): Promise<{ count: number; litToday: boolean }> {
    const { data, error } = await getSupabase().rpc('light_candle', { p_grave: graveId })
    if (error) fail(error)
    return data as { count: number; litToday: boolean }
  },
}

// ─── Книга воспоминаний ───────────────────────────────────────

export const memoriesApi = {
  async list(graveId: string): Promise<Memory[]> {
    const { data, error } = await getSupabase()
      .from('memories')
      .select('id, grave_id, author_name, text, photos, created_at')
      .eq('grave_id', graveId)
      .order('created_at', { ascending: false })
    if (error) fail(error)
    return (data ?? []).map(r => ({
      id: r.id as string,
      graveId: r.grave_id as string,
      authorName: r.author_name as string,
      text: r.text as string,
      createdAt: r.created_at as string,
      photos: (r.photos ?? []) as string[],
    }))
  },

  async add(input: {
    graveId: string
    authorName: string
    text: string
    photos?: string[]
  }): Promise<Memory> {
    const uid = await requireUserId()
    const { data, error } = await getSupabase()
      .from('memories')
      .insert({
        grave_id: input.graveId,
        user_id: uid,
        author_name: input.authorName,
        text: input.text,
        photos: input.photos ?? [],
      })
      .select('id, grave_id, author_name, text, photos, created_at')
      .single()
    if (error || !data) fail(error)
    return {
      id: data.id,
      graveId: data.grave_id,
      authorName: data.author_name,
      text: data.text,
      createdAt: data.created_at,
      photos: (data.photos ?? []) as string[],
    }
  },
}

// ─── Совместный доступ ────────────────────────────────────────

export const membersApi = {
  async list(graveId: string): Promise<Member[]> {
    const { data, error } = await getSupabase()
      .from('grave_members')
      .select('user_id, role, profile:profiles(name, avatar_url)')
      .eq('grave_id', graveId)
    if (error) fail(error)
    return (data ?? []).map(r => {
      const p = r.profile as unknown as { name: string; avatar_url: string | null } | null
      return {
        id: r.user_id as string,
        name: p?.name ?? 'Участник',
        role: r.role as Member['role'],
        avatarUrl: p?.avatar_url ?? null,
      }
    })
  },

  async inviteLink(graveId: string): Promise<{ url: string }> {
    return { url: `pamyat://grave/${graveId}` }
  },
}

// ─── Напоминания ──────────────────────────────────────────────

interface ReminderRow {
  id: string
  grave_id: string
  type: Reminder['type']
  date: string
  label: string
  is_enabled: boolean
  auto_order: string[]
  grave: { full_name: string; cemetery: { name: string } | null } | null
}

const REMINDER_SELECT =
  'id, grave_id, type, date, label, is_enabled, auto_order, grave:graves(full_name, cemetery:cemeteries(name))'

function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    graveId: row.grave_id,
    graveName: row.grave?.full_name ?? '',
    cemeteryName: row.grave?.cemetery?.name ?? '',
    type: row.type,
    date: row.date,
    label: row.label,
    isEnabled: row.is_enabled,
    autoOrder: row.auto_order ?? [],
  }
}

export const remindersApi = {
  async list(graveId?: string): Promise<Reminder[]> {
    let query = getSupabase().from('reminders').select(REMINDER_SELECT).order('date')
    if (graveId) query = query.eq('grave_id', graveId)
    const { data, error } = await query
    if (error) fail(error)
    return ((data ?? []) as unknown as ReminderRow[]).map(mapReminder)
  },

  async create(input: {
    graveId: string
    type: Reminder['type']
    date: string
    label: string
    autoOrder: string[]
  }): Promise<Reminder> {
    const uid = await requireUserId()
    const { data, error } = await getSupabase()
      .from('reminders')
      .insert({
        user_id: uid,
        grave_id: input.graveId,
        type: input.type,
        date: input.date,
        label: input.label,
        auto_order: input.autoOrder,
      })
      .select(REMINDER_SELECT)
      .single()
    if (error || !data) fail(error)
    return mapReminder(data as unknown as ReminderRow)
  },

  async update(
    id: string,
    patch: { isEnabled?: boolean; autoOrder?: string[] }
  ): Promise<Reminder> {
    const dbPatch: Record<string, unknown> = {}
    if (patch.isEnabled !== undefined) dbPatch.is_enabled = patch.isEnabled
    if (patch.autoOrder !== undefined) dbPatch.auto_order = patch.autoOrder
    const { data, error } = await getSupabase()
      .from('reminders')
      .update(dbPatch)
      .eq('id', id)
      .select(REMINDER_SELECT)
      .single()
    if (error || !data) fail(error)
    return mapReminder(data as unknown as ReminderRow)
  },

  async remove(id: string): Promise<{ success: boolean }> {
    const { error } = await getSupabase().from('reminders').delete().eq('id', id)
    if (error) fail(error)
    return { success: true }
  },
}

// ─── Профиль ──────────────────────────────────────────────────

function planName(plan: SubscriptionPlan): string {
  return plansMock.find(p => p.id === plan)?.name ?? plan
}

function gravesLimit(plan: SubscriptionPlan): number {
  return plan === 'premium' ? 99 : plan === 'standard' ? 3 : 1
}

export const profileApi = {
  async get(): Promise<UserProfile> {
    const uid = await requireUserId()
    const sb = getSupabase()
    const [{ data, error }, { count }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).single(),
      sb.from('saved_graves').select('grave_id', { count: 'exact', head: true }),
    ])
    if (error || !data) fail(error)
    return {
      id: data.id,
      name: data.name,
      phone: data.phone ?? '',
      avatarUrl: data.avatar_url,
      savedGravesCount: count ?? 0,
      subscription: {
        plan: data.plan as SubscriptionPlan,
        planName: planName(data.plan as SubscriptionPlan),
        validUntil: data.plan_valid_until,
        gravesLimit: gravesLimit(data.plan as SubscriptionPlan),
      },
    }
  },

  async update(patch: { name?: string; avatarUrl?: string }): Promise<UserProfile> {
    const uid = await requireUserId()
    const dbPatch: Record<string, unknown> = {}
    if (patch.name !== undefined) dbPatch.name = patch.name
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl
    const { error } = await getSupabase().from('profiles').update(dbPatch).eq('id', uid)
    if (error) fail(error)
    return await profileApi.get()
  },

  async subscription(): Promise<Subscription> {
    const profile = await profileApi.get()
    return profile.subscription
  },

  async plans(): Promise<PlanInfo[]> {
    // тарифы статичны — единый источник в plansMock
    return plansMock
  },

  async changePlan(plan: SubscriptionPlan): Promise<Subscription> {
    const uid = await requireUserId()
    const paid = (plansMock.find(p => p.id === plan)?.price ?? 0) > 0
    const until = new Date()
    until.setMonth(until.getMonth() + 1)
    const { error } = await getSupabase()
      .from('profiles')
      .update({ plan, plan_valid_until: paid ? until.toISOString().slice(0, 10) : null })
      .eq('id', uid)
    if (error) fail(error)
    return await profileApi.subscription()
  },

  async restoreSubscription(): Promise<{ success: boolean }> {
    return { success: true }
  },
}

// ─── Уведомления ──────────────────────────────────────────────

export const notificationsApi = {
  async list(): Promise<AppNotification[]> {
    const { data, error } = await getSupabase()
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) fail(error)
    return (data ?? []).map(r => ({
      id: r.id as string,
      type: r.type as AppNotification['type'],
      title: r.title as string,
      body: r.body as string,
      createdAt: r.created_at as string,
      isRead: r.is_read as boolean,
      orderId: (r.order_id as string | null) ?? undefined,
      graveId: (r.grave_id as string | null) ?? undefined,
    }))
  },

  async markAllRead(): Promise<{ success: boolean }> {
    const { error } = await getSupabase()
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    if (error) fail(error)
    return { success: true }
  },
}

// ─── Исполнитель ──────────────────────────────────────────────

interface ExecutorOrderRow {
  id: string
  service_id: string
  status: OrderStatus
  date: string
  amount: number | null
  notes: string | null
  grave: {
    full_name: string
    plot: string | null
    lat: number | null
    lng: number | null
    cemetery: { name: string; city: { name: string } | null } | null
  } | null
  service: { name: string; icon: string } | null
}

const EXECUTOR_ORDER_SELECT =
  'id, service_id, status, date, amount, notes, grave:graves(full_name, plot, lat, lng, cemetery:cemeteries(name, city:cities(name))), service:services(name, icon)'

// Чек-лист по услуге; для крупных работ — общий порядок
const EXECUTION_STEPS: Record<string, string[]> = {
  'svc-cleaning': ['Убрать мусор и листву', 'Протереть памятник', 'Покосить траву', 'Помыть ограду'],
  'svc-flowers': ['Убрать увядшие цветы', 'Возложить свежие цветы'],
  'svc-candles': ['Очистить лампадку', 'Установить и зажечь свечи'],
}
const DEFAULT_STEPS = ['Сверить место с заказом', 'Выполнить работу', 'Убрать за собой']

// Отказ от нового заказа ни на что в базе не влияет — заказ просто
// скрывается у этого исполнителя. Список хранится на телефоне: раньше он жил
// до перезапуска, и отклонённые заказы возвращались.
const SKIPPED_KEY = 'skippedOrders'
// SecureStore держит до 2 КБ на значение — старые отказы вытесняются
const SKIPPED_LIMIT = 40
let skippedOrders: string[] | null = null

async function loadSkipped(): Promise<Set<string>> {
  if (!skippedOrders) {
    try {
      const raw = await kvStorage.get(SKIPPED_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      skippedOrders = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      skippedOrders = []
    }
  }
  return new Set(skippedOrders)
}

async function skipOrder(id: string): Promise<void> {
  await loadSkipped()
  skippedOrders = [...(skippedOrders ?? []).filter(x => x !== id), id].slice(-SKIPPED_LIMIT)
  await kvStorage.set(SKIPPED_KEY, JSON.stringify(skippedOrders))
}

let rewardShare: number | null = null

async function executorRewardShare(): Promise<number> {
  if (rewardShare != null) return rewardShare
  const uid = await requireUserId()
  const { data, error } = await getSupabase()
    .from('executors')
    .select('reward_share')
    .eq('user_id', uid)
    .maybeSingle()
  if (error) fail(error)
  rewardShare = Number(data?.reward_share ?? 0)
  return rewardShare
}

function mapExecutorOrder(row: ExecutorOrderRow, share: number): ExecutorOrder {
  const cemetery = row.grave?.cemetery
  const amount = row.amount ?? 0
  return {
    id: row.id,
    serviceName: row.service?.name ?? '',
    serviceIcon: row.service?.icon ?? 'Broom',
    graveName: row.grave?.full_name ?? '',
    cemeteryName: cemetery?.name ?? '',
    plot: row.grave?.plot ?? null,
    address: [cemetery?.city?.name, cemetery?.name].filter(Boolean).join(', '),
    coordinates:
      row.grave?.lat != null && row.grave.lng != null
        ? { latitude: row.grave.lat, longitude: row.grave.lng }
        : null,
    distanceKm: null,
    amount,
    reward: Math.round(amount * share),
    executionSteps: EXECUTION_STEPS[row.service_id] ?? DEFAULT_STEPS,
    status: row.status,
    date: row.date,
    notes: row.notes,
  }
}

async function uploadReportPhotos(
  orderId: string,
  kind: 'before' | 'after',
  uris: string[]
): Promise<string[]> {
  const storage = getSupabase().storage.from(REPORTS_BUCKET)
  const paths: string[] = []
  // по одному: параллельные загрузки в мобильной сети душат друг друга
  for (const [i, uri] of uris.entries()) {
    const body = await (await fetch(uri)).arrayBuffer()
    const path = `${orderId}/${kind}/${Date.now()}-${i}.jpg`
    const { error } = await storage.upload(path, body, { contentType: 'image/jpeg' })
    if (error) fail(error)
    paths.push(path)
  }
  return paths
}

async function rpcVoid(fn: string, args: Record<string, unknown>): Promise<{ success: boolean }> {
  const { error } = await getSupabase().rpc(fn, args)
  if (error) fail(error)
  return { success: true }
}

export const executorApi = {
  /** Вход исполнителя: код из Telegram + телефон из списка исполнителей. */
  async claim(phone: string, code: string): Promise<AuthTokens> {
    const sb = getSupabase()
    const existing = await sb.auth.getSession()
    let session = existing.data.session
    if (!session) {
      const { data, error } = await sb.auth.signInAnonymously()
      if (error || !data.session) fail(error)
      session = data.session
    }
    const { data, error } = await sb.rpc('executor_claim', { p_phone: phone, p_code: code })
    if (error) fail(error)
    const res = data as { ok: boolean; reason?: string; name?: string }
    if (!res.ok) {
      throw new Error(res.reason === 'not_executor' ? 'not_executor' : 'Неверный код')
    }
    rewardShare = null
    await tokenStorage.setTokens(session.access_token, session.refresh_token)
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: { id: session.user.id, phone, name: res.name ?? '' },
    }
  },

  async orders(status?: OrderStatus): Promise<ExecutorOrder[]> {
    const share = await executorRewardShare()
    let query = getSupabase()
      .from('orders')
      .select(EXECUTOR_ORDER_SELECT)
      .order('date', { ascending: true })
      .limit(100)
    if (status) query = query.eq('status', status)
    const [{ data, error }, skipped] = await Promise.all([query, loadSkipped()])
    if (error) fail(error)
    return ((data ?? []) as unknown as ExecutorOrderRow[])
      .filter(r => !skipped.has(r.id))
      .map(r => mapExecutorOrder(r, share))
  },

  async getById(id: string): Promise<ExecutorOrder> {
    const share = await executorRewardShare()
    const { data, error } = await getSupabase()
      .from('orders')
      .select(EXECUTOR_ORDER_SELECT)
      .eq('id', id)
      .single()
    if (error || !data) fail(error)
    return mapExecutorOrder(data as unknown as ExecutorOrderRow, share)
  },

  async profile(): Promise<ExecutorProfile> {
    const { data, error } = await getSupabase().rpc('executor_profile')
    if (error) fail(error)
    if (!data) throw new Error('Вы не в списке исполнителей')
    const p = data as Omit<ExecutorProfile, 'services'>
    return {
      id: p.id,
      name: p.name,
      rating: Number(p.rating),
      isOnline: p.isOnline,
      totalOrders: p.totalOrders,
      monthEarnings: p.monthEarnings,
      cities: p.cities,
      services: ['Уборка могилы', 'Цветы и венки', 'Свечи и лампадки'],
    }
  },

  accept: (id: string) => rpcVoid('executor_accept', { p_order: id }),

  async reject(id: string, status: OrderStatus): Promise<{ success: boolean }> {
    if (status === 'pending') {
      await skipOrder(id)
      return { success: true }
    }
    return await rpcVoid('executor_release', { p_order: id })
  },

  arrive: (id: string) => rpcVoid('executor_arrive', { p_order: id }),

  async uploadPhotos(
    id: string,
    kind: 'before' | 'after',
    uris: string[]
  ): Promise<{ success: boolean }> {
    const paths = await uploadReportPhotos(id, kind, uris)
    return await rpcVoid('executor_set_photos', { p_order: id, p_kind: kind, p_paths: paths })
  },

  complete: (id: string) => rpcVoid('executor_complete', { p_order: id }),

  setOnline: (isOnline: boolean) => rpcVoid('executor_set_online', { p_online: isOnline }),
}
