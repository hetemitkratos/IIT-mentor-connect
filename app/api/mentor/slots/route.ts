import { NextResponse } from 'next/server'

const DEPRECATION_MESSAGE = {
  deprecated: true,
  message:
    'This endpoint is deprecated. Use GET /api/mentor/availability (weekly schedule) instead.',
  migration:
    'POST /api/mentor/availability with [{ dayOfWeek, startTime, endTime, isActive }]',
}

/**
 * @deprecated — Slot model is deprecated. This endpoint is a no-op stub.
 * Returns 200 with deprecation notice to avoid crashing stale clients.
 * Any attempt to write here throws at the service layer.
 */
export async function POST() {
  // Safeguard: throw at the service boundary so no legacy code accidentally writes slots
  throw new Error('Slot model is deprecated — use Availability instead')
}

export async function GET() {
  return NextResponse.json({ success: true, ...DEPRECATION_MESSAGE }, { status: 200 })
}
