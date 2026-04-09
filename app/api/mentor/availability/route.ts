import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { success, error } from '@/lib/api-response'
import { updateMentorAvailability } from '@/services/mentor.service'
import { z } from 'zod'

const availabilitySchema = z.object({
  availableSlots: z.record(z.string(), z.array(z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Invalid 30-min slot'))),
  timezone: z.string().min(1, 'Timezone is required'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'mentor') {
      return error('Unauthorized', 401)
    }

    const body = await req.json()
    const validated = availabilitySchema.parse(body)

    await updateMentorAvailability(session.user.id, {
      ...validated,
      availabilityConfigured: true,
    })

    return success({ message: 'Availability updated successfully' })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error((err as any).errors[0].message, 400)
    }
    console.error('[API_MENTOR_AVAILABILITY]', err)
    return error('Internal server error', 500)
  }
}
