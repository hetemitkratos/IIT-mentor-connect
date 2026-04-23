import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/security';
import { success, error } from '@/lib/api-response';
import { z } from 'zod';

const createBookingSchema = z.object({
  mentorId: z.string().uuid('Invalid mentor ID'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, "Invalid time format"),
});

const SLOT_HOLD_MINUTES = 10;
const SESSION_DURATION = 20;

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const rateLimitResponse = checkRateLimit(`create_booking_${user!.id}`);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);

  const { mentorId, date, startTime } = parsed.data;
  const parsedDate = new Date(date);
  parsedDate.setUTCHours(0, 0, 0, 0);

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Mandatory GC: Clean up any expired locks guaranteeing fresh un-locked slots
      await tx.slotLock.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      });

      // 2. Verify mentor exists and is active
      const mentor = await tx.mentor.findUnique({
        where: { id: mentorId },
      });
      if (!mentor || !mentor.isActive) {
        throw new Error('MENTOR_INACTIVE');
      }

      // 3. User limit: 1 active booking per mentor per student
      const existingActive = await tx.booking.findFirst({
        where: {
          studentId: user!.id,
          mentorId: mentorId,
          status: { in: ['pending', 'paid'] },
        },
      });
      if (existingActive) throw new Error('DUPLICATE_BOOKING');

      // 4. Check if slot actually exists in Mentor's configuration
      const slotDef = await tx.slot.findUnique({
        where: { mentorId_date_startTime: { mentorId, date: parsedDate, startTime } }
      });
      if (!slotDef || !slotDef.isActive) {
        throw new Error('SLOT_NOT_FOUND');
      }

      // 5. Calculate Time boundaries
      const lockExpiresAt = new Date(Date.now() + SLOT_HOLD_MINUTES * 60000);
      
      // Calculate endTime based on session duration (e.g., 20 mins)
      const [h, m] = startTime.split(':').map(Number);
      const endM = m + SESSION_DURATION;
      const endH = h + Math.floor(endM / 60);
      const endMinsRest = endM % 60;
      const endTimeFormatted = `${endH.toString().padStart(2, '0')}:${endMinsRest.toString().padStart(2, '0')}`;

      // 6. DB Level Locks via Application creation
      // If either of these throws a PrismaUniqueConstraintViolation, the slot is taken!
      const lock = await tx.slotLock.create({
        data: {
          mentorId,
          date: parsedDate,
          startTime,
          expiresAt: lockExpiresAt,
        }
      });
      console.log(JSON.stringify({
        event: "LOCK_CREATED",
        lockId: lock.id,
        startTime,
        mentorId,
        studentId: user!.id,
        timestamp: new Date().toISOString()
      }));

      const newBooking = await tx.booking.create({
        data: {
          studentId: user!.id,
          mentorId,
          date: parsedDate,
          startTime,
          endTime: endTimeFormatted,
          status: 'pending',
          source: 'internal',
        }
      });

      // Tie bookingId back into SlotLock ensuring deterministic strict payment verify linkage
      await tx.slotLock.update({
        where: { id: lock.id },
        data: { bookingId: newBooking.id }
      });

      console.log(JSON.stringify({
        event: "BOOKING_CREATED",
        bookingId: newBooking.id,
        lockId: lock.id,
        mentorId,
        studentId: user!.id,
        timestamp: new Date().toISOString()
      }));

      return newBooking;
    });

    return success({ 
      bookingId: booking.id, 
      sessionToken: booking.sessionToken, 
      paymentRequired: true 
    }, 201);

  } catch (err: any) {
    // Handle Prisma P2002 Unique Constraint Violation
    if (err.code === 'P2002') {
      return error('Slot is already taken or locked by another user.', 409);
    }
    
    // Handle internal logical errors thrown inside transaction
    if (err instanceof Error) {
      if (err.message === 'DUPLICATE_BOOKING') return error('You already have an active booking with this mentor', 409);
      if (err.message === 'MENTOR_INACTIVE') return error('Mentor is not active or not found', 400);
      if (err.message === 'SLOT_NOT_FOUND') return error('This slot is not configured or available', 400);
    }
    
    console.error('[BOOKING_CREATE_ERROR]', err);
    return error('Failed to create booking', 500);
  }
}
