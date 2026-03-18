import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/session'
import { getMentorByUserId } from '@/services/mentor.service'
import { getMentorBookings } from '@/services/booking.service'
import { success, error } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { user, response } = await requireRole('mentor')
  if (response) return response

  const mentor = await getMentorByUserId(user!.id)
  if (!mentor) return error('Mentor profile not found', 404)

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 10)

  try {
    const data = await getMentorBookings(mentor.id, status, page, limit)
    return success(data)
  } catch {
    return error('Failed to fetch bookings', 500)
  }
}

