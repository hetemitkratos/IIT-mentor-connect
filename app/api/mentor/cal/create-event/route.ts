import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { success, error } from '@/lib/api-response'
import { getMentorByUserId, updateMentorAvailability } from '@/services/mentor.service'
import { SESSION_CONFIG } from '@/lib/constants/session'

/**
 * POST /api/mentor/cal/create-event
 *
 * Creates a real Cal.com event type for the authenticated mentor using their
 * persisted access token. The returned event type ID is stored in the DB so
 * the mentor dashboard can track onboarding progress.
 *
 * Prerequisites:
 *   - Mentor must have completed Cal.com OAuth (calConnected = true)
 *   - calAccessToken must be present in the DB
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'mentor') {
      return error('Unauthorized', 401)
    }

    const mentor = await getMentorByUserId(session.user.id)
    if (!mentor) {
      return error('Mentor not found', 404)
    }

    if (!mentor.calConnected || !mentor.calAccessToken) {
      return error('Cal.com account is not connected. Please connect your Cal.com account first.', 400)
    }

    // Create the event type on Cal.com using the mentor's real access token
    const calEventRes = await fetch('https://api.cal.com/v1/event-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mentor.calAccessToken}`,
      },
      body: JSON.stringify({
        title: 'IIT Mentor Connect Session',
        slug: '1-on-1-mentorship',
        length: SESSION_CONFIG.durationMinutes,
        description: '1-on-1 mentorship session booked via IIT Mentor Connect.',
        hidden: false,
      }),
    })

    if (!calEventRes.ok) {
      const errBody = await calEventRes.text()
      console.error('[API_CAL_CREATE_EVENT] Cal.com rejected event type creation:', errBody)
      return error('Failed to create event type in Cal.com. Please try reconnecting your account.', 500)
    }

    const eventData = await calEventRes.json()
    const calEventTypeId = String(eventData.event_type?.id ?? eventData.id)

    if (!calEventTypeId || calEventTypeId === 'undefined') {
      console.error('[API_CAL_CREATE_EVENT] Cal.com returned an unexpected response:', eventData)
      return error('Cal.com returned an invalid event type ID', 500)
    }

    // Persist the real Cal.com event type ID to the mentor's record
    const existingSlots = mentor.availableSlots && typeof mentor.availableSlots === 'string'
      ? JSON.parse(mentor.availableSlots as string)
      : (mentor.availableSlots ?? {})

    await updateMentorAvailability(mentor.userId, {
      availableSlots: existingSlots,
      timezone: mentor.timezone ?? 'Asia/Kolkata',
      availabilityConfigured: mentor.availabilityConfigured,
      calEventTypeId,
    })

    console.log(`[API_CAL_CREATE_EVENT] Created event type ${calEventTypeId} for mentor ${mentor.id}`)
    return success({ message: 'Event type created successfully on Cal.com', calEventTypeId })

  } catch (err) {
    console.error('[API_CAL_CREATE_EVENT] Unexpected error:', err)
    return error('Internal server error', 500)
  }
}
