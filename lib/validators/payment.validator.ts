import { z } from 'zod'

export const createOrderSchema = z.object({
  bookingId: z.string().uuid(),
  sessionToken: z.string().uuid(),
})

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
