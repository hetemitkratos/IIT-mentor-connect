import { Resend } from "resend"
import BookingConfirmationEmail from "@/emails/BookingConfirmationEmail"
import SessionReminderEmail from "@/emails/SessionReminderEmail"

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
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Candid Conversations <noreply@yourdomain.com>",
      to: data.to,
      subject: `Your session with ${data.mentorName} is confirmed 🎉`,
      react: BookingConfirmationEmail(data),
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
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Candid Conversations <noreply@yourdomain.com>",
      to: data.to,
      subject: "Your session starts soon ⏰",
      react: SessionReminderEmail(data),
    })
  } catch (err) {
    console.error("Reminder email failed", err)
    throw err // Throw the error so the cron job can catch it and not mark it `reminderSent = true`
  }
}
