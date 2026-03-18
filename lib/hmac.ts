import { createHmac } from 'crypto'

/**
 * Verify Razorpay webhook HMAC-SHA256 signature.
 * Signature = HMAC_SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
 */
export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}

/**
 * Verify Razorpay payment signature from client.
 * Signature = HMAC_SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!
  const expected = createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return expected === signature
}
