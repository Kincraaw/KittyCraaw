import { NextResponse } from 'next/server'

export async function GET() {
  const raw = process.env.APP_USERS ?? ''
  const users = raw.split(',').filter(Boolean).map(entry => {
    const parts = entry.trim().split(':')
    return {
      email: parts[0],
      hashStart: parts[1]?.slice(0, 10) + '...',
      name: parts.slice(2).join(':'),
      partsCount: parts.length,
    }
  })
  return NextResponse.json({ users, rawLength: raw.length })
}
