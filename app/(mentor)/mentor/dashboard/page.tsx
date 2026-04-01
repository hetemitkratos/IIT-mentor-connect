import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getMentorDashboard } from '@/services/dashboard.service'
import MentorDashboardContent from '@/components/mentor/MentorDashboardContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentor Dashboard — IIT Mentor Connect',
}

export default async function MentorDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  const mentor = await prisma.mentor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, iit: true, bio: true, calendlyLink: true },
  })

  if (!mentor) {
    return (
      <main className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[rgba(221,193,175,0.2)] shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎓</div>
          <h1 className="text-xl font-semibold text-[#1a1c1c] mb-2">No Mentor Profile Found</h1>
          <p className="text-[#585f6c] text-sm">
            Your mentor account hasn&apos;t been set up yet. Contact an admin if this is unexpected.
          </p>
        </div>
      </main>
    )
  }

  const {
    upcomingBookings,
    ongoingBookings,
    completedBookings,
    cancelledBookings,
    stats,
  } = await getMentorDashboard(mentor.id)

  return (
    <MentorDashboardContent
      mentorName={session.user.name ?? 'Mentor'}
      mentorIit={mentor.iit}
      mentorCalendly={mentor.calendlyLink}
      bio={mentor.bio}
      upcomingBookings={upcomingBookings}
      ongoingBookings={ongoingBookings}
      completedBookings={completedBookings}
      cancelledBookings={cancelledBookings}
      stats={stats}
    />
  )
}
