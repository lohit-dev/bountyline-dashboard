import { useState } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'
const KEY = 'bountyline.theme'
const ORDER: ThemeChoice[] = ['system', 'light', 'dark']

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(choice: ThemeChoice): void {
  if (choice === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', choice)
}

export function applyStoredTheme(): void {
  apply(read())
}

export function useTheme(): { choice: ThemeChoice; cycle: () => void } {
  const [choice, setChoice] = useState<ThemeChoice>(read)
  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length]!
    setChoice(next)
    apply(next)
    try {
      if (next === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      /* optional */
    }
  }
  return { choice, cycle }
}
