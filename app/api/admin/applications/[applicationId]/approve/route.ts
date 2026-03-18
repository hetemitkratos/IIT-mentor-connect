import { requireRole } from '@/lib/session'
import { approveApplication } from '@/services/admin.service'
import { success, error } from '@/lib/api-response'

export async function POST(_req: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { applicationId } = await params
  try {
    await approveApplication(applicationId)
    return success({ message: 'Application approved. Mentor account created.' })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NOT_FOUND') return error('Application not found', 404)
    return error('Failed to approve application', 500)
  }
}
