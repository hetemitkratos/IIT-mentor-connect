'use client'

import { useMentorDashboard } from '@/hooks/useMentorDashboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { UpcomingSessionsWidget } from '@/components/dashboard/UpcomingSessionsWidget'
import { PastSessionsWidget } from '@/components/dashboard/PastSessionsWidget'

export default function MentorDashboardPage() {
  const { data, isLoading, isError } = useMentorDashboard()

  const stats = [
    {
      label: 'Total Sessions',
      value: isLoading ? '—' : (data?.stats.totalSessions ?? 0),
      accent: 'blue' as const,
    },
    {
      label: 'Completed',
      value: isLoading ? '—' : (data?.stats.completedSessions ?? 0),
      accent: 'green' as const,
    },
    {
      label: 'Earnings',
      value: isLoading ? '—' : `₹${data?.stats.earningsRs ?? 0}`,
      accent: 'amber' as const,
    },
  ]

  // Flatten nested student info for widgets
  const upcomingBookings = (data?.upcomingBookings ?? []).map((b) => ({
    id:          b.id,
    status:      b.status,
    startTime:   b.startTime,
    meetingLink: b.meetingLink,
    studentName: b.student.name,
  }))

  const pastBookings = (data?.pastBookings ?? []).map((b) => ({
    id:          b.id,
    status:      b.status,
    startTime:   b.startTime,
    meetingLink: null, // No join link for past sessions
    studentName: b.student.name,
  }))

  return (
    <main className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Mentor Dashboard</h1>
        <p className="dashboard-page__subtitle">Your upcoming sessions and earnings overview</p>
      </div>

      <StatsCard stats={stats} />

      <div className="dashboard-page__widgets">
        <UpcomingSessionsWidget
          bookings={upcomingBookings}
          isLoading={isLoading}
          isError={isError}
          view="mentor"
        />
        <PastSessionsWidget
          bookings={pastBookings}
          isLoading={isLoading}
          isError={isError}
          view="mentor"
        />
      </div>
    </main>
  )
}
