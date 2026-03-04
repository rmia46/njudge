'use client'

export type Theme = 'emerald' | 'midnight' | 'steel' | 'royal'

export const THEMES: Record<Theme, string> = {
  emerald: 'theme-emerald',
  midnight: 'theme-midnight',
  steel: 'theme-steel',
  royal: 'theme-royal',
}

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  
  const root = window.document.documentElement
  
  // Remove all other theme classes
  Object.values(THEMES).forEach((t) => root.classList.remove(t))
  
  // Add the new theme class
  if (theme !== 'emerald') { // Emerald is the default (root)
    root.classList.add(THEMES[theme])
  }
  
  localStorage.setItem('njudge-theme', theme)
}

export function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'emerald'
  return (localStorage.getItem('njudge-theme') as Theme) || 'emerald'
}
