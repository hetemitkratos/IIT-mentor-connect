import { Client } from "@upstash/qstash"

// Instantiate with a safe fallback to prevent Next.JS dev build crashes
const client = new Client({
  token: process.env.QSTASH_TOKEN || "qstash_dummy_token",
})

export async function scheduleReminder({
  bookingId,
  startDateTime,
}: {
  bookingId: string
  startDateTime: Date
}) {
  const reminderTime = new Date(startDateTime.getTime() - 30 * 60 * 1000)

  // if already in past → skip, meaning the session is within 30m of being booked!
  if (reminderTime < new Date()) {
    console.log(`[QSTASH] Skipping reminder, time ${reminderTime} is in the past.`);
    return
  }

  // The base URL can be determined from the Vercel branch or your production URL locally
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "http://localhost:3000"

  await client.publishJSON({
    url: `${baseUrl}/api/reminders/send`,
    body: { bookingId },
    notBefore: Math.floor(reminderTime.getTime() / 1000),
  })

  console.log(`[QSTASH] Scheduled reminder for booking ${bookingId} at timestamp ${reminderTime.toISOString()}`);
}
