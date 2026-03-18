import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/session'
import { getMentorByUserId, updateMentorProfile } from '@/services/mentor.service'
import { mentorProfileUpdateSchema } from '@/lib/validators/mentor.validator'
import { success, error } from '@/lib/api-response'

export async function GET() {
  const { user, response } = await requireRole('mentor')
  if (response) return response

  const mentor = await getMentorByUserId(user!.id)
  if (!mentor) return error('Mentor profile not found', 404)
  return success(mentor)
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireRole('mentor')
  if (response) return response

  const body = await req.json()
  const parsed = mentorProfileUpdateSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  try {
    await updateMentorProfile(user!.id, parsed.data)
    return success({ message: 'Profile updated successfully' })
  } catch {
    return error('Failed to update profile', 500)
  }
}

