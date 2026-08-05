'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface UserEntry {
  name: string
  rating: number | null
  watched: boolean
  status: string
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
type Filter = 'all' | 'duo' | 'diff'

const POSTER_COLORS = ['from-violet-900 to-purple-950', 'from-blue-900 to-indigo-950', 'from-teal-900 to-emerald-950', 'from-rose-900 to-pink-950']

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-white/20 text-xs">—</span>
  return <span className="text-amber-400 text-xs tracking-tight">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    watched: 'bg-violet-600/30 text-violet-300',
    watching: 'bg-amber-600/30 text-amber-300',
    unwatched: 'bg-white/8 text-white/40',
  }
  const labels: Record<string, string> = { watched: 'Vu', watching: 'En cours', unwatched: 'À voir' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg[status] ?? cfg.unwatched}`}>
      {labels[status] ?? 'À voir'}
    </span>
  )
}

function UserSide({ entry, align }: { entry: UserEntry | undefined; align: 'left' | 'right' }) {
  const isLeft = align === 'left'
  if (!entry) {
    return (
      <div className={`flex-1 flex flex-col items-${isLeft ? 'end' : 'start'} justify-center gap-1 opacity-25 px-3`}>
        <span className="text-xs text-white/40">—</span>
      </div>
    )
  }
  return (
    <div className={`flex-1 flex flex-col ${isLeft ? 'items-end text-right' : 'items-start text-left'} justify-center gap-1.5 px-3`}>
      <StatusBadge status={entry.status} />
      <Stars rating={entry.rating} />
      {entry.note && (
        <p className="text-xs text-white/35 italic leading-tight line-clamp-2 max-w-[120px]">"{entry.note}"</p>
      )}
    </div>
  )
}

export default function DuoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('film')
  const [filter, setFilter] = useState<Filter>('all')

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

  // Identifier moi vs l'autre
  const me = users.find(u => u.email === session?.user?.email)
  const other = users.find(u => u.email !== session?.user?.email)

  const filtered = groups.filter(g => {
    const count = Object.keys(g.entries).length
    if (filter === 'duo') return count >= 2
    if (filter === 'diff') {
      const ratings = Object.values(g.entries).map(e => e.rating).filter((r): r is number => r !== null)
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
        const r = Object.values(g.entries).map(e => e.rating).filter((r): r is number => r !== null)
        return sum + (r.length === 2 ? Math.abs(r[0] - r[1]) : 0)
      }, 0) / sharedWatched.length).toFixed(1)
    : '—'

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-lg font-semibold mb-5">🎭 Duo</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
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

        {/* Tabs + Filtres */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {(['film', 'serie'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded px-4 py-1.5 text-sm transition-colors ${tab === t ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
                {t === 'film' ? '🎬 Films' : '📺 Séries'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {([['all', 'Tout'], ['duo', 'En commun'], ['diff', 'Désaccords']] as [Filter, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`rounded px-3 py-1 text-xs transition-colors ${filter === val ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* En-tête colonnes */}
        {!loading && filtered.length > 0 && me && other && (
          <div className="flex items-center mb-2 px-1">
            <div className="flex-1 text-right pr-3">
              <span className="text-xs font-medium text-white/60">{me.name}</span>
            </div>
            <div className="w-20 shrink-0" />
            <div className="flex-1 pl-3">
              <span className="text-xs font-medium text-white/60">{other.name}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-white/30 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">Aucun résultat</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(g => {
              const myEntry = me ? g.entries[me.email] : undefined
              const otherEntry = other ? g.entries[other.email] : undefined
              const posterColor = POSTER_COLORS[g.title.length % POSTER_COLORS.length]
              const isDuo = !!myEntry && !!otherEntry
              const bothRated = myEntry?.rating != null && otherEntry?.rating != null
              const agree = bothRated && myEntry!.rating === otherEntry!.rating

              return (
                <div key={g.key} className={`flex items-center rounded-xl border bg-[var(--color-surface)] overflow-hidden transition-all ${isDuo ? 'border-white/12' : 'border-white/6 opacity-75'}`}>
                  {/* Côté gauche — moi */}
                  <UserSide entry={myEntry} align="left" />

                  {/* Centre — film */}
                  <div className="w-20 shrink-0 flex flex-col items-center py-3 gap-2">
                    <div className={`w-12 h-16 rounded-lg overflow-hidden bg-gradient-to-br ${posterColor} relative`}>
                      {g.poster_url
                        ? <img src={g.poster_url} alt={g.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-sm">{g.title[0]}</div>
                      }
                      {isDuo && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border border-[var(--color-surface)] flex items-center justify-center text-xs ${agree ? 'bg-emerald-500' : bothRated ? 'bg-red-500' : 'bg-white/20'}`}>
                          {agree ? '=' : bothRated ? '!' : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-center px-1">
                      <p className="text-xs font-medium text-white leading-tight line-clamp-2">{g.title}</p>
                      {g.year && <p className="text-xs text-white/30 mt-0.5">{g.year}</p>}
                    </div>
                  </div>

                  {/* Côté droit — l'autre */}
                  <UserSide entry={otherEntry} align="right" />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
