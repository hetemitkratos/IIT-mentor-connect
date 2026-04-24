import { NextResponse } from 'next/server'

/**
 * @deprecated — Cal.com integration has been removed.
 * This route is a no-op stub retained only to avoid 404s from cached clients.
 * Returns 200 with a deprecation notice so stale frontend code doesn't crash.
 */
export async function PATCH() {
  return NextResponse.json({
    deprecated: true,
    message: 'Cal.com integration has been removed. Scheduling is now fully internal.',
  }, { status: 200 })
}
