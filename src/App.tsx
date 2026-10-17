import { useEffect } from 'react'
import { Topbar } from './components/Topbar'
import { navigate, useRoute } from './lib/router'
import { takeDestination, useSession } from './lib/session'
import { BountyDetailPage } from './pages/BountyDetail'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { PayoutPage } from './pages/PayoutPage'

export default function App() {
  const route = useRoute()
  const { session, refresh, signOut } = useSession()

  // After signing in, continue to where the person was going (for example the /payout link from the bot).
  useEffect(() => {
    if (session.status !== 'in') return
    const next = takeDestination()
    if (next && next !== '/') navigate(next)
  }, [session.status])

  if (session.status === 'loading') {
    return (
      <div className="shell">
        <Topbar me={null} onSignOut={signOut} />
        <main className="page">
          <p className="muted">Loading…</p>
        </main>
      </div>
    )
  }

  if (session.status === 'out') {
    return (
      <div className="shell">
        <Topbar me={null} onSignOut={signOut} />
        <Landing />
      </div>
    )
  }

  const { me } = session
  return (
    <div className="shell">
      <Topbar me={me} onSignOut={signOut} />
      {route.name === 'home' ? <Dashboard me={me} /> : null}
      {route.name === 'bounty' ? <BountyDetailPage id={route.id} /> : null}
      {route.name === 'payout' ? <PayoutPage me={me} onChanged={refresh} /> : null}
      {route.name === 'notfound' ? (
        <main className="page">
          <div className="empty card">
            <strong>Page not found</strong>
            <a href="#/">Back to bounties</a>
          </div>
        </main>
      ) : null}
    </div>
  )
}
