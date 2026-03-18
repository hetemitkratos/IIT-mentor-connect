import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/session'
import { rejectApplication } from '@/services/admin.service'
import { rejectApplicationSchema } from '@/lib/validators/admin.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { applicationId } = await params
  const body = await req.json()
  const parsed = rejectApplicationSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  try {
    await rejectApplication(applicationId, parsed.data.reason)
    return success({ message: 'Application rejected.' })
  } catch {
    return error('Failed to reject application', 500)
  }
}
