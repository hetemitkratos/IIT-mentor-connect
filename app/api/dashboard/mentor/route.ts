import { requireRole } from '@/lib/session'
import { getMentorByUserId } from '@/services/mentor.service'
import { getMentorDashboard } from '@/services/dashboard.service'
import { success, error } from '@/lib/api-response'

export async function GET() {
  const { user, response } = await requireRole('mentor')
  if (response) return response

  const mentor = await getMentorByUserId(user!.id)
  if (!mentor) return error('Mentor profile not found', 404)

  try {
    const data = await getMentorDashboard(mentor.id)
    return success(data)
  } catch {
    return error('Failed to load dashboard', 500)
  }
}

