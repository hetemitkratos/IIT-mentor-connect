import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { createRazorpayOrder } from '@/services/payment.service'
import { createOrderSchema } from '@/lib/validators/payment.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const body = await req.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  try {
    const order = await createRazorpayOrder(parsed.data.bookingId, user!.id)
    console.log("RAZORPAY ORDER CREATED:", order);
    return NextResponse.json(order)
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'NOT_FOUND') return error('Booking not found', 404)
      if (err.message === 'INVALID_BOOKING_STATUS') return error('Booking is not in a payable state', 409)
      if (err.message === 'ACTIVE_BOOKING_EXISTS') return error('You already have an active booking with this mentor', 409)
      if (err.message === 'booking_unconfirmed') return error('Booking not confirmed yet. We are waiting on Cal.com.', 400)
    }
    console.error("Create Order Error Debug:", err);
    return error(`Failed to create payment order: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}

