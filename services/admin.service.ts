import { prisma } from '@/lib/prisma'
import { expireBookingsIfNeeded } from './booking.service'
import { Booking } from '@prisma/client'

export async function getApplications(status = 'pending', page = 1, limit = 20) {
  const where = { status: status as never }
  const [total, applications] = await Promise.all([
    prisma.mentorApplication.count({ where }),
    prisma.mentorApplication.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ])

  // College IDs are stored as plain URLs (Google Drive / public links)
  return { applications, total, page }
}

export async function approveApplication(applicationId: string) {
  const application = await prisma.mentorApplication.findUnique({
    where: { id: applicationId },
  })
  if (!application) throw new Error('NOT_FOUND')

  return prisma.$transaction([
    prisma.mentorApplication.update({
      where: { id: applicationId },
      data: { status: 'approved', reviewedAt: new Date() },
    }),
    prisma.mentor.create({
      data: {
        userId:    application.userId,
        iit:       application.iit,
        branch:    application.branch,
        year:      application.year,
        languages: application.languages,
        bio:       application.bio,
        calLink:   application.calLink,
      },
    }),
    prisma.user.update({
      where: { id: application.userId },
      data: { role: 'mentor' },
    }),
  ])
}

export async function rejectApplication(applicationId: string, reason: string) {
  return prisma.mentorApplication.update({
    where: { id: applicationId },
    data: { status: 'rejected', reviewedAt: new Date() },
  })
}

export async function getAllBookings(status?: string, page = 1, limit = 20) {
  const where = status ? { status: status as never } : {}
  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        mentor:  { include: { user: { select: { name: true } } } },
        student: { select: { name: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ])
  
  await expireBookingsIfNeeded(bookings as unknown as Booking[])
  
  return { bookings, total, page }
}

export async function adminCompleteBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) throw new Error('NOT_FOUND')
  if (booking.status !== 'scheduled') throw new Error('INVALID_STATUS')

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'completed' },
  })
}

export async function getAllUsers(role?: string, page = 1, limit = 20) {
  const where = role ? { role: role as never } : {}
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ])
  return { users, total, page }
}
