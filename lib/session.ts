import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Role } from '@/types'

// Type alias for session user (matches next-auth.d.ts extension)
type SessionUser = NonNullable<Session['user']>

export async function getSessionUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getSessionUser()
  if (!user) {
    return { user: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user, response: null }
}

export async function requireRole(role: Role) {
  const { user, response } = await requireAuth()
  if (response) return { user: null, response }
  if (user!.role !== role) {
    return { user: null, response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) }
  }
  return { user: user!, response: null }
}

// ─── Utility Helpers ──────────────────────────────────────────────────────────

/**
 * Check if a session user has a specific role.
 * Avoids repeating user.role === role comparisons across route handlers.
 */
export function hasRole(user: SessionUser, role: Role): boolean {
  return user.role === role
}

/**
 * Boolean check on a nullable session — safe to call with null.
 * Use in layouts and server components before accessing session.user.
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user?.id
}
