'use client'

import { useState, useEffect } from 'react'
import { BookingStatus } from '@prisma/client'

interface Props {
  bookingId: string
  startTime: Date | null
  status: BookingStatus
  initialOtp: string | null
  otpVerified: boolean
  otpGeneratedAt: Date | null
  meetingLink: string | null
}

export default function StartSessionOTP({
  bookingId,
  startTime,
  status,
  initialOtp,
  otpVerified,
  otpGeneratedAt,
  meetingLink,
}: Props) {
  const [otp, setOtp] = useState<string | null>(initialOtp)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeUntilStart, setTimeUntilStart] = useState<string | null>(null)
  const [isWithinWindow, setIsWithinWindow] = useState(false)
  
  // Track dynamically if OTP is expired (10 mins)
  const [isExpired, setIsExpired] = useState(false)
  const [currentOtpGeneratedAt, setCurrentOtpGeneratedAt] = useState<Date | null>(otpGeneratedAt)

  useEffect(() => {
    if (status !== 'scheduled' || !startTime) return

    const updateTimer = () => {
      const now = new Date()
      const start = new Date(startTime)
      const diffMs = start.getTime() - 5 * 60 * 1000 - now.getTime()

      if (diffMs <= 0) {
        setIsWithinWindow(true)
        setTimeUntilStart(null)
      } else {
        setIsWithinWindow(false)
        const diffMins = Math.ceil(diffMs / 60000)
        setTimeUntilStart(`Session starts in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`)
      }

      // Check OTP expiry if verify isn't complete
      if (currentOtpGeneratedAt && !otpVerified) {
        const generatedAt = new Date(currentOtpGeneratedAt)
        setIsExpired(now.getTime() - generatedAt.getTime() >= 10 * 60 * 1000)
      } else {
        setIsExpired(false)
      }
    }

    updateTimer()
    const intId = setInterval(updateTimer, 60000) // update every minute
    return () => clearInterval(intId)
  }, [startTime, status, currentOtpGeneratedAt, otpVerified])

  if (status !== 'scheduled') return null

  if (otpVerified) {
    return (
      <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
        <p className="text-green-800 font-medium">✅ Session Verified and In Progress</p>
      </div>
    )
  }

  const handleGenerateOTP = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const json = await res.json()
      if (json.success) {
        setOtp(json.data.otp)
        setCurrentOtpGeneratedAt(new Date())
        setIsExpired(false)
      } else {
        setError(json.error ?? 'Failed to generate OTP')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const otpExistsAndValid = Boolean(otp && !isExpired)
  const canJoinMeeting = otpVerified || otpExistsAndValid

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {!otpVerified && otpExistsAndValid && (
        <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-100 mb-4">
          <p className="text-sm text-blue-700 font-semibold mb-1">Your Session OTP</p>
          <p className="text-3xl font-mono tracking-[0.2em] text-blue-900 bg-white rounded-md py-2 shadow-sm">
            {otp}
          </p>
          <p className="text-xs text-blue-500 mt-2">
            Share this with your mentor. Valid for 10 minutes.
          </p>
        </div>
      )}

      {!otpVerified && !otpExistsAndValid && (
        <div className="flex flex-col items-center mb-4">
          <button
            onClick={handleGenerateOTP}
            disabled={!isWithinWindow || loading}
            className={`w-full py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              isWithinWindow && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Generating...' : (isExpired ? 'Regenerate OTP' : 'Generate Session OTP')}
          </button>

          {!isWithinWindow && timeUntilStart && (
            <p className="text-xs text-gray-500 mt-2 text-center animate-pulse">
              {timeUntilStart}
            </p>
          )}

          {isWithinWindow && !timeUntilStart && !isExpired && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Generate OTP to unlock meeting
            </p>
          )}

          {isExpired && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Your previous OTP has expired. Please regenerate.
            </p>
          )}
        </div>
      )}

      {/* Join Meeting Button */}
      <div className="flex flex-col items-center">
        {meetingLink ? (
          <a
            href={canJoinMeeting ? meetingLink : '#'}
            target={canJoinMeeting ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!canJoinMeeting) e.preventDefault()
            }}
            className={`w-full py-3 px-4 rounded-md font-medium text-sm text-center transition-colors ${
              canJoinMeeting
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Join Meeting
          </a>
        ) : (
          <span className="w-full py-3 px-4 rounded-md font-medium text-sm text-center bg-gray-100 text-gray-400 cursor-not-allowed">
            Meeting link not generated yet
          </span>
        )}
        
        {canJoinMeeting && !otpVerified && (
          <p className="text-xs text-green-600 mt-2 text-center">
            OTP generated. You can now join the meeting.
          </p>
        )}
      </div>
    </div>
  )
}
