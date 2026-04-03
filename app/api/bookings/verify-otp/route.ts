import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, isOTPBlocked, recordFailedOTPAttempt, resetOTPAttempts } from '@/lib/security'
import { verifyOtpSchema } from '@/lib/validators/otp.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error('Unauthorized', 401)

    const rateLimitResponse = checkRateLimit(`verify_otp_${session.user.id}`)
    if (rateLimitResponse) return rateLimitResponse

    const body = await req.json()
    const parsed = verifyOtpSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues[0].message, 400)
    const { bookingId, otp } = parsed.data

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { mentor: true },
    })

    if (!booking) return error('Booking not found', 404)
    if (booking.status !== 'scheduled') return error('Invalid booking status', 400)

    if (isOTPBlocked(bookingId)) {
      return error('Too many failed OTP attempts. Please wait 15 minutes.', 429)
    }

    // Ensure Role Safety: Only the mentor for this booking can verify the OTP
    if (session.user.id !== booking.mentor.userId) {
      return error('Unauthorized', 403)
    }

    // Double Verification Prevention
    if (booking.otpVerified) {
      return error('Session already verified', 400)
    }

    if (!booking.startTime || !booking.endTime) {
      return error('Session time not set', 400)
    }

    const now = new Date()
    const end = new Date(booking.endTime)

    // Prevent Verification After Session Ends
    if (now.getTime() > end.getTime()) {
      return error('Session already ended', 400)
    }

    if (!booking.otp || !booking.otpGeneratedAt) {
      return error('OTP not generated', 400)
    }

    const generatedAt = new Date(booking.otpGeneratedAt)

    // Check expiry (15 min max)
    if (now.getTime() - generatedAt.getTime() > 15 * 60 * 1000) {
      return error('OTP expired', 400)
    }

    // Match OTP
    if (booking.otp !== otp) {
      recordFailedOTPAttempt(bookingId)
      return error('Invalid OTP', 400)
    }

    resetOTPAttempts(bookingId)

    // Update Verification and Mark Session Progress
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        otpVerified: true,
        status: 'in_progress',
      },
    })

    return success({ verified: true })
  } catch (err) {
    console.error('[VERIFY_OTP] Error:', err)
    return error('Internal server error', 500)
  }
}
