import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/security';
import { success, error } from '@/lib/api-response';
import { z } from 'zod';
import { generateSlots, filterByLeadTime } from '@/services/slot-generator';

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
      // 1. Mandatory GC: Cancel pending bookings whose slot lock has expired (strict bookingId linkage)
      const expiredLocks = await tx.slotLock.findMany({
        where: { expiresAt: { lt: new Date() } },
        select: { bookingId: true },
      });
      if (expiredLocks.length > 0) {
        // Only cancel the EXACT booking tied to each lock — never cancel by mentorId/date/time
        const expiredBookingIds = expiredLocks
          .map(l => l.bookingId)
          .filter((id): id is string => id !== null);
        if (expiredBookingIds.length > 0) {
          await tx.booking.updateMany({
            where: { id: { in: expiredBookingIds }, status: 'pending' },
            data: { status: 'cancelled' },
          });
        }
        await tx.slotLock.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      }

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
        select: { id: true, status: true },
      });
      if (existingActive) {
        if (existingActive.status === 'pending') {
          // Return the existing booking so frontend can redirect to payment
          throw Object.assign(new Error('EXISTING_PENDING'), { bookingId: existingActive.id });
        }
        throw new Error('DUPLICATE_BOOKING');
      }

      // 4. Validate slot against Availability (backend source of truth)
      // Derive IST day-of-week from the date
      const [yr, mo, dy] = date.split('-').map(Number);
      const istDayDate = new Date(Date.UTC(yr, mo - 1, dy, 0, 0, 0));
      istDayDate.setUTCMinutes(-330);
      const bookingDayOfWeek = istDayDate.getUTCDay();

      const availability = await tx.availability.findFirst({
        where: { mentorId, dayOfWeek: bookingDayOfWeek, isActive: true },
      });
      if (!availability) {
        throw new Error('INVALID_SLOT');
      }

      // Verify startTime falls within the generated slot list
      const validSlots = generateSlots(availability.startTime, availability.endTime);
      if (!validSlots.includes(startTime)) {
        throw new Error('INVALID_SLOT');
      }

      // Enforce lead-time (>= 1 hour from now)
      const leadValid = filterByLeadTime([startTime], date);
      if (leadValid.length === 0) {
        throw new Error('SLOT_TOO_SOON');
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
          startDateTime: new Date(`${date}T${startTime}:00+05:30`),
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
      return error('Slot is already taken. Please choose another.', 409);
    }
    
    // Handle internal logical errors thrown inside transaction
    if (err instanceof Error) {
      if (err.message === 'EXISTING_PENDING') {
        return NextResponse.json(
          { success: false, code: 'EXISTING_PENDING', bookingId: (err as any).bookingId, message: 'You already have a reserved slot. Continue to payment.' },
          { status: 409 }
        );
      }
      if (err.message === 'DUPLICATE_BOOKING') return error('You already have an active booking with this mentor', 409);
      if (err.message === 'MENTOR_INACTIVE') return error('Mentor is not active or not found', 400);
      if (err.message === 'INVALID_SLOT') return error('Invalid or unavailable slot', 400);
      if (err.message === 'SLOT_TOO_SOON') return error('This slot is too soon to book. Please allow at least 1 hour in advance.', 400);
    }
    
    console.error('[BOOKING_CREATE_ERROR]', err);
    return error('Failed to create booking', 500);
  }
}
