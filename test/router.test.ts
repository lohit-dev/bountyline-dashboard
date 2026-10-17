import { describe, expect, test } from 'bun:test'
import { matchRoute } from '../src/lib/routes'

describe('matchRoute', () => {
  test('known routes', () => {
    expect(matchRoute('/')).toEqual({ name: 'home' })
    expect(matchRoute('')).toEqual({ name: 'home' })
    expect(matchRoute('/payout')).toEqual({ name: 'payout' })
    expect(matchRoute('/payout/')).toEqual({ name: 'payout' })
    expect(matchRoute('/bounty/abc-123')).toEqual({ name: 'bounty', id: 'abc-123' })
    expect(matchRoute('/bounty/a%20b?x=1')).toEqual({ name: 'bounty', id: 'a b' })
  })
  test('unknown routes', () => {
    expect(matchRoute('/nope')).toEqual({ name: 'notfound' })
    expect(matchRoute('/bounty/a/b')).toEqual({ name: 'notfound' })
  })
})
