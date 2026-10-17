/** Shapes returned by the Bountyline API (apps/api, src/services/dashboard.ts). Kept in sync by hand. */

export type Status =
  | 'created'
  | 'funded'
  | 'claimed'
  | 'reviewed'
  | 'flagged'
  | 'window'
  | 'paid'
  | 'vetoed'
  | 'cancelled'
  | 'expired'
  | 'refunded'

export type Bounty = {
  id: string
  repo: string
  issueNumber: number
  issueUrl: string
  amountCents: number
  status: Status
  funderLogin: string
  role: 'funder' | 'contributor' | 'maintainer'
  createdAt: string
  fundedAt: string | null
  expiresAt: string | null
  windowEndsAt: string | null
  canDecide: boolean
  submissions: { prNumber: number; prUrl: string; authorLogin: string; status: string; current: boolean }[]
  review: {
    score: number
    passed: boolean
    recommendation: string
    ci: string
    summary: string
    redFlags: string[]
    rubric: Record<string, number>
    createdAt: string
  } | null
  payout: { state: string; sentAt: string | null } | null
  refund: { state: string; reason: string } | null
}

export type BountyDetail = Bounty & {
  events: { type: string; actor: string; createdAt: string }[]
  settings: { reviewWindowHours: number; scoreThreshold: number; expiryDays: number }
  payoutAddressSet: boolean
}

export type ActivityItem = {
  bountyId: string
  repo: string
  issueNumber: number
  type: string
  actor: string
  createdAt: string
}

export type Me = { id: number; login: string; payout: { set: boolean; masked: string | null } }
