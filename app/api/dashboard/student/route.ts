import { requireAuth } from '@/lib/session'
import { getStudentDashboard } from '@/services/dashboard.service'
import { success, error } from '@/lib/api-response'

export async function GET() {
  const { user, response } = await requireAuth()
  if (response) return response

  try {
    const data = await getStudentDashboard(user!.id)
    return success(data)
  } catch {
    return error('Failed to load dashboard', 500)
  }
}

