import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') redirect('/')
  return (
    <>
      <AppHeader />
      <main>{children}</main>
      <PublicFooter />
    </>
  )
}
