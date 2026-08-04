import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

interface StoredUser {
  email: string
  passwordHash: string
  name: string
}

function getUsers(): StoredUser[] {
  const raw = process.env.APP_USERS ?? ''
  // Format: "email1:hash1:name1,email2:hash2:name2"
  return raw.split(',').filter(Boolean).map(entry => {
    const [email, passwordHash, ...nameParts] = entry.trim().split(':')
    return { email: email.toLowerCase(), passwordHash, name: nameParts.join(':') || email }
  })
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const users = getUsers()
        const user = users.find(u => u.email === credentials.email.toLowerCase())
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return { id: user.email, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
