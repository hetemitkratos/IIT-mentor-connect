'use client'

import { useState } from 'react'

interface Props {
  bookingId: string
  otpVerified: boolean
  status: string
}

export default function VerifySessionOTP({ bookingId, otpVerified, status }: Props) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(otpVerified || status === 'in_progress')

  if (!['scheduled', 'in_progress'].includes(status) && !success) return null

  if (success) {
    return (
      <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
        ✅ Session Verified & In Progress
      </div>
    )
  }

  const handleVerify = async () => {
    if (otp.length !== 4) {
      setError('OTP must be exactly 4 digits')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, otp }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(true)
        // Optionally refresh the page so the session moves to completed seamlessly
        window.location.reload()
      } else {
        setError(json.error ?? 'Verification failed')
      }
    } catch (err) {
      setError('Network error during verification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 flex flex-col items-end">
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          maxLength={4}
          placeholder="4-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="w-28 text-center px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 4}
          className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${
            loading || otp.length !== 4
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Verifying...' : 'Verify Session'}
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        Ask the student for the secure session OTP.
      </p>
    </div>
  )
}
