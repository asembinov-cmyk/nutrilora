import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ComponentType,
  type Dispatch,
  type ReactNode,
} from 'react'
import { INITIAL_ACCOUNTS, INITIAL_VIDEOS } from './data'
import type { NewAccountInput, NewTopicInput } from './lib/library'
import type { Account, Language, ProductionFilter, Role, Section, Stage, Video } from './types'
import { completeCost, DEMO_TODAY, fullCost } from './utils'

interface Notice {
  id: number
  text: string
}

export interface State {
  mode: 'demo' | 'live'
  email: string | null
  status: 'ready' | 'loading' | 'error'
  role: Role
  section: Section
  accounts: Account[]
  videos: Video[]
  selectedVideoId: string | null
  year: number
  month: number
  selectedDay: string
  productionFilter: ProductionFilter
  noticeSeq: number
  notice: Notice | null
}

export type Action =
  | { type: 'section'; section: Section }
  | { type: 'production-home' }
  | { type: 'role'; role: Role }
  | { type: 'open-video'; id: string }
  | { type: 'set-filter'; patch: Partial<ProductionFilter> }
  | { type: 'focus-stage'; stage: Stage }
  | { type: 'focus-account'; accountId: string }
  | { type: 'update-script'; id: string; script: string; language?: Language }
  | { type: 'update-account'; id: string; patch: Partial<Pick<Account, 'niche' | 'language' | 'perDay'>> }
  | { type: 'advance'; id: string }
  | { type: 'approve'; id: string }
  | { type: 'revise'; id: string; note: string }
  | { type: 'schedule'; id: string; date: string }
  | { type: 'unschedule'; id: string }
  | { type: 'publish'; id: string }
  | { type: 'dismiss-issue'; id: string }
  | { type: 'show-day'; day: string }
  | { type: 'select-day'; day: string }
  | { type: 'shift-month'; delta: number }
  | { type: 'notice'; text: string }
  | { type: 'dismiss-notice' }
  | { type: 'reset' }
  | { type: 'hydrate'; accounts: Account[]; videos: Video[] }
  | { type: 'add-account'; account: Account }
  | { type: 'add-video'; video: Video }
  | { type: 'load-failed' }

function fresh(): State {
  const demo = structuredClone({ accounts: INITIAL_ACCOUNTS, videos: INITIAL_VIDEOS })
  return {
    mode: 'demo',
    email: null,
    status: 'ready',
    role: 'owner',
    section: 'overview',
    accounts: demo.accounts,
    videos: demo.videos,
    selectedVideoId: 'v-drink',
    year: 2026,
    month: 9,
    selectedDay: DEMO_TODAY,
    productionFilter: { stage: 'all', accountId: 'all', language: 'all', query: '' },
    noticeSeq: 0,
    notice: null,
  }
}

export function blankLive(email: string): State {
  return {
    ...fresh(),
    mode: 'live',
    email,
    status: 'loading',
    accounts: [],
    videos: [],
    selectedVideoId: null,
    notice: null,
    noticeSeq: 0,
  }
}

function notify(state: State, text: string): State {
  const noticeSeq = state.noticeSeq + 1
  return { ...state, noticeSeq, notice: { id: noticeSeq, text } }
}

function say(state: State, live: string, demo: string): string {
  return state.mode === 'live' ? live : demo
}

function patchVideo(videos: Video[], id: string, update: (video: Video) => Video): Video[] {
  return videos.map((video) => (video.id === id ? update(video) : video))
}

function findVideo(state: State, id: string): Video | undefined {
  return state.videos.find((video) => video.id === id)
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'section':
      return { ...state, section: action.section }
    case 'production-home':
      return {
        ...state,
        section: 'production',
        productionFilter: { stage: 'all', accountId: 'all', language: 'all', query: '' },
      }
    case 'role':
      return { ...state, role: action.role }
    case 'open-video':
      return { ...state, selectedVideoId: action.id, section: 'editor' }
    case 'set-filter':
      return { ...state, productionFilter: { ...state.productionFilter, ...action.patch } }
    case 'focus-stage':
      return {
        ...state,
        section: 'production',
        productionFilter: { stage: action.stage, accountId: 'all', language: 'all', query: '' },
      }
    case 'focus-account':
      return {
        ...state,
        section: 'production',
        productionFilter: { stage: 'all', accountId: action.accountId, language: 'all', query: '' },
      }
    case 'update-script':
      return {
        ...state,
        videos: patchVideo(state.videos, action.id, (video) => ({
          ...video,
          script: action.script,
          language: action.language ?? video.language,
        })),
      }
    case 'update-account':
      return {
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === action.id ? { ...account, ...action.patch } : account,
        ),
      }
    case 'advance': {
      const video = findVideo(state, action.id)
      if (!video) return state
      if (video.issue && !video.issue.dismissed) {
        return notify(state, 'Сначала снимите отметку ошибки. Внешний сервис отсюда не вызывается.')
      }
      if (video.stage === 'topic') {
        return notify(
          {
            ...state,
            videos: patchVideo(state.videos, video.id, (item) => ({ ...item, stage: 'script' })),
          },
          say(state, 'Тема передана в сценарии.', 'Тема передана в сценарии. Это демо-переход, API не вызывался.'),
        )
      }
      if (video.stage === 'script') {
        return notify(
          {
            ...state,
            videos: patchVideo(state.videos, video.id, (item) => ({
              ...item,
              stage: 'generation',
              cost: item.cost ?? { voice: fullCost(item.language).voice, avatar: 0, assembly: 0 },
            })),
          },
          say(
            state,
            'Сценарий отмечен как отправленный на генерацию. HeyGen и Creatomate не вызывались.',
            'Сценарий отправлен на генерацию в демо-линии. HeyGen и Creatomate не вызывались.',
          ),
        )
      }
      if (video.stage === 'generation') {
        return notify(
          {
            ...state,
            videos: patchVideo(state.videos, video.id, (item) => ({
              ...item,
              stage: 'review',
              cost: completeCost(item.cost, item.language),
            })),
          },
          'Ролик отмечен готовым к проверке. Файл видео по-прежнему отсутствует.',
        )
      }
      return notify(state, 'Дальше этот ролик двигают кнопки «Согласовать» и «На доработку».')
    }
    case 'approve': {
      const video = findVideo(state, action.id)
      if (!video) return state
      if (video.stage !== 'review') {
        return notify(state, 'Согласование доступно на этапе «Проверка».')
      }
      if (video.issue && !video.issue.dismissed) {
        return notify(state, 'Сначала разберите ошибку.')
      }
      return notify(
        {
          ...state,
          videos: patchVideo(state.videos, video.id, (item) => ({
            ...item,
            stage: 'ready',
            cost: completeCost(item.cost, item.language),
          })),
        },
        say(
          state,
          'Ролик согласован и стоит в колонке «Готово». Во внешние кабинеты он не уходил.',
          'Ролик согласован и стоит в колонке «Готово». Во внешние кабинеты он не уходил.',
        ),
      )
    }
    case 'revise': {
      const video = findVideo(state, action.id)
      const note = action.note.trim()
      if (!video || note.length < 8) return state
      if (video.published) {
        return notify(state, 'Опубликованный ролик оставлен только для чтения.')
      }
      if (video.stage === 'topic') {
        return notify(state, 'Для темы сначала передайте её в сценарии.')
      }
      return notify(
        {
          ...state,
          videos: patchVideo(state.videos, video.id, (item) => ({
            ...item,
            stage: 'script',
            scheduledAt: null,
            notes: [...item.notes, note],
          })),
        },
        say(
          state,
          'Ролик возвращён в «Сценарии». Слот календаря снят.',
          'Ролик возвращён в «Сценарии» с комментарием. Внешняя пересборка не запускалась.',
        ),
      )
    }
    case 'schedule': {
      const video = findVideo(state, action.id)
      if (!video) return state
      if (video.stage !== 'ready' || video.published) {
        return notify(state, 'В календарь ставится готовый ролик, который ещё не отмечен опубликованным.')
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(action.date)) return state
      return notify(
        {
          ...state,
          videos: patchVideo(state.videos, video.id, (item) => ({ ...item, scheduledAt: action.date })),
        },
        say(state, 'Слот записан в календарь. В TikTok публикация не ставилась.', 'Слот записан в демо-календарь. В TikTok публикация не ставилась.'),
      )
    }
    case 'unschedule': {
      const video = findVideo(state, action.id)
      if (!video || video.published) return state
      return notify(
        {
          ...state,
          videos: patchVideo(state.videos, video.id, (item) => ({ ...item, scheduledAt: null })),
        },
        say(state, 'Слот снят с календаря.', 'Слот снят с демо-календаря.'),
      )
    }
    case 'publish': {
      const video = findVideo(state, action.id)
      if (!video) return state
      if (video.stage !== 'ready' || !video.scheduledAt) {
        return notify(state, 'Сначала поставьте готовый ролик в календарь.')
      }
      if (video.issue && !video.issue.dismissed) {
        return notify(state, 'На ролике висит ошибка. Снимите отметку, если слот уже разобран.')
      }
      if (video.published) return state
      return notify(
        {
          ...state,
          videos: patchVideo(state.videos, video.id, (item) => ({ ...item, published: true })),
        },
        'В календаре ролик отмечен опубликованным. В TikTok он не уходил, просмотры не подставлены.',
      )
    }
    case 'dismiss-issue':
      return notify(
        {
          ...state,
          videos: patchVideo(state.videos, action.id, (video) =>
            video.issue ? { ...video, issue: { ...video.issue, dismissed: true } } : video,
          ),
        },
        say(
          state,
          'Отметка ошибки снята. Во внешние сервисы ничего не отправлялось.',
          'Учебная отметка снята в этом сеансе. Во внешние сервисы ничего не отправлялось.',
        ),
      )
    case 'show-day': {
      const [year, month] = action.day.split('-').map(Number)
      return {
        ...state,
        section: 'calendar',
        year,
        month: month - 1,
        selectedDay: action.day,
      }
    }
    case 'select-day':
      return { ...state, selectedDay: action.day }
    case 'shift-month': {
      const next = new Date(state.year, state.month + action.delta, 1)
      const year = next.getFullYear()
      const month = next.getMonth()
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
      const selectedDay = state.selectedDay.startsWith(monthKey) ? state.selectedDay : `${monthKey}-01`
      return { ...state, year, month, selectedDay }
    }
    case 'notice':
      return notify(state, action.text)
    case 'dismiss-notice':
      return { ...state, notice: null }
    case 'reset':
      if (state.mode === 'live') {
        return notify(state, 'Рабочая база не сбрасывается. Нажмите «Обновить из базы».')
      }
      return notify(fresh(), 'Демо-библиотека возвращена к исходному срезу.')
    case 'hydrate': {
      const selectedVideoId = action.videos.some((video) => video.id === state.selectedVideoId)
        ? state.selectedVideoId
        : (action.videos[0]?.id ?? null)
      return {
        ...state,
        accounts: action.accounts,
        videos: action.videos,
        selectedVideoId,
        status: 'ready',
      }
    }
    case 'add-account':
      return { ...state, accounts: [...state.accounts, action.account], status: 'ready' }
    case 'add-video':
      return {
        ...state,
        videos: [...state.videos, action.video],
        selectedVideoId: action.video.id,
        status: 'ready',
      }
    case 'load-failed':
      return notify({ ...state, status: 'error' }, 'Не удалось прочитать библиотеку.')
    default: {
      const unreachable: never = action
      return unreachable
    }
  }
}

interface StoreValue {
  state: State
  dispatch: Dispatch<Action>
  accountOf: (id: string) => Account
  selected: Video | null
  reload: () => void
  signOut: () => void
  createAccount: (input: NewAccountInput) => Promise<string | null>
  createTopic: (input: NewTopicInput) => Promise<string | null>
  importDemo: () => Promise<string | null>
  busy: boolean
}

export const StoreContext = createContext<StoreValue | null>(null)

export function useNoticeTimer(notice: Notice | null, dispatch: Dispatch<Action>) {
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => dispatch({ type: 'dismiss-notice' }), 4600)
    return () => window.clearTimeout(timer)
  }, [notice, dispatch])
}

export function buildValue(
  state: State,
  dispatch: Dispatch<Action>,
  extras: Pick<StoreValue, 'reload' | 'signOut' | 'createAccount' | 'createTopic' | 'importDemo' | 'busy'>,
): StoreValue {
  const accountOf = (id: string) => {
    const account = state.accounts.find((item) => item.id === id)
    if (!account) throw new Error(`Нет аккаунта ${id}`)
    return account
  }
  const selected =
    state.videos.find((video) => video.id === state.selectedVideoId) ?? state.videos[0] ?? null
  return { state, dispatch, accountOf, selected, ...extras }
}

const idleLibrary = {
  busy: false,
  reload: () => undefined,
  signOut: () => undefined,
  createAccount: async () => 'Новый аккаунт доступен после входа в Supabase.',
  createTopic: async () => 'Новая тема доступна после входа в Supabase.',
  importDemo: async () => 'Учебная библиотека загружается после входа в Supabase.',
}

function DemoStore({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, fresh)
  useNoticeTimer(state.notice, dispatch)
  const value = useMemo(
    () =>
      buildValue(state, dispatch, {
        ...idleLibrary,
        reload: () => dispatch({ type: 'reset' }),
      }),
    [state],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

function LiveGate({ children }: { children: ReactNode }) {
  const [Live, setLive] = useState<ComponentType<{ children: ReactNode }> | null>(null)

  useEffect(() => {
    void import('./live').then((mod) => setLive(() => mod.LiveStore))
  }, [])

  if (!Live) {
    return (
      <div className="auth">
        <p className="auth__wait">Проверяем сессию…</p>
      </div>
    )
  }
  return <Live>{children}</Live>
}

export function StoreProvider({ children }: { children: ReactNode }) {
  if (!supabaseConfigured) return <DemoStore>{children}</DemoStore>
  return <LiveGate>{children}</LiveGate>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('StoreProvider отсутствует')
  return value
}

export function useFilteredVideos(): Video[] {
  const { state } = useStore()
  const { stage, accountId, language, query } = state.productionFilter
  const needle = query.trim().toLowerCase()
  return state.videos.filter((video) => {
    if (stage !== 'all' && video.stage !== stage) return false
    if (accountId !== 'all' && video.accountId !== accountId) return false
    if (language !== 'all' && video.language !== language) return false
    if (!needle) return true
    const account = state.accounts.find((item) => item.id === video.accountId)
    const haystack = `${video.title} ${account?.handle ?? ''} ${account?.niche ?? ''}`
    return haystack.toLowerCase().includes(needle)
  })
}
