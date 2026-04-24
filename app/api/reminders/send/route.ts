import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendReminderEmail } from "@/services/email.service"

function formatTime(startTime: string | null) {
  if (!startTime) return "Upcoming"
  // If the string is already a formatted string like '16:00', we could convert it to standard 12H manually or just return it.
  const [h, m] = startTime.split(':').map(Number)
  const isPM = h >= 12
  const stdH = h % 12 || 12
  return `${stdH}:${m.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
}

export async function POST(req: NextRequest) {
  // QStash payload security verification:
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()

    if (!body || !body.bookingId) {
      return new Response("Missing bookingId", { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { 
        student: true, 
        mentor: { include: { user: true } } 
      },
    })

    if (!booking || booking.reminderSent) {
      return new Response("Already processed or invalid", { status: 200 })
    }

    if (booking.status !== "paid") {
      return new Response("Session is not confirmed (paid)", { status: 200 })
    }

    await sendReminderEmail({
      to: booking.student.email,
      studentName: booking.student.name || "Student",
      mentorName: booking.mentor.user.name || "Mentor",
      time: formatTime(booking.startTime),
      meetLink: booking.meetingUrl,
    })

    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSent: true },
    })

    return new Response("OK")
  } catch (err) {
    console.error("[QSTASH_RECEIVER] Error processing webhook:", err)
    return new Response("Internal error", { status: 500 })
  }
}
