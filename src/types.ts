export type Section =
  | 'overview'
  | 'accounts'
  | 'production'
  | 'editor'
  | 'calendar'
  | 'analytics'
  | 'settings'

export type Role = 'owner' | 'editor' | 'operator'

export type Stage = 'topic' | 'script' | 'generation' | 'review' | 'ready'

export type Language = 'ru' | 'kk'

export interface Account {
  id: string
  name: string
  handle: string
  niche: string
  language: Language
  perDay: number
}

export interface Source {
  title: string
  note: string
}

export interface Cost {
  voice: number
  avatar: number
  assembly: number
}

export interface Stats {
  views: number
  likes: number
  comments: number
  shares: number
}

export interface Issue {
  title: string
  detail: string
  dismissed: boolean
}

export interface Video {
  id: string
  title: string
  accountId: string
  language: Language
  stage: Stage
  script: string
  gloss: string | null
  sources: Source[]
  cost: Cost | null
  duration: string
  scheduledAt: string | null
  published: boolean
  stats: Stats | null
  issue: Issue | null
  notes: string[]
}

export interface ProductionFilter {
  stage: Stage | 'all'
  accountId: string | 'all'
  language: Language | 'all'
  query: string
}

export interface IntegrationInfo {
  id: string
  name: string
  purpose: string
  fields: string[]
  status: 'disconnected'
}
