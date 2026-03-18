import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MentorBookingsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'mentor') redirect('/')
  return (
    <main>
      <h1>My Sessions</h1>
    </main>
  )
}
