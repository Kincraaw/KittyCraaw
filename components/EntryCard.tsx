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

  async function toggleWatched() {
    setLoading(true)
    const newWatched = !entry.watched
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watched: newWatched, rating: newWatched ? entry.rating : null }),
    })
    const data = await res.json()
    onUpdate(data)
    setLoading(false)
  }

  async function setRating(rating: number) {
    if (!entry.watched) return
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
    const data = await res.json()
    onUpdate(data)
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

      <button
        onClick={e => { e.stopPropagation(); handleDelete() }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white/50 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 text-xs flex items-center justify-center"
        aria-label="Supprimer"
      >
        ✕
      </button>

      <div className="p-3">
        <p className="font-medium text-sm text-white truncate leading-tight">{entry.title}</p>
        {entry.year && <p className="text-xs text-white/40 mt-0.5">{entry.year}</p>}

        <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={toggleWatched}
            disabled={loading}
            className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 ${
              entry.watched
                ? 'bg-violet-500 border-violet-500 text-white'
                : 'border-white/20 hover:border-violet-400'
            }`}
            aria-label={entry.watched ? 'Marquer comme non vu' : 'Marquer comme vu'}
          >
            {entry.watched && <span className="text-xs leading-none">✓</span>}
          </button>
          <span className="text-xs text-white/50">{entry.watched ? 'Vu' : 'À voir'}</span>
        </div>

        <div className={`mt-2 transition-opacity ${entry.watched ? 'opacity-100' : 'opacity-30 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
          <StarRating value={entry.rating} onChange={setRating} readonly={!entry.watched} />
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
