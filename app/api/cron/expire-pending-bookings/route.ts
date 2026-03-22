import { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api-response'

async function handleCron(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  const thirtyMinutesAgo  = new Date(Date.now() - 30 * 60 * 1000)

  // Expire bookings that never went to Calendly (15 min)
  const expired1 = await prisma.booking.updateMany({
    where: {
      status: 'payment_pending',
      createdAt: { lt: fifteenMinutesAgo },
    },
    data: { status: 'cancelled' },
  })

  // Expire bookings where Calendly was done but payment never completed (30 min since scheduling)
  const expired2 = await prisma.booking.updateMany({
    where: {
      status: 'awaiting_payment',
      updatedAt: { lt: thirtyMinutesAgo },
    },
    data: { status: 'cancelled' },
  })

  const totalExpired = expired1.count + expired2.count

  // Fix #8: Structured log for observability
  if (totalExpired > 0) {
    console.log('[BOOKING_EXPIRED]', {
      paymentPending: expired1.count,
      pendingPayment: expired2.count,
      cutoff15: fifteenMinutesAgo.toISOString(),
      cutoff30: thirtyMinutesAgo.toISOString(),
    })
  }

  return success({ expiredCount: totalExpired }) // return expiredCount specifically per requirements
}

export async function GET(req: NextRequest) {
  return handleCron(req)
}

export async function POST(req: NextRequest) {
  return handleCron(req)
}


