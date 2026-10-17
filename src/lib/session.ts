import { useCallback, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'
import type { Me } from './types'

export type Session = { status: 'loading' } | { status: 'out' } | { status: 'in'; me: Me }

export function useSession() {
  const [session, setSession] = useState<Session>(() => (getToken() ? { status: 'loading' } : { status: 'out' }))

  const refresh = useCallback(() => {
    if (!getToken()) {
      setSession({ status: 'out' })
      return
    }
    api
      .me()
      .then((me) => setSession({ status: 'in', me }))
      .catch(() => setSession({ status: 'out' }))
  }, [])

  useEffect(refresh, [refresh])

  const signOut = useCallback(() => {
    setToken(null)
    setSession({ status: 'out' })
  }, [])

  return { session, refresh, signOut }
}

/** Where to go after signing in, e.g. the /payout link the bot posted. */
const NEXT_KEY = 'bountyline.next'
export function rememberDestination(hash: string): void {
  try {
    sessionStorage.setItem(NEXT_KEY, hash)
  } catch {
    /* optional */
  }
}
export function takeDestination(): string | null {
  try {
    const v = sessionStorage.getItem(NEXT_KEY)
    sessionStorage.removeItem(NEXT_KEY)
    return v && v.startsWith('#/') ? v.slice(1) : null
  } catch {
    return null
  }
}
