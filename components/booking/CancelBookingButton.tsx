'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookingId:  string
  mentorSlug: string
}

export default function CancelBookingButton({ bookingId, mentorSlug }: Props) {
  const router = useRouter()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleCancel = async () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const json = await res.json()

      if (res.ok) {
        router.replace(`/mentors/${mentorSlug}`)
      } else {
        setError(json.error || 'Failed to cancel. Please try again.')
        setConfirmed(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setConfirmed(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <p className="text-red-500 text-[12px]">{error}</p>
      )}
      {confirmed ? (
        <div className="flex gap-2 items-center">
          <span className="text-[12px] text-[#585f6c]">Are you sure?</span>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-[12px] font-semibold text-red-600 hover:underline disabled:opacity-50"
          >
            {loading ? 'Cancelling…' : 'Yes, cancel'}
          </button>
          <button
            onClick={() => setConfirmed(false)}
            className="text-[12px] text-[#9ca3af] hover:underline"
          >
            No, keep it
          </button>
        </div>
      ) : (
        <button
          onClick={handleCancel}
          className="text-[12px] text-[#9ca3af] hover:text-red-500 hover:underline transition-colors"
        >
          Cancel this booking
        </button>
      )}
    </div>
  )
}
