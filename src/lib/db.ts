import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { neon } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl && databaseUrl.startsWith('postgres')) {
    try {
      const sql = neon(databaseUrl)
      const adapter = new PrismaPg({ queryer: sql })
      return new PrismaClient({ adapter })
    } catch {
      return new PrismaClient()
    }
  }

  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
