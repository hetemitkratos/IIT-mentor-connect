'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function ArrowIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getRole(session: any): string | undefined {
  return session?.user?.role
}

/**
 * Smart "Book a Session" button:
 *  - Not signed in          → /signin
 *  - Signed in + bookings   → /dashboard (role-aware)
 *  - Signed in + no bookings → /mentors
 */
export function HeroBookButton({ className }: { className?: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [destination, setDestination] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      setDestination('/signin')
      return
    }
    if (status === 'authenticated') {
      const role = getRole(session)
      // Mentors and admins go straight to their dashboards
      if (role === 'mentor') { setDestination('/mentor/dashboard'); return }
      if (role === 'admin')  { setDestination('/admin');            return }

      // Students: check if they have any existing bookings
      fetch('/api/user/has-bookings')
        .then(r => r.json())
        .then(({ hasBookings }: { hasBookings: boolean }) => {
          setDestination(hasBookings ? '/dashboard' : '/mentors')
        })
        .catch(() => setDestination('/mentors'))
    }
  }, [status, session])

  const handleClick = () => {
    if (!destination) return
    router.push(destination)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!destination}
      className={className ?? 'btn-primary hero__cta-primary'}
      style={!destination ? { opacity: 0.7, cursor: 'default' } : undefined}
    >
      Book a Session <ArrowIcon />
    </button>
  )
}

/**
 * Smart CTA banner button (same logic, different label)
 */
export function CtaBookButton({ className }: { className?: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [destination, setDestination] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { setDestination('/signin'); return }
    if (status === 'authenticated') {
      const role = getRole(session)
      if (role === 'mentor') { setDestination('/mentor/dashboard'); return }
      if (role === 'admin')  { setDestination('/admin');            return }

      fetch('/api/user/has-bookings')
        .then(r => r.json())
        .then(({ hasBookings }: { hasBookings: boolean }) => {
          setDestination(hasBookings ? '/dashboard' : '/mentors')
        })
        .catch(() => setDestination('/mentors'))
    }
  }, [status, session])

  return (
    <button
      onClick={() => destination && router.push(destination)}
      disabled={!destination}
      className={className ?? 'cta-banner__btn'}
      style={!destination ? { opacity: 0.7, cursor: 'default' } : undefined}
    >
      Find a Mentor <ArrowIcon className="w-4 h-4" />
    </button>
  )
}
