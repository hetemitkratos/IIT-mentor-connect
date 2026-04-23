import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { z } from 'zod';

const slotsSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  slots: z.array(z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, "Slot must be exactly HH:00 or HH:30 in 24-hour format")),
});

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAuth();
    if (response) return response;

    const mentor = await prisma.mentor.findUnique({
      where: { userId: user!.id },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Unauthorized: not a mentor" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = slotsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { date, slots } = parsed.data;
    const parsedDate = new Date(date);
    // Normalize date to strictly midnight UTC so grouping works reliably if sent as YYYY-MM-DD
    parsedDate.setUTCHours(0, 0, 0, 0);

    // Completely replace the slots for this date
    await prisma.$transaction(async (tx) => {
      // Clear out existing slots for this day
      await tx.slot.deleteMany({
        where: {
          mentorId: mentor.id,
          date: parsedDate,
        },
      });

      // Insert new slots if array is not empty
      if (slots.length > 0) {
        await tx.slot.createMany({
          data: slots.map((t) => ({
            mentorId: mentor.id,
            date: parsedDate,
            startTime: t,
            isActive: true,
          })),
        });
      }
    });

    return NextResponse.json({ success: true, message: "Slots updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("[MENTOR_SLOTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAuth();
    if (response) return response;

    const mentor = await prisma.mentor.findUnique({
      where: { userId: user!.id },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date');
    if (!dateQuery) return NextResponse.json({ error: "Missing date" }, { status: 400 });

    const parsedDate = new Date(dateQuery);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const slots = await prisma.slot.findMany({
      where: { mentorId: mentor.id, date: parsedDate, isActive: true },
      select: { startTime: true },
    });

    return NextResponse.json({
      success: true,
      slots: slots.map(s => s.startTime)
    });
  } catch (error) {
    console.error("[MENTOR_SLOTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

