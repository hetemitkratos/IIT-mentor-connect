import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import CompletePaymentButton from '@/components/booking/CompletePaymentButton'
import { getBookingById } from '@/services/booking.service'
import Link from 'next/link'

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

  if (booking.status === 'scheduled' || booking.status === 'payment_complete') {
    return (
      <main className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
        <div className="bg-white border flex flex-col items-center border-[rgba(221,193,175,0.2)] rounded-3xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-[28px] font-['Newsreader'] italic mb-3 text-[#1a1c1c]">Payment Successful</h1>
          <p className="text-[#585f6c] text-[15px] mb-8">
            Your session with {booking.mentor.user.name} is confirmed for {booking.selectedDay} at {booking.selectedSlot}.
          </p>
          <Link href="/dashboard" className="px-6 py-3 bg-[#1a1c1c] text-white rounded-full font-semibold text-sm">
            Go to Dashboard
          </Link>
        </div>
      </main>
    )
  }

  if (booking.status === 'expired' || booking.status === 'cancelled') {
    return (
      <main className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
        <div className="bg-white border flex flex-col items-center border-[rgba(221,193,175,0.2)] rounded-3xl p-10 max-w-md w-full text-center">
           <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl text-red-500">⏳</span>
          </div>
          <h1 className="text-[28px] font-['Newsreader'] italic mb-3 text-[#1a1c1c]">Session Expired</h1>
          <p className="text-[#585f6c] text-[15px] mb-8">
            The 30-minute window to complete your payment has passed. Please book the slot again.
          </p>
          <Link href={`/mentors/${booking.mentor.slug}`} className="px-6 py-3 bg-[#1a1c1c] text-white rounded-full font-semibold text-sm">
            Try Again
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-3xl p-8 md:p-10 shadow-[0_4px_40px_rgba(0,0,0,0.03)]">
          <h1 className="text-[32px] font-['Newsreader'] italic text-[#1a1c1c] mb-2 text-center">Complete your booking</h1>
          <p className="text-[#585f6c] text-[15px] text-center mb-8 pb-8 border-b border-[rgba(221,193,175,0.2)]">
            Review your session details and complete the payment to secure your slot.
          </p>
          
          <div className="flex flex-col gap-6 mb-10">
            <div className="flex justify-between items-center bg-[#f9f9f9] p-4 rounded-2xl">
              <span className="text-[#9ca3af] text-[13px] font-semibold uppercase tracking-wider">Mentor</span>
              <span className="text-[#1a1c1c] font-semibold">{booking.mentor.user.name}</span>
            </div>
            <div className="flex justify-between items-center bg-[#f9f9f9] p-4 rounded-2xl">
              <span className="text-[#9ca3af] text-[13px] font-semibold uppercase tracking-wider">Schedule</span>
              <span className="text-[#1a1c1c] font-semibold">{booking.selectedDay} at {booking.selectedSlot}</span>
            </div>
            <div className="flex justify-between items-center bg-[#f9f9f9] p-4 rounded-2xl">
              <span className="text-[#9ca3af] text-[13px] font-semibold uppercase tracking-wider">Amount</span>
              <span className="text-[#f5820a] font-bold text-lg">₹150</span>
            </div>
          </div>

          <div className="w-full flex justify-center">
            {/* The existing component uses tailwind and basic styling, we wrap it to restrict width */}
            <div className="w-full">
               <CompletePaymentButton bookingId={booking.id} sessionToken={booking.sessionToken} />
            </div>
          </div>
          
          <p className="text-center text-[#9ca3af] text-[12px] mt-6">
            Payments are secured by Razorpay
          </p>
        </div>
      </div>
    </main>
  )
}
