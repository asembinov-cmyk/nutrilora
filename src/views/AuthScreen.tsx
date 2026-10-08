import { useState, type FormEvent } from 'react'
import { Icon } from '../components'
import { getSupabase } from '../lib/supabase'

function authError(message: string): string {
  const text = message.toLowerCase()
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'Неверный email или пароль.'
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'Такой email уже зарегистрирован. Войдите.'
  }
  if (text.includes('password')) return 'Пароль должен быть не короче 6 символов.'
  if (text.includes('signup') && text.includes('disabled')) {
    return 'Регистрация в проекте выключена. Войдите существующим email или включите её в Supabase → Authentication.'
  }
  if (text.includes('email')) return 'Проверьте email.'
  return 'Не удалось войти. Проверьте email и пароль.'
}

export function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const supabase = getSupabase()
    if (!supabase) return
    setError('')
    setInfo('')
    setPending(true)
    try {
      if (mode === 'sign-up') {
        const { data, error: signError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (signError) {
          setError(authError(signError.message))
          return
        }
        if (!data.session) {
          setInfo('Письмо с подтверждением отправлено. После перехода по ссылке войдите этим email.')
          setMode('sign-in')
        }
        return
      }
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signError) setError(authError(signError.message))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={onSubmit}>
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="leaf" />
          </span>
          <span>
            <span className="brand__name">Nutrilora</span>
            <span className="brand__sub">Вход владельца</span>
          </span>
        </div>
        <p className="page-lead">
          Аккаунты, ролики и календарь видны только вошедшему владельцу. Секретный ключ сюда не вводится.
        </p>
        <div className="seg" role="group" aria-label="Способ входа">
          <button
            type="button"
            className={mode === 'sign-in' ? 'seg__btn is-active' : 'seg__btn'}
            aria-pressed={mode === 'sign-in'}
            onClick={() => {
              setMode('sign-in')
              setError('')
              setInfo('')
            }}
          >
            Войти
          </button>
          <button
            type="button"
            className={mode === 'sign-up' ? 'seg__btn is-active' : 'seg__btn'}
            aria-pressed={mode === 'sign-up'}
            onClick={() => {
              setMode('sign-up')
              setError('')
              setInfo('')
            }}
          >
            Создать владельца
          </button>
        </div>
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="control"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Пароль</span>
          <input
            className="control"
            type="password"
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="notice-inline" role="alert">
            {error}
          </p>
        )}
        {info && <p className="hint">{info}</p>}
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Подождите…' : mode === 'sign-up' ? 'Создать и войти' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
