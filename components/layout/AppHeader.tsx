'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { NavProfile } from './NavProfile'

/**
 * AppHeader — shown on all authenticated dashboard pages via layout.tsx.
 * Uses the shared NavProfile for consistent position & behavior.
 */
export function AppHeader() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link href="/" className="navbar__logo">CandidConversation</Link>

        {/* Nav links */}
        <nav className="navbar__links">
          <Link href="/mentors" className="navbar__link">Find Mentors</Link>
          <Link href="/#how-it-works" className="navbar__link">How It Works</Link>
          {(!role || role === 'aspirant') && (
            <Link href="/become-a-mentor" className="navbar__link">Become a Mentor</Link>
          )}
        </nav>

        {/* Profile avatar + dropdown — always visible on dashboard pages */}
        <NavProfile />
      </div>
    </header>
  )
}
