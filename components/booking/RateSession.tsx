'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RateSession({ bookingId, initialRating }: { bookingId: string, initialRating?: number | null }) {
  const [rating, setRating] = useState<number>(initialRating || 0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(!!initialRating)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    if (rating === 0) {
      setErrorMsg('Please select a rating')
      return
    }
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/bookings/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, review })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit rating')
      } else {
        setSubmitted(true)
        router.refresh()
      }
    } catch (err) {
      setErrorMsg('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg text-center">
        <p className="text-green-800 font-medium pb-1">Thanks for your feedback!</p>
        <div className="flex justify-center gap-1 text-green-600 text-xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star}>{star <= rating ? '★' : '☆'}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm transition-all hover:shadow-md">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">Rate this session</h4>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="text-2xl transition-colors cursor-pointer"
            style={{ color: star <= (hoverRating || rating) ? '#fbbf24' : '#e5e7eb' }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={300}
        placeholder="Write a review (optional)..."
        className="w-full text-sm border border-gray-300 rounded-md p-2 mb-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[60px] resize-none"
      />
      {errorMsg && <p className="text-xs text-red-500 mb-2">{errorMsg}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  )
}
