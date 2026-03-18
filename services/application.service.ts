import { prisma } from '@/lib/prisma'
import { getCollegeIdSignedUrl } from '@/lib/supabase'

export async function submitApplication(
  userId: string,
  data: {
    iit: string
    branch: string
    year: number
    languages: string[]
    bio: string
    calendlyLink: string
  },
  fileUrl: string
) {
  const existing = await prisma.mentorApplication.findFirst({
    where: { userId, status: { in: ['pending', 'approved'] } },
  })
  if (existing) throw new Error('DUPLICATE_APPLICATION')

  return prisma.mentorApplication.create({
    data: { userId, ...data, collegeIdUrl: fileUrl },
  })
}

export async function getApplicationStatus(userId: string) {
  const application = await prisma.mentorApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return application
}
