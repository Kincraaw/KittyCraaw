'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/users').then(r => r.json()).then(setUsers)
    }
  }, [session])

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const COLORS = ['bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-amber-500']

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-xl font-semibold mb-6">👥 Membres</h1>
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
