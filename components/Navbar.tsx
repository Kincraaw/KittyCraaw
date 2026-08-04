'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const tabs = [
    { href: '/films', label: 'Films', icon: '🎬' },
    { href: '/series', label: 'Séries', icon: '📺' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-base font-semibold tracking-tight">🐱 KittyCraaw</span>
            <nav className="flex gap-1">
              {tabs.map(tab => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    pathname === tab.href
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ''}
                    className="w-7 h-7 rounded-full border border-white/10"
                  />
                )}
                <span className="text-xs text-white/50 hidden sm:block">{session.user.email}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-white/40 hover:text-white/80 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
