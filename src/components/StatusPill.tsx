import { statusInfo } from '../lib/format'
import type { Bounty } from '../lib/types'

export function StatusPill({ bounty, now, showDue = false }: { bounty: Pick<Bounty, 'status' | 'windowEndsAt' | 'expiresAt'>; now: Date; showDue?: boolean }) {
  const { label, tone, due } = statusInfo(bounty, now)
  return (
    <div className="cell2">
      <span className={`pill pill--${tone}`} style={{ alignSelf: 'flex-start' }}>
        {label}
      </span>
      {showDue && due ? <span className="cell2__sub">{due}</span> : null}
    </div>
  )
}
