const dotenv = require('dotenv');
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  const booking = await prisma.booking.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      mentor: { include: { user: true } },
      student: true,
      payment: true
    }
  })

  if (!booking) {
    console.log("No bookings found")
    return
  }

  console.log("--- Booking Details ---")
  console.log("ID:", booking.id)
  console.log("Status:", booking.status)
  console.log("Start DateTime:", booking.startDateTime)
  console.log("Meeting Status:", booking.meetingStatus)
  console.log("Meeting Link:", booking.meetingLink)
  console.log("Created At:", booking.createdAt)

  console.log("\n--- Mentor ---")
  console.log("Email:", booking.mentor.user.email)
  console.log("Has Access Token:", !!booking.mentor.user.googleAccessToken)
  console.log("Has Refresh Token:", !!booking.mentor.user.googleRefreshToken)
  console.log("Token Scope:", booking.mentor.user.googleTokenScope)

  console.log("\n--- Student ---")
  console.log("Email:", booking.student.email)

  console.log("\n--- Payment ---")
  console.log("Status:", booking.payment?.status)
}

main().catch(console.error).finally(() => prisma.$disconnect());
