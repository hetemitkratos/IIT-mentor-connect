import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { error } from '@/lib/api-response'
import { CAL_TOKEN_URL, CAL_ME_URL, getCalClientId, getCalClientSecret, getCalRedirectUri } from '@/constants/cal'

/**
 * GET /api/auth/cal/callback
 * Receives the OAuth authorization code from Cal.com, exchanges it for tokens,
 * fetches the mentor's Cal.com username, and saves everything to the DB.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const code    = searchParams.get('code')
  const state   = searchParams.get('state')   // userId we sent as state param
  const errParam = searchParams.get('error')

  // ── User denied access ────────────────────────────────────────────────────
  if (errParam) {
    return Response.redirect(new URL('/mentor/dashboard?cal=denied', req.url))
  }

  if (!code || !state) {
    return error('Missing code or state parameter', 400)
  }

  // ── Exchange code for tokens ──────────────────────────────────────────────
  let accessToken: string
  let refreshToken: string | null = null

  try {
    const tokenRes = await fetch(CAL_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        client_id:     getCalClientId(),
        client_secret: getCalClientSecret(),
        redirect_uri:  getCalRedirectUri(),
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[CAL_CALLBACK] Token exchange failed:', body)
      return Response.redirect(new URL('/mentor/dashboard?cal=error', req.url))
    }

    const tokens = await tokenRes.json()
    accessToken  = tokens.access_token
    refreshToken = tokens.refresh_token ?? null
  } catch (err) {
    console.error('[CAL_CALLBACK] Token exchange threw:', err)
    return Response.redirect(new URL('/mentor/dashboard?cal=error', req.url))
  }

  // ── Fetch Cal.com profile (username) ─────────────────────────────────────
  let calUsername: string | null = null

  try {
    const meRes = await fetch(CAL_ME_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (meRes.ok) {
      const me = await meRes.json()
      calUsername = me?.data?.username ?? me?.username ?? null
    }
  } catch {
    // Non-fatal — we still save the token even if profile fetch fails
    console.warn('[CAL_CALLBACK] Could not fetch Cal.com profile')
  }

  // ── Persist to DB via Prisma service layer ────────────────────────────────
  try {
    const mentor = await prisma.mentor.findUnique({
      where:  { userId: state },
      select: { id: true },
    })

    if (!mentor) {
      console.error('[CAL_CALLBACK] No mentor found for userId:', state)
      return Response.redirect(new URL('/mentor/dashboard?cal=error', req.url))
    }

    await prisma.mentor.update({
      where: { id: mentor.id },
      data: {
        calAccessToken:  accessToken,
        calRefreshToken: refreshToken,
        calUsername,
        calConnected:    true,
      },
    })

    console.log(`[CAL_CALLBACK] Mentor ${mentor.id} connected to Cal.com${calUsername ? ` as @${calUsername}` : ''}`)
  } catch (err) {
    console.error('[CAL_CALLBACK] DB update failed:', err)
    return Response.redirect(new URL('/mentor/dashboard?cal=error', req.url))
  }

  // ── Success → back to dashboard ───────────────────────────────────────────
  return Response.redirect(new URL('/mentor/dashboard?cal=connected', req.url))
}
