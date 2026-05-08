import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function SettingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#060f1e]/80 backdrop-blur-sm border border-steel/10 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <h2 className="text-steel/70 text-xs font-semibold uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [username, setUsername] = useState(user?.username ?? '')
  const [usernameMsg, setUsernameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [email, setEmail] = useState(user?.email ?? '')
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleUsername(e: FormEvent) {
    e.preventDefault()
    setUsernameMsg(null)
    try {
      await api.patch('/api/me/username', { username })
      updateUser({ username })
      setUsernameMsg({ ok: true, text: 'Username updated.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update username.'
      setUsernameMsg({ ok: false, text: msg })
    }
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault()
    setEmailMsg(null)
    try {
      await api.patch('/api/me/email', { email })
      updateUser({ email })
      setEmailMsg({ ok: true, text: 'Email updated.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update email.'
      setEmailMsg({ ok: false, text: msg })
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'New passwords do not match.' })
      return
    }
    try {
      await api.patch('/api/me/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMsg({ ok: true, text: 'Password updated.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update password.'
      setPasswordMsg({ ok: false, text: msg })
    }
  }

  const inputClass =
    'w-full bg-[#040d1a] border border-steel/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal/50 transition-colors'
  const saveBtn =
    'py-2 px-5 bg-teal text-navy-950 font-bold rounded-lg hover:bg-teal/90 transition-colors shadow-[0_0_20px_rgba(62,207,190,0.25)] text-sm'

  return (
    <div className="max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent mb-1">
          Profile Settings
        </h1>
        <p className="text-steel text-sm">Update your account information below.</p>
      </div>

      <SettingCard title="Username">
        <form onSubmit={handleUsername} className="flex flex-col gap-3">
          <input
            type="text"
            required
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="New username"
            className={inputClass}
          />
          {usernameMsg && (
            <p className={`text-xs ${usernameMsg.ok ? 'text-teal' : 'text-danger'}`}>{usernameMsg.text}</p>
          )}
          <button type="submit" className={saveBtn}>Save</button>
        </form>
      </SettingCard>

      <SettingCard title="Email">
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="New email"
            className={inputClass}
          />
          {emailMsg && (
            <p className={`text-xs ${emailMsg.ok ? 'text-teal' : 'text-danger'}`}>{emailMsg.text}</p>
          )}
          <button type="submit" className={saveBtn}>Save</button>
        </form>
      </SettingCard>

      <SettingCard title="Password">
        <form onSubmit={handlePassword} className="flex flex-col gap-3">
          <input
            type="password"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className={inputClass}
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            className={inputClass}
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className={inputClass}
          />
          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.ok ? 'text-teal' : 'text-danger'}`}>{passwordMsg.text}</p>
          )}
          <button type="submit" className={saveBtn}>Save</button>
        </form>
      </SettingCard>
    </div>
  )
}
