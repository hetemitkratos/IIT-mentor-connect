import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { error, success } from '@/lib/api-response'
import { z } from 'zod'

const completeBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  if (user?.role !== 'mentor') {
    return error('Unauthorized', 403)
  }

  const body = await req.json()
  const parsed = completeBookingSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  const { bookingId } = parsed.data

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mentor: true }
  })

  if (!booking) return error('Booking not found', 404)

  // VERY IMPORTANT: Mentor Ownership Check
  if (booking.mentor.userId !== user.id) {
    return error('Unauthorized', 403)
  }

  // STATUS CHECK
  if (booking.status === 'completed') {
    return error('Already completed', 400)
  }
  if (booking.status !== 'in_progress') {
    return error('Session is not in progress', 400)
  }

  // TIME CHECK
  const now = new Date()
  if (!booking.startTime) {
    return error('Session has no start time', 400)
  }
  if (now < booking.startTime) {
    return error('Session not started', 400)
  }
  // 5 minute buffer to prevent instant completion
  if (now < new Date(booking.startTime.getTime() + 5 * 60 * 1000)) {
    return error('Session just started, wait a bit', 400)
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'completed' }
  })

  return success({ message: 'Session marked as completed' })
}
