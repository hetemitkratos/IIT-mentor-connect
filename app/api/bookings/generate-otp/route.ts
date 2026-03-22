import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error('Unauthorized', 401)

    const { bookingId } = await req.json()
    if (!bookingId) return error('Missing bookingId', 400)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) return error('Booking not found', 404)
    if (booking.status !== 'scheduled') return error('Invalid booking state', 400)

    // Ensure Role Safety
    if (session.user.id !== booking.studentId) {
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

    // Prevent Regeneration Spam (reuse valid OTP if under 10 minutes)
    if (booking.otp && booking.otpGeneratedAt && !booking.otpVerified) {
      const generatedAt = new Date(booking.otpGeneratedAt)
      if (now.getTime() - generatedAt.getTime() < 10 * 60 * 1000) {
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
