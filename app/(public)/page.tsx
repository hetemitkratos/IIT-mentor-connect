import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IIT Mentor Connect — 1:1 Mentorship with IIT Students',
  description: 'Book a 20-minute session with IIT mentors for ₹150. Get personalized JEE guidance.',
}

export default function LandingPage() {
  return (
    <main>
      <h1>IIT Mentor Connect</h1>
      <p>Book a session with an IIT mentor for ₹150.</p>
      <a href="/mentors">Browse Mentors</a>
    </main>
  )
}
