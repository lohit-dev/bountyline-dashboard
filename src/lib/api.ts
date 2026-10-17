import type { ActivityItem, Bounty, BountyDetail, Me } from './types'

export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? 'http://localhost:3000'

const TOKEN_KEY = 'bountyline.token'
let memoryToken: string | null = null

/** localStorage can throw (private windows, blocked storage), so fall back to memory. */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}
export function setToken(token: string | null): void {
  memoryToken = token
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* memory copy is enough for this tab */
  }
}

/** After GitHub sign-in the API sends the browser back to `/#token=...`. Keep the token, clean the URL. */
export function captureTokenFromHash(): void {
  const m = /^#token=([^&]+)/.exec(window.location.hash)
  if (!m) return
  setToken(decodeURIComponent(m[1]!))
  window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/')
}

export const loginUrl = `${API_URL}/auth/login?to=dashboard`

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>
  if (res.status === 401) setToken(null)
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`)
  return data as T
}

export const api = {
  me: () => request<Me>('GET', '/api/me'),
  bounties: async () => (await request<{ bounties: Bounty[] }>('GET', '/api/bounties')).bounties,
  bounty: (id: string) => request<BountyDetail>('GET', `/api/bounties/${encodeURIComponent(id)}`),
  activity: async () => (await request<{ activity: ActivityItem[] }>('GET', '/api/activity?limit=15')).activity,
  approve: (id: string) => request<{ ok: true }>('POST', `/api/bounties/${encodeURIComponent(id)}/approve`),
  veto: (id: string) => request<{ ok: true }>('POST', `/api/bounties/${encodeURIComponent(id)}/veto`),
  setPayoutEmail: (email: string) => request<{ ok: true; masked: string }>('PUT', '/api/payout-account', { email }),
}
