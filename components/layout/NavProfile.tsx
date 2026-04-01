'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getDashboardHref(role?: string | null) {
  if (role === 'mentor') return '/mentor/dashboard'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}

/**
 * Shared profile avatar + dropdown — shown on ALL pages when signed in.
 * Can be dropped into any navbar (PublicNavbar or AppHeader).
 */
export function NavProfile() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!session?.user) return null

  const { name, image, role } = session.user as { name?: string | null; image?: string | null; role?: string }
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  const dashboardHref = getDashboardHref(role)

  return (
    <div className="nav-profile" ref={ref}>
      <button
        className="nav-profile__trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="Profile menu"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name ?? 'Avatar'} className="nav-profile__avatar" />
        ) : (
          <span className="nav-profile__avatar nav-profile__avatar--initials">{initial}</span>
        )}
        <ChevronIcon open={open} />
      </button>

      <div className={`nav-dropdown${open ? ' nav-dropdown--open' : ''}`}>
        <div className="nav-dropdown__header">
          <p className="nav-dropdown__name">{name ?? 'User'}</p>
          <p className="nav-dropdown__role">{role ?? 'Student'}</p>
        </div>
        <div className="nav-dropdown__divider" />
        <Link href={dashboardHref} className="nav-dropdown__item" onClick={() => setOpen(false)}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Dashboard
        </Link>
        <button
          className="nav-dropdown__item nav-dropdown__item--danger"
          onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M5.5 1.5H2a1 1 0 00-1 1v10a1 1 0 001 1h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M10 10.5l3-3-3-3M13 7.5H5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}
