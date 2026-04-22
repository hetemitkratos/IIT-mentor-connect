import { z } from 'zod'

export const mentorApplySchema = z.object({
  fullName:  z.string().min(1, 'Full Name is required'),
  iit:       z.string().min(1, 'IIT is required'),
  branch:    z.string().min(1, 'Branch is required'),
  year:      z.string().min(1, 'Year is required'),
  rank:      z.string().optional(),
  state:     z.string().min(1, 'Native State is required'),
  languages: z.string().min(1, 'At least one language required'),
  bio:       z.string().min(50, 'Bio must be at least 50 characters').max(600, 'Bio must be at most 600 characters'),
  // calendlyLink is optional at application time — mentor sets it on dashboard after approval
  calLink:   z.string().min(0).optional(),
  collegeIdUrl: z.string().min(1, 'College ID URL is required'),
})

export const mentorProfileUpdateSchema = z.object({
  bio:          z.string().min(50).max(600).optional(),
  languages:    z.array(z.string()).min(1).optional(),
  calLink:       z.string().url().regex(/cal\.com/, 'Must be a valid cal.com link').optional(),
  year:         z.number().int().min(1).max(5).optional(),
})

export type MentorApplyInput    = z.infer<typeof mentorApplySchema>
export type MentorProfileUpdateInput = z.infer<typeof mentorProfileUpdateSchema>
