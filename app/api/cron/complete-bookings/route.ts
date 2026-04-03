import { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api-response'

async function handleCron(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const result = await prisma.booking.updateMany({
    where: {
      status: 'in_progress',
      endTime: { lt: new Date() },
    },
    data: { status: 'completed' },
  })

  return success({ completed: result.count })
}

// Vercel Cron sends GET — must export both
export async function GET(req: NextRequest) {
  return handleCron(req)
}

export async function POST(req: NextRequest) {
  return handleCron(req)
}

