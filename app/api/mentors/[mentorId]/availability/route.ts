import { requireAuth } from '@/lib/session'
import { getMentorAvailability } from '@/services/mentor.service'
import { success, error } from '@/lib/api-response'

export async function GET(_req: Request, { params }: { params: Promise<{ mentorId: string }> }) {
  const { response } = await requireAuth()
  if (response) return response

  const { mentorId } = await params
  const mentor = await getMentorAvailability(mentorId)
  if (!mentor) return error('Mentor not found', 404)
  if (!mentor.isActive) return error('Mentor is not currently active', 409)

  return success({
    mentorId: mentor.id,
    mentorName: mentor.user.name,
    calendlyLink: mentor.calendlyLink,
    sessionDurationMinutes: 20,
    sessionPriceRs: 150,
    isAvailable: mentor.isActive,
  })
}
