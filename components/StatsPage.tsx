'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'

interface Stats {
  films: { total: number; watched: number; watching: number; unwatched: number }
  series: { total: number; watched: number; watching: number; unwatched: number }
  avgRating: number | null
  ratingDistribution: number[]
  byMonth: { month: string; count: number }[]
  totalRated: number
}

const MONTH_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return `${MONTH_FR[parseInt(mo) - 1]} ${y.slice(2)}`
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-white/50 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
    </div>
  )
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function StatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
  }, [session])

  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-white/40 text-sm">Chargement…</div></div>
  }

  const maxMonth = stats ? Math.max(...stats.byMonth.map(m => m.count), 1) : 1
  const maxRating = stats ? Math.max(...stats.ratingDistribution, 1) : 1
  const total = stats ? stats.films.total + stats.series.total : 0
  const totalWatched = stats ? stats.films.watched + stats.series.watched : 0

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-lg font-semibold mb-5">📊 Mes stats</h1>

        {loading ? (
          <div className="text-center py-16 text-white/30 text-sm">Chargement…</div>
        ) : stats && (
          <div className="flex flex-col gap-5">

            {/* Résumé global */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Titres au total" value={total} />
              <StatCard label="Vus" value={totalWatched} />
              <StatCard label="Note moyenne" value={stats.avgRating !== null ? `${stats.avgRating} ★` : '—'} sub={stats.totalRated > 0 ? `sur ${stats.totalRated} noté${stats.totalRated > 1 ? 's' : ''}` : undefined} />
            </div>

            {/* Films vs Séries */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '🎬 Films', data: stats.films },
                { label: '📺 Séries', data: stats.series },
              ].map(({ label, data }) => (
                <div key={label} className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
                  <p className="text-sm font-medium text-white mb-3">{label}</p>
                  <div className="flex flex-col gap-2">
                    <ProgressBar label="Vus" value={data.watched} max={data.total} color="bg-violet-500" />
                    <ProgressBar label="En cours" value={data.watching} max={data.total} color="bg-amber-500" />
                    <ProgressBar label="À voir" value={data.unwatched} max={data.total} color="bg-white/20" />
                  </div>
                  <p className="text-xs text-white/30 mt-3">{data.total} au total</p>
                </div>
              ))}
            </div>

            {/* Distribution des notes */}
            {stats.totalRated > 0 && (
              <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
                <p className="text-sm font-medium text-white mb-4">Distribution des notes</p>
                <div className="flex flex-col gap-2">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-8 shrink-0">{'★'.repeat(star)}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-700"
                          style={{ width: `${Math.round((stats.ratingDistribution[star - 1] / maxRating) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40 w-4 text-right">{stats.ratingDistribution[star - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activité par mois */}
            {stats.byMonth.length > 0 && (
              <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
                <p className="text-sm font-medium text-white mb-4">Ajouts par mois</p>
                <div className="flex items-end gap-2 h-24">
                  {stats.byMonth.map(({ month, count }) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-white/40">{count}</span>
                      <div
                        className="w-full rounded-t bg-violet-500/70 transition-all duration-700"
                        style={{ height: `${Math.round((count / maxMonth) * 72)}px` }}
                      />
                      <span className="text-xs text-white/30 leading-tight text-center">{formatMonth(month)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </>
  )
}
