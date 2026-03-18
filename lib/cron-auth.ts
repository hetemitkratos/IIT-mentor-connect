import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifies the CRON_SECRET bearer token on cron route handlers.
 * Returns null if valid, or a 403 NextResponse if invalid.
 */
export function verifyCronSecret(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  return null
}
