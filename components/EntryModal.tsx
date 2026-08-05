'use client'

import { useState, useEffect } from 'react'
import StarRating from './StarRating'
import type { Entry } from '@/lib/supabase'

interface MemberNote {
  name: string
  note: string
  rating: number | null
}

interface Props {
  entry: Entry
  onUpdate: (updated: Entry) => void
  onClose: () => void
}

export default function EntryModal({ entry, onUpdate, onClose }: Props) {
  const [note, setNote] = useState(entry.note ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [memberNotes, setMemberNotes] = useState<MemberNote[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [suggestMsg, setSuggestMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const param = entry.tmdb_id
      ? `tmdb_id=${entry.tmdb_id}`
      : `title=${encodeURIComponent(entry.title)}`
    fetch(`/api/entries/notes?${param}`)
      .then(r => r.json())
      .then(setMemberNotes)
  }, [entry.tmdb_id, entry.title])

  async function suggest() {
    setSuggesting(true)
    setSuggestMsg(null)
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entry.id }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuggestMsg({ ok: true, text: `✓ Suggéré à ${data.to} !` })
    } else {
      setSuggestMsg({ ok: false, text: data.error })
    }
    setSuggesting(false)
  }

  async function saveNote() {
    setSaving(true)
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    const data = await res.json()
    onUpdate(data)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const POSTER_COLORS = ['from-violet-900 to-purple-950', 'from-blue-900 to-indigo-950', 'from-teal-900 to-emerald-950']
  const posterColor = POSTER_COLORS[entry.title.length % POSTER_COLORS.length]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[var(--color-surface-2)] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        <div className="flex gap-4 p-5 border-b border-white/8">
          <div className={`w-20 h-28 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br ${posterColor}`}>
            {entry.poster_url
              ? <img src={entry.poster_url} alt={entry.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-lg">{entry.title[0]}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white leading-tight">{entry.title}</h2>
            {entry.year && <p className="text-sm text-white/40 mt-0.5">{entry.year}</p>}
            <div className="mt-3">
              <StarRating value={entry.rating} readonly />
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${entry.watched ? 'bg-violet-500/20 text-violet-300' : 'bg-white/10 text-white/40'}`}>
                {entry.watched ? '✓ Vu' : 'À voir'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none">✕</button>
            <button
              onClick={suggest}
              disabled={suggesting}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 whitespace-nowrap"
            >
              {suggesting ? '…' : '💌 Suggérer'}
            </button>
            {suggestMsg && (
              <span className={`text-xs ${suggestMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                {suggestMsg.text}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 border-b border-white/8">
          <label className="text-xs text-white/50 mb-2 block">Ma note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={entry.watched ? 'Écris ce que tu as pensé du film…' : 'Tu pourras écrire une note une fois le film vu.'}
            disabled={!entry.watched}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500 transition-colors resize-none disabled:opacity-40"
          />
          {entry.watched && (
            <div className="flex justify-end mt-2">
              <button
                onClick={saveNote}
                disabled={saving}
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>

        {memberNotes.length > 0 && (
          <div className="p-5">
            <p className="text-xs text-white/50 mb-3">Notes des membres</p>
            <div className="flex flex-col gap-3">
              {memberNotes.map((m, i) => (
                <div key={i} className="rounded-xl bg-white/5 border border-white/8 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">{m.name}</span>
                    {m.rating && <StarRating value={m.rating} readonly />}
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
