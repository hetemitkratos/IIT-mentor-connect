'use client'

import { useQuery } from '@tanstack/react-query'

export interface StudentDashboardBooking {
  id:          string
  status:      string
  createdAt:   string
  startTime:   string | null
  meetingLink: string | null
  mentor: {
    iit:    string
    branch: string
    user:   { name: string | null; image: string | null }
  }
}

export interface StudentDashboardData {
  upcomingBookings: StudentDashboardBooking[]
  pastBookings:     StudentDashboardBooking[]
  stats: {
    totalBookings:     number
    completedSessions: number
    upcomingSessions:  number
  }
}

async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const res  = await fetch('/api/dashboard/student')
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Failed to load dashboard')
  return json.data
}

export function useStudentDashboard() {
  return useQuery<StudentDashboardData, Error>({
    queryKey: ['dashboard', 'student'],
    queryFn:  fetchStudentDashboard,
  })
}
