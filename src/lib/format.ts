import type { Bounty, Status } from './types'

export function fmtUsd(cents: number): string {
  const dollars = cents / 100
  return '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })
}

/* ------------------------------ Status ------------------------------ */

export type Tab = 'all' | 'review' | 'open' | 'paid' | 'refunded'
export const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'In review' },
  { id: 'open', label: 'Open' },
  { id: 'paid', label: 'Paid' },
  { id: 'refunded', label: 'Refunded' },
]

export function tabOf(status: Status): Exclude<Tab, 'all'> {
  switch (status) {
    case 'claimed':
    case 'reviewed':
    case 'flagged':
    case 'window':
      return 'review'
    case 'created':
    case 'funded':
      return 'open'
    case 'paid':
      return 'paid'
    default:
      return 'refunded' // vetoed, cancelled, expired, refunded
  }
}

export const matchesTab = (b: Pick<Bounty, 'status'>, tab: Tab) => tab === 'all' || tabOf(b.status) === tab

export function tabCounts(bounties: Pick<Bounty, 'status'>[]): Record<Tab, number> {
  const counts: Record<Tab, number> = { all: bounties.length, review: 0, open: 0, paid: 0, refunded: 0 }
  for (const b of bounties) counts[tabOf(b.status)]++
  return counts
}

export type Tone = 'review' | 'open' | 'paid' | 'flagged' | 'refunded'

const LABELS: Record<Status, string> = {
  created: 'Awaiting payment',
  funded: 'Open',
  claimed: 'In review',
  reviewed: 'Passed review',
  flagged: 'Needs a maintainer',
  window: 'Payout scheduled',
  paid: 'Paid',
  vetoed: 'Vetoed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  refunded: 'Refunded',
}

export function toneOf(status: Status): Tone {
  return status === 'flagged' ? 'flagged' : tabOf(status)
}

/** "3d 4h", "5h 12m", "12m". Past times read as "now". */
export function countdown(to: Date, now: Date): string {
  const ms = to.getTime() - now.getTime()
  if (ms <= 0) return 'now'
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'in under a minute'
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `in ${d}d ${h}h`
  if (h > 0) return `in ${h}h ${m}m`
  return `in ${m}m`
}

export function ago(iso: string, now: Date): string {
  const mins = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function statusInfo(
  b: Pick<Bounty, 'status' | 'windowEndsAt' | 'expiresAt'>,
  now: Date,
): { label: string; tone: Tone; due: string } {
  const label = LABELS[b.status]
  const tone = toneOf(b.status)
  let due = ''
  switch (b.status) {
    case 'created':
      due = 'waiting for the funder'
      break
    case 'funded':
      due = b.expiresAt ? `expires ${countdown(new Date(b.expiresAt), now)}` : 'waiting for a pull request'
      break
    case 'claimed':
      due = 'AI review running'
      break
    case 'reviewed':
      due = 'waiting for the merge'
      break
    case 'flagged':
      due = 'waiting for a decision'
      break
    case 'window':
      due = b.windowEndsAt ? (new Date(b.windowEndsAt) <= now ? 'paying now' : `pays ${countdown(new Date(b.windowEndsAt), now)}`) : 'after the review window'
      break
    case 'vetoed':
    case 'expired':
      due = 'refund in progress'
      break
  }
  return { label, tone, due }
}

/* ------------------------------ Stats ------------------------------ */

type Money = { cents: number; count: number }
export function stats(bounties: Pick<Bounty, 'status' | 'amountCents' | 'fundedAt'>[]) {
  const sum = (pred: (b: (typeof bounties)[number]) => boolean): Money => {
    const rows = bounties.filter(pred)
    return { cents: rows.reduce((a, b) => a + b.amountCents, 0), count: rows.length }
  }
  return {
    funded: sum((b) => b.fundedAt !== null && tabOf(b.status) !== 'refunded'),
    paid: sum((b) => b.status === 'paid'),
    inWindow: sum((b) => b.status === 'window'),
    open: sum((b) => b.status === 'funded'),
  }
}

/* ------------------------------ Review ------------------------------ */

export const CRITERIA: { key: string; label: string; max: number }[] = [
  { key: 'solves_issue', label: 'Solves the issue', max: 25 },
  { key: 'scope', label: 'Stays in scope', max: 20 },
  { key: 'tests_ci', label: 'Tests and CI', max: 30 },
  { key: 'quality', label: 'Code quality', max: 20 },
  { key: 'red_flags', label: 'No red flags', max: 5 },
]

/* ------------------------------ Events ------------------------------ */

const EVENT_TEXT: Record<string, string | null> = {
  created: 'Bounty created',
  funded: 'Funded',
  pr_linked: 'Pull request linked',
  new_commits: 'New commits pushed, review restarts',
  review: 'AI review finished',
  review_passed: 'AI review passed',
  review_flagged: 'AI review needs a maintainer',
  review_stale: 'New commits pushed, review restarts',
  review_limit: 'Review limit reached, a maintainer decides',
  review_unavailable: 'AI review unavailable, a maintainer decides',
  pr_merged: 'Pull request merged',
  pr_closed: 'Pull request closed without merging',
  submission_changed: null,
  approve: 'Approved',
  veto: 'Vetoed',
  cancel: 'Cancelled',
  expire: 'Expired',
  payout_sent: 'Payout sent',
  payout_confirmed: 'PayPal confirmed the payout',
  payout_address_missing: 'Waiting for the contributor to set a payout address',
  payout_abandoned: 'No payout address was set, refunding',
  payout_error: 'A payout attempt failed and will be retried',
  payout_failed_after_send: 'PayPal could not deliver the payout',
  refunded: 'Refunded to the funder',
  refund_error: 'A refund attempt failed and will be retried',
}

/** Plain-language timeline text. Returns null for events that are not worth showing. */
export function eventText(type: string, actor: string): string | null {
  const key = type.toLowerCase()
  const text = key in EVENT_TEXT ? EVENT_TEXT[key] : type.replace(/_/g, ' ').toLowerCase()
  if (text === null || text === undefined) return null
  const byUser = ['approve', 'veto', 'cancel'].includes(key) && actor && actor !== 'system' ? ` by @${actor}` : ''
  return text + byUser
}

/** Drops hidden events and neighbours that would read the same (the API logs some steps twice). */
export function timeline<T extends { type: string; actor: string; createdAt: string }>(events: T[]): (T & { text: string })[] {
  const out: (T & { text: string })[] = []
  for (const e of events) {
    const text = eventText(e.type, e.actor)
    if (!text) continue
    if (out.length && out[out.length - 1]!.text === text) continue
    out.push({ ...e, text })
  }
  return out
}
