import { useTheme } from '../lib/theme'
import type { Me } from '../lib/types'

export function Topbar({ me, onSignOut }: { me: Me | null; onSignOut: () => void }) {
  const { choice, cycle } = useTheme()
  return (
    <header className="topbar">
      <div className="topbar__in">
        <a className="brand" href="#/">
          <span className="brand__dot" aria-hidden="true" />
          Bountyline
        </a>
        <span className="spacer" />
        <button type="button" className="btn btn--link" onClick={cycle} aria-label={`Theme: ${choice}. Switch theme`}>
          Theme: {choice}
        </button>
        {me ? (
          <>
            <a className="btn btn--link" href="#/payout">
              Payout address
            </a>
            <span className="chip">@{me.login}</span>
            <button type="button" className="btn btn--sm" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </header>
  )
}
