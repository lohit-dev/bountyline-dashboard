import { useCallback, useEffect, useMemo, useState } from 'react'
import { BountyGrid } from '../grid/BountyGrid'
import type { GridContext } from '../grid/context'
import { api } from '../lib/api'
import { messageOf } from '../lib/errors'
import { ago, fmtUsd, stats, tabCounts, TABS, timeline, type Tab } from '../lib/format'
import { bountyHref } from '../lib/router'
import type { ActivityItem, Bounty, Me } from '../lib/types'
import { useNow } from '../lib/useNow'

function Stat({ label, cents, count, unit }: { label: string; cents: number; count: number; unit: string }) {
  return (
    <div className="card stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{fmtUsd(cents)}</span>
      <span className="stat__sub">
        {count} {unit}
        {count === 1 ? '' : 's'}
      </span>
    </div>
  )
}

export function DashboardView({
  bounties,
  activity,
  tab,
  search,
  now,
  busyId,
  onTab,
  onSearch,
  onDecide,
}: {
  bounties: Bounty[]
  activity: ActivityItem[]
  tab: Tab
  search: string
  now: Date
  busyId: string | null
  onTab: (t: Tab) => void
  onSearch: (s: string) => void
  onDecide: GridContext['onDecide']
}) {
  const s = useMemo(() => stats(bounties), [bounties])
  const counts = useMemo(() => tabCounts(bounties), [bounties])
  const context = useMemo<GridContext>(() => ({ now, busyId, onDecide }), [now, busyId, onDecide])
  const feed = useMemo(() => timeline(activity), [activity])

  return (
    <>
      <section className="stats" aria-label="Totals">
        <Stat label="Funded" cents={s.funded.cents} count={s.funded.count} unit="bounty" />
        <Stat label="Paid out" cents={s.paid.cents} count={s.paid.count} unit="payout" />
        <Stat label="In review window" cents={s.inWindow.cents} count={s.inWindow.count} unit="bounty" />
        <Stat label="Open, unclaimed" cents={s.open.cents} count={s.open.count} unit="bounty" />
      </section>

      <section className="card">
        <div className="toolbar">
          <div className="tabs" role="tablist" aria-label="Filter by status">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" className="tab" aria-selected={tab === t.id} onClick={() => onTab(t.id)}>
                {t.label} <span className="tab__n">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <input
            className="input search"
            type="search"
            placeholder="Search repo, issue or person"
            aria-label="Search bounties"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        {bounties.length === 0 ? (
          <div className="empty">
            <strong>No bounties yet</strong>
            <span className="muted">
              Comment <code>/bounty 150</code> on an issue in a repository where Bountyline is installed, or open a pull request that closes a funded issue.
            </span>
          </div>
        ) : (
          <BountyGrid rows={bounties} tab={tab} search={search} context={context} />
        )}
      </section>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">Bot activity</h2>
        </div>
        <div className="card__body">
          {feed.length === 0 ? (
            <span className="muted">Nothing yet.</span>
          ) : (
            <ul className="activity">
              {feed.map((a, i) => (
                <li key={`${a.bountyId}-${a.createdAt}-${i}`}>
                  <span>
                    <a href={bountyHref(a.bountyId)}>
                      {a.repo} #{a.issueNumber}
                    </a>{' '}
                    <span className="muted">{a.text}</span>
                  </span>
                  <span className="muted small">{ago(a.createdAt, now)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="note">Bot comments and this feed never show PayPal emails or order ids. Payout addresses stay encrypted on the server.</p>
        </div>
      </section>
    </>
  )
}

export function Dashboard({ me }: { me: Me }) {
  const [bounties, setBounties] = useState<Bounty[] | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const now = useNow(30_000)

  const load = useCallback(async () => {
    try {
      const [b, a] = await Promise.all([api.bounties(), api.activity()])
      setBounties(b)
      setActivity(a)
      setError(null)
    } catch (e) {
      setError(messageOf(e))
    }
  }, [])

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), 60_000)
    return () => clearInterval(t)
  }, [load])

  const onDecide = useCallback(
    async (b: Bounty, action: 'approve' | 'veto') => {
      setBusyId(b.id)
      setNotice(null)
      try {
        await (action === 'approve' ? api.approve(b.id) : api.veto(b.id))
        setNotice(action === 'approve' ? 'Approved. The payout is on its way.' : 'Vetoed. The funder is being refunded.')
        setError(null)
        await load()
      } catch (e) {
        setError(messageOf(e))
      } finally {
        setBusyId(null)
      }
    },
    [load],
  )

  return (
    <main className="page">
      <div>
        <h1>Bounties</h1>
        <p className="muted">Everything you funded or are working on, @{me.login}.</p>
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
      {bounties === null ? (
        <p className="muted">Loading…</p>
      ) : (
        <DashboardView
          bounties={bounties}
          activity={activity}
          tab={tab}
          search={search}
          now={now}
          busyId={busyId}
          onTab={setTab}
          onSearch={setSearch}
          onDecide={onDecide}
        />
      )}
    </main>
  )
}
