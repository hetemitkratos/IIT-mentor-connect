'use client'

import { useQuery } from '@tanstack/react-query'

export interface MentorDashboardBooking {
  id:          string
  status:      string
  createdAt:   string
  startTime:   string | null
  meetingLink: string | null
  student: { name: string | null; image: string | null }
}

export interface MentorDashboardData {
  upcomingBookings: MentorDashboardBooking[]
  pastBookings:     MentorDashboardBooking[]
  stats: {
    totalSessions:     number
    completedSessions: number
    upcomingSessions:  number
    earningsRs:        number
  }
}

async function fetchMentorDashboard(): Promise<MentorDashboardData> {
  const res  = await fetch('/api/dashboard/mentor')
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Failed to load dashboard')
  return json.data
}

export function useMentorDashboard() {
  return useQuery<MentorDashboardData, Error>({
    queryKey: ['dashboard', 'mentor'],
    queryFn:  fetchMentorDashboard,
  })
}
