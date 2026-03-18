import { NextRequest } from 'next/server'
import { handleRazorpayWebhook } from '@/services/webhook.service'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  try {
    const result = await handleRazorpayWebhook(body, signature)
    return success(result)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INVALID_SIGNATURE')
      return error('Invalid signature', 400)
    return error('Webhook processing failed', 500)
  }
}

