import { z } from 'zod'

export const generateOtpSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

export const verifyOtpSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  otp: z.string().regex(/^\d{4}$/, 'OTP must be exactly 4 digits'),
})

export type GenerateOtpInput = z.infer<typeof generateOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
