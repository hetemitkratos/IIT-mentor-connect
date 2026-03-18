import { prisma } from '@/lib/prisma'

export interface MentorFilters {
  search?:   string
  iit?:      string
  branch?:   string
  year?:     number
  language?: string
}

export async function getMentors(filters: MentorFilters, page = 1, limit = 10) {
  // Build where clause dynamically
  const searchFilter = filters.search
    ? {
        OR: [
          { user:   { name:   { contains: filters.search, mode: 'insensitive' as const } } },
          { iit:              { contains: filters.search, mode: 'insensitive' as const } },
          { branch:           { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const where = {
    isActive: true,
    ...(filters.iit      && { iit:       filters.iit }),
    ...(filters.branch   && { branch:    filters.branch }),
    ...(filters.year     && { year:      filters.year }),
    ...(filters.language && { languages: { has: filters.language } }),
    ...searchFilter,
  }

  const [total, mentors] = await Promise.all([
    prisma.mentor.count({ where }),
    prisma.mentor.findMany({
      where,
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return { mentors, total, page, totalPages }
}

export async function getMentorById(mentorId: string) {
  return prisma.mentor.findFirst({
    where: { id: mentorId, isActive: true },
    include: { user: { select: { name: true, image: true } } },
  })
}

export async function getMentorByUserId(userId: string) {
  return prisma.mentor.findUnique({ where: { userId } })
}

export async function getMentorAvailability(mentorId: string) {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    select: { id: true, isActive: true, calendlyLink: true, user: { select: { name: true } } },
  })
  return mentor
}

export async function updateMentorProfile(
  userId: string,
  data: { bio?: string; languages?: string[]; calendlyLink?: string; year?: number }
) {
  return prisma.mentor.update({
    where: { userId },
    data,
  })
}
