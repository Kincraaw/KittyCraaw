import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entry_id } = await req.json()
  const supabase = getSupabase()

  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .eq('user_email', session.user.email)
    .single()

  if (!entry) return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('name')
    .eq('email', session.user.email)
    .single()

  const { data: otherUser } = await supabase
    .from('users')
    .select('email, name')
    .neq('email', session.user.email)
    .single()

  if (!otherUser) return NextResponse.json({ error: 'Aucun autre membre trouvé' }, { status: 404 })

  const dupQuery = supabase
    .from('entries')
    .select('id')
    .eq('user_email', otherUser.email)

  const { data: dup } = await (entry.tmdb_id
    ? dupQuery.eq('tmdb_id', entry.tmdb_id)
    : dupQuery.ilike('title', entry.title))

  if (dup && dup.length > 0) {
    return NextResponse.json({ error: `${otherUser.name} a déjà ce titre dans sa liste` }, { status: 409 })
  }

  const { error } = await supabase.from('entries').insert({
    user_email: otherUser.email,
    type: entry.type,
    title: entry.title,
    year: entry.year,
    poster_url: entry.poster_url,
    tmdb_id: entry.tmdb_id,
    watched: false,
    status: 'unwatched',
    rating: null,
    note: null,
    suggested_by: currentUser?.name ?? session.user.email,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, to: otherUser.name })
}
