import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ hasBookings: false })
  }

  const count = await prisma.booking.count({
    where: {
      studentId: session.user.id,
      status: { notIn: ['cancelled'] },
    },
  })

  return NextResponse.json({ hasBookings: count > 0 })
}
