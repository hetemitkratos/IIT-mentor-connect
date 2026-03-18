import { NextRequest } from 'next/server'
import {
  handleCalendlyWebhook,
  verifyCalendlySignature,
} from '@/services/webhook.service'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const body             = await req.text()
  const signatureHeader  = req.headers.get('calendly-webhook-signature') ?? ''

  // Verify Calendly HMAC signature before processing anything
  if (!verifyCalendlySignature(body, signatureHeader)) {
    return error('Invalid signature', 400)
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return error('Invalid JSON payload', 400)
  }

  try {
    const result = await handleCalendlyWebhook(payload)
    return success(result)
  } catch {
    return error('Webhook processing failed', 500)
  }
}

