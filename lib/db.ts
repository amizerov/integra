import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Добавляем параметры connection pool в DATABASE_URL или через конфигурацию
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || ''
  // Добавляем параметры пула если их нет
  if (baseUrl && !baseUrl.includes('connection_limit')) {
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}connection_limit=5&pool_timeout=30`
  }
  return baseUrl
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
