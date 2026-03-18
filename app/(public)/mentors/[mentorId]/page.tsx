import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mentor Profile — IIT Mentor Connect' }

export default async function MentorProfilePage({ params }: { params: Promise<{ mentorId: string }> }) {
  const { mentorId } = await params
  return (
    <main>
      <h1>Mentor Profile</h1>
      <p>Mentor ID: {mentorId}</p>
    </main>
  )
}
