import { NextRequest } from 'next/server'
import { getMentors } from '@/services/mentor.service'
import { success, error } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const search   = searchParams.get('search')   || undefined
  const iit      = searchParams.get('iit')      || undefined
  const branch   = searchParams.get('branch')   || undefined
  const language = searchParams.get('language') || undefined
  const year     = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
  const page     = Math.max(1, Number(searchParams.get('page')  || 1))
  const limit    = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 10)))

  try {
    const data = await getMentors({ search, iit, branch, year, language }, page, limit)
    return success(data)
  } catch {
    return error('Failed to fetch mentors', 500)
  }
}


