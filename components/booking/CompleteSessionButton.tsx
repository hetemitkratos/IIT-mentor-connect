'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompleteSessionButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleComplete = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/bookings/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to complete session')
      } else {
        setCompleted(true)
        router.refresh()
      }
    } catch (err) {
      setErrorMsg('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <button disabled className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-200 w-full font-medium">
        Session marked as completed
      </button>
    )
  }

  return (
    <div className="mt-2 w-full">
      <button 
        onClick={handleComplete} 
        disabled={loading}
        className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Completing...' : 'Mark as Complete'}
      </button>
      {errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
    </div>
  )
}
