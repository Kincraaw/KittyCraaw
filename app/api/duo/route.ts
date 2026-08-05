import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type') ?? 'film'
  const supabase = getSupabase()

  // Récupérer toutes les entrées du type demandé
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*')
    .eq('type', type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Récupérer les prénoms
  const emails = [...new Set(entries?.map(e => e.user_email) ?? [])]
  const { data: users } = await supabase
    .from('users')
    .select('email, name')
    .in('email', emails)

  const nameMap = Object.fromEntries((users ?? []).map(u => [u.email, u.name]))

  // Grouper par tmdb_id ou titre
  const groups = new Map<string, { key: string; title: string; year: number | null; poster_url: string | null; entries: Record<string, { name: string; rating: number | null; watched: boolean; note: string | null }> }>()

  for (const entry of entries ?? []) {
    const key = entry.tmdb_id ? `tmdb_${entry.tmdb_id}` : `title_${entry.title.toLowerCase()}`

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: entry.title,
        year: entry.year,
        poster_url: entry.poster_url,
        entries: {},
      })
    }

    const group = groups.get(key)!
    group.entries[entry.user_email] = {
      name: nameMap[entry.user_email] ?? entry.user_email,
      rating: entry.rating,
      watched: entry.watched,
      note: entry.note,
    }
  }

  // Trier : d'abord les films vus par les deux, puis par les deux non vus, puis solo
  const result = Array.from(groups.values()).sort((a, b) => {
    const aCount = Object.keys(a.entries).length
    const bCount = Object.keys(b.entries).length
    return bCount - aCount
  })

  return NextResponse.json({ result, users: users ?? [] })
}
