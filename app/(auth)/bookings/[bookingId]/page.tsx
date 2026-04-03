import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Booking Detail — CandidConversation' }

export default async function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  return (
    <main>
      <h1>Booking Detail</h1>
      <p>Booking ID: {bookingId}</p>
    </main>
  )
}
