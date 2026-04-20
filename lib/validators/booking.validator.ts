import { z } from 'zod'

export const createBookingSchema = z.object({
  mentorId: z.string().uuid('Invalid mentor ID'),
  selectedDay: z.string().min(1).optional(),
  selectedSlot: z.string().min(1).optional(),
})

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

export const completeBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

export const rateBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(300).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
