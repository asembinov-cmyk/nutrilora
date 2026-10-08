import type { Language, Section, Stage } from './types'

export const DEMO_TODAY = '2026-10-08'

export const STAGE_ORDER: Stage[] = ['topic', 'script', 'generation', 'review', 'ready']

export const STAGE_LABEL: Record<Stage, string> = {
  topic: 'Темы',
  script: 'Сценарии',
  generation: 'Генерация',
  review: 'Проверка',
  ready: 'Готово',
}

export const SECTION_LABEL: Record<Section, string> = {
  overview: 'Обзор',
  accounts: 'Аккаунты',
  production: 'Производство',
  editor: 'Редактор',
  calendar: 'Календарь',
  analytics: 'Аналитика',
  settings: 'Настройки',
}

export const LANG_LABEL: Record<Language, string> = {
  ru: 'Русский',
  kk: 'Казахский',
}

export const ROLE_LABEL = {
  owner: 'Владелец',
  editor: 'Редактор',
  operator: 'Оператор',
} as const

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function plural(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few
  return many
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatMoney(value: number): string {
  return `${formatNumber(value)} ₸`
}

export function parseIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

export function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatDay(iso: string): string {
  const { year, month, day } = parseIso(iso)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, day),
  )
}

export function formatDayLong(iso: string): string {
  const { year, month, day } = parseIso(iso)
  const text = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatMonth(year: number, monthIndex: number): string {
  const text = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthIndex, 1),
  )
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function monthGrid(year: number, monthIndex: number): Array<string | null> {
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const cells: Array<string | null> = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= days; day += 1) cells.push(toIso(year, monthIndex, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function excerpt(script: string, limit = 92): string {
  const line = script
    .split('\n')
    .map((part) => part.trim())
    .find(Boolean)
  if (!line) return ''
  return line.length > limit ? `${line.slice(0, limit - 1)}…` : line
}

export function videoCost(cost: { voice: number; avatar: number; assembly: number } | null): number {
  if (!cost) return 0
  return cost.voice + cost.avatar + cost.assembly
}

export function reactionCount(stats: { likes: number; comments: number; shares: number } | null): number {
  if (!stats) return 0
  return stats.likes + stats.comments + stats.shares
}

export function activeIssue(video: { issue: { dismissed: boolean } | null }): boolean {
  return Boolean(video.issue && !video.issue.dismissed)
}

export function fullCost(language: Language): { voice: number; avatar: number; assembly: number } {
  return {
    voice: language === 'kk' ? 420 : 340,
    avatar: language === 'kk' ? 2300 : 2100,
    assembly: 470,
  }
}

export function completeCost(
  cost: { voice: number; avatar: number; assembly: number } | null,
  language: Language,
): { voice: number; avatar: number; assembly: number } {
  const full = fullCost(language)
  return {
    voice: cost?.voice || full.voice,
    avatar: cost?.avatar || full.avatar,
    assembly: cost?.assembly || full.assembly,
  }
}
