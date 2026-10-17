import { useCallback, useEffect, useState } from 'react'
import { ScoreBar } from '../components/ScoreBar'
import { StatusPill } from '../components/StatusPill'
import { api, ApiError } from '../lib/api'
import { messageOf } from '../lib/errors'
import { ago, countdown, CRITERIA, fmtUsd, timeline } from '../lib/format'
import type { BountyDetail } from '../lib/types'
import { useNow } from '../lib/useNow'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function ReviewCard({ d, now }: { d: BountyDetail; now: Date }) {
  const r = d.review
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">AI review</h2>
        {r ? <span className="muted small">{ago(r.createdAt, now)}</span> : null}
      </div>
      <div className="card__body">
        {!r ? (
          <span className="muted">No review yet. It starts when a pull request is linked.</span>
        ) : (
          <>
            <div className="score-big">
              <span className="score-big__n">{r.score}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ScoreBar score={r.score} threshold={d.settings.scoreThreshold} large />
                <span className="muted small">
                  Pass mark {d.settings.scoreThreshold}. CI: {r.ci}. {r.passed ? 'Passed.' : 'Needs a maintainer.'}
                </span>
              </div>
            </div>
            <div className="criteria">
              {CRITERIA.map((c) => {
                const v = r.rubric[c.key] ?? 0
                return (
                  <div className="criterion" key={c.key}>
                    <span>{c.label}</span>
                    <span className="criterion__n">
                      {v} / {c.max}
                    </span>
                    <div className="criterion__bar">
                      <span style={{ width: `${(v / c.max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p>{r.summary}</p>
            {r.redFlags.length ? (
              <ul className="flags">
                {r.redFlags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : null}
            <p className="note">The AI only advises. Payment needs a merged pull request and the review window to end, and maintainers can veto.</p>
          </>
        )}
      </div>
    </section>
  )
}

function PayoutCard({
  d,
  now,
  busy,
  onDecide,
}: {
  d: BountyDetail
  now: Date
  busy: boolean
  onDecide: (a: 'approve' | 'veto') => void
}) {
  const [confirming, setConfirming] = useState(false)
  const contributor = d.submissions.find((s) => s.current)?.authorLogin
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">Payout</h2>
      </div>
      <div className="card__body">
        {d.status === 'window' && d.windowEndsAt ? (
          <div>
            <div className="countdown">{countdown(new Date(d.windowEndsAt), now)}</div>
            <span className="muted small">Scheduled for {fmtDate(d.windowEndsAt)}</span>
          </div>
        ) : (
          <StatusPill bounty={d} now={now} showDue />
        )}
        <dl className="kv">
          <dt>Amount</dt>
          <dd>{fmtUsd(d.amountCents)}</dd>
          <dt>Funder</dt>
          <dd>@{d.funderLogin}</dd>
          {contributor ? (
            <>
              <dt>Contributor</dt>
              <dd>@{contributor}</dd>
              <dt>Payout address</dt>
              <dd>{d.payoutAddressSet ? 'Saved' : 'Not set yet'}</dd>
            </>
          ) : null}
          {d.payout ? (
            <>
              <dt>Payout</dt>
              <dd>{d.payout.state}</dd>
            </>
          ) : null}
          {d.refund ? (
            <>
              <dt>Refund</dt>
              <dd>
                {d.refund.state} ({d.refund.reason})
              </dd>
            </>
          ) : null}
        </dl>
        {d.role === 'contributor' && !d.payoutAddressSet && contributor ? (
          <a className="btn" href="#/payout">
            Set your payout address
          </a>
        ) : null}
        {d.canDecide ? (
          <div className="actions">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => onDecide('approve')}>
              Approve and pay now
            </button>
            {confirming ? (
              <>
                <button
                  type="button"
                  className="btn btn--danger-solid"
                  disabled={busy}
                  onClick={() => {
                    setConfirming(false)
                    onDecide('veto')
                  }}
                >
                  Confirm: veto and refund
                </button>
                <button type="button" className="btn" onClick={() => setConfirming(false)}>
                  Keep the bounty
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--danger" disabled={busy} onClick={() => setConfirming(true)}>
                Veto and refund
              </button>
            )}
            <span className="muted small">Payouts are final once PayPal has been asked to send them.</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function BountyDetailView({
  d,
  now,
  busy,
  error,
  notice,
  onDecide,
}: {
  d: BountyDetail
  now: Date
  busy: boolean
  error: string | null
  notice: string | null
  onDecide: (a: 'approve' | 'veto') => void
}) {
  const events = timeline(d.events)
  const current = d.submissions.find((s) => s.current)
  return (
    <main className="page">
      <a className="crumbs" href="#/">
        ← All bounties
      </a>
      <div className="detail-head">
        <div style={{ minWidth: 0 }}>
          <h1>
            {d.repo} #{d.issueNumber}
          </h1>
          <div className="detail-head__meta">
            <StatusPill bounty={d} now={now} />
            <a href={d.issueUrl} target="_blank" rel="noreferrer">
              Issue on GitHub
            </a>
            {current ? (
              <a href={current.prUrl} target="_blank" rel="noreferrer">
                PR #{current.prNumber} by @{current.authorLogin}
              </a>
            ) : null}
          </div>
        </div>
        <div className="big-amount">{fmtUsd(d.amountCents)}</div>
      </div>

      {error ? (
        <div className="alert" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="ok" role="status">
          {notice}
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="stack">
          <ReviewCard d={d} now={now} />
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">Timeline</h2>
            </div>
            <div className="card__body">
              {events.length === 0 ? (
                <span className="muted">No events yet.</span>
              ) : (
                <ol className="timeline">
                  {events.map((e, i) => (
                    <li key={`${e.createdAt}-${i}`}>
                      <span aria-hidden="true" />
                      <div>
                        <div>{e.text}</div>
                        <div className="timeline__when">{fmtDate(e.createdAt)}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <PayoutCard d={d} now={now} busy={busy} onDecide={onDecide} />
          {d.submissions.length > 1 ? (
            <section className="card">
              <div className="card__head">
                <h2 className="card__title">Pull requests</h2>
              </div>
              <div className="card__body">
                <ul className="activity">
                  {d.submissions.map((s) => (
                    <li key={s.prNumber}>
                      <a href={s.prUrl} target="_blank" rel="noreferrer">
                        #{s.prNumber} by @{s.authorLogin}
                      </a>
                      <span className="muted small">{s.current ? 'current, ' : ''}{s.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">Repository settings</h2>
            </div>
            <div className="card__body">
              <dl className="kv">
                <dt>Review window</dt>
                <dd>{d.settings.reviewWindowHours} hours</dd>
                <dt>Pass score</dt>
                <dd>{d.settings.scoreThreshold} / 100</dd>
                <dt>Expires after</dt>
                <dd>{d.settings.expiryDays} days</dd>
              </dl>
              <p className="note">These are the defaults. Changing them from the dashboard is not available yet.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export function BountyDetailPage({ id }: { id: string }) {
  const [detail, setDetail] = useState<BountyDetail | null>(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const now = useNow(30_000)

  const load = useCallback(async () => {
    try {
      setDetail(await api.bounty(id))
      setMissing(false)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setMissing(true)
      else setError(messageOf(e))
    }
  }, [id])

  useEffect(() => {
    setDetail(null)
    setMissing(false)
    void load()
    const t = setInterval(() => void load(), 60_000)
    return () => clearInterval(t)
  }, [load])

  const onDecide = async (action: 'approve' | 'veto') => {
    setBusy(true)
    setNotice(null)
    try {
      await (action === 'approve' ? api.approve(id) : api.veto(id))
      setNotice(action === 'approve' ? 'Approved. The payout is on its way.' : 'Vetoed. The funder is being refunded.')
      setError(null)
      await load()
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  if (missing)
    return (
      <main className="page">
        <a className="crumbs" href="#/">
          ← All bounties
        </a>
        <div className="empty card">
          <strong>Bounty not found</strong>
          <span className="muted">It may not exist, or you may not have access to it.</span>
        </div>
      </main>
    )
  if (!detail)
    return (
      <main className="page">
        {error ? <div className="alert" role="alert">{error}</div> : <p className="muted">Loading…</p>}
      </main>
    )
  return <BountyDetailView d={detail} now={now} busy={busy} error={error} notice={notice} onDecide={onDecide} />
}
