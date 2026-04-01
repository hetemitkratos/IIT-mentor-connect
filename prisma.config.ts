import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

config({ path: path.resolve('.env') })

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    // Use DIRECT_URL for Studio/migrations (bypasses PgBouncer which blocks introspection)
    // At runtime the app uses DATABASE_URL (pooler) via lib/prisma.ts
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
})