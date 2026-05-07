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
      <h2 className="text-xl font-bold text-white mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-steel text-xs mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
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
