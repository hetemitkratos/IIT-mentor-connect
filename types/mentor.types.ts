export type MentorStatus = 'approved' | 'inactive'

export interface Mentor {
  id: string
  userId: string
  name: string
  iit: string
  branch: string
  year: number
  languages: string[]
  bio: string
  calendlyLink: string
  profileImage: string | null
  isActive: boolean
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface MentorApplication {
  id: string
  userId: string
  iit: string
  branch: string
  year: number
  languages: string[]
  bio: string
  calendlyLink: string
  collegeIdUrl: string
  status: ApplicationStatus
  submittedAt: string
  reviewedAt: string | null
}
