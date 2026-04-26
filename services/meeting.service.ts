import { google } from "googleapis"
import { getValidGoogleAuth } from "./google-auth.service"

export async function createMeetLink({
  mentor,
  startTime,
  endTime,
  studentEmail
}: {
  mentor: any
  startTime: string
  endTime: string
  studentEmail: string
}) {
  const auth = await getValidGoogleAuth(mentor)

  // 🔥 CRITICAL: Re-initialize the calendar client correctly using the valid auth
  const calendar = google.calendar({ version: "v3", auth })

  console.log(`[MEET] Generating link for ${mentor.email} at ${startTime}...`)

  const insertEvent = async (retrying = false): Promise<any> => {
    try {
      console.log(`[MEET] Calling Google Calendar events.insert API...`)
      const event = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
          summary: "CandidConversation Session",
          start: {
            dateTime: startTime,
            timeZone: "Asia/Kolkata"
          },
          end: {
            dateTime: endTime,
            timeZone: "Asia/Kolkata"
          },
          attendees: [{ email: studentEmail }],
          conferenceData: {
            createRequest: {
              requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              conferenceSolutionKey: { type: "hangoutsMeet" }
            }
          }
        }
      })
      console.log(`[MEET] Google Calendar API responded successfully.`)
      return event
    } catch (err: any) {
      if (err.response?.status === 401 && !retrying) {
        console.log("[MEET] 401 detected from Calendar API, refreshing token + retrying...")
        const { credentials } = await auth.refreshAccessToken()
        auth.setCredentials(credentials)
        return insertEvent(true) // Retry once
      }

      console.error(`[MEET] Google Calendar API Call Error:`, {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      })
      throw err
    }
  }

  try {
    const event = await insertEvent()

    // 🛡️ Robust extraction: Some accounts/domains return it in entryPoints instead
    const link =
      event.data.hangoutLink ||
      event.data.conferenceData?.entryPoints?.[0]?.uri ||
      event.data.htmlLink

    console.log(`[MEET] Successfully extracted Meet link: ${link}`)
    return link

  } catch (err: any) {
    console.error("[MEET] Failed to generate Google Meet link completely. Fallback will trigger.")
    throw new Error("Calendar event creation failed")
  }
}
