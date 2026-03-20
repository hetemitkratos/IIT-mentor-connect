import { notFound } from 'next/navigation'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { getMentorById } from '@/services/mentor.service'

interface BookPageProps {
  params: Promise<{ mentorId: string }>
}

// Server Component — no 'use client' needed.
// The (auth) layout.tsx already guarantees a valid session before this renders.
export default async function BookPage({ params }: BookPageProps) {
  const { mentorId } = await params

  const mentor = await getMentorById(mentorId)
  if (!mentor) notFound()

  const displayName = mentor.user?.name ?? 'IIT Mentor'

  return (
    <main className="book-page">
      <div className="book-page__card">
        {/* Mentor summary */}
        <div className="book-page__mentor-info">
          <h1 className="book-page__title">Book a Session</h1>
          <p className="book-page__mentor-name">{displayName}</p>
          <div className="book-page__meta">
            <span>{mentor.iit}</span>
            <span>·</span>
            <span>{mentor.branch}</span>
            <span>·</span>
            <span>Year {mentor.year}</span>
          </div>
          <p className="book-page__bio">{mentor.bio}</p>
        </div>

        {/* Session details */}
        <div className="book-page__session-info">
          <div className="book-page__detail-row">
            <span>Duration</span>
            <span>20 minutes</span>
          </div>
          <div className="book-page__detail-row">
            <span>Format</span>
            <span>Google Meet (via Calendly)</span>
          </div>
          <div className="book-page__detail-row book-page__detail-row--price">
            <span>Price</span>
            <span>₹150</span>
          </div>
        </div>

        {/* What happens next */}
        <ol className="book-page__steps">
          <li>Pay ₹150 securely via Razorpay</li>
          <li>Pick your time slot on Calendly</li>
          <li>Get a Google Meet link via email</li>
        </ol>

        {/* Booking flow — client component */}
        <BookingFlow
          mentorId={mentorId}
          mentorName={displayName}
          calendlyLink={mentor.calendlyLink}
        />

        <p className="book-page__disclaimer">
          Cancellations must be requested at least 4 hours before the session.
          Refunds are processed within 5–7 business days.
        </p>
      </div>
    </main>
  )
}
