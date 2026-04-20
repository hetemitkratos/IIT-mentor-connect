import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { error, success } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

const CAL_LINK_REGEX = /^https:\/\/cal\.com\/.+/

/**
 * PATCH /api/mentor/update-cal-link
 * Saves a mentor's Cal.com booking link to the DB.
 */
export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  if (user!.role !== 'mentor') {
    return error('Unauthorized', 403)
  }

  const body = await req.json()
  const { calLink } = body

  if (!calLink || typeof calLink !== 'string' || !CAL_LINK_REGEX.test(calLink.trim())) {
    return error('Please enter a valid Cal.com booking link (e.g. https://cal.com/your-username/session)', 400)
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: user!.id }, select: { id: true } })
  if (!mentor) return error('Mentor not found', 404)

  await prisma.mentor.update({
    where: { id: mentor.id },
    data: { calLink: calLink.trim() },
  })

  console.log(`[CAL_LINK_UPDATED] mentor ${mentor.id} → ${calLink.trim()}`)
  return success({ message: 'Cal.com link saved successfully' })
}
