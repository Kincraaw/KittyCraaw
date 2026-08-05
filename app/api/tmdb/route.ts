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
  const genreEndpoint = type === 'serie' ? 'genre/tv/list' : 'genre/movie/list'
  const headers = { Authorization: `Bearer ${token}` }

  const [searchRes, genreRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/${endpoint}?query=${encodeURIComponent(q)}&language=fr-FR&page=1`, { headers, next: { revalidate: 60 } }),
    fetch(`https://api.themoviedb.org/3/${genreEndpoint}?language=fr-FR`, { headers, next: { revalidate: 86400 } }),
  ])

  const [data, genreData] = await Promise.all([searchRes.json(), genreRes.json()])

  const genreMap: Record<number, string> = {}
  for (const g of (genreData.genres ?? [])) genreMap[g.id] = g.name

  const results = (data.results ?? []).slice(0, 6).map((item: Record<string, unknown>) => ({
    tmdb_id: item.id,
    title: (item.title ?? item.name) as string,
    year: ((item.release_date ?? item.first_air_date) as string)?.slice(0, 4) ?? null,
    poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
    genres: ((item.genre_ids as number[]) ?? []).map(id => genreMap[id]).filter(Boolean),
  }))

  return NextResponse.json(results)
}
