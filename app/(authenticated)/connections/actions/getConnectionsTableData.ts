'use server'

import { prisma } from '@/lib/db'

/**
 * Получить данные связей для таблицы
 */
export async function getConnectionsTableData() {
  try {
    const connections = await prisma.dataStream.findMany({
      include: {
        sourceVersion: {
          include: {
            system: {
              select: {
                systemName: true,
                systemShortName: true,
              }
            }
          }
        },
        recipientVersion: {
          include: {
            system: {
              select: {
                systemName: true,
                systemShortName: true,
              }
            }
          }
        }
      },
      orderBy: [
        { versionId: 'asc' },
        { streamId: 'asc' }
      ]
    })

    return connections.map((conn: any) => ({
      id: `${conn.versionId}-${conn.streamId}`,
      streamId: conn.streamId,
      description: conn.dataStreamDescription || 'Без описания',
      source: {
        systemName: conn.sourceVersion?.system?.systemShortName || conn.sourceVersion?.system?.systemName || 'Неизвестно',
        versionCode: conn.sourceVersion?.versionCode || `v${conn.sourceVersion?.versionId}` || 'Неизвестно',
        versionId: conn.sourceVersion?.versionId || null,
      },
      recipient: conn.recipientVersionId ? {
        systemName: conn.recipientVersion?.system?.systemShortName || conn.recipientVersion?.system?.systemName || 'Неизвестно',
        versionCode: conn.recipientVersion?.versionCode || `v${conn.recipientVersion?.versionId}` || 'Неизвестно',
        versionId: conn.recipientVersion?.versionId || null,
      } : null,
      shareDatabase: Boolean(conn.shareDatabase),
      createdAt: conn.creationDate,
    }))
  } catch (error) {
    console.error('Error fetching connections table data:', error)
    return []
  }
}
