'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import EntryModal from './EntryModal'
import type { Entry } from '@/lib/supabase'

const POSTER_COLORS = [
  'from-violet-900 to-purple-950',
  'from-blue-900 to-indigo-950',
  'from-teal-900 to-emerald-950',
  'from-rose-900 to-pink-950',
  'from-amber-900 to-orange-950',
  'from-slate-800 to-slate-950',
]

function getPosterColor(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) & 0xffffffff
  return POSTER_COLORS[Math.abs(hash) % POSTER_COLORS.length]
}

function getInitials(title: string) {
  return title.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

interface Props {
  entry: Entry
  onUpdate: (updated: Entry) => void
  onDelete: (id: string) => void
}

export default function EntryCard({ entry, onUpdate, onDelete }: Props) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  async function cycleStatus() {
    setLoading(true)
    const cycle: Record<string, string> = { unwatched: 'watching', watching: 'watched', watched: 'unwatched' }
    const newStatus = cycle[entry.status ?? 'unwatched']
    const newWatched = newStatus === 'watched'
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, watched: newWatched, rating: newWatched ? entry.rating : null }),
    })
    const data = await res.json()
    onUpdate(data)
    setLoading(false)
  }

  async function setRating(rating: number) {
    if ((entry.status ?? (entry.watched ? 'watched' : 'unwatched')) !== 'watched') return
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
    const data = await res.json()
    onUpdate(data)
  }

  async function toggleLock() {
    setLoading(true)
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked: !entry.locked }),
    })
    const data = await res.json()
    onUpdate(data)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${entry.title}" ?`)) return
    await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
    onDelete(entry.id)
  }

  const posterColor = getPosterColor(entry.title)
  const initials = getInitials(entry.title)

  return (
    <>
    <div className="group relative rounded-xl overflow-hidden border border-white/8 bg-[var(--color-surface)] hover:border-white/20 transition-all cursor-pointer" onClick={() => setShowModal(true)}>
      <div className={`h-36 bg-gradient-to-br ${posterColor} flex items-center justify-center overflow-hidden`}>
        {entry.poster_url ? (
          <img src={entry.poster_url} alt={entry.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-white/30 tracking-wider">{initials}</span>
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {(entry.status ?? (entry.watched ? 'watched' : 'unwatched')) === 'watched' && (
          <button
            onClick={e => { e.stopPropagation(); toggleLock() }}
            className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 transition-all text-xs flex items-center justify-center"
            aria-label={entry.locked ? 'Déverrouiller' : 'Verrouiller'}
          >
            {entry.locked ? '🔒' : '🔓'}
          </button>
        )}
        {!entry.locked && (
          <button
            onClick={e => { e.stopPropagation(); handleDelete() }}
            className="w-6 h-6 rounded-full bg-black/60 text-white/50 hover:text-red-400 hover:bg-black/80 transition-all text-xs flex items-center justify-center"
            aria-label="Supprimer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-3">
        {entry.suggested_by && (
          <p className="text-xs text-amber-400/80 mb-1">💌 {entry.suggested_by}</p>
        )}
        <p className="font-medium text-sm text-white truncate leading-tight">{entry.title}</p>
        {entry.year && <p className="text-xs text-white/40 mt-0.5">{entry.year}</p>}
        {entry.watched_at && (
          <p className="text-xs text-white/30 mt-0.5">
            Vu le {new Date(entry.watched_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

        <div className="mt-3" onClick={e => e.stopPropagation()}>
          {(() => {
            const status = entry.status ?? (entry.watched ? 'watched' : 'unwatched')
            const cfg = {
              unwatched: { label: 'À voir', cls: 'bg-white/8 text-white/50 hover:bg-white/12' },
              watching:  { label: 'En cours', cls: 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/40' },
              watched:   { label: 'Vu ✓', cls: 'bg-violet-600/30 text-violet-300 hover:bg-violet-600/40' },
            }[status]
            return (
              <button
                onClick={cycleStatus}
                disabled={loading || entry.locked}
                className={`w-full rounded px-2 py-1 text-xs font-medium transition-all ${entry.locked ? 'opacity-50 cursor-not-allowed ' : ''}${cfg.cls}`}
              >
                {cfg.label}
              </button>
            )
          })()}
        </div>

        <div className={`mt-2 transition-opacity ${(entry.status ?? (entry.watched ? 'watched' : 'unwatched')) === 'watched' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
          <StarRating value={entry.rating} onChange={setRating} readonly={!entry.watched || entry.locked} />
        </div>
      </div>
    </div>

    {showModal && (
      <EntryModal
        entry={entry}
        onUpdate={updated => { onUpdate(updated); setShowModal(false) }}
        onClose={() => setShowModal(false)}
      />
    )}
    </>
  )
}
