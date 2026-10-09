import type { ReactNode } from 'react'
import { supabaseEnv } from './lib/env'
import type { Language, Stage } from './types'
import { LANG_LABEL, STAGE_LABEL } from './utils'

export type IconName = 'grid' | 'users' | 'flow' | 'pen' | 'calendar' | 'chart' | 'sliders' | 'leaf'

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconShape(name)}
    </svg>
  )
}

function iconShape(name: IconName): ReactNode {
  switch (name) {
    case 'grid':
      return (
        <>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
        </>
      )
    case 'users':
      return (
        <>
          <path d="M8.2 12.2a3.1 3.1 0 1 0-3.1-3.1 3.1 3.1 0 0 0 3.1 3.1z" />
          <path d="M3.2 19.2c.5-2.4 2.4-3.6 5-3.6s4.5 1.2 5 3.6" />
          <path d="M16 12.1a2.6 2.6 0 1 0-2.2-4" />
          <path d="M16.2 15.6c1.8.2 3.2 1.2 3.7 3.6" />
        </>
      )
    case 'flow':
      return (
        <>
          <rect x="3.5" y="5" width="5" height="5" rx="1.2" />
          <rect x="15.5" y="5" width="5" height="5" rx="1.2" />
          <rect x="9.5" y="14" width="5" height="5" rx="1.2" />
          <path d="M8.5 7.5h7M12 10v4" />
        </>
      )
    case 'pen':
      return (
        <>
          <path d="M4 20h4l10.2-10.2a2.1 2.1 0 0 0-3-3L5 17z" />
          <path d="M13.2 6.8l3 3" />
        </>
      )
    case 'calendar':
      return (
        <>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.8v3.2M16 3.8v3.2M4 9.5h16" />
        </>
      )
    case 'chart':
      return (
        <>
          <path d="M4 19.5h16" />
          <path d="M7 16.5v-4" />
          <path d="M12 16.5V7" />
          <path d="M17 16.5v-6" />
        </>
      )
    case 'sliders':
      return (
        <>
          <path d="M4 8h16M4 16h16" />
          <circle cx="9" cy="8" r="2.1" />
          <circle cx="15" cy="16" r="2.1" />
        </>
      )
    case 'leaf':
      return <path d="M6 16.5c3.2-.6 5-4.6 6.8-9.5C14.6 11.9 16.4 15.9 19.5 16.5 16.6 18 15 19.6 12.8 21.2 10.6 19.6 9 18 6 16.5z" />
    default: {
      const unreachable: never = name
      return unreachable
    }
  }
}

export function DemoMark() {
  if (supabaseEnv()) return null
  return <span className="chip chip--demo">демо</span>
}

export function LangChip({ language }: { language: Language }) {
  return <span className={language === 'kk' ? 'chip chip--kk' : 'chip chip--ru'}>{LANG_LABEL[language]}</span>
}

export function StageChip({ stage }: { stage: Stage }) {
  return <span className="chip chip--neutral">{STAGE_LABEL[stage]}</span>
}
