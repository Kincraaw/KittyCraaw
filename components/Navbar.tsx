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
    { href: '/films', label: 'Films', icon: '🎬' },
    { href: '/series', label: 'Séries', icon: '📺' },
    { href: '/duo', label: 'Duo', icon: '🎭' },
    { href: '/stats', label: 'Stats', icon: '📊' },
    { href: '/membres', label: 'Membres', icon: '👥' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[var(--color-bg)]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-2">
          <span className="text-base font-semibold tracking-tight shrink-0">🐱</span>
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
              className="text-base hover:scale-110 transition-transform"
            >
              {themeIcon}
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
