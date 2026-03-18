export type BookingStatus =
  | 'payment_pending'
  | 'payment_complete'
  | 'scheduled'
  | 'completed'
  | 'cancelled'

export interface Booking {
  id: string
  mentorId: string
  studentId: string
  sessionToken: string
  calendlyEventId: string | null
  meetingLink: string | null
  startTime: string | null
  endTime: string | null
  status: BookingStatus
  createdAt: string
}

export interface BookingWithMentor extends Booking {
  mentorName: string
  mentorIit: string
  mentorBranch: string
}

export interface BookingWithStudent extends Booking {
  studentName: string
}
