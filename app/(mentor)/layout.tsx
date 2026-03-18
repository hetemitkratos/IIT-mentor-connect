import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')
  // Role check — only mentor (and aspirant for /apply) can access
  // Fine-grained role check occurs per-page for /mentor/* routes
  return <>{children}</>
}
