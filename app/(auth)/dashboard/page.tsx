import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StudentDashboardContent from '@/components/student/StudentDashboardContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Dashboard — CandidConversation',
}

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  // Role guards
  const role = session.user.role
  if (role === 'mentor') redirect('/mentor/dashboard')
  if (role === 'admin') redirect('/admin')

  const bookings = await prisma.booking.findMany({
    where: { studentId: session.user.id },
    include: {
      mentor: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const uniqueMentors = new Set(bookings.map(b => b.mentorId)).size

  const stats = {
    completed: bookings.filter(b => b.status === 'completed').length,
    upcoming:  bookings.filter(b => !['completed', 'cancelled'].includes(b.status)).length,
    mentorsConsulted: uniqueMentors,
  }

  return (
    <StudentDashboardContent
      studentName={session.user.name ?? 'Student'}
      bookings={bookings as any}
      stats={stats}
    />
  )
}
