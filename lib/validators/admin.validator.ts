import { z } from 'zod'

export const rejectApplicationSchema = z.object({
  reason: z.string().min(10, 'Please provide a rejection reason'),
})

export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>
