import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { error, success } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

const CALENDLY_REGEX = /^https:\/\/(calendly\.com|cal\.com)\/.+/

/**
 * PATCH /api/mentor/update-calendly-link
 * Saves a mentor's Calendly booking link to the DB.
 */
export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  if (user!.role !== 'mentor') {
    return error('Unauthorized', 403)
  }

  const body = await req.json()
  const { calendlyLink } = body

  if (!calendlyLink || typeof calendlyLink !== 'string' || !CALENDLY_REGEX.test(calendlyLink.trim())) {
    return error('Please enter a valid Calendly link (e.g. https://calendly.com/your-name/30min)', 400)
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: user!.id }, select: { id: true } })
  if (!mentor) return error('Mentor not found', 404)

  await prisma.mentor.update({
    where: { id: mentor.id },
    data: { calendlyLink: calendlyLink.trim() },
  })

  console.log(`[CALENDLY_LINK_UPDATED] mentor ${mentor.id} → ${calendlyLink.trim()}`)
  return success({ message: 'Calendly link saved successfully' })
}
