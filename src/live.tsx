import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import {
  approveContent,
  importDemoLibrary,
  insertAccount,
  insertTopic,
  loadLibrary,
  requestRevision,
  saveAccount,
  saveScript,
  saveVideo,
  type NewAccountInput,
  type NewTopicInput,
} from './lib/library'
import { getSupabase } from './lib/supabase'
import { blankLive, buildValue, reducer, StoreContext, useNoticeTimer, type Action } from './store'
import { AuthScreen } from './views/AuthScreen'

const PERSISTED = new Set<Action['type']>([
  'update-script',
  'update-account',
  'advance',
  'approve',
  'revise',
  'schedule',
  'unschedule',
  'publish',
  'dismiss-issue',
])

export function LiveStore({ children }: { children: ReactNode }) {
  const supabase = getSupabase()
  const [email, setEmail] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    void supabase.auth.getSession().then(
      ({ data }) => {
        if (!alive) return
        setEmail(data.session ? (data.session.user.email ?? 'владелец') : null)
      },
      () => {
        if (!alive) return
        setEmail(null)
      },
    )
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session ? (session.user.email ?? 'владелец') : null)
    })
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  if (!supabase || email === undefined) {
    return (
      <div className="auth">
        <p className="auth__wait">Проверяем сессию…</p>
      </div>
    )
  }
  if (email === null) return <AuthScreen />
  return <LiveLibrary email={email}>{children}</LiveLibrary>
}

function LiveLibrary({ email, children }: { email: string; children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, email, blankLive)
  const stateRef = useRef(state)
  stateRef.current = state
  const timers = useRef(new Map<string, number>())
  const loadGen = useRef(0)
  const [busy, setBusy] = useState(false)

  const apply = useCallback((action: Action) => {
    const prev = stateRef.current
    const next = reducer(prev, action)
    stateRef.current = next
    if (next !== prev) rawDispatch(action)
    return { prev, next }
  }, [])

  const reload = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const gen = ++loadGen.current
    const result = await loadLibrary(supabase)
    if (gen !== loadGen.current) return
    if ('error' in result) {
      apply({ type: 'load-failed' })
      return
    }
    apply({ type: 'hydrate', accounts: result.accounts, videos: result.videos })
  }, [apply])

  const fail = useCallback(
    async (text: string) => {
      apply({ type: 'notice', text })
      await reload()
    },
    [apply, reload],
  )

  const dispatch = useCallback(
    (action: Action) => {
      const { prev, next } = apply(action)
      if (next === prev || next.mode !== 'live' || !PERSISTED.has(action.type)) return
      const supabase = getSupabase()
      if (!supabase) return

      const videoOf = (id: string) => next.videos.find((video) => video.id === id)

      if (action.type === 'update-script') {
        const key = `script:${action.id}`
        window.clearTimeout(timers.current.get(key))
        const timer = window.setTimeout(() => {
          timers.current.delete(key)
          const video = stateRef.current.videos.find((item) => item.id === action.id)
          if (!video) return
          void saveScript(supabase, video.id, video.script).then((error) => {
            if (error) void fail(error)
          })
        }, 500)
        timers.current.set(key, timer)
        return
      }

      if (action.type === 'update-account') {
        const key = `account:${action.id}`
        const structural = action.patch.language !== undefined || action.patch.perDay !== undefined
        const write = () => {
          const account = stateRef.current.accounts.find((item) => item.id === action.id)
          if (!account) return
          void saveAccount(supabase, account).then((error) => {
            if (error) void fail(error)
          })
        }
        if (!structural) {
          window.clearTimeout(timers.current.get(key))
          const timer = window.setTimeout(() => {
            timers.current.delete(key)
            write()
          }, 500)
          timers.current.set(key, timer)
          return
        }
        window.clearTimeout(timers.current.get(key))
        timers.current.delete(key)
        write()
        return
      }

      if (!('id' in action)) return
      const scriptKey = `script:${action.id}`
      window.clearTimeout(timers.current.get(scriptKey))
      timers.current.delete(scriptKey)
      const video = videoOf(action.id)
      if (!video) return

      if (action.type === 'approve') {
        void approveContent(supabase, video.id, video.cost).then((error) => {
          if (error) void fail(error)
        })
        return
      }
      if (action.type === 'revise') {
        void requestRevision(supabase, video.id, action.note).then((error) => {
          if (error) void fail(error)
        })
        return
      }
      void saveVideo(supabase, video).then((error) => {
        if (error) void fail(error)
      })
    },
    [apply, fail],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useNoticeTimer(state.notice, dispatch)

  const createAccount = useCallback(
    async (input: NewAccountInput) => {
      const supabase = getSupabase()
      if (!supabase) return 'Нет подключения к Supabase.'
      setBusy(true)
      loadGen.current += 1
      try {
        const result = await insertAccount(supabase, input)
        if ('error' in result) return result.error
        apply({ type: 'add-account', account: result.account })
        apply({ type: 'notice', text: 'Аккаунт записан в базу.' })
        return null
      } finally {
        setBusy(false)
      }
    },
    [apply],
  )

  const createTopic = useCallback(
    async (input: NewTopicInput) => {
      const supabase = getSupabase()
      if (!supabase) return 'Нет подключения к Supabase.'
      setBusy(true)
      loadGen.current += 1
      try {
        const result = await insertTopic(supabase, input)
        if ('error' in result) return result.error
        apply({ type: 'add-video', video: result.video })
        apply({ type: 'notice', text: 'Тема записана в базу.' })
        apply({ type: 'open-video', id: result.video.id })
        return null
      } finally {
        setBusy(false)
      }
    },
    [apply],
  )

  const importDemo = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return 'Нет подключения к Supabase.'
    if (stateRef.current.accounts.length > 0 || stateRef.current.videos.length > 0) {
      return 'Учебная библиотека загружается только в пустую базу.'
    }
    setBusy(true)
    loadGen.current += 1
    try {
      const result = await importDemoLibrary(supabase)
      if ('error' in result) return result.error
      apply({ type: 'hydrate', accounts: result.accounts, videos: result.videos })
      apply({
        type: 'notice',
        text: 'Учебная библиотека записана. Просмотры, расходы и ошибки в ней демонстрационные.',
      })
      return null
    } finally {
      setBusy(false)
    }
  }, [apply])

  const signOut = useCallback(() => {
    void getSupabase()?.auth.signOut()
  }, [])

  const value = useMemo(
    () =>
      buildValue(state, dispatch, {
        reload: () => void reload(),
        signOut,
        createAccount,
        createTopic,
        importDemo,
        busy,
      }),
    [state, dispatch, reload, signOut, createAccount, createTopic, importDemo, busy],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
