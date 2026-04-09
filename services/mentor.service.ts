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
      include: { 
        user: { select: { name: true, image: true } },
        bookings: {
          select: { review: true, rating: true, updatedAt: true, student: { select: { name: true } } },
          where: { review: { not: null } },
          orderBy: { updatedAt: 'desc' },
          take: 5
        }
      },
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

export async function getMentorBySlug(slug: string) {
  return prisma.mentor.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      iit: true,
      branch: true,
      year: true,
      rank: true,
      state: true,
      languages: true,
      bio: true,
      profileImage: true,
      availableSlots: true,
      timezone: true,
      availabilityConfigured: true,
      calEventTypeId: true,
      user: { select: { name: true, image: true } },
    },
  })
}

export async function getMentorByUserId(userId: string) {
  return prisma.mentor.findUnique({ where: { userId } })
}

export async function getMentorAvailability(mentorId: string) {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    select: { id: true, isActive: true, calLink: true, user: { select: { name: true } } },
  })
  return mentor
}

export async function updateMentorProfile(
  userId: string,
  data: { bio?: string; languages?: string[]; calLink?: string; year?: number }
) {
  return prisma.mentor.update({
    where: { userId },
    data,
  })
}

export async function updateMentorAvailability(
  userId: string,
  data: {
    availableSlots: any
    timezone: string
    availabilityConfigured: boolean
    calEventTypeId?: string
  }
) {
  return prisma.mentor.update({
    where: { userId },
    data
  })
}

export interface CreateMentorInput {
  userId:       string
  iit:          string
  branch:       string
  year:         number
  languages:    string[]
  bio:          string
  calLink:       string
  profileImage?: string
}

/**
 * Creates a mentor using the Prisma client.
 * @default(uuid()) is a Prisma CLIENT-level default — it only fires when you
 * use prisma.mentor.create(). Prisma Studio bypasses the client and writes
 * directly to the DB, so it never sees this default. Always use this function.
 */
export async function createMentor(input: CreateMentorInput) {
  const existing = await prisma.mentor.findUnique({ where: { userId: input.userId } })
  if (existing) throw new Error('MENTOR_ALREADY_EXISTS')

  return prisma.mentor.create({
    data: {
      userId:       input.userId,
      iit:          input.iit,
      branch:       input.branch,
      year:         input.year,
      languages:    input.languages,
      bio:          input.bio,
      calLink:       input.calLink,
      profileImage: input.profileImage,
    },
    include: { user: { select: { name: true, image: true } } },
  })
}

