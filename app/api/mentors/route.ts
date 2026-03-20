import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { getMentors, createMentor } from '@/services/mentor.service'
import { success, error } from '@/lib/api-response'
import { z } from 'zod'

const createMentorSchema = z.object({
  iit:          z.string().min(1, 'IIT is required'),
  branch:       z.string().min(1, 'Branch is required'),
  year:         z.number().int().min(1).max(5),
  languages:    z.array(z.string()).min(1, 'At least one language required'),
  bio:          z.string().min(50, 'Bio must be at least 50 characters'),
  calendlyLink: z.string().url('Must be a valid Calendly URL'),
  profileImage: z.string().url().optional(),
})

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

/**
 * POST /api/mentors
 *
 * Why this exists:
 * Prisma Studio does NOT trigger @default(uuid()) — that default lives at the
 * Prisma client layer, not the database layer. Always create mentors through
 * this endpoint so that prisma.mentor.create() generates a valid UUID for id.
 */
export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const body = await req.json()
  const parsed = createMentorSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 422)

  try {
    const mentor = await createMentor({ userId: user!.id, ...parsed.data })
    return success(mentor, 201)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'MENTOR_ALREADY_EXISTS')
      return error('You already have a mentor profile', 409)
    return error('Failed to create mentor profile', 500)
  }
}



