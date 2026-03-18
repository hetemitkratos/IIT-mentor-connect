import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { success, error } from '@/lib/api-response'

export async function GET() {
  const { user, response } = await requireAuth()
  if (response) return response
  return success(user)
}

