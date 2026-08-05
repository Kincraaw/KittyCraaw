'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Theme = 'bordeaux' | 'image'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'bordeaux',
  toggle: () => {},
})

export function useTheme() { return useContext(ThemeContext) }

const NO_BG_PAGES = ['/login', '/register']

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('bordeaux')
  const pathname = usePathname()
  const noBg = NO_BG_PAGES.includes(pathname)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    apply(saved ?? 'bordeaux')
  }, [])

  useEffect(() => {
    if (theme !== 'image' || noBg) {
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
  }, [theme, noBg])

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
