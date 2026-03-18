import { z } from 'zod'

export const mentorApplySchema = z.object({
  iit: z.string().min(1, 'IIT is required'),
  branch: z.string().min(1, 'Branch is required'),
  year: z.number().int().min(1).max(5),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  calendlyLink: z.string().url('Must be a valid Calendly URL'),
})

export const mentorProfileUpdateSchema = z.object({
  bio: z.string().min(50).optional(),
  languages: z.array(z.string()).min(1).optional(),
  calendlyLink: z.string().url().optional(),
  year: z.number().int().min(1).max(5).optional(),
})

export type MentorApplyInput = z.infer<typeof mentorApplySchema>
export type MentorProfileUpdateInput = z.infer<typeof mentorProfileUpdateSchema>
