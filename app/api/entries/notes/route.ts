import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tmdb_id = req.nextUrl.searchParams.get('tmdb_id')
  const title = req.nextUrl.searchParams.get('title')

  const supabase = getSupabase()
  let query = supabase
    .from('entries')
    .select('user_email, note, rating, watched')
    .not('note', 'is', null)
    .neq('note', '')

  if (tmdb_id) query = query.eq('tmdb_id', parseInt(tmdb_id))
  else if (title) query = query.ilike('title', title)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrichir avec les prénoms
  const userEmails = [...new Set(data?.map(d => d.user_email) ?? [])]
  const { data: users } = await supabase
    .from('users')
    .select('email, name')
    .in('email', userEmails)

  const nameMap = Object.fromEntries((users ?? []).map(u => [u.email, u.name]))

  const result = (data ?? []).map(d => ({
    name: nameMap[d.user_email] ?? d.user_email,
    note: d.note,
    rating: d.rating,
  }))

  return NextResponse.json(result)
}
