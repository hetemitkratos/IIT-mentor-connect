import { prisma } from '@/lib/prisma'
import { MentorApplyInput } from '@/lib/validators/mentor.validator'

export async function submitApplication(
  userId: string,
  data: MentorApplyInput,
  fileUrl: string
) {
  const existing = await prisma.mentorApplication.findFirst({
    where: { userId, status: { in: ['pending', 'approved'] } },
  })
  if (existing) throw new Error('DUPLICATE_APPLICATION')

  // Update user name if different
  await prisma.user.update({
    where: { id: userId },
    data: { name: data.fullName }
  })

  return prisma.mentorApplication.create({
    data: {
      userId,
      iit:         data.iit,
      branch:      data.branch,
      year:        parseInt(data.year, 10),
      rank:        data.rank,
      state:       data.state,
      languages:   data.languages.split(',').map(s => s.trim()).filter(Boolean),
      bio:         data.bio,
      calLink:     '',
      collegeIdUrl: fileUrl,
    },
  })
}

export async function getApplicationStatus(userId: string) {
  const application = await prisma.mentorApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return application
}
