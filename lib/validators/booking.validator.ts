import { z } from 'zod'

export const createBookingSchema = z.object({
  mentorId: z.string().uuid('Invalid mentor ID'),
})

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
