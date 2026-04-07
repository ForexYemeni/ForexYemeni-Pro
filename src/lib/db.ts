import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // التحقق من وجود DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    // إرجاع PrismaClient فارغ - لن يستخدم بدون قاعدة بيانات
    return new PrismaClient({
      datasources: {
        db: {
          url: 'postgres://placeholder:placeholder@localhost:5432/placeholder'
        }
      },
      log: [],
    })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
