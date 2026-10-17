import { describe, expect, test } from 'bun:test'
import { ago, countdown, eventText, fmtUsd, matchesTab, stats, statusInfo, tabCounts, tabOf, timeline, toneOf } from '../src/lib/format'
import type { Status } from '../src/lib/types'

const now = new Date('2026-10-20T10:00:00Z')
const at = (ms: number) => new Date(now.getTime() + ms).toISOString()
const H = 3_600_000

describe('money', () => {
  test('whole dollars have no decimals, thousands get separators', () => {
    expect(fmtUsd(15000)).toBe('$150')
    expect(fmtUsd(1250)).toBe('$12.50')
    expect(fmtUsd(123400)).toBe('$1,234')
  })
})

describe('tabs and tones', () => {
  const all: Status[] = ['created', 'funded', 'claimed', 'reviewed', 'flagged', 'window', 'paid', 'vetoed', 'cancelled', 'expired', 'refunded']
  test('every status belongs to exactly one tab', () => {
    const counts = tabCounts(all.map((status) => ({ status })))
    expect(counts).toEqual({ all: 11, review: 4, open: 2, paid: 1, refunded: 4 })
    for (const s of all) expect(matchesTab({ status: s }, tabOf(s))).toBe(true)
    expect(all.every((s) => matchesTab({ status: s }, 'all'))).toBe(true)
  })
  test('tones follow the design tokens', () => {
    expect(toneOf('flagged')).toBe('flagged')
    expect(toneOf('window')).toBe('review')
    expect(toneOf('funded')).toBe('open')
    expect(toneOf('paid')).toBe('paid')
    expect(toneOf('vetoed')).toBe('refunded')
  })
})

describe('time text', () => {
  test('countdown', () => {
    expect(countdown(new Date(at(-1000)), now)).toBe('now')
    expect(countdown(new Date(at(30_000)), now)).toBe('in under a minute')
    expect(countdown(new Date(at(12 * 60_000)), now)).toBe('in 12m')
    expect(countdown(new Date(at(5 * H + 12 * 60_000)), now)).toBe('in 5h 12m')
    expect(countdown(new Date(at(51 * H)), now)).toBe('in 2d 3h')
  })
  test('ago', () => {
    expect(ago(at(-10_000), now)).toBe('just now')
    expect(ago(at(-5 * 60_000), now)).toBe('5m ago')
    expect(ago(at(-3 * H), now)).toBe('3h ago')
    expect(ago(at(-50 * H), now)).toBe('2d ago')
  })
  test('status due lines', () => {
    expect(statusInfo({ status: 'window', windowEndsAt: at(31 * H), expiresAt: null }, now)).toEqual({ label: 'Payout scheduled', tone: 'review', due: 'pays in 1d 7h' })
    expect(statusInfo({ status: 'window', windowEndsAt: at(-H), expiresAt: null }, now).due).toBe('paying now')
    expect(statusInfo({ status: 'funded', windowEndsAt: null, expiresAt: at(30 * 24 * H) }, now).due).toBe('expires in 30d 0h')
    expect(statusInfo({ status: 'flagged', windowEndsAt: null, expiresAt: null }, now)).toMatchObject({ tone: 'flagged', label: 'Needs a maintainer' })
    expect(statusInfo({ status: 'paid', windowEndsAt: null, expiresAt: null }, now).due).toBe('')
  })
})

describe('stats', () => {
  const rows = [
    { status: 'funded' as Status, amountCents: 10000, fundedAt: 'x' },
    { status: 'window' as Status, amountCents: 15000, fundedAt: 'x' },
    { status: 'paid' as Status, amountCents: 5000, fundedAt: 'x' },
    { status: 'refunded' as Status, amountCents: 7000, fundedAt: 'x' },
    { status: 'created' as Status, amountCents: 2000, fundedAt: null },
  ]
  test('funded excludes refunded and unpaid bounties', () => {
    const s = stats(rows)
    expect(s.funded).toEqual({ cents: 30000, count: 3 })
    expect(s.paid).toEqual({ cents: 5000, count: 1 })
    expect(s.inWindow).toEqual({ cents: 15000, count: 1 })
    expect(s.open).toEqual({ cents: 10000, count: 1 })
  })
})

describe('timeline', () => {
  test('friendly text, with the actor on decisions', () => {
    expect(eventText('VETO', 'maint')).toBe('Vetoed by @maint')
    expect(eventText('PR_MERGED', 'mira')).toBe('Pull request merged')
    expect(eventText('something_new', 'x')).toBe('something new')
    expect(eventText('SUBMISSION_CHANGED', 'x')).toBeNull()
  })
  test('hides internal events and collapses repeats', () => {
    const e = (type: string) => ({ type, actor: 'mira', createdAt: 'x' })
    const t = timeline([e('PR_LINKED'), e('pr_linked'), e('SUBMISSION_CHANGED'), e('PR_MERGED')])
    expect(t.map((x) => x.text)).toEqual(['Pull request linked', 'Pull request merged'])
  })
})
