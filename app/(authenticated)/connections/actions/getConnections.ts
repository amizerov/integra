'use server'

import { prisma } from '@/lib/db'

/**
 * Получить все связи между системами
 */
export async function getConnections() {
  const connections = await prisma.dataStream.findMany({
    include: {
      sourceVersion: {
        include: {
          system: true
        }
      },
      recipientVersion: {
        include: {
          system: true
        }
      }
    }
  })
  
  return connections
}
