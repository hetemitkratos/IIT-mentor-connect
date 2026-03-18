import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
