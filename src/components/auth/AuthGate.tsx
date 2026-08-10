import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthGate() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

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
      toast.error(err instanceof Error ? err.message : 'Sign-in failed')
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
        Sign in with a magic link to access your private data rooms in the cloud.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-dashed p-6">
          <p className="font-medium text-foreground">Link sent</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open the email we sent to <span className="text-foreground">{email.trim()}</span>{' '}
            and click the link to continue. You can close this tab after that.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <form className="mt-8 flex flex-col gap-4" onSubmit={(e) => void sendLink(e)}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
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
