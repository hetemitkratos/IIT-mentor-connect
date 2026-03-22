require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  const events = await prisma.webhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('--- LATEST WEBHOOK EVENTS ---');
  console.log(JSON.stringify(events, null, 2));
  console.log('--- LATEST BOOKINGS ---');
  console.log(JSON.stringify(bookings, null, 2));
}

checkDb().catch(console.error).finally(() => prisma.$disconnect());
