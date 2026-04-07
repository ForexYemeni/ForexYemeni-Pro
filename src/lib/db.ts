import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl && databaseUrl.startsWith('postgres')) {
    const adapter = new PrismaPg({ connectionString: databaseUrl })
    return new PrismaClient({ adapter })
  }

  // Fallback: SQLite محلي للتطوير
  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
