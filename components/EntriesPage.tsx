'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import EntryCard from './EntryCard'
import AddModal from './AddModal'
import type { Entry, EntryType } from '@/lib/supabase'

type Filter = 'all' | 'watched' | 'watching' | 'unwatched'
type Sort = 'date' | 'title' | 'rating' | 'year'

export default function EntriesPage({ type }: { type: EntryType }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('date')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/entries?type=${type}`)
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [type])

  useEffect(() => { if (session) fetchEntries() }, [session, fetchEntries])

  function handleAdd(entry: Entry) { setEntries(prev => [entry, ...prev]) }
  function handleUpdate(updated: Entry) { setEntries(prev => prev.map(e => e.id === updated.id ? updated : e)) }
  function handleDelete(id: string) { setEntries(prev => prev.filter(e => e.id !== id)) }

  const filtered = entries
    .filter(e => {
      const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
      const status = e.status ?? (e.watched ? 'watched' : 'unwatched')
      const matchFilter = filter === 'all' || status === filter
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1)
      if (sort === 'year') return (b.year ?? 0) - (a.year ?? 0)
      return 0 // 'date' = ordre d'ajout (déjà trié par l'API)
    })

  const watchedCount = entries.filter(e => (e.status ?? (e.watched ? 'watched' : 'unwatched')) === 'watched').length
  const watchingCount = entries.filter(e => (e.status ?? '') === 'watching').length
  const ratedEntries = entries.filter(e => e.rating !== null)
  const avgRating = ratedEntries.length
    ? (ratedEntries.reduce((sum, e) => sum + (e.rating ?? 0), 0) / ratedEntries.length).toFixed(1)
    : '—'

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-sm">Chargement…</div>
      </div>
    )
  }

  const label = type === 'film' ? 'films' : 'séries'

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold">{type === 'film' ? '🎬 Films' : '📺 Séries'}</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            <span className="text-base leading-none">+</span> Ajouter
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5 max-w-lg">
          <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
            <div className="text-2xl font-semibold">{watchedCount}</div>
            <div className="text-xs text-white/50 mt-0.5">{label.charAt(0).toUpperCase() + label.slice(1)} vus</div>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
            <div className="text-2xl font-semibold">{avgRating} {avgRating !== '—' && '★'}</div>
            <div className="text-xs text-white/50 mt-0.5">Note moyenne</div>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4">
            <div className="text-2xl font-semibold">{watchingCount > 0 ? watchingCount : entries.length - watchedCount}</div>
            <div className="text-xs text-white/50 mt-0.5">{watchingCount > 0 ? 'En cours' : 'À voir'}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500 transition-colors flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {([['all', 'Tout'], ['watched', 'Vus'], ['watching', 'En cours'], ['unwatched', 'À voir']] as [Filter, string][]).map(([f, lbl]) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded px-3 py-1 text-xs transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {([['date', '🕐 Date'], ['title', 'A→Z'], ['rating', '★ Note'], ['year', '📅 Année']] as [Sort, string][]).map(([s, label]) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`rounded px-3 py-1 text-xs transition-colors ${sort === s ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/30 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">{entries.length === 0 ? '🎞️' : '🔍'}</div>
            <p className="text-white/40 text-sm">
              {entries.length === 0
                ? `Aucun${type === 'serie' ? 'e' : ''} ${type} pour l'instant`
                : 'Aucun résultat'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-violet-400 text-sm hover:text-violet-300 transition-colors"
              >
                Ajouter {type === 'film' ? 'un film' : 'une série'} →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {filtered.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <AddModal type={type} onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
