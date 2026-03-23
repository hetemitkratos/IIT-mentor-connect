import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { error, success } from '@/lib/api-response'
import { rateBookingSchema } from '@/lib/validators/booking.validator'

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const body = await req.json()
  const parsed = rateBookingSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  const { bookingId, rating, review } = parsed.data

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  })

  if (!booking) return error('Booking not found', 404)

  if (booking.studentId !== user?.id) {
    return error('Unauthorized', 403)
  }

  if (booking.status !== 'completed') {
    return error('Session not completed', 400)
  }

  if (!booking.otpVerified) {
    return error('Session not verified', 400)
  }

  if (booking.rating) {
    return error('Already rated', 400)
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return error('Invalid rating', 400)
  }

  const cleanReview = review?.trim()
  if (cleanReview && cleanReview.length > 300) {
    return error('Review too long', 400)
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      rating,
      review: cleanReview || null
    }
  })

  return success({ message: 'Rating submitted successfully' })
}
