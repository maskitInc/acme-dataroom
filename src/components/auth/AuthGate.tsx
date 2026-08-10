import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Public take-home reviewer account (password auth — no email send). */
export const REVIEWER_DEMO = {
  email: 'reviewer@acme-dataroom.app',
  password: 'AcmeReview2026!',
} as const

export function AuthGate() {
  const [email, setEmail] = useState(REVIEWER_DEMO.email)
  const [password, setPassword] = useState(REVIEWER_DEMO.password)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  async function signInPassword(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !password) {
      toast.error('Enter email and password')
      return
    }
    setBusy(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })
      if (error) throw error
      toast.success('Signed in')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  async function sendLink(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      toast.error('Enter your email')
      return
    }
    setBusy(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      setSent(true)
      toast.success('Check your email for the magic link')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      toast.error(
        /rate limit/i.test(msg)
          ? 'Email rate limit (built-in ≈2/hr). Use Password + demo account instead.'
          : msg,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-8 text-left">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Acme Data Room
      </h1>
      <p className="mt-2 text-muted-foreground">
        Sign in to access private data rooms. Reviewers: use the demo password
        below (no email required).
      </p>

      <div className="mt-4 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
        <p className="font-medium text-foreground">Reviewer demo</p>
        <p className="mt-0.5 text-muted-foreground">
          {REVIEWER_DEMO.email} / {REVIEWER_DEMO.password}
        </p>
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'password' ? 'default' : 'outline'}
          onClick={() => {
            setMode('password')
            setSent(false)
          }}
        >
          Password
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'magic' ? 'default' : 'outline'}
          onClick={() => setMode('magic')}
        >
          Magic link
        </Button>
      </div>

      {mode === 'magic' && sent ? (
        <div className="mt-8 rounded-xl border border-dashed p-6">
          <p className="font-medium text-foreground">Link sent</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open the email we sent to{' '}
            <span className="text-foreground">{email.trim()}</span> and click the
            link. Built-in mailer is limited (~2/hr); prefer Password for demos.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
        </div>
      ) : mode === 'password' ? (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => void signInPassword(e)}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      ) : (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => void sendLink(e)}
        >
          <div className="grid gap-2">
            <Label htmlFor="email-magic">Email</Label>
            <Input
              id="email-magic"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send magic link'}
          </Button>
        </form>
      )}
    </div>
  )
}
