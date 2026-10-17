import { describe, expect, mock, test } from 'bun:test'
import { renderToString } from 'react-dom/server'

// AG Grid is exercised in the browser; here it is replaced so the surrounding page can be rendered.
mock.module('ag-grid-react', () => ({ AgGridReact: () => null }))
mock.module('ag-grid-community', () => ({ themeQuartz: { withParams: () => ({}) }, AllCommunityModule: {}, ModuleRegistry: { registerModules: () => {} } }))

const { BountyDetailView } = await import('../src/pages/BountyDetail')
const { PayoutView } = await import('../src/pages/PayoutPage')
const { DashboardView } = await import('../src/pages/Dashboard')
const { Landing } = await import('../src/pages/Landing')
const { Topbar } = await import('../src/components/Topbar')
import type { Bounty, BountyDetail } from '../src/lib/types'

const now = new Date('2026-10-20T10:00:00Z')
const at = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString()

const base: Bounty = {
  id: 'b1', repo: 'acme/widgets', issueNumber: 5, issueUrl: 'https://github.com/acme/widgets/issues/5', amountCents: 15000, status: 'window',
  funderLogin: 'maint', role: 'funder', createdAt: at(-80), fundedAt: at(-79), expiresAt: at(500), windowEndsAt: at(31), canDecide: true,
  submissions: [{ prNumber: 7, prUrl: 'https://github.com/acme/widgets/pull/7', authorLogin: 'mira', status: 'merged', current: true }],
  review: { score: 82, passed: true, recommendation: 'approve', ci: 'success', summary: 'Solid change with tests.', redFlags: [], rubric: { solves_issue: 22, scope: 18, tests_ci: 24, quality: 14, red_flags: 4 }, createdAt: at(-30) },
  payout: null, refund: null,
}
const detail: BountyDetail = {
  ...base,
  events: [
    { type: 'FUNDED', actor: 'maint', createdAt: at(-79) },
    { type: 'PR_LINKED', actor: 'mira', createdAt: at(-60) },
    { type: 'pr_linked', actor: 'mira', createdAt: at(-60) },
    { type: 'PR_MERGED', actor: 'mira', createdAt: at(-17) },
  ],
  settings: { reviewWindowHours: 48, scoreThreshold: 75, expiryDays: 30 },
  payoutAddressSet: false,
}
const noop = () => {}
/** React separates interpolated text with comment markers in server output. */
const clean = (h: string) => h.replaceAll('<!-- -->', '')

describe('bounty detail', () => {
  const html = (d: BountyDetail) => clean(renderToString(<BountyDetailView d={d} now={now} busy={false} error={null} notice={null} onDecide={noop} />))

  test('maintainer sees the review, countdown, timeline and both decisions', () => {
    const h = html(detail)
    expect(h).toContain('acme/widgets')
    expect(h).toContain('$150')
    expect(h).toContain('82')
    expect(h).toContain('Pass mark 75')
    expect(h).toContain('Solves the issue')
    expect(h).toContain('22 / 25')
    expect(h).toContain('in 1d 7h')
    expect(h).toContain('Approve and pay now')
    expect(h).toContain('Veto and refund')
    expect(h).toContain('Pull request merged')
    expect(h.match(/Pull request linked/g)?.length).toBe(1) // the duplicate log line is collapsed
    expect(h).toContain('Payouts are final')
  })
  test('veto is two-step: the confirm button is not there until clicked', () => {
    expect(html(detail)).not.toContain('Confirm: veto and refund')
  })
  test('a contributor cannot decide, and is pointed at the payout address page', () => {
    const h = html({ ...detail, role: 'contributor', canDecide: false })
    expect(h).not.toContain('Approve and pay now')
    expect(h).not.toContain('Veto and refund')
    expect(h).toContain('Set your payout address')
    expect(h).toContain('href="#/payout"')
  })
  test('no review yet, and nothing secret is rendered', () => {
    const h = html({ ...detail, review: null, status: 'funded', canDecide: false, submissions: [], windowEndsAt: null })
    expect(h).toContain('No review yet')
    expect(h).not.toMatch(/paypal|@example\.com/i)
  })
  test('AI text is escaped, not injected', () => {
    const h = html({ ...detail, review: { ...detail.review!, summary: '<script>alert(1)</script>', redFlags: ['<img src=x onerror=alert(1)>'] } })
    expect(h).not.toContain('<script>alert(1)')
    expect(h).not.toContain('<img src=x')
    expect(h).toContain('&lt;script&gt;')
  })
  test('errors and notices are announced', () => {
    const h = clean(renderToString(<BountyDetailView d={detail} now={now} busy error="The payout has already been sent and payouts are final." notice={null} onDecide={noop} />))
    expect(h).toContain('role="alert"')
    expect(h).toContain('already been sent')
    expect(h).toContain('disabled')
  })
})

describe('dashboard', () => {
  const rows: Bounty[] = [
    base,
    { ...base, id: 'b2', status: 'paid', amountCents: 5000, canDecide: false, windowEndsAt: null },
    { ...base, id: 'b3', status: 'funded', amountCents: 10000, canDecide: false, windowEndsAt: null, submissions: [], review: null },
    { ...base, id: 'b4', status: 'refunded', amountCents: 7000, canDecide: false, windowEndsAt: null },
  ]
  const activity = [
    { bountyId: 'b1', repo: 'acme/widgets', issueNumber: 5, type: 'PR_MERGED', actor: 'mira', createdAt: at(-1) },
    { bountyId: 'b1', repo: 'acme/widgets', issueNumber: 5, type: 'payout_error', actor: 'system', createdAt: at(-2) },
  ]
  const html = (b: Bounty[], tab: 'all' | 'paid' = 'all') =>
    renderToString(<DashboardView bounties={b} activity={activity} tab={tab} search="" now={now} busyId={null} onTab={noop} onSearch={noop} onDecide={async () => {}} />)

  test('stat cards, tab counts and the activity feed', () => {
    const h = html(rows)
    expect(h).toContain('$300') // funded: window 150 + paid 50 + open 100 (refunded excluded)
    expect(h).toContain('Paid out')
    expect(h).toContain('In review window')
    expect(h).toContain('Open, unclaimed')
    for (const t of ['All', 'In review', 'Open', 'Paid', 'Refunded']) expect(h).toContain(t)
    expect(h).toContain('Pull request merged')
    expect(h).toContain('never show PayPal emails')
    expect(h).toContain('role="tab"')
  })
  test('the selected tab is marked for assistive tech', () => {
    expect(html(rows, 'paid')).toMatch(/aria-selected="true"[^>]*>Paid/)
  })
  test('empty account explains how to start', () => {
    const h = html([])
    expect(h).toContain('No bounties yet')
    expect(h).toContain('/bounty 150')
  })
})

describe('payout page', () => {
  test('shows only the masked address and explains the privacy rules', () => {
    const h = renderToString(<PayoutView masked="m***@example.com" saving={false} error={null} saved={false} onSave={noop} />)
    expect(h).toContain('m***@example.com')
    expect(h).toContain('type="email"')
    expect(h).toContain('encrypted')
    expect(h).toContain('Replace address')
  })
  test('first time, and save errors', () => {
    const h = renderToString(<PayoutView masked={null} saving={false} error="Enter the email address of your PayPal account." saved={false} onSave={noop} />)
    expect(h).toContain('not saved a payout address')
    expect(h).toContain('Save address')
    expect(h).toContain('role="alert"')
  })
})

describe('landing and topbar', () => {
  test('landing explains the rule and offers GitHub sign-in', () => {
    const h = renderToString(<Landing />)
    expect(h).toContain('Sign in with GitHub')
    expect(h).toContain('localhost:3000/auth/login?to=dashboard')
    expect(h).toContain('merged')
    expect(h).toContain('veto')
  })
  test('signed-in topbar', () => {
    const h = renderToString(<Topbar me={{ id: 1, login: 'mira', payout: { set: false, masked: null } }} onSignOut={noop} />)
    expect(h).toMatch(/chip">@(<!-- -->)?mira/)
    expect(h).toContain('Sign out')
    expect(h).toContain('Payout address')
  })
})
