import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

type Role = 'aspirant' | 'mentor' | 'admin'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
  }
}

