import { NextResponse } from 'next/server'
import type { ApiSuccess, ApiError } from '@/types'

export function success<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function error(message: string, status = 400): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message }, { status })
}
