import { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api-response'

async function handleCron(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

  // 1. Expire un-completed payment intents
  const expiredPayments = await prisma.booking.updateMany({
    where: {
      status: { in: ['payment_pending', 'awaiting_payment'] },
      updatedAt: { lt: thirtyMinutesAgo },
    },
    data: { status: 'expired' },
  })

  // 2. Expire scheduled no-shows
  const expiredNoShows = await prisma.booking.updateMany({
    where: {
      status: 'scheduled',
      endTime: { lt: new Date() },
      otpVerified: false,
    },
    data: { status: 'expired' },
  })

  // 3. Mark completed sessions
  const completedSessions = await prisma.booking.updateMany({
    where: {
      status: 'in_progress',
      endTime: { lt: new Date() },
    },
    data: { status: 'completed' },
  })

  const totalExpired = expiredPayments.count + expiredNoShows.count

  if (totalExpired > 0 || completedSessions.count > 0) {
    console.log('[CRON_CLEANUP]', {
      expiredPayments: expiredPayments.count,
      expiredNoShows: expiredNoShows.count,
      completedSessions: completedSessions.count,
    })
  }

  return success({
    expiredCount: totalExpired,
    completedCount: completedSessions.count,
  })
}

export async function GET(req: NextRequest) {
  return handleCron(req)
}

export async function POST(req: NextRequest) {
  return handleCron(req)
}
