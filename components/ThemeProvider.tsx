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
      {theme === 'image' && (
        <div
          id="theme-bg"
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: "url('/bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
      )}
      {children}
    </ThemeContext.Provider>
  )
}
