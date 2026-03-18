import { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  // Fix #2: 15-minute expiry window (tightened from 30 min)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

  const result = await prisma.booking.updateMany({
    where: {
      status: 'payment_pending',
      createdAt: { lt: fifteenMinutesAgo },
    },
    data: { status: 'cancelled' },
  })

  // Fix #8: Structured log for observability
  if (result.count > 0) {
    console.log('[BOOKING_EXPIRED]', { count: result.count, cutoff: fifteenMinutesAgo.toISOString() })
  }

  return success({ expired: result.count })
}


