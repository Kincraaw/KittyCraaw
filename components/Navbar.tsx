'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  const themeIcon = theme === 'bordeaux' ? '🖼️' : '🍷'
  const themeLabel = theme === 'bordeaux' ? 'Thème image' : 'Thème bordeaux'

  const tabs = [
    { href: '/films', label: 'Films', icon: '🍿' },
    { href: '/series', label: 'Séries', icon: '📺' },
    { href: '/duo', label: 'Partagé', icon: '🤝' },
    { href: '/stats', label: 'Stats', icon: '📊' },
    { href: '/membres', label: 'Membres', icon: '🧑‍🤝‍🧑' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[var(--color-bg)]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-2">
          <img src="/icon.svg" alt="KittyCraaw" className="w-8 h-8 rounded-lg shrink-0" />
          <nav className="flex gap-1 flex-1">
            {tabs.map(tab => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors flex-1 justify-center sm:flex-none sm:justify-start sm:px-3 ${
                  pathname === tab.href
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggle}
              title={themeLabel}
              className="relative w-14 h-7 rounded-full border border-white/15 transition-colors duration-300 shrink-0"
              style={{ background: theme === 'image' ? 'rgba(192,57,43,0.25)' : 'rgba(255,255,255,0.06)' }}
            >
              {/* Track icons */}
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm leading-none select-none">🌙</span>
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm leading-none select-none">☀️</span>
              {/* Sliding pill */}
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full shadow-md flex items-center justify-center text-sm transition-all duration-300"
                style={{
                  left: theme === 'image' ? 'calc(100% - 1.75rem)' : '0.125rem',
                  background: theme === 'image' ? '#c0392b' : '#2b1019',
                }}
              >
                {theme === 'image' ? '☀️' : '🌙'}
              </span>
            </button>
            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-white/40 hover:text-white/80 transition-colors"
              >
                Sortir
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
