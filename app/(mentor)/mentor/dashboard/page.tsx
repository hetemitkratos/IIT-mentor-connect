import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getMentorDashboard } from '@/services/dashboard.service'
import LogoutButton from '@/components/auth/LogoutButton'
import VerifySessionOTP from '@/components/booking/VerifySessionOTP'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentor Dashboard — IIT Mentor Connect',
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function MentorDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  // Get the mentor record for this user
  const mentor = await prisma.mentor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!mentor) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No Mentor Profile Found</h1>
          <p className="text-gray-500">Your mentor account hasn&apos;t been set up yet. Contact an admin if this is unexpected.</p>
        </div>
      </main>
    )
  }

  const { upcomingBookings, pastBookings, stats } = await getMentorDashboard(mentor.id)

  const statCards = [
    { label: 'Total Sessions', value: stats.totalSessions },
    { label: 'Upcoming', value: stats.upcomingSessions },
    { label: 'Completed', value: stats.completedSessions },
    { label: 'Earnings', value: `₹${stats.earningsRs}` },
  ]

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {session.user.name ?? 'Mentor'} 👋</p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Sessions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Upcoming Sessions
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
              No upcoming sessions
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {b.student.name ?? 'Student'}
                    </p>
                    {b.startTime && (
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {formatDate(b.startTime)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Status: {b.status === 'scheduled' ? 'Scheduled' : 'Awaiting Time Selection'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {b.meetingLink ? (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Join Session
                      </a>
                    ) : (
                      <span className="inline-block px-4 py-2 bg-gray-100 text-gray-400 text-sm rounded-md">
                        No link yet
                      </span>
                    )}
                    <VerifySessionOTP
                      bookingId={b.id}
                      otpVerified={b.otpVerified}
                      status={b.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Sessions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Past Sessions
          </h2>

          {pastBookings.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
              No past sessions
            </div>
          ) : (
            <div className="space-y-3 opacity-85">
              {pastBookings.map(b => (
                <div key={b.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">
                      {b.student.name ?? 'Student'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(b.startTime ?? b.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    b.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {b.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
