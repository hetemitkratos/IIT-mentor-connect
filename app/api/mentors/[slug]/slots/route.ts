import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MIN_LEAD_TIME_MINUTES = 60;

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date');

    if (!dateQuery) {
      return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
    }

    const mentor = await prisma.mentor.findUnique({
      where: { slug, isActive: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const parsedDate = new Date(dateQuery);
    parsedDate.setUTCHours(0, 0, 0, 0);

    // [Throttled Garbage Collection] Run SlotLock cleanup dynamically on reads (10% chance to save DB load)
    if (Math.random() < 0.1) {
      await prisma.slotLock.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }).catch(err => console.error("[SLOTLOCK_CLEANUP_ERROR]", err)); // Avoid blocking response
    }

    const [slots, locks, bookings] = await Promise.all([
      // 1. Fetch mentor's active slots for this day
      prisma.slot.findMany({
        where: { mentorId: mentor.id, date: parsedDate, isActive: true },
        orderBy: { startTime: 'asc' },
      }),
      // 2. Fetch active SlotLocks (expires in the future)
      prisma.slotLock.findMany({
        where: { mentorId: mentor.id, date: parsedDate, expiresAt: { gt: new Date() } },
      }),
      // 3. Fetch Bookings blocking the slots
      prisma.booking.findMany({
        where: {
          mentorId: mentor.id,
          date: parsedDate,
          status: { in: ['pending', 'paid'] },
        },
      })
    ]);

    // Build fast lookup sets for locks and bookings
    const lockedTimes = new Set(locks.map(l => l.startTime));
    const bookedTimes = new Set(bookings.map(b => b.startTime));

    const now = new Date();
    // Build availability avoiding overlaps and enforcing minimum lead time
    const availableSlots = slots.filter((slot) => {
      // 🔴 Check if booked
      if (bookedTimes.has(slot.startTime)) return false;

      // 🔴 Check if locked
      if (lockedTimes.has(slot.startTime)) return false;

      // 🔴 Check if min lead time has passed
      // Parse slot.startTime ("16:00" IST string) into a Date
      // Assuming dateQuery is standard local YYYY-MM-DD
      const [hours, mins] = slot.startTime.split(':').map(Number);
      
      // Creating the actual slot absolute timestamp (in IST)
      // Wait, date is stored as UTC 00:00:00 representation of the literal day string?
      // It's safer to reconstruct it locally using India offset (+05:30).
      // A quick ISO trick if parsedDate represents UTC string:
      // Let's do absolute arithmetic:
      const slotLocalTime = new Date(`${dateQuery}T${slot.startTime}:00+05:30`);
      
      const leadTimeThreshold = new Date(now.getTime() + MIN_LEAD_TIME_MINUTES * 60000);

      // If slot is closer than 60 mins from right now, it's blocked.
      if (slotLocalTime < leadTimeThreshold) return false;

      return true;
    });

    const response = NextResponse.json({
      success: true,
      data: availableSlots.map(s => s.startTime),
    });
    
    // Fix #4: Prevent caching of highly dynamic slot availability
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  } catch (error) {
    console.error("[STUDENT_SLOTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
