'use client'

import type { Metadata } from 'next'
import { useStudentDashboard } from '@/hooks/useStudentDashboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { UpcomingSessionsWidget } from '@/components/dashboard/UpcomingSessionsWidget'
import { PastSessionsWidget } from '@/components/dashboard/PastSessionsWidget'

// Note: metadata must be in a server component — moved to layout or as a static export.
// For client pages, we declare it separately.

export default function StudentDashboardPage() {
  const { data, isLoading, isError } = useStudentDashboard()

  const stats = [
    {
      label: 'Total Bookings',
      value: isLoading ? '—' : (data?.stats.totalBookings ?? 0),
      accent: 'blue' as const,
    },
    {
      label: 'Upcoming',
      value: isLoading ? '—' : (data?.stats.upcomingSessions ?? 0),
      accent: 'amber' as const,
    },
    {
      label: 'Completed',
      value: isLoading ? '—' : (data?.stats.completedSessions ?? 0),
      accent: 'green' as const,
    },
  ]

  // Flatten nested mentor info for widgets
  const upcomingBookings = (data?.upcomingBookings ?? []).map((b) => ({
    id:          b.id,
    status:      b.status,
    startTime:   b.startTime,
    meetingLink: b.meetingLink,
    mentorName:  b.mentor.user.name,
    mentorIit:   b.mentor.iit,
  }))

  const pastBookings = (data?.pastBookings ?? []).map((b) => ({
    id:          b.id,
    status:      b.status,
    startTime:   b.startTime,
    meetingLink: b.meetingLink,
    mentorName:  b.mentor.user.name,
    mentorIit:   b.mentor.iit,
  }))

  return (
    <main className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">My Dashboard</h1>
        <p className="dashboard-page__subtitle">Your upcoming and past mentorship sessions</p>
      </div>

      <StatsCard stats={stats} />

      <div className="dashboard-page__widgets">
        <UpcomingSessionsWidget
          bookings={upcomingBookings}
          isLoading={isLoading}
          isError={isError}
          view="student"
        />
        <PastSessionsWidget
          bookings={pastBookings}
          isLoading={isLoading}
          isError={isError}
          view="student"
        />
      </div>
    </main>
  )
}
