import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../lib/types'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
      login(res.token, res.user)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="h-poster text-center mb-1" style={{ fontSize: '1.6rem', fontWeight: 700 }}>
        Board the Ship
      </p>
      <p
        className="font-poster text-center mb-6"
        style={{ fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#6b3a18' }}
      >
        Login
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1 ink-soft font-poster tracking-widest uppercase" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="field-paper w-full"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 ink-soft font-poster tracking-widest uppercase" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="field-paper w-full"
          />
        </div>
        {error && <p className="text-xs" style={{ color: '#8a2a1f' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-stamp w-full"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <p className="text-center text-xs mt-4 ink-soft">
        No account?{' '}
        <Link to="/register" className="hover:underline" style={{ color: '#8a2a1f', fontWeight: 700 }}>Register</Link>
      </p>
    </>
  )
}
