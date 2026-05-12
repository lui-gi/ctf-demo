import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../lib/types'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/register', {
        username, email, password,
      })
      login(res.token, res.user)
      navigate('/dashboard')
    } catch {
      setError('Registration failed. Username or email may already be taken.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="h-poster text-center mb-1" style={{ fontSize: '1.6rem', fontWeight: 700 }}>
        Sign the Articles
      </p>
      <p
        className="font-poster text-center mb-6"
        style={{ fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#6b3a18' }}
      >
        Create Account
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1 ink-soft font-poster tracking-widest uppercase" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            required
            autoComplete="off"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="field-paper w-full"
          />
        </div>
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
            minLength={8}
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
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="text-center text-xs mt-4 ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="hover:underline" style={{ color: '#8a2a1f', fontWeight: 700 }}>Login</Link>
      </p>
    </>
  )
}
