import { requireAuth } from '@/lib/session'
import { getApplicationStatus } from '@/services/application.service'
import { success, error } from '@/lib/api-response'

export async function GET() {
  const { user, response } = await requireAuth()
  if (response) return response

  const application = await getApplicationStatus(user!.id)
  if (!application) return error('No application found', 404)
  return success(application)
}

