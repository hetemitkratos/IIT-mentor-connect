import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')
  return (
    <>
      <AppHeader />
      <main>{children}</main>
      <PublicFooter />
    </>
  )
}
