import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  const supabase = getSupabase()

  let query = supabase
    .from('entries')
    .select('*')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, year, type, poster_url, tmdb_id, genres } = body
  if (!title || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = getSupabase()

  // Vérifier si l'entrée existe déjà
  let dupQuery = supabase
    .from('entries')
    .select('id')
    .eq('user_email', session.user.email)
    .eq('type', type)

  if (tmdb_id) dupQuery = dupQuery.eq('tmdb_id', tmdb_id)
  else dupQuery = dupQuery.ilike('title', title.trim())

  const { data: existing } = await dupQuery.single()
  if (existing) return NextResponse.json({ error: 'Déjà dans ta liste' }, { status: 409 })

  const { data, error } = await supabase
    .from('entries')
    .insert({ user_email: session.user.email, title, year: year || null, type, watched: false, rating: null, poster_url: poster_url || null, tmdb_id: tmdb_id || null, genres: genres ?? [] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
