import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/types'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Reject sign-in if no email is present
      if (!user.email) return false

      console.log('[AUTH] signIn callback — user:', { id: user.id, email: user.email, name: user.name })

      // Safety net: ensure User row exists in DB
      // PrismaAdapter v1 may not reliably create users with Prisma 7's adapter-based client.
      // upsert guarantees the row exists without duplicating if the adapter already created it.
      try {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          },
          select: { id: true },
        })
        // Patch user.id so the jwt callback gets the real DB id
        user.id = dbUser.id
        console.log('[AUTH] signIn — user ensured in DB, id:', dbUser.id)

        // Also ensure Account is linked to User
        if (account) {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {},
            create: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token ?? null,
              access_token: account.access_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state: account.session_state as string | null ?? null,
            },
          })
          console.log('[AUTH] signIn — account linked for provider:', account.provider)
        }
      } catch (err) {
        console.error('[AUTH] signIn — failed to ensure user/account:', err)
        // Don't block sign-in; the jwt callback will attempt DB lookup as fallback
      }

      return true
    },

    async jwt({ token, user }) {
      // On first sign-in, user object is present with the DB id
      if (user) {
        console.log('[AUTH] jwt callback (first sign-in) — user:', { id: user.id, email: user.email })
        token.id = user.id
        // Fetch role from DB (Google profile doesn't carry role)
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        token.role = (dbUser?.role as Role) ?? 'aspirant'
      }

      // Token rotation fallback — re-fetch if id/role missing on subsequent requests
      if (!token.id && token.email) {
        console.warn('[AUTH] jwt — token.id missing, looking up by email:', token.email)
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role as Role
        }
      }

      return token
    },

    async session({ session, token }) {
      // Guard against malformed token — only inject if both id and role are present
      if (session.user && token.id && token.role) {
        session.user.id = token.id
        session.user.role = token.role
      }
      console.log('[AUTH] session callback — user:', { id: session.user?.id, email: session.user?.email, role: (session.user as Record<string, unknown>)?.role })
      return session
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}


