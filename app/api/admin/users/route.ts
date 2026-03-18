import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/session'
import { getAllUsers } from '@/services/admin.service'
import { success, error } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { searchParams } = req.nextUrl
  const role = searchParams.get('role') ?? undefined
  const page = Number(searchParams.get('page') || 1)

  try {
    const data = await getAllUsers(role, page)
    return success(data)
  } catch {
    return error('Failed to fetch users', 500)
  }
}

