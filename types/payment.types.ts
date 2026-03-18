export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded'

export interface Payment {
  id: string
  bookingId: string
  razorpayOrderId: string
  razorpayPaymentId: string | null
  amount: number
  currency: string
  status: PaymentStatus
}
