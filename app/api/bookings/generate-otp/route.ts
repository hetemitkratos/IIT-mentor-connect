import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/security'
import { generateOtpSchema } from '@/lib/validators/otp.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (response) return response

    const rateLimitResponse = checkRateLimit(`generate_otp_${user!.id}`)
    if (rateLimitResponse) return rateLimitResponse

    const body = await req.json()
    const parsed = generateOtpSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues[0].message, 400)
    const { bookingId } = parsed.data

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) return error('Booking not found', 404)
    if (booking.status !== 'scheduled') return error('Invalid booking state', 400)

    // Ensure Role Safety
    if (user!.id !== booking.studentId) {
      return error('Unauthorized', 403)
    }

    if (!booking.startTime || !booking.endTime) {
      return error('Session time not set', 400)
    }

    // Normalize Time Comparisons
    const now = new Date()
    const start = new Date(booking.startTime)
    const end = new Date(booking.endTime)

    // Time window restriction: [startTime - 5 mins, endTime]
    if (now.getTime() < start.getTime() - 5 * 60 * 1000) {
      return error('Session not started yet', 400)
    }
    if (now.getTime() > end.getTime()) {
      return error('Session already ended', 400)
    }

    // Double Verification Prevention
    if (booking.otpVerified) {
      return error('Session already verified', 400)
    }

    // Prevent Regeneration Spam (reuse valid OTP if under 15 minutes)
    if (booking.otp && booking.otpGeneratedAt && !booking.otpVerified) {
      const generatedAt = new Date(booking.otpGeneratedAt)
      if (now.getTime() - generatedAt.getTime() < 15 * 60 * 1000) {
        return success({ otp: booking.otp })
      }
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        otp,
        otpGeneratedAt: now,
        otpVerified: false,
      },
    })

    return success({ otp })
  } catch (err) {
    console.error('[GENERATE_OTP] Error:', err)
    return error('Internal server error', 500)
  }
}
