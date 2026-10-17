import { useEffect, useState } from 'react'
import { matchRoute, type Route } from './routes'

export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '')
  return h.startsWith('/') ? h : '/'
}

export function normalizeInitialUrl(): void {
  const { pathname, hash } = window.location
  if (pathname !== '/' && !hash.startsWith('#/')) window.history.replaceState(null, '', '/#' + pathname)
}

export function navigate(path: string): void {
  window.location.hash = path
}

export const bountyHref = (id: string) => `#/bounty/${encodeURIComponent(id)}`

export function useRoute(): Route {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return matchRoute(path)
}
