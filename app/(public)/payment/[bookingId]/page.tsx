import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import CompletePaymentButton from '@/components/booking/CompletePaymentButton'
import CancelBookingButton from '@/components/booking/CancelBookingButton'
import { getBookingById } from '@/services/booking.service'
import Link from 'next/link'
import PaymentPendingClient from '@/components/booking/PaymentPendingClient'

export default async function PaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin')
  }

  const booking = await getBookingById(bookingId, session.user.id)
  
  if (!booking) {
    return notFound()
  }

  // ── Already paid / completed ──
  if (booking.status === 'paid' || booking.status === 'completed') {
    redirect(`/booking/success/${booking.id}`)
  }

  // ── Cancelled ──
  if (booking.status === 'cancelled') {
    return (
      <main className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
        <div className="bg-white border flex flex-col items-center border-[rgba(221,193,175,0.2)] rounded-3xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-[28px] font-['Newsreader'] italic mb-3 text-[#1a1c1c]">Booking Cancelled</h1>
          <p className="text-[#585f6c] text-[15px] mb-8">
            This booking was cancelled. The slot lock may have expired. Please book again.
          </p>
          <Link href={`/mentors/${booking.mentor.slug}`} className="px-6 py-3 bg-[#1a1c1c] text-white rounded-full font-semibold text-sm">
            Book Again
          </Link>
        </div>
      </main>
    )
  }

  // ── Pending — show payment form ──
  const dateLabel = booking.date && booking.startTime
    ? `${new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${booking.startTime} IST`
    : null

  return (
    <main className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <PaymentPendingClient booking={booking} dateLabel={dateLabel} />
    </main>
  )
}
