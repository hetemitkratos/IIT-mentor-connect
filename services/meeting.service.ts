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

  const calendar = google.calendar({ version: "v3", auth })

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
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      }
    }
  })

  // Fallback to htmlLink if hangoutLink is missing for some reason
  return event.data.hangoutLink || event.data.htmlLink
}
