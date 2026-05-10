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
      <p
        className="font-mono font-bold text-xs tracking-[0.4em] uppercase text-center mb-6"
        style={{
          color: '#d8ffe9',
          textShadow: '0 0 12px rgba(0,255,136,0.55), 0 0 28px rgba(57,255,20,0.35)',
        }}
      >
        Login
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-teal"
          />
        </div>
        {error && <p className="text-danger text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-amber text-navy-950 font-bold rounded hover:bg-amber/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <p className="text-center text-steel text-xs mt-4">
        No account?{' '}
        <Link to="/register" className="text-amber hover:underline">Register</Link>
      </p>
    </>
  )
}
