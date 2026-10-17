import { useEffect, useState } from 'react'
import type { CustomCellRendererProps } from 'ag-grid-react'
import { ScoreBar } from '../components/ScoreBar'
import { StatusPill } from '../components/StatusPill'
import { bountyHref } from '../lib/router'
import type { Bounty } from '../lib/types'
import { LIST_THRESHOLD, type GridContext } from './context'

/** Two lines: repo and issue number (a real link), then the pull request and who opened it. */
export function IssueCell({ data }: CustomCellRendererProps<Bounty>) {
  if (!data) return null
  const pr = data.submissions.find((s) => s.current) ?? data.submissions[0]
  return (
    <div className="cell2">
      <a className="cell2__top" href={bountyHref(data.id)}>
        {data.repo} #{data.issueNumber}
      </a>
      <span className="cell2__sub mono">{pr ? `PR #${pr.prNumber} by @${pr.authorLogin}` : 'no pull request yet'}</span>
    </div>
  )
}

/** Status pill with a due line underneath ("pays in 5h 12m"). */
export function StatusCell({ data, context }: CustomCellRendererProps<Bounty>) {
  if (!data) return null
  return <StatusPill bounty={data} now={(context as GridContext).now} showDue />
}

export function ScoreCell({ data }: CustomCellRendererProps<Bounty>) {
  if (!data?.review) return <span className="muted">Not reviewed</span>
  return <ScoreBar score={data.review.score} threshold={LIST_THRESHOLD} />
}

/** Approve and Veto. Veto needs a second click, so a stray tap never refunds a bounty. */
export function ActionsCell({ data, context }: CustomCellRendererProps<Bounty>) {
  const [confirming, setConfirming] = useState(false)
  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 5000)
    return () => clearTimeout(t)
  }, [confirming])

  if (!data || !data.canDecide) return null
  const ctx = context as GridContext
  const busy = ctx.busyId === data.id

  return (
    <div className="cell-actions">
      {confirming ? (
        <>
          <button
            type="button"
            className="btn btn--danger-solid btn--sm"
            disabled={busy}
            onClick={() => {
              setConfirming(false)
              void ctx.onDecide(data, 'veto')
            }}
          >
            Confirm veto and refund
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setConfirming(false)}>
            Keep
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void ctx.onDecide(data, 'approve')}>
            Approve and pay
          </button>
          <button type="button" className="btn btn--danger btn--sm" disabled={busy} onClick={() => setConfirming(true)}>
            Veto
          </button>
        </>
      )}
    </div>
  )
}
