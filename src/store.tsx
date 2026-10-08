import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { INITIAL_ACCOUNTS, INITIAL_VIDEOS } from './data'
import type { Account, ProductionFilter, Role, Section, Stage, Video } from './types'
import { completeCost, DEMO_TODAY, fullCost } from './utils'

interface Notice {
  id: number
  text: string
}

export interface State {
  role: Role
  section: Section
  accounts: Account[]
  videos: Video[]
  selectedVideoId: string
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
  | { type: 'update-script'; id: string; script: string }
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

function fresh(): State {
  const demo = structuredClone({ accounts: INITIAL_ACCOUNTS, videos: INITIAL_VIDEOS })
  return {
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

function notify(state: State, text: string): State {
  const noticeSeq = state.noticeSeq + 1
  return { ...state, noticeSeq, notice: { id: noticeSeq, text } }
}

function patchVideo(videos: Video[], id: string, update: (video: Video) => Video): Video[] {
  return videos.map((video) => (video.id === id ? update(video) : video))
}

function findVideo(state: State, id: string): Video | undefined {
  return state.videos.find((video) => video.id === id)
}

function reducer(state: State, action: Action): State {
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
        videos: patchVideo(state.videos, action.id, (video) => ({ ...video, script: action.script })),
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
        return notify(state, 'Сначала снимите учебную ошибку. Внешний сервис отсюда не вызывается.')
      }
      if (video.stage === 'topic') {
        return notify(
          {
            ...state,
            videos: patchVideo(state.videos, video.id, (item) => ({ ...item, stage: 'script' })),
          },
          'Тема передана в сценарии. Это демо-переход, API не вызывался.',
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
          'Сценарий отправлен на генерацию в демо-линии. HeyGen и Creatomate не вызывались.',
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
        return notify(state, 'Сначала разберите учебную ошибку.')
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
        'Ролик согласован и стоит в колонке «Готово». Во внешние кабинеты он не уходил.',
      )
    }
    case 'revise': {
      const video = findVideo(state, action.id)
      const note = action.note.trim()
      if (!video || note.length < 8) return state
      if (video.published) {
        return notify(state, 'Опубликованный демо-ролик оставлен только для чтения.')
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
            notes: [...item.notes, note],
          })),
        },
        'Ролик возвращён в «Сценарии» с комментарием. Внешняя пересборка не запускалась.',
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
        'Слот записан в демо-календарь. В TikTok публикация не ставилась.',
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
        'Слот снят с демо-календаря.',
      )
    }
    case 'publish': {
      const video = findVideo(state, action.id)
      if (!video) return state
      if (video.stage !== 'ready' || !video.scheduledAt) {
        return notify(state, 'Сначала поставьте готовый ролик в календарь.')
      }
      if (video.issue && !video.issue.dismissed) {
        return notify(state, 'На ролике висит учебная ошибка. Снимите отметку, если слот уже разобран.')
      }
      if (video.published) return state
      return notify(
        {
          ...state,
          videos: patchVideo(state.videos, video.id, (item) => ({ ...item, published: true })),
        },
        'В демо-календаре ролик отмечен опубликованным. В TikTok он не уходил, просмотры не подставлены.',
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
        'Учебная отметка снята в этом сеансе. Во внешние сервисы ничего не отправлялось.',
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
      return notify(fresh(), 'Демо-библиотека возвращена к исходному срезу.')
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
  selected: Video
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, fresh)

  useEffect(() => {
    if (!state.notice) return
    const timer = window.setTimeout(() => dispatch({ type: 'dismiss-notice' }), 4600)
    return () => window.clearTimeout(timer)
  }, [state.notice])

  const value = useMemo<StoreValue>(() => {
    const accountOf = (id: string) => {
      const account = state.accounts.find((item) => item.id === id)
      if (!account) throw new Error(`Нет аккаунта ${id}`)
      return account
    }
    const selected = state.videos.find((video) => video.id === state.selectedVideoId) ?? state.videos[0]
    return { state, dispatch, accountOf, selected }
  }, [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('StoreProvider отсутствует')
  return value
}

export function useFilteredVideos(): Video[] {
  const { state, accountOf } = useStore()
  const { stage, accountId, language, query } = state.productionFilter
  const needle = query.trim().toLowerCase()
  return state.videos.filter((video) => {
    if (stage !== 'all' && video.stage !== stage) return false
    if (accountId !== 'all' && video.accountId !== accountId) return false
    if (language !== 'all' && video.language !== language) return false
    if (!needle) return true
    const account = accountOf(video.accountId)
    return `${video.title} ${account.handle} ${account.niche}`.toLowerCase().includes(needle)
  })
}
