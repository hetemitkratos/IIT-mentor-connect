import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { submitApplication } from '@/services/application.service'
import { mentorApplySchema } from '@/lib/validators/mentor.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const body = await req.json()
  const parsed = mentorApplySchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  // TODO: handle file upload via formData + supabase upload for college ID
  const fileUrl = body.collegeIdUrl // placeholder — actual upload handled client-side to Supabase

  try {
    const application = await submitApplication(user!.id, parsed.data, fileUrl)
    return success({ applicationId: application.id, status: application.status }, 201)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'DUPLICATE_APPLICATION')
      return error('You already have an active application', 409)
    return error('Failed to submit application', 500)
  }
}

