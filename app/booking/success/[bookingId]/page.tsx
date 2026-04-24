import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { getBookingById } from '@/services/booking.service'
import Link from 'next/link'

export default async function BookingSuccessPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin')
  }

  const booking = await getBookingById(bookingId, session.user.id)
  
  if (!booking) {
    return notFound()
  }

  // Ensure user can't hit success page for un-paid items
  if (booking.status !== 'paid' && booking.status !== 'completed') {
    redirect(`/payment/${bookingId}`)
  }

  const dateLabel = booking.date && booking.startTime
    ? `${new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${booking.startTime} IST`
    : null

  return (
    <main className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="bg-white border flex flex-col items-center border-[rgba(221,193,175,0.2)] rounded-3xl p-10 max-w-md w-full text-center shadow-[0_4px_40px_rgba(0,0,0,0.03)]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-[28px] font-['Newsreader'] italic mb-2 text-[#1a1c1c]">Session Confirmed</h1>
        <p className="text-[#585f6c] text-[15px] mb-8">
          Your booking is locked in.
        </p>
        
        <div className="w-full flex flex-col gap-3 mb-8 bg-[#f9f9f9] p-5 rounded-2xl">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#9ca3af] font-medium tracking-wide">Mentor</span>
            <span className="text-[#1a1c1c] font-semibold">{booking.mentor.user.name}</span>
          </div>
          {dateLabel && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#9ca3af] font-medium tracking-wide">Date & Time</span>
              <span className="text-[#1a1c1c] font-semibold">{dateLabel}</span>
            </div>
          )}
        </div>

        {booking.meetingUrl ? (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center py-4 mb-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-semibold text-[15px] transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Join Google Meet
          </a>
        ) : (
          <div className="mb-6 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl w-full">
            <p className="text-[13px] font-medium text-neutral-700">Your meeting link is being prepared. It will appear here shortly.</p>
          </div>
        )}

        <Link href="/dashboard" className="w-full flex items-center justify-center py-4 bg-[#f5820a] hover:bg-[#e07509] text-white rounded-xl font-semibold text-[15px] transition shadow-[0_8px_24px_rgba(245,130,10,0.35)] active:scale-[0.98]">
          View Dashboard
        </Link>
      </div>
    </main>
  )
}
