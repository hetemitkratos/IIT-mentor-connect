import Link from 'next/link'
import { HeroBookButton } from './HeroBookButton'
import { NavProfile } from './NavProfile'

/**
 * Public-facing navbar — shown on the landing page and all public routes.
 * Server component shell; interactive bits (HeroBookButton, NavProfile) are
 * client components that hydrate independently.
 */
export function PublicNavbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link href="/" className="navbar__logo">CandidConversation</Link>

        {/* Nav links */}
        <nav className="navbar__links">
          <Link href="/mentors" className="navbar__link">Find Mentors</Link>
          <Link href="/#how-it-works" className="navbar__link">How It Works</Link>
          <Link href="/become-a-mentor" className="navbar__link">Become a Mentor</Link>
        </nav>

        {/* Right side: smart CTA + profile avatar (when signed in) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HeroBookButton />
          <NavProfile />
        </div>
      </div>
    </header>
  )
}
