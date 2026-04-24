import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api-response'
import { z } from 'zod'
import { generateSlots } from '@/services/slot-generator'

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'startTime must be HH:00 or HH:30'),
  endTime:   z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'endTime must be HH:00 or HH:30'),
  disabledSlots: z.array(z.string()).default([]),
  isActive:  z.boolean().default(true),
})

const availabilitySchema = z.array(daySchema).min(1).max(7)

/** GET /api/mentor/availability — return full weekly schedule */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'mentor') return error('Unauthorized', 401)

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } })
  if (!mentor) return error('Mentor profile not found', 404)

  const rows = await prisma.availability.findMany({
    where: { mentorId: mentor.id },
    orderBy: { dayOfWeek: 'asc' },
  })

  return success(rows)
}

/** POST /api/mentor/availability — upsert weekly schedule */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'mentor') return error('Unauthorized', 401)

    const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } })
    if (!mentor) return error('Mentor profile not found', 404)

    const body = await req.json()
    const parsed = availabilitySchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues[0].message, 400)

    for (const day of parsed.data) {
      // Validate startTime < endTime and at least one 30-min slot fits
      const slots = generateSlots(day.startTime, day.endTime)
      if (slots.length === 0) {
        return error(
          `Day ${day.dayOfWeek}: endTime must be at least 30 minutes after startTime and ≥ 06:30`,
          400
        )
      }
    }

    // Upsert each day atomically
    await prisma.$transaction(
      parsed.data.map(day =>
        prisma.availability.upsert({
          where: { mentorId_dayOfWeek: { mentorId: mentor.id, dayOfWeek: day.dayOfWeek } },
          create: {
            mentorId:  mentor.id,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime:   day.endTime,
            disabledSlots: day.disabledSlots,
            isActive:  day.isActive,
          },
          update: {
            startTime: day.startTime,
            endTime:   day.endTime,
            disabledSlots: day.disabledSlots,
            isActive:  day.isActive,
          },
        })
      )
    )

    console.log(JSON.stringify({
      event: 'AVAILABILITY_UPDATED',
      mentorId: mentor.id,
      days: parsed.data.map(d => d.dayOfWeek),
      timestamp: new Date().toISOString(),
    }))

    return success({ message: 'Availability updated successfully' })
  } catch (err: any) {
    if (err instanceof z.ZodError) return error(err.issues[0].message, 400)
    console.error('[API_MENTOR_AVAILABILITY_POST]', err)
    return error('Internal server error', 500)
  }
}
