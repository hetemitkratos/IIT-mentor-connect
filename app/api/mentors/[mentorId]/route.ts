import { requireAuth } from '@/lib/session'
import { getMentorById } from '@/services/mentor.service'
import { success, error } from '@/lib/api-response'

export async function GET(_req: Request, { params }: { params: Promise<{ mentorId: string }> }) {
  const { response } = await requireAuth()
  if (response) return response

  const { mentorId } = await params
  const mentor = await getMentorById(mentorId)
  if (!mentor) return error('Mentor not found', 404)
  return success(mentor)
}
