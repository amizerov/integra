'use server'

import { prisma } from '@/lib/db'

/**
 * Получить статистику по связям
 */
export async function getConnectionsStats() {
  const totalConnections = await prisma.dataStream.count()

  return {
    totalConnections,
  }
}
