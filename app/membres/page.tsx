'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export default function MembresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/users').then(r => r.json()).then(setUsers)
    }
  }, [session])

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/bg/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    setUploadMsg(res.ok ? { ok: true, text: '✓ Image de fond mise à jour !' } : { ok: false, text: data.error })
    e.target.value = ''
  }

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const COLORS = ['bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-amber-500']

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-xl font-semibold mb-6">👥 Membres</h1>
        {/* Upload fond */}
        <div className="rounded-xl border border-white/8 bg-[var(--color-surface)] p-4 mb-5 max-w-sm">
          <p className="text-sm font-medium text-white mb-1">🖼️ Image de fond</p>
          <p className="text-xs text-white/40 mb-3">Visible uniquement en thème image. Stockée de façon privée.</p>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleBgUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Envoi…' : 'Choisir une image'}
          </button>
          {uploadMsg && (
            <p className={`mt-2 text-xs ${uploadMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{uploadMsg.text}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 max-w-sm">
          {users.map((user, i) => (
            <div key={user.id} className="flex items-center gap-4 rounded-xl border border-white/8 bg-[var(--color-surface)] p-4">
              <div className={`w-10 h-10 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-sm font-semibold text-white shrink-0`}>
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-white">{user.name}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
              <div className="ml-auto text-xs text-white/30 shrink-0">
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
