'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'bordeaux' | 'image'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'bordeaux',
  toggle: () => {},
})

export function useTheme() { return useContext(ThemeContext) }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('bordeaux')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    apply(saved ?? 'bordeaux')
  }, [])

  useEffect(() => {
    if (theme !== 'image') {
      document.documentElement.style.removeProperty('--bg-image-url')
      return
    }
    fetch('/api/bg')
      .then(r => r.ok ? r.blob() : null)
      .then(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        document.documentElement.style.setProperty('--bg-image-url', `url(${url})`)
      })
  }, [theme])

  function apply(t: Theme) {
    setTheme(t)
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  function toggle() {
    apply(theme === 'bordeaux' ? 'image' : 'bordeaux')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
