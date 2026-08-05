import { createClient } from '@supabase/supabase-js'

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars manquants')
  return createClient(url, key)
}

export type EntryType = 'film' | 'serie'
export type EntryStatus = 'unwatched' | 'watching' | 'watched'

export interface Entry {
  id: string
  user_email: string
  type: EntryType
  title: string
  year: number | null
  watched: boolean
  status: EntryStatus
  rating: number | null
  poster_url: string | null
  tmdb_id: number | null
  note: string | null
  suggested_by: string | null
  created_at: string
}
