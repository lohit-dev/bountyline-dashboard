import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { messageOf } from '../lib/errors'
import type { Me } from '../lib/types'

export function PayoutView({
  masked,
  saving,
  error,
  saved,
  onSave,
}: {
  masked: string | null
  saving: boolean
  error: string | null
  saved: boolean
  onSave: (email: string) => void
}) {
  const [email, setEmail] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave(email)
  }
  return (
    <main className="page">
      <a className="crumbs" href="#/">
        ← All bounties
      </a>
      <div>
        <h1>Payout address</h1>
        <p className="muted">Where Bountyline sends your payments, through PayPal.</p>
      </div>
      <section className="card" style={{ maxWidth: 560 }}>
        <div className="card__body">
          {masked ? (
            <p>
              Current address: <span className="mono">{masked}</span>
            </p>
          ) : (
            <p className="muted">You have not saved a payout address yet.</p>
          )}
          <form className="form" onSubmit={submit}>
            <label htmlFor="paypal-email">PayPal email</label>
            <input
              id="paypal-email"
              className="input"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : masked ? 'Replace address' : 'Save address'}
              </button>
            </div>
            {error ? (
              <div className="alert" role="alert">
                {error}
              </div>
            ) : null}
            {saved ? (
              <div className="ok" role="status">
                Saved. If a payout was waiting for this, it is sent shortly.
              </div>
            ) : null}
          </form>
          <p className="note">
            Your email is encrypted on our server. It is never shown on GitHub or to maintainers. Payouts are final once PayPal has been asked to send them.
          </p>
        </div>
      </section>
    </main>
  )
}

export function PayoutPage({ me, onChanged }: { me: Me; onChanged: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const onSave = async (email: string) => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api.setPayoutEmail(email)
      setSaved(true)
      onChanged()
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setSaving(false)
    }
  }

  return <PayoutView masked={me.payout.masked} saving={saving} error={error} saved={saved} onSave={(e) => void onSave(e)} />
}
