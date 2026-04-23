import { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api-response'

async function handleCron(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  
  // Create an absolute boundary for 'yesterday'
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  // 1. Expire un-completed pending intents softly drops them via native garbage collection
  const expiredPending = await prisma.booking.updateMany({
    where: {
      status: 'pending',
      createdAt: { lt: thirtyMinutesAgo },
    },
    data: { status: 'cancelled' },
  })

  // 2. Auto-complete strictly past sessions using absolute UTC Date bindings
  const autoCompletedSessions = await prisma.booking.updateMany({
    where: {
      status: 'paid',
      date: { lt: todayStart },
    },
    data: { status: 'completed' },
  })

  const totalExpired = expiredPending.count

  if (totalExpired > 0 || autoCompletedSessions.count > 0) {
    console.log('[CRON_CLEANUP]', {
      expiredPending: expiredPending.count,
      autoCompletedSessions: autoCompletedSessions.count,
    })
  }

  return success({
    expiredCount: totalExpired,
    completedCount: autoCompletedSessions.count,
  })
}

export async function GET(req: NextRequest) { return handleCron(req) }
export async function POST(req: NextRequest) { return handleCron(req) }
