import type { Bounty } from '../lib/types'

/** Passed to AG Grid as `context`, so cell renderers can reach page state. */
export type GridContext = {
  now: Date
  busyId: string | null
  onDecide: (bounty: Bounty, action: 'approve' | 'veto') => Promise<void>
}

/** The pass mark shown on list rows. The detail page uses the repository's own setting. */
export const LIST_THRESHOLD = 75
