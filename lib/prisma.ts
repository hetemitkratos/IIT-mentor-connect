/**
 * lib/prisma.ts
 *
 * Uses the @neondatabase/serverless driver so ALL queries travel over
 * HTTPS/WebSocket (port 443) instead of raw TCP (port 5432).
 *
 * This is required for environments where port 5432 is blocked
 * (college networks, corporate firewalls, etc.) and is the recommended
 * approach for Neon on serverless/edge runtimes as well.
 */

import { neon, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon }       from '@prisma/adapter-neon'
import { PrismaClient }     from '@prisma/client'

// Use WebSockets for the connection — travels over port 443 (never blocked)
neonConfig.webSocketConstructor =
  typeof WebSocket !== 'undefined'
    ? WebSocket                                     // browser / edge runtime
    : require('ws')                                 // Node.js (local dev server)

neonConfig.poolQueryViaFetch = true                 // fallback: HTTP fetch for single queries

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set in .env')

  const adapter = new PrismaNeon({ connectionString: url })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
