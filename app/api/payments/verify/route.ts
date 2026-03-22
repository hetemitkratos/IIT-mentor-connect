import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { verifyPayment } from '@/services/payment.service'
import { verifyPaymentSchema } from '@/lib/validators/payment.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const body = await req.json()
  const parsed = verifyPaymentSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  try {
    await verifyPayment(
      parsed.data.razorpayOrderId,
      parsed.data.razorpayPaymentId,
      parsed.data.razorpaySignature
    )
    return success({ message: 'Payment verified. Your session is confirmed!' })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INVALID_SIGNATURE')
      return error('Payment signature verification failed', 400)
    return error('Payment verification failed', 500)
  }
}

