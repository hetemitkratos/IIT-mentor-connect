import { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const result = await prisma.booking.updateMany({
    where: {
      status: 'scheduled',
      endTime: { lt: new Date() },
    },
    data: { status: 'completed' },
  })

  return success({ completed: result.count })
}

