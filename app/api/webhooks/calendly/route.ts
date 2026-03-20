import { NextRequest } from 'next/server'
import {
  handleCalendlyWebhook,
  verifyCalendlySignature,
} from '@/services/webhook.service'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const body            = await req.text()
  const signatureHeader = req.headers.get('calendly-webhook-signature') ?? ''

  // IMPORTANT: Re-enable strict signature verification in production.
  // Skip verification only when CALENDLY_WEBHOOK_SECRET is not configured
  // (i.e. absent OR still set to the placeholder value in .env).
  const rawSecret = process.env.CALENDLY_WEBHOOK_SECRET
  const hasRealSecret =
    !!rawSecret &&
    rawSecret !== 'YOUR_CALENDLY_WEBHOOK_SECRET' &&
    rawSecret.length > 10

  if (hasRealSecret) {
    if (!verifyCalendlySignature(body, signatureHeader)) {
      console.error('[CALENDLY_WEBHOOK] Signature verification failed')
      return error('Invalid signature', 400)
    }
  } else {
    console.warn('[CALENDLY_WEBHOOK] ⚠️  Signature verification SKIPPED — set CALENDLY_WEBHOOK_SECRET in .env for production')
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

