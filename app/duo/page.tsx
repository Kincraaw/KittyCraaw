'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface UserEntry {
  name: string
  rating: number | null
  watched: boolean
  note: string | null
}

interface Group {
  key: string
  title: string
  year: number | null
  poster_url: string | null
  entries: Record<string, UserEntry>
}

interface User {
  email: string
  name: string
}

type Tab = 'film' | 'serie'

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-white/20 text-xs">—</span>
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function diff(a: number | null, b: number | null): string {
  if (a === null || b === null) return ''
  const d = a - b
  if (d === 0) return '='
  return d > 0 ? `+${d}` : `${d}`
}

function diffColor(a: number | null, b: number | null) {
  if (a === null || b === null) return 'text-white/20'
  const d = Math.abs(a - b)
  if (d === 0) return 'text-emerald-400'
  if (d === 1) return 'text-amber-400'
  return 'text-red-400'
}

const POSTER_COLORS = ['from-violet-900 to-purple-950', 'from-blue-900 to-indigo-950', 'from-teal-900 to-emerald-950', 'from-rose-900 to-pink-950']

export default function DuoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('film')
  const [filter, setFilter] = useState<'all' | 'duo' | 'diff'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/duo?type=${tab}`)
    const data = await res.json()
    setGroups(data.result ?? [])
    setUsers(data.users ?? [])
    setLoading(false)
  }, [tab])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const filtered = groups.filter(g => {
    const count = Object.keys(g.entries).length
    if (filter === 'duo') return count >= 2
    if (filter === 'diff') {
      const ratings = Object.values(g.entries).map(e => e.rating).filter(Boolean)
      return ratings.length === 2 && ratings[0] !== ratings[1]
    }
    return true
  })

  const sharedWatched = groups.filter(g => {
    const vals = Object.values(g.entries)
    return vals.length >= 2 && vals.every(e => e.watched)
  })
  const avgDiff = sharedWatched.length > 0
    ? (sharedWatched.reduce((sum, g) => {
        const ratings = Object.values(g.entries).map(e => e.rating).filter((r): r is number => r !== null)
        return sum + (ratings.length === 2 ? Math.abs(ratings[0] - ratings[1]) : 0)
      }, 0) / sharedWatched.length).toFixed(1)
    : '—'

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-lg font-semibold mb-5">🎭 Duo</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5 max-w-lg">
          <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
            <div className="text-2xl font-semibold">{sharedWatched.length}</div>
            <div className="text-xs text-white/50 mt-0.5">Vus ensemble</div>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
            <div className="text-2xl font-semibold">{avgDiff}</div>
            <div className="text-xs text-white/50 mt-0.5">Écart moyen</div>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
            <div className="text-2xl font-semibold">
              {sharedWatched.filter(g => {
                const r = Object.values(g.entries).map(e => e.rating)
                return r[0] === r[1] && r[0] !== null
              }).length}
            </div>
            <div className="text-xs text-white/50 mt-0.5">Notes identiques</div>
          </div>
        </div>

        {/* Tabs Films / Séries */}
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1 w-fit mb-4">
          {(['film', 'serie'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded px-4 py-1.5 text-sm transition-colors ${tab === t ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
              {t === 'film' ? '🎬 Films' : '📺 Séries'}
            </button>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1 w-fit mb-5">
          {[['all', 'Tout'], ['duo', 'En commun'], ['diff', 'Désaccords']] .map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val as typeof filter)}
              className={`rounded px-3 py-1 text-xs transition-colors ${filter === val ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/30 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">Aucun résultat</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(g => {
              const userEntries = Object.entries(g.entries)
              const isDuo = userEntries.length >= 2
              const ratings = userEntries.map(([, e]) => e.rating)
              const posterColor = POSTER_COLORS[g.title.length % POSTER_COLORS.length]

              return (
                <div key={g.key} className="rounded-xl border border-white/8 bg-[var(--color-surface)] overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {/* Poster */}
                    <div className={`w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br ${posterColor}`}>
                      {g.poster_url
                        ? <img src={g.poster_url} alt={g.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">{g.title[0]}</div>
                      }
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-white leading-tight">{g.title}</p>
                          {g.year && <p className="text-xs text-white/40">{g.year}</p>}
                        </div>
                        {isDuo && ratings[0] !== null && ratings[1] !== null && (
                          <span className={`text-xs font-semibold shrink-0 ${diffColor(ratings[0], ratings[1])}`}>
                            {diff(ratings[0], ratings[1])}
                          </span>
                        )}
                      </div>

                      {/* Comparaison */}
                      <div className="mt-3 flex flex-col gap-1.5">
                        {users.map(u => {
                          const e = g.entries[u.email]
                          return (
                            <div key={u.email} className="flex items-center gap-2">
                              <span className="text-xs text-white/50 w-14 shrink-0 truncate">{u.name}</span>
                              {e ? (
                                e.watched
                                  ? <Stars rating={e.rating} />
                                  : <span className="text-xs text-white/30 italic">À voir</span>
                              ) : (
                                <span className="text-xs text-white/20">—</span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Notes */}
                      {userEntries.some(([, e]) => e.note) && (
                        <div className="mt-3 flex flex-col gap-1.5 border-t border-white/8 pt-3">
                          {userEntries.filter(([, e]) => e.note).map(([email, e]) => (
                            <div key={email}>
                              <span className="text-xs font-medium text-white/60">{e.name} : </span>
                              <span className="text-xs text-white/40 italic">"{e.note}"</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
