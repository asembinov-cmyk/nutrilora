import type { SupabaseClient } from '@supabase/supabase-js'
import { INITIAL_ACCOUNTS, INITIAL_VIDEOS } from '../data'
import type { Account, Cost, Language, Source, Stage, Stats, Video } from '../types'

export interface NewAccountInput {
  name: string
  handle: string
  niche: string
  language: Language
  perDay: number
}

export interface NewTopicInput {
  accountId: string
  title: string
  language: Language
}

type LibraryResult = { accounts: Account[]; videos: Video[] } | { error: string }

interface AccountRow {
  id: string
  name: string
  handle: string
  niche: string
  language: string
  per_day: number
}

interface ContentRow {
  id: string
  account_id: string
  title: string
  language: string
  stage: string
  script: string
  gloss: string | null
  duration: string
  cost_voice: number | null
  cost_avatar: number | null
  cost_assembly: number | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  issue_title: string | null
  issue_detail: string | null
  issue_dismissed: boolean
  scheduled_on: string | null
  published: boolean
}

interface SourceRow {
  content_id: string
  position: number
  title: string
  note: string
}

interface ApprovalRow {
  content_id: string
  decision: string
  note: string | null
  created_at: string
}

const CONTENT_COLUMNS =
  'id,account_id,title,language,stage,script,gloss,duration,cost_voice,cost_avatar,cost_assembly,views,likes,comments,shares,issue_title,issue_detail,issue_dismissed,scheduled_on,published'

function isLanguage(value: string): value is Language {
  return value === 'ru' || value === 'kk'
}

function isStage(value: string): value is Stage {
  return value === 'topic' || value === 'script' || value === 'generation' || value === 'review' || value === 'ready'
}

function explain(error: { message: string; code?: string }, fallback: string): string {
  const text = `${error.code ?? ''} ${error.message}`.toLowerCase()
  if (text.includes('accounts_owner_handle_unique') || text.includes('duplicate')) {
    return 'Такой @handle уже есть.'
  }
  if (text.includes('content_calendar_check')) {
    return 'В календарь ставится только готовый ролик с датой.'
  }
  if (text.includes('row-level') || text.includes('permission denied') || text.includes('jwt')) {
    return 'Сессия не позволяет записать строку. Войдите снова.'
  }
  return fallback
}

export function normalizeHandle(value: string): string {
  const trimmed = value.trim().replace(/^@+/, '')
  return trimmed ? `@${trimmed}` : ''
}

function accountPayload(account: Account) {
  return {
    id: account.id,
    name: account.name,
    handle: account.handle,
    niche: account.niche,
    language: account.language,
    per_day: account.perDay,
  }
}

function contentPayload(video: Video) {
  return {
    id: video.id,
    account_id: video.accountId,
    title: video.title,
    language: video.language,
    stage: video.stage,
    script: video.script,
    gloss: video.gloss,
    duration: video.duration,
    cost_voice: video.cost?.voice ?? null,
    cost_avatar: video.cost?.avatar ?? null,
    cost_assembly: video.cost?.assembly ?? null,
    views: video.stats?.views ?? null,
    likes: video.stats?.likes ?? null,
    comments: video.stats?.comments ?? null,
    shares: video.stats?.shares ?? null,
    issue_title: video.issue?.title ?? null,
    issue_detail: video.issue?.detail ?? null,
    issue_dismissed: video.issue?.dismissed ?? false,
    scheduled_on: video.scheduledAt,
    published: video.published,
  }
}

function dateOnly(value: string | null): string | null {
  if (!value) return null
  return value.slice(0, 10)
}

function costOf(row: ContentRow): Cost | null {
  if (row.cost_voice === null || row.cost_avatar === null || row.cost_assembly === null) return null
  return { voice: row.cost_voice, avatar: row.cost_avatar, assembly: row.cost_assembly }
}

function statsOf(row: ContentRow): Stats | null {
  if (row.views === null || row.likes === null || row.comments === null || row.shares === null) return null
  return { views: row.views, likes: row.likes, comments: row.comments, shares: row.shares }
}

function mapAccount(row: AccountRow): Account | string {
  if (!isLanguage(row.language)) return 'В базе есть аккаунт с неожиданным языком.'
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    niche: row.niche,
    language: row.language,
    perDay: row.per_day,
  }
}

function mapVideo(row: ContentRow, sources: Source[], notes: string[]): Video | string {
  if (!isLanguage(row.language) || !isStage(row.stage)) {
    return 'В базе есть ролик с неожиданным этапом или языком.'
  }
  const issue =
    row.issue_title && row.issue_detail
      ? { title: row.issue_title, detail: row.issue_detail, dismissed: row.issue_dismissed }
      : null
  return {
    id: row.id,
    title: row.title,
    accountId: row.account_id,
    language: row.language,
    stage: row.stage,
    script: row.script,
    gloss: row.gloss,
    sources,
    cost: costOf(row),
    duration: row.duration,
    scheduledAt: dateOnly(row.scheduled_on),
    published: row.published,
    stats: statsOf(row),
    issue,
    notes,
  }
}

export async function loadLibrary(supabase: SupabaseClient): Promise<LibraryResult> {
  const [accountsRes, itemsRes, sourcesRes, approvalsRes] = await Promise.all([
    supabase.from('accounts').select('id,name,handle,niche,language,per_day').order('created_at'),
    supabase.from('content_items').select(CONTENT_COLUMNS).order('created_at'),
    supabase.from('content_sources').select('content_id,position,title,note').order('position'),
    supabase
      .from('approvals')
      .select('content_id,decision,note,created_at')
      .eq('decision', 'revision')
      .order('created_at'),
  ])

  if (accountsRes.error) return { error: explain(accountsRes.error, 'Не удалось прочитать аккаунты.') }
  if (itemsRes.error) return { error: explain(itemsRes.error, 'Не удалось прочитать ролики.') }
  if (sourcesRes.error) return { error: explain(sourcesRes.error, 'Не удалось прочитать источники.') }
  if (approvalsRes.error) return { error: explain(approvalsRes.error, 'Не удалось прочитать комментарии.') }

  const accounts: Account[] = []
  for (const row of (accountsRes.data ?? []) as AccountRow[]) {
    const account = mapAccount(row)
    if (typeof account === 'string') return { error: account }
    accounts.push(account)
  }

  const sourcesByContent = new Map<string, Source[]>()
  for (const row of (sourcesRes.data ?? []) as SourceRow[]) {
    const list = sourcesByContent.get(row.content_id) ?? []
    list.push({ title: row.title, note: row.note })
    sourcesByContent.set(row.content_id, list)
  }

  const notesByContent = new Map<string, string[]>()
  for (const row of (approvalsRes.data ?? []) as ApprovalRow[]) {
    const note = row.note?.trim() ?? ''
    if (note.length < 8) continue
    const list = notesByContent.get(row.content_id) ?? []
    list.push(note)
    notesByContent.set(row.content_id, list)
  }

  const videos: Video[] = []
  for (const row of (itemsRes.data ?? []) as ContentRow[]) {
    const video = mapVideo(row, sourcesByContent.get(row.id) ?? [], notesByContent.get(row.id) ?? [])
    if (typeof video === 'string') return { error: video }
    videos.push(video)
  }

  return { accounts, videos }
}

export async function saveAccount(supabase: SupabaseClient, account: Account): Promise<string | null> {
  const { error } = await supabase
    .from('accounts')
    .update({ niche: account.niche, language: account.language, per_day: account.perDay })
    .eq('id', account.id)
  return error ? explain(error, 'Не удалось сохранить аккаунт. Обновляю библиотеку.') : null
}

export async function saveScript(supabase: SupabaseClient, id: string, script: string): Promise<string | null> {
  const { error } = await supabase.from('content_items').update({ script }).eq('id', id)
  return error ? explain(error, 'Не удалось сохранить сценарий. Обновляю библиотеку.') : null
}

export async function saveVideo(supabase: SupabaseClient, video: Video): Promise<string | null> {
  const { id, ...payload } = contentPayload(video)
  const { error } = await supabase.from('content_items').update(payload).eq('id', id)
  return error ? explain(error, 'Не удалось сохранить ролик. Обновляю библиотеку.') : null
}

export async function approveContent(supabase: SupabaseClient, id: string, cost: Cost | null): Promise<string | null> {
  const { error } = await supabase.rpc('approve_content', { p_content_id: id })
  if (error) return explain(error, 'Не удалось согласовать ролик. Обновляю библиотеку.')
  if (!cost) return null
  const { error: costError } = await supabase
    .from('content_items')
    .update({ cost_voice: cost.voice, cost_avatar: cost.avatar, cost_assembly: cost.assembly })
    .eq('id', id)
  return costError ? explain(costError, 'Ролик согласован, но стоимость не записалась. Обновляю библиотеку.') : null
}

export async function requestRevision(supabase: SupabaseClient, id: string, note: string): Promise<string | null> {
  const { error } = await supabase.rpc('request_revision', { p_content_id: id, p_note: note.trim() })
  return error ? explain(error, 'Не удалось вернуть ролик на доработку. Обновляю библиотеку.') : null
}

export function validateAccount(input: NewAccountInput): string | null {
  if (!input.name.trim()) return 'Укажите название аккаунта.'
  if (!normalizeHandle(input.handle)) return 'Укажите @handle.'
  if (!isLanguage(input.language)) return 'Язык — русский или казахский.'
  if (!Number.isInteger(input.perDay) || input.perDay < 0 || input.perDay > 6) {
    return 'План роликов в день — от 0 до 6.'
  }
  return null
}

export async function insertAccount(
  supabase: SupabaseClient,
  input: NewAccountInput,
): Promise<{ account: Account } | { error: string }> {
  const invalid = validateAccount(input)
  if (invalid) return { error: invalid }
  const account: Account = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    handle: normalizeHandle(input.handle),
    niche: input.niche.trim(),
    language: input.language,
    perDay: input.perDay,
  }
  const { error } = await supabase.from('accounts').insert(accountPayload(account))
  if (error) return { error: explain(error, 'Не удалось создать аккаунт.') }
  return { account }
}

export async function insertTopic(
  supabase: SupabaseClient,
  input: NewTopicInput,
): Promise<{ video: Video } | { error: string }> {
  const title = input.title.trim()
  if (!title) return { error: 'Укажите название темы.' }
  if (!input.accountId) return { error: 'Выберите аккаунт.' }
  if (!isLanguage(input.language)) return { error: 'Язык — русский или казахский.' }

  const video: Video = {
    id: crypto.randomUUID(),
    title,
    accountId: input.accountId,
    language: input.language,
    stage: 'topic',
    script: '',
    gloss: null,
    sources: [
      {
        title: 'Памятка редакции Nutrilora',
        note: 'Короткая пометка редакции. Внешний архив не подключён.',
      },
    ],
    cost: null,
    duration: '0:30',
    scheduledAt: null,
    published: false,
    stats: null,
    issue: null,
    notes: [],
  }

  const { error } = await supabase.from('content_items').insert(contentPayload(video))
  if (error) return { error: explain(error, 'Не удалось создать тему.') }

  const { error: sourceError } = await supabase.from('content_sources').insert({
    content_id: video.id,
    position: 0,
    title: video.sources[0].title,
    note: video.sources[0].note,
  })
  if (sourceError) {
    await supabase.from('content_items').delete().eq('id', video.id)
    return { error: explain(sourceError, 'Тема не сохранилась: не записался источник.') }
  }
  return { video }
}

async function removeAccounts(supabase: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return
  await supabase.from('accounts').delete().in('id', ids)
}

export async function importDemoLibrary(supabase: SupabaseClient): Promise<LibraryResult> {
  const accountIds = new Map<string, string>()
  const accounts = INITIAL_ACCOUNTS.map((account) => {
    const id = crypto.randomUUID()
    accountIds.set(account.id, id)
    return { ...account, id }
  })
  const videos = INITIAL_VIDEOS.map((video) => ({
    ...structuredClone(video),
    id: crypto.randomUUID(),
    accountId: accountIds.get(video.accountId) ?? video.accountId,
  }))

  const { error: accountError } = await supabase.from('accounts').insert(accounts.map(accountPayload))
  if (accountError) return { error: explain(accountError, 'Не удалось записать учебные аккаунты.') }

  const ids = accounts.map((account) => account.id)
  const { error: itemError } = await supabase.from('content_items').insert(videos.map(contentPayload))
  if (itemError) {
    await removeAccounts(supabase, ids)
    return { error: explain(itemError, 'Не удалось записать учебные ролики. База осталась пустой.') }
  }

  const sources = videos.flatMap((video) =>
    video.sources.map((source, position) => ({
      content_id: video.id,
      position,
      title: source.title,
      note: source.note,
    })),
  )
  if (sources.length > 0) {
    const { error } = await supabase.from('content_sources').insert(sources)
    if (error) {
      await removeAccounts(supabase, ids)
      return { error: explain(error, 'Не удалось записать источники. Учебная загрузка отменена.') }
    }
  }

  const approvals = videos.flatMap((video) =>
    video.notes
      .map((note) => note.trim())
      .filter((note) => note.length >= 8)
      .map((note) => ({ content_id: video.id, decision: 'revision', note })),
  )
  if (approvals.length > 0) {
    const { error } = await supabase.from('approvals').insert(approvals)
    if (error) {
      await removeAccounts(supabase, ids)
      return { error: explain(error, 'Не удалось записать комментарии. Учебная загрузка отменена.') }
    }
  }

  return { accounts, videos }
}
