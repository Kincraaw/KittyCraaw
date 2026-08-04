'use client'

import { useState, useRef, useEffect } from 'react'
import type { Entry, EntryType } from '@/lib/supabase'

interface Props {
  type: EntryType
  onAdd: (entry: Entry) => void
  onClose: () => void
}

export default function AddModal({ type, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), year: year ? parseInt(year) : null, type }),
    })
    const data = await res.json()
    onAdd(data)
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--color-surface-2)] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-4">
          Ajouter {type === 'film' ? 'un film' : 'une série'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Titre *</label>
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'film' ? 'Ex: Dune Part Two' : 'Ex: Breaking Bad'}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Année (optionnel)</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="2024"
              min="1900"
              max="2099"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
