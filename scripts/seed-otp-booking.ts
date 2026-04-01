import { PrismaClient } from '@prisma/client'
import { neon, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws
neonConfig.poolQueryViaFetch = true

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding test booking for OTP...');

  // 1. Get any student
  const student = await prisma.user.findFirst({
    where: { role: 'aspirant' }
  });

  // 2. Get any mentor
  const mentor = await prisma.mentor.findFirst();

  if (!student || !mentor) {
    console.log('Need at least 1 student and 1 mentor in DB.');
    return;
  }

  // 3. Create a booking that is currently Active (Starts right now, ends in 30 mins)
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 60 * 1000);

  const booking = await prisma.booking.create({
    data: {
      studentId: student.id,
      mentorId: mentor.id,
      sessionToken: 'test-otp-session-token-' + Date.now(),
      status: 'scheduled',
      startTime: now,
      endTime: end,
      meetingLink: 'https://meet.google.com/test-otp-link'
    }
  });

  console.log(`✅ Test Booking Created!`);
  console.log(`Booking ID: ${booking.id}`);
  console.log(`Student ID: ${student.id} | Email: ${student.email}`);
  console.log(`Mentor ID: ${mentor.id}`);
  console.log(`Please login as the student to see the "Start Session" button!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
