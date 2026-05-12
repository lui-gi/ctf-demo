import { useState, type FormEvent, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { SectionEyebrow } from '../components/ui/SectionRole'
import { RoleDoctor } from '../components/ui/PirateMotifs'
import { PlusIcon } from '../components/ui/AbilityPrims'

/* ─── Pulsemend field-host ────────────────────────────────────
   Wraps an input/textarea so we can drop a faint plus icon at its
   right edge that fades in on :focus-within, and overlay a green
   ripple keyframe pulse when the parent form reports a success. */
function FieldHost({
  children,
  rippleKey,
}: {
  children: ReactNode
  /* When this value changes to a non-null value, a ripple is
     mounted and culled 700ms later. */
  rippleKey?: number | null
}) {
  return (
    <div className="fx-doctor-host" style={{ position: 'relative' }}>
      {children}
      <span className="fx-doctor-plus" aria-hidden>
        <PlusIcon size={14} />
      </span>
      {rippleKey != null && (
        <span key={rippleKey} className="fx-doctor-ripple" aria-hidden />
      )}
    </div>
  )
}

function SettingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="parchment-card p-6 relative">
      <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
      <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 ink-soft font-poster">{title}</h2>
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

  /* Pulsemend — bump these on successful save to remount the ripple. */
  const [usernameRipple, setUsernameRipple] = useState<number | null>(null)
  const [emailRipple, setEmailRipple]       = useState<number | null>(null)
  const [passwordRipple, setPasswordRipple] = useState<number | null>(null)

  async function handleUsername(e: FormEvent) {
    e.preventDefault()
    setUsernameMsg(null)
    try {
      await api.patch('/api/me/username', { username })
      updateUser({ username })
      setUsernameMsg({ ok: true, text: 'Username updated.' })
      setUsernameRipple(Date.now())
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
      setEmailRipple(Date.now())
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
      setPasswordRipple(Date.now())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update password.'
      setPasswordMsg({ ok: false, text: msg })
    }
  }

  return (
    <div className="max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-6">
      <div className="mb-2">
        <SectionEyebrow
          role="doctor"
          label="Tend to your kit"
          icon={<RoleDoctor size={16} strokeWidth={1.8} />}
        />
        <h1 className="h-poster mb-1" style={{ fontSize: '2.1rem', fontWeight: 800 }}>
          Profile Settings
        </h1>
        <p className="ink-soft text-sm font-poster" style={{ letterSpacing: '0.06em' }}>
          Update your account information below.
        </p>
      </div>

      <SettingCard title="Username">
        <form onSubmit={handleUsername} className="flex flex-col gap-3">
          <FieldHost rippleKey={usernameRipple}>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="New username"
              className="field-paper fx-doctor w-full"
            />
          </FieldHost>
          {usernameMsg && (
            <p className="text-xs font-poster" style={{ color: usernameMsg.ok ? '#3d6b3a' : '#8a2a1f' }}>
              {usernameMsg.text}
            </p>
          )}
          <button type="submit" className="btn-stamp">Save</button>
        </form>
      </SettingCard>

      <SettingCard title="Email">
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <FieldHost rippleKey={emailRipple}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="New email"
              className="field-paper fx-doctor w-full"
            />
          </FieldHost>
          {emailMsg && (
            <p className="text-xs font-poster" style={{ color: emailMsg.ok ? '#3d6b3a' : '#8a2a1f' }}>
              {emailMsg.text}
            </p>
          )}
          <button type="submit" className="btn-stamp">Save</button>
        </form>
      </SettingCard>

      <SettingCard title="Password">
        <form onSubmit={handlePassword} className="flex flex-col gap-3">
          <FieldHost rippleKey={passwordRipple}>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="field-paper fx-doctor w-full"
            />
          </FieldHost>
          <FieldHost>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
              className="field-paper fx-doctor w-full"
            />
          </FieldHost>
          <FieldHost>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="field-paper fx-doctor w-full"
            />
          </FieldHost>
          {passwordMsg && (
            <p className="text-xs font-poster" style={{ color: passwordMsg.ok ? '#3d6b3a' : '#8a2a1f' }}>
              {passwordMsg.text}
            </p>
          )}
          <button type="submit" className="btn-stamp">Save</button>
        </form>
      </SettingCard>
    </div>
  )
}
