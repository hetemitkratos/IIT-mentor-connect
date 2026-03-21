import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard — IIT Mentor Connect',
}

export default async function AdminDashboardPage() {
  // Fetch basic stats
  const [totalUsers, totalMentors, totalBookings, pendingApplications] = await Promise.all([
    prisma.user.count(),
    prisma.mentor.count(),
    prisma.booking.count(),
    prisma.mentorApplication.count({ where: { status: 'pending' } }),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers },
    { label: 'Active Mentors', value: totalMentors },
    { label: 'Total Bookings', value: totalBookings },
    { label: 'Pending Applications', value: pendingApplications },
  ]

  const quickActions = [
    { label: 'Review Applications', href: '/admin/applications', description: 'Approve or reject mentor applications' },
    { label: 'View Bookings', href: '/admin/bookings', description: 'Monitor all booking activity' },
    { label: 'Manage Users', href: '/admin/users', description: 'View and manage user accounts' },
  ]

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage mentors, bookings, and users</p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-3">
          {quickActions.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div>
                <p className="font-medium text-gray-900">{action.label}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
              <span className="text-gray-400 text-lg">→</span>
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}
