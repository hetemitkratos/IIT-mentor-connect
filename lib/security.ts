import { error } from '@/lib/api-response'

// In-Memory Rate Limiter (MVP) - 10 req/min/user
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>()

export function checkRateLimit(key: string, limit = 10, windowMs = 60000) {
  const now = Date.now()
  const current = rateLimitMap.get(key)

  if (!current || now > current.expiresAt) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs })
    return null
  }

  if (current.count >= limit) {
    console.warn(`[RATE_LIMIT] Blocked: ${key}`)
    return error('Too many requests, please try again later', 429)
  }

  current.count += 1
  return null
}

// OTP Brute Force Protection - 5 attempts max within 15 mins
const otpAttemptsMap = new Map<string, { count: number; expiresAt: number }>()

export function isOTPBlocked(bookingId: string) {
  const now = Date.now()
  const current = otpAttemptsMap.get(bookingId)

  // Clear if expired
  if (current && now > current.expiresAt) {
    otpAttemptsMap.delete(bookingId)
    return false
  }

  return current ? current.count >= 5 : false
}

export function recordFailedOTPAttempt(bookingId: string) {
  const now = Date.now()
  const current = otpAttemptsMap.get(bookingId)

  if (!current || now > current.expiresAt) {
    otpAttemptsMap.set(bookingId, { count: 1, expiresAt: now + 15 * 60 * 1000 })
  } else {
    current.count += 1
  }
}

export function resetOTPAttempts(bookingId: string) {
  otpAttemptsMap.delete(bookingId)
}
