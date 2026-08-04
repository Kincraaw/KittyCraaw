'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Entry, EntryType } from '@/lib/supabase'

interface TmdbResult {
  tmdb_id: number
  title: string
  year: string | null
  poster_url: string | null
}

interface Props {
  type: EntryType
  onAdd: (entry: Entry) => void
  onClose: () => void
}

export default function AddModal({ type, onAdd, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TmdbResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/tmdb?q=${encodeURIComponent(q)}&type=${type}`)
    const data = await res.json()
    setResults(Array.isArray(data) ? data : [])
    setSearching(false)
  }, [type])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  async function handleSelect(result: TmdbResult) {
    setAdding(true)
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: result.title,
        year: result.year ? parseInt(result.year) : null,
        type,
        poster_url: result.poster_url,
        tmdb_id: result.tmdb_id,
      }),
    })
    const data = await res.json()
    onAdd(data)
    setAdding(false)
    onClose()
  }

  async function handleManual(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setAdding(true)
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: query.trim(), type }),
    })
    const data = await res.json()
    onAdd(data)
    setAdding(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--color-surface-2)] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <h2 className="text-base font-semibold mb-3">
            Ajouter {type === 'film' ? 'un film' : 'une série'}
          </h2>
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            placeholder={type === 'film' ? 'Rechercher un film…' : 'Rechercher une série…'}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {searching && (
            <div className="py-6 text-center text-white/40 text-sm">Recherche…</div>
          )}

          {!searching && results.length > 0 && (
            <ul>
              {results.map(r => (
                <li key={r.tmdb_id}>
                  <button
                    onClick={() => handleSelect(r)}
                    disabled={adding}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-14 rounded-md overflow-hidden shrink-0 bg-white/5 border border-white/10">
                      {r.poster_url ? (
                        <img src={r.poster_url} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">?</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.title}</p>
                      {r.year && <p className="text-xs text-white/40 mt-0.5">{r.year}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && query.trim() && results.length === 0 && (
            <div className="py-4 px-4">
              <p className="text-white/40 text-sm text-center mb-3">Aucun résultat TMDB</p>
              <button
                onClick={handleManual}
                disabled={adding}
                className="w-full rounded-xl border border-white/10 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                Ajouter "{query}" manuellement
              </button>
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-white/30 text-sm">
              Tape le nom pour chercher
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/8">
          <button onClick={onClose} className="w-full text-sm text-white/40 hover:text-white/70 transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
