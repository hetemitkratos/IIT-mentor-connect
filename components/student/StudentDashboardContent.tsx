'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BookingStatus } from '@prisma/client'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MentorInfo {
  iit: string
  branch: string
  year: number
  user: { name: string | null; image: string | null }
}

interface BookingRow {
  id: string
  status: BookingStatus
  date: Date | null
  startTime: string | null
  endTime: string | null
  createdAt: Date
  otp: string | null
  otpVerified: boolean
  otpGeneratedAt: Date | null
  meetingLink: string | null
  sessionToken: string
  rating: number | null
  review: string | null
  mentor: MentorInfo
}

interface Props {
  studentName: string
  bookings: BookingRow[]
  stats: {
    completed: number
    upcoming: number
    mentorsConsulted: number
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(date: Date | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(val: Date | string | null) {
  if (!val) return '—'
  if (typeof val === 'string') return val
  return new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
function padStat(n: number) {
  return String(n).padStart(2, '0')
}

// ── Inline OTP component (student side) ───────────────────────────────────────
function InlineOTP({ booking }: { booking: BookingRow }) {
  const [otp, setOtp] = useState<string | null>(booking.otp)
  const [otpGeneratedAt, setOtpGeneratedAt] = useState<Date | null>(booking.otpGeneratedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWithinWindow, setIsWithinWindow] = useState(false)
  const [timeUntilStart, setTimeUntilStart] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!['scheduled', 'in_progress'].includes(booking.status) || !booking.startTime) return
    const check = () => {
      const now = new Date()
      // Create native absolute JS boundaries explicitly out of combined strings mapping IST offsets
      const dateStr = booking.date!.toISOString().split('T')[0]
      const start = new Date(`${dateStr}T${booking.startTime}:00+05:30`)
      const diffMs = start.getTime() - 5 * 60 * 1000 - now.getTime()
      if (diffMs <= 0) {
        setIsWithinWindow(true)
        setTimeUntilStart(null)
      } else {
        setIsWithinWindow(false)
        const mins = Math.ceil(diffMs / 60000)
        setTimeUntilStart(`Available in ${mins}m`)
      }
      if (otpGeneratedAt && !booking.otpVerified) {
        setIsExpired(now.getTime() - new Date(otpGeneratedAt).getTime() >= 15 * 60 * 1000)
      } else {
        setIsExpired(false)
      }
    }
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [booking.startTime, booking.status, booking.otpVerified, otpGeneratedAt])

  const handleGenerateOTP = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const json = await res.json()
      if (json.success) {
        setOtp(json.data.otp)
        setOtpGeneratedAt(new Date())
        setIsExpired(false)
      } else {
        setError(json.error ?? 'Failed to generate OTP')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const isVerified = booking.otpVerified || booking.status === 'in_progress'
  const otpValid = Boolean(otp && !isExpired)
  const canJoin = isVerified || otpValid

  if (!['scheduled', 'in_progress'].includes(booking.status)) return null

  return (
    <div className="sd-otp-zone">
      {error && <p className="sd-otp-error">{error}</p>}

      {/* OTP display box */}
      {!isVerified && otpValid && (
        <div className="sd-otp-display">
          <span className="sd-otp-label">Your Session OTP</span>
          <span className="sd-otp-code">{otp}</span>
          <span className="sd-otp-hint">Share with your mentor · valid 15 min</span>
        </div>
      )}

      {/* Generate / Regenerate button */}
      {!isVerified && !otpValid && (
        <div className="sd-otp-generate-row">
          <button
            onClick={handleGenerateOTP}
            disabled={!isWithinWindow || loading}
            className={`sd-otp-btn${isWithinWindow && !loading ? ' sd-otp-btn--active' : ' sd-otp-btn--disabled'}`}
          >
            {loading ? 'Generating…' : isExpired ? 'Regenerate OTP' : 'Generate OTP'}
          </button>
          {!isWithinWindow && timeUntilStart && (
            <span className="sd-otp-countdown">{timeUntilStart}</span>
          )}
        </div>
      )}

      {/* Verified badge */}
      {isVerified && (
        <span className="sd-verified-badge">✓ Session Verified</span>
      )}

      {/* Join Meeting — only appears after OTP generated OR verified */}
      {booking.meetingLink && canJoin && (
        <a
          href={booking.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="sd-join-btn"
        >
          Join Meet <span className="sd-arrow">→</span>
        </a>
      )}
      {!booking.meetingLink && canJoin && (
        <span className="sd-join-btn sd-join-btn--disabled">Your mentor will share the meeting link before the session.</span>
      )}
    </div>
  )
}

// ── Inline Rating widget ───────────────────────────────────────────────────────
function InlineRating({ bookingId, initialRating, initialReview }: {
  bookingId: string
  initialRating: number | null
  initialReview: string | null
}) {
  const [rating, setRating] = useState(initialRating ?? 0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState(initialReview ?? '')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(!!initialRating)
  const [err, setErr] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    if (!rating) { setErr('Pick a rating'); return }
    setLoading(true); setErr('')
    try {
      const res = await fetch('/api/bookings/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, review }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Failed'); return }
      setSubmitted(true)
      router.refresh()
    } catch { setErr('Network error') } finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <div className="sd-rating-done">
        <span className="sd-rating-done__label">Your Rating</span>
        <div className="sd-stars">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={s <= rating ? 'sd-star sd-star--on' : 'sd-star'}>★</span>
          ))}
        </div>
        {review && <p className="sd-rating-done__review">"{review}"</p>}
      </div>
    )
  }

  return (
    <div className="sd-rating-form">
      <span className="sd-rating-form__label">Rate this session</span>
      <div className="sd-stars sd-stars--interactive">
        {[1,2,3,4,5].map(s => (
          <button
            key={s}
            type="button"
            className={s <= (hover || rating) ? 'sd-star sd-star--on' : 'sd-star'}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            aria-label={`Rate ${s} stars`}
          >★</button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={e => setReview(e.target.value)}
        maxLength={300}
        placeholder="Write a review (optional)…"
        className="sd-rating-textarea"
      />
      {err && <p className="sd-rating-err">{err}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading || !rating}
        className="sd-rating-submit"
      >
        {loading ? 'Submitting…' : 'Submit Rating'}
      </button>
    </div>
  )
}

// ── Razorpay payment helper ────────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise<boolean>(res => {
    if ((window as any).Razorpay) { res(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => res(true)
    s.onerror = () => res(false)
    document.body.appendChild(s)
  })
}

function PayNowButton({ bookingId, sessionToken }: { bookingId: string; sessionToken: string }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) { alert('Payment gateway failed to load'); return }
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, sessionToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order creation failed')
      const rzp = new (window as any).Razorpay({
        key: data.key, amount: data.amount, currency: 'INR',
        order_id: data.orderId,
        handler: async (response: any) => {
          const vr = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          if (vr.ok) window.location.reload()
          else alert('Payment verification failed')
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
    } catch (e: any) {
      alert(e.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading} className="sd-pay-btn">
      {loading ? 'Processing…' : 'Pay Now'} <span className="sd-arrow">→</span>
    </button>
  )
}

// ── Session Card ───────────────────────────────────────────────────────────────
function SessionCard({ booking }: { booking: BookingRow }) {
  const { mentor } = booking
  const isPending = ['payment_pending', 'awaiting_payment', 'payment_complete'].includes(booking.status)
  const isScheduled = booking.status === 'scheduled'
  const isInProgress = booking.status === 'in_progress'
  const isCompleted = booking.status === 'completed'
  const isCancelled = booking.status === 'cancelled'

  // Status badge
  const badgeClass = isInProgress
    ? 'sd-badge sd-badge--inprogress'
    : isScheduled
    ? 'sd-badge sd-badge--confirmed'
    : isPending
    ? 'sd-badge sd-badge--pending'
    : isCompleted
    ? 'sd-badge sd-badge--completed'
    : 'sd-badge sd-badge--cancelled'

  const badgeLabel = isInProgress
    ? 'In-Progress'
    : isScheduled
    ? 'Confirmed'
    : isPending
    ? 'Payment Pending'
    : isCompleted
    ? 'Completed'
    : 'Cancelled'

  const avatarSrc = mentor.user.image
  const mentorName = mentor.user.name ?? 'IIT Mentor'

  return (
    <div className={`sd-card${isCancelled ? ' sd-card--muted' : ''}`}>
      {/* Avatar */}
      <div className="sd-card__avatar">
        {avatarSrc
          ? <img src={avatarSrc} alt={mentorName} />
          : <div className="sd-card__avatar-placeholder">{mentorName[0]}</div>
        }
      </div>

      {/* Info column */}
      <div className="sd-card__info">
        <p className="sd-card__name">{mentorName}</p>
        <p className="sd-card__meta">{mentor.iit} • {mentor.branch}</p>

        {booking.startTime && (
          <div className="sd-card__datetime">
            <span className="sd-icon-cal">🗓</span>
            <span>{formatDate(booking.date ?? booking.createdAt)}</span>
            <span className="sd-icon-clock">⏰</span>
            <span>{formatTime(booking.startTime)}</span>
          </div>
        )}

        {/* OTP flow for scheduled / in_progress */}
        {(isScheduled || isInProgress) && <InlineOTP booking={booking} />}

        {/* Rating for completed */}
        {isCompleted && (
          <InlineRating
            bookingId={booking.id}
            initialRating={booking.rating}
            initialReview={booking.review}
          />
        )}
      </div>

      {/* Right column */}
      <div className="sd-card__right">
        <span className={badgeClass}>{badgeLabel}</span>

        {/* Rejoin for in-progress */}
        {isInProgress && booking.meetingLink && (
          <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="sd-join-btn">
            Rejoin <span className="sd-arrow">→</span>
          </a>
        )}

        {/* Pay Now for payment-pending */}
        {isPending && (
          <PayNowButton bookingId={booking.id} sessionToken={booking.sessionToken} />
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard Component ───────────────────────────────────────────────────
type TabKey = 'upcoming' | 'completed' | 'all'

export default function StudentDashboardContent({ studentName, bookings, stats }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming')

  // Segment bookings
  const upcoming  = bookings.filter(b => !['completed', 'cancelled'].includes(b.status))
  const completed = bookings.filter(b => b.status === 'completed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const all       = bookings

  const listMap: Record<TabKey, BookingRow[]> = {
    upcoming,
    completed,
    all,
  }

  const displayed = listMap[activeTab]

  return (
    <>
      {/* Inlined styles matching Figma design tokens exactly */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@1,400&family=Inter:wght@400;500;600&display=swap');

        .sd-root {
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Inter', sans-serif;
          color: #1a1c1c;
        }
        .sd-main {
          max-width: 1216px;
          margin: 0 auto;
          padding: 48px 32px;
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        /* ── Header ── */
        .sd-header { display: flex; flex-direction: column; gap: 4px; }
        .sd-header__greeting {
          font-family: 'Newsreader', serif;
          font-style: italic;
          font-weight: 400;
          font-size: 40px;
          line-height: 1.25;
          color: #1a1c1c;
        }
        .sd-header__sub {
          font-size: 14px;
          color: #585f6c;
          line-height: 1.5;
        }

        /* ── Stats grid ── */
        .sd-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .sd-stat-card {
          background: #fff;
          border: 1px solid rgba(221,193,175,0.2);
          border-radius: 12px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sd-stat-card__label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #585f6c;
        }
        .sd-stat-card__value {
          font-size: 28px;
          font-weight: 600;
          color: #1a1c1c;
          line-height: 1.5;
        }

        /* ── Tabs ── */
        .sd-tabs {
          display: flex;
          gap: 32px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0;
        }
        .sd-tab {
          padding-bottom: 14px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          background: none;
          color: #585f6c;
          font-weight: 400;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.15s;
        }
        .sd-tab:hover { color: #1a1c1c; }
        .sd-tab--active {
          color: #1a1c1c;
          font-weight: 500;
          border-bottom-color: #f5820a;
        }

        /* ── Session Card ── */
        .sd-card {
          background: #fff;
          border: 1px solid rgba(221,193,175,0.2);
          border-radius: 12px;
          padding: 32px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          position: relative;
          transition: box-shadow 0.2s;
        }
        .sd-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .sd-card--muted { opacity: 0.65; }

        .sd-card__avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        .sd-card__avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sd-card__avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f5820a, #fb923c);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }

        .sd-card__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sd-card__name {
          font-size: 15px;
          font-weight: 600;
          color: #1a1c1c;
          margin: 0;
        }
        .sd-card__meta {
          font-size: 13px;
          color: #585f6c;
          margin: 0;
        }
        .sd-card__datetime {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #585f6c;
          margin-top: 6px;
        }
        .sd-icon-cal, .sd-icon-clock { font-size: 13px; }

        .sd-topic-pill {
          display: inline-block;
          background: #f3f3f3;
          color: #404754;
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-top: 6px;
          width: fit-content;
        }

        /* ── Card right column ── */
        .sd-card__right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          flex-shrink: 0;
          min-width: 120px;
        }

        /* ── Badges ── */
        .sd-badge {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 12px;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .sd-badge--confirmed  { background: #d1fae5; color: #065f46; }
        .sd-badge--inprogress { background: #fce7f3; color: #9d174d; }
        .sd-badge--pending    { background: #fee2e2; color: #991b1b; }
        .sd-badge--completed  { background: #fdf6dc; color: #B8962E; }
        .sd-badge--cancelled  { background: #f3f4f6; color: #6b7280; }

        /* ── Join button ── */
        .sd-join-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #065f46;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          transition: opacity 0.15s;
        }
        .sd-join-btn:hover { opacity: 0.75; }
        .sd-join-btn--disabled { color: #9ca3af; cursor: not-allowed; }
        .sd-arrow { font-size: 14px; }

        /* ── Pay button ── */
        .sd-pay-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #1a1c1c;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.15s;
        }
        .sd-pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sd-pay-btn:hover:not(:disabled) { opacity: 0.75; }

        /* ── OTP zone ── */
        .sd-otp-zone {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sd-otp-error { font-size: 12px; color: #dc2626; }
        .sd-otp-display {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .sd-otp-label { font-size: 12px; color: #1d4ed8; font-weight: 600; }
        .sd-otp-code {
          font-family: monospace;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: #1e3a8a;
          background: #fff;
          border-radius: 6px;
          padding: 4px 16px;
        }
        .sd-otp-hint { font-size: 11px; color: #3b82f6; }
        .sd-otp-generate-row { display: flex; align-items: center; gap: 10px; }
        .sd-otp-btn {
          font-size: 13px;
          font-weight: 500;
          padding: 7px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sd-otp-btn--active { background: #f5820a; color: #fff; }
        .sd-otp-btn--active:hover { background: #e06c00; }
        .sd-otp-btn--disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
        .sd-otp-countdown { font-size: 12px; color: #9ca3af; }
        .sd-verified-badge {
          font-size: 12px;
          font-weight: 600;
          color: #065f46;
          background: #d1fae5;
          padding: 3px 10px;
          border-radius: 9999px;
          width: fit-content;
        }

        /* ── Rating ── */
        .sd-rating-done {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }
        .sd-rating-done__label { font-size: 12px; color: #585f6c; }
        .sd-rating-done__review { font-size: 13px; color: #585f6c; font-style: italic; }
        .sd-stars { display: flex; gap: 2px; }
        .sd-star { font-size: 18px; color: #e5e7eb; }
        .sd-star--on { color: #f59e0b; }
        .sd-stars--interactive .sd-star {
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-size: 22px;
          transition: color 0.1s;
        }
        .sd-rating-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }
        .sd-rating-form__label { font-size: 13px; font-weight: 600; color: #1a1c1c; }
        .sd-rating-textarea {
          width: 100%;
          min-height: 60px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .sd-rating-textarea:focus { border-color: #f5820a; }
        .sd-rating-err { font-size: 12px; color: #dc2626; }
        .sd-rating-submit {
          background: #1a1c1c;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.15s;
          width: fit-content;
        }
        .sd-rating-submit:hover:not(:disabled) { background: #333; }
        .sd-rating-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Session list ── */
        .sd-session-list { display: flex; flex-direction: column; gap: 24px; }

        /* ── Empty state ── */
        .sd-empty {
          text-align: center;
          padding: 48px 0;
          color: #585f6c;
        }
        .sd-empty__title { font-size: 15px; font-weight: 600; color: #1a1c1c; margin-bottom: 6px; }
        .sd-empty__body { font-size: 14px; margin-bottom: 16px; }
        .sd-empty__cta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #f5820a;
          font-weight: 500;
          font-size: 14px;
          text-decoration: none;
        }
        .sd-empty__cta:hover { text-decoration: underline; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .sd-main { padding: 24px 16px; gap: 32px; }
          .sd-header__greeting { font-size: 28px; }
          .sd-stats { grid-template-columns: 1fr; gap: 12px; }
          .sd-card { flex-direction: column; }
          .sd-card__right { flex-direction: row; align-items: center; justify-content: space-between; width: 100%; }
        }
      `}</style>

      <div className="sd-root">
        <div className="sd-main">
          {/* Header */}
          <div className="sd-header">
            <h1 className="sd-header__greeting">{getGreeting()}, {studentName.split(' ')[0]}.</h1>
            <p className="sd-header__sub">Here are your upcoming sessions.</p>
          </div>

          {/* Stats */}
          <div className="sd-stats">
            <div className="sd-stat-card">
              <span className="sd-stat-card__label">Sessions Completed</span>
              <span className="sd-stat-card__value">{padStat(stats.completed)}</span>
            </div>
            <div className="sd-stat-card">
              <span className="sd-stat-card__label">Upcoming</span>
              <span className="sd-stat-card__value">{padStat(stats.upcoming)}</span>
            </div>
            <div className="sd-stat-card">
              <span className="sd-stat-card__label">Mentors Consulted</span>
              <span className="sd-stat-card__value">{padStat(stats.mentorsConsulted)}</span>
            </div>
          </div>

          {/* Session list */}
          <div>
            {/* Tabs */}
            <div className="sd-tabs">
              {(['upcoming', 'completed', 'all'] as TabKey[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`sd-tab${activeTab === tab ? ' sd-tab--active' : ''}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div className="sd-session-list" style={{ marginTop: '32px' }}>
              {displayed.length === 0 ? (
                <div className="sd-empty">
                  <p className="sd-empty__title">
                    {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No sessions yet'}
                  </p>
                  {activeTab === 'upcoming' && (
                    <>
                      <p className="sd-empty__body">Browse IIT mentors and book your first 1:1 session.</p>
                      <Link href="/mentors" className="sd-empty__cta">Browse mentors →</Link>
                    </>
                  )}
                </div>
              ) : (
                displayed.map(b => <SessionCard key={b.id} booking={b} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
