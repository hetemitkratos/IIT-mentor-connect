import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { error, success } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

const CAL_REGEX = /^https:\/\/cal\.com\/.+/

/**
 * PATCH /api/mentor/update-calendly-link  (kept for backward compat)
 * Now writes to calLink (Cal.com only). Prefer /api/mentor/update-cal-link.
 */
export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  if (user!.role !== 'mentor') {
    return error('Unauthorized', 403)
  }

  const body = await req.json()
  const link: unknown = body.calLink ?? body.calendlyLink

  if (!link || typeof link !== 'string' || !CAL_REGEX.test(link.trim())) {
    return error('Please enter a valid Cal.com link (e.g. https://cal.com/your-name/30min)', 400)
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: user!.id }, select: { id: true } })
  if (!mentor) return error('Mentor not found', 404)

  await prisma.mentor.update({
    where: { id: mentor.id },
    data: { calLink: link.trim() },
  })

  console.log(`[CAL_LINK_UPDATED] mentor ${mentor.id} → ${link.trim()}`)
  return success({ message: 'Cal.com link saved successfully' })
}
