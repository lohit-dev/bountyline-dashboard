/**
 * Hash routing (#/bounty/<id>), so the static host needs no rewrite rules.
 * The bot links to plain paths like /payout, which are turned into hash routes on load.
 */
export type Route =
  | { name: 'home' }
  | { name: 'bounty'; id: string }
  | { name: 'payout' }
  | { name: 'notfound' }

export function matchRoute(path: string): Route {
  const clean = path.split('?')[0]!.replace(/\/+$/, '') || '/'
  if (clean === '/') return { name: 'home' }
  if (clean === '/payout') return { name: 'payout' }
  const m = /^\/bounty\/([^/]+)$/.exec(clean)
  if (m) return { name: 'bounty', id: decodeURIComponent(m[1]!) }
  return { name: 'notfound' }
}
