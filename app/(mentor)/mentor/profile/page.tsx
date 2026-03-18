import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MentorProfilePage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'mentor') redirect('/')
  return (
    <main>
      <h1>Edit Profile</h1>
    </main>
  )
}
