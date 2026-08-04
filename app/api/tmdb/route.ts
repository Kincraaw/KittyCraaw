import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')
  const type = req.nextUrl.searchParams.get('type') // 'film' | 'serie'
  if (!q) return NextResponse.json([])

  const token = process.env.TMDB_API_TOKEN
  if (!token) return NextResponse.json({ error: 'TMDB token manquant' }, { status: 500 })

  const endpoint = type === 'serie' ? 'search/tv' : 'search/movie'
  const url = `https://api.themoviedb.org/3/${endpoint}?query=${encodeURIComponent(q)}&language=fr-FR&page=1`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  })

  const data = await res.json()

  const results = (data.results ?? []).slice(0, 6).map((item: Record<string, unknown>) => ({
    tmdb_id: item.id,
    title: (item.title ?? item.name) as string,
    year: ((item.release_date ?? item.first_air_date) as string)?.slice(0, 4) ?? null,
    poster_url: item.poster_path
      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
      : null,
  }))

  return NextResponse.json(results)
}
