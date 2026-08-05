import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data: entries, error } = await supabase
    .from('entries')
    .select('type, status, watched, rating, created_at, watched_at')
    .eq('user_email', session.user.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const films = entries.filter(e => e.type === 'film')
  const series = entries.filter(e => e.type === 'serie')

  function countStatus(arr: NonNullable<typeof entries>) {
    return {
      total: arr.length,
      watched: arr.filter(e => (e.status ?? (e.watched ? 'watched' : 'unwatched')) === 'watched').length,
      watching: arr.filter(e => (e.status ?? '') === 'watching').length,
      unwatched: arr.filter(e => (e.status ?? (e.watched ? 'watched' : 'unwatched')) === 'unwatched').length,
    }
  }

  const rated = entries.filter(e => e.rating !== null)
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, e) => s + e.rating, 0) / rated.length) * 10) / 10
    : null

  const ratingDistribution = [1, 2, 3, 4, 5].map(star =>
    rated.filter(e => e.rating === star).length
  )

  const byMonth: Record<string, number> = {}
  entries.forEach(e => {
    const date = e.watched_at ?? e.created_at
    const month = date.slice(0, 7)
    byMonth[month] = (byMonth[month] ?? 0) + 1
  })
  const sortedMonths = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }))

  return NextResponse.json({
    films: countStatus(films),
    series: countStatus(series),
    avgRating,
    ratingDistribution,
    byMonth: sortedMonths,
    totalRated: rated.length,
  })
}
