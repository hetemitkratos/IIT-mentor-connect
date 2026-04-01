import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard — IIT Mentor Connect',
}

// ── Tiny server-side icon components ─────────────────────────────────────────
function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="8" cy="7" r="3" stroke="#f5820a" strokeWidth="1.5" />
      <path d="M1 18c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 11a4 4 0 100-6M21 18c0-2.5-2.5-4.5-6-5" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function MentorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L3 6v5c0 5 3.5 9.74 8 11 4.5-1.26 8-6 8-11V6l-8-4z" stroke="#f5820a" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
function BookingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="4" width="18" height="16" rx="2" stroke="#f5820a" strokeWidth="1.5" />
      <path d="M2 9h18M7 2v4M15 2v4" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function PendingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="#f5820a" strokeWidth="1.5" />
      <path d="M11 6v5l3 3" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default async function AdminDashboardPage() {
  const [totalUsers, totalMentors, totalBookings, pendingApplications] = await Promise.all([
    prisma.user.count(),
    prisma.mentor.count(),
    prisma.booking.count(),
    prisma.mentorApplication.count({ where: { status: 'pending' } }),
  ])

  const stats = [
    { label: 'Total Users',          value: totalUsers,          icon: <UsersIcon />,   hint: 'Registered accounts' },
    { label: 'Active Mentors',       value: totalMentors,        icon: <MentorIcon />,  hint: 'Approved mentors' },
    { label: 'Total Bookings',       value: totalBookings,       icon: <BookingIcon />, hint: 'All time sessions' },
    { label: 'Pending Applications', value: pendingApplications, icon: <PendingIcon />, hint: 'Awaiting review' },
  ]

  const quickActions = [
    {
      label: 'Review Applications',
      href: '/admin/applications',
      description: 'Approve or reject mentor applications',
      badge: pendingApplications > 0 ? `${pendingApplications} pending` : null,
    },
    {
      label: 'View Bookings',
      href: '/admin/bookings',
      description: 'Monitor all booking activity on the platform',
      badge: null,
    },
    {
      label: 'Manage Users',
      href: '/admin/users',
      description: 'View and manage student and mentor accounts',
      badge: null,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 32px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.2,
            color: '#1a1c1c',
            margin: 0,
          }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#585f6c', marginTop: 6 }}>
            Manage mentors, bookings, and users across the platform.
          </p>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 48,
        }}>
          {stats.map(s => (
            <div
              key={s.label}
              style={{
                background: '#fff',
                border: '1px solid rgba(221,193,175,0.22)',
                borderRadius: 16,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  background: 'rgba(245,130,10,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {s.icon}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#585f6c' }}>
                  {s.label}
                </span>
              </div>
              <span style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 40,
                fontWeight: 400,
                color: '#1a1c1c',
                lineHeight: 1,
              }}>
                {s.value}
              </span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{s.hint}</span>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <h2 style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 26,
          fontWeight: 400,
          color: '#1a1c1c',
          marginBottom: 16,
        }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quickActions.map(action => (
          <Link
              key={action.href}
              href={action.href}
              className="admin-action-card"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1c1c' }}>
                    {action.label}
                  </span>
                  {action.badge && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#fef3c7',
                      color: '#B8962E',
                      borderRadius: 9999,
                      padding: '2px 8px',
                      letterSpacing: '0.3px',
                    }}>
                      {action.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: '#585f6c' }}>{action.description}</span>
              </div>
              <span style={{ color: '#f5820a', flexShrink: 0 }}>
                <ArrowRight />
              </span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
