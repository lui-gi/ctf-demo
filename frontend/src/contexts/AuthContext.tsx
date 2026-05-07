import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react'
import { api } from '../lib/api'
import type { User, CrewRank } from '../lib/types'

interface AuthContextValue {
  user: User | null
  crewRank: CrewRank | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })
  const [crewRank, setCrewRank] = useState<CrewRank | null>(null)

  const login = useCallback((token: string, incoming: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(incoming))
    setUser(incoming)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCrewRank(null)
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchRank = () =>
      api.get<CrewRank>('/api/me/crew-rank').then(setCrewRank).catch(() => {})
    fetchRank()
    const id = setInterval(fetchRank, 30_000)
    return () => clearInterval(id)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, crewRank, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
