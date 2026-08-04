import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabase } from '@/lib/supabase'

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
  }

  if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
    return NextResponse.json({ error: 'Cet email n\'est pas autorisé' }, { status: 403 })
  }

  const supabase = getSupabase()
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Allowed emails:', ALLOWED_EMAILS)
  console.log('Email reçu:', email.toLowerCase())

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { error } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase(), password_hash, name })

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
