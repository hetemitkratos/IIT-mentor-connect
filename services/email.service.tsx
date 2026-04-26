import { Resend } from "resend"
import { render } from "@react-email/render"
import BookingEmail from "@/emails/BookingEmail"
import SessionReminderEmail from "@/emails/SessionReminderEmail"
import RaycastMagicLinkEmail from "@/emails/RaycastMagicLinkEmail"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy")

export async function sendBookingEmail(data: {
  to: string
  studentName: string
  mentorName: string
  date: string
  time: string
  meetLink?: string | null
}) {
  try {
    const htmlString = await render(<BookingEmail {...data} />)

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Candid Conversations <noreply@yourdomain.com>",
      to: data.to,
      subject: `Your session with ${data.mentorName} is confirmed 🎉`,
      html: htmlString,
    })
  } catch (err) {
    console.error("Booking email failed", err)
  }
}

export async function sendReminderEmail(data: {
  to: string
  studentName: string
  mentorName: string
  time: string
  meetLink?: string | null
}) {
  try {
    const htmlString = await render(<SessionReminderEmail {...data} />)

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Candid Conversations <noreply@yourdomain.com>",
      to: data.to,
      subject: "Your session starts soon ⏰",
      html: htmlString,
    })
  } catch (err) {
    console.error("Reminder email failed", err)
    throw err // Throw the error so the cron job can catch it and not mark it `reminderSent = true`
  }
}

export async function sendMagicLinkEmail({ to, url }: { to: string; url: string }) {
  try {
    const htmlString = await render(<RaycastMagicLinkEmail magicLink={url} />)

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Candid Conversations <noreply@yourdomain.com>",
      to: to,
      subject: "Sign in to Candid Conversations",
      html: htmlString,
    })
  } catch (err) {
    console.error("Magic link email failed", err)
    throw err
  }
}
