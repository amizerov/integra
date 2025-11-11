'use server'

import { prisma } from '@/lib/db'

/**
 * Получить топ систем по количеству связей (входящих + исходящих)
 */
export async function getTopConnectedSystems(limit: number = 4) {
  // Получаем все системы с их версиями и связями
  const systems = await prisma.informationSystem.findMany({
    include: {
      versions: {
        include: {
          dataStreamsSource: true, // Исходящие потоки
          dataStreamsRecipient: true, // Входящие потоки
        }
      }
    }
  })
  
  // Подсчитываем общее количество связей для каждой системы
  const systemsWithConnections = systems.map(system => {
    const outgoingCount = system.versions.reduce(
      (sum: number, v: any) => sum + (v.dataStreamsSource?.length || 0), 
      0
    )
    const incomingCount = system.versions.reduce(
      (sum: number, v: any) => sum + (v.dataStreamsRecipient?.length || 0), 
      0
    )
    const totalConnections = outgoingCount + incomingCount
    
    return {
      systemId: system.systemId,
      systemName: system.systemName || '',
      systemShortName: system.systemShortName || '',
      totalConnections,
      outgoingCount,
      incomingCount,
    }
  })
  
  // Сортируем по количеству связей и берем топ
  return systemsWithConnections
    .filter(s => s.totalConnections > 0)
    .sort((a, b) => b.totalConnections - a.totalConnections)
    .slice(0, limit)
}

export async function getSystems() {
  const systems = await prisma.informationSystem.findMany({
    include: {
      versions: {
        include: {
          dataStreamsSource: true,
          dataStreamsRecipient: true,
        }
      },
      documents: true,
      creator: true,
    },
    orderBy: {
      creationDate: 'desc'
    }
  })
  
  return {
    systems: systems.map((system: any) => {
      // Подсчет исходящих и входящих потоков данных
      const allOutgoingStreams = system.versions.flatMap((v: any) => v.dataStreamsSource || [])
      const allIncomingStreams = system.versions.flatMap((v: any) => v.dataStreamsRecipient || [])
      
      return {
        id: system.systemId,
        systemId: system.systemId,
        systemShortName: system.systemShortName || '',
        systemName: system.systemName || '',
        hasPersonalData: system.hasPersonalData,
        createdBy: system.creator?.fio || 'Неизвестно',
        createdAt: system.creationDate,
        modifiedBy: system.modifier?.fio || 'Неизвестно',
        modifiedAt: system.lastChangeDate,
        _count: {
          versions: system.versions.length,
          documents: system.documents.length,
          connections: allOutgoingStreams.length + allIncomingStreams.length,
          outgoingConnections: allOutgoingStreams.length,
          incomingConnections: allIncomingStreams.length,
        }
      }
    })
  }
}

export async function getSystemById(id: number) {
  const system = await prisma.informationSystem.findUnique({
    where: { systemId: id },
    include: {
      versions: {
        orderBy: {
          productionStartYear: 'desc'
        }
      },
      documents: {
        include: {
          documentKind: true
        }
      }
    }
  })
  
  return system
}

export async function createSystem(data: {
  systemName: string
  systemShortName?: string
  hasPersonalData?: boolean
  userId: number
}) {
  // Get the max systemId to generate the next one
  const maxSystem = await prisma.informationSystem.findFirst({
    orderBy: { systemId: 'desc' }
  })
  const nextId = (maxSystem?.systemId || 0) + 1
  
  const system = await prisma.informationSystem.create({
    data: {
      systemId: nextId,
      systemName: data.systemName,
      systemShortName: data.systemShortName,
      hasPersonalData: data.hasPersonalData ? 1 : 0,
      userId: data.userId,
      creationDate: new Date(),
      lastChangeUser: data.userId,
      lastChangeDate: new Date()
    }
  })
  
  return system
}

export async function getDashboardStats() {
  const [
    totalSystems,
    systemsWithPersonalData,
    totalVersions,
    totalConnections,
    totalManagingDocuments,
    totalFullTextDocuments,
    totalUserGuides,
    recentSystemsData,
    topConnectedSystems,
  ] = await Promise.all([
    prisma.informationSystem.count(),
    prisma.informationSystem.count({
      where: { hasPersonalData: 1 }
    }),
    prisma.systemVersion.count(),
    prisma.dataStream.count(),
    prisma.managingDocument.count(),
    prisma.documentFullText.count(),
    prisma.userGuide.count(),
    // Получаем системы с их последними версиями
    prisma.informationSystem.findMany({
      include: {
        versions: {
          orderBy: { lastChangeDate: 'desc' },
          take: 1,
          include: {
            modifier: {
              select: { fio: true }
            }
          }
        }
      }
    }),
    // Получаем топ систем по количеству связей
    getTopConnectedSystems(10),
  ])

  // Сортируем системы по дате изменения их последней версии и берем топ-5
  const sortedSystems = recentSystemsData
    .filter(s => s.versions.length > 0) // Только системы с версиями
    .sort((a, b) => {
      const dateA = a.versions[0]?.lastChangeDate || new Date(0)
      const dateB = b.versions[0]?.lastChangeDate || new Date(0)
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 5)
  
  return {
    totalSystems,
    systemsWithPersonalData,
    activeSystems: totalSystems,
    totalVersions,
    activeVersions: totalVersions,
    totalConnections,
    totalManagingDocuments,
    totalFullTextDocuments,
    totalUserGuides,
    systemsByPlatform: [],
    systemsByDatabase: [],
    topConnectedSystems,
    recentSystems: sortedSystems.map((s: any) => {
      const latestVersion = s.versions[0] // Самая последняя версия по дате изменения
      return {
        id: s.systemId,
        systemCode: s.systemShortName || '',
        systemName: s.systemName || '',
        updatedAt: latestVersion?.lastChangeDate || new Date(),
        modifiedBy: latestVersion?.modifier?.fio || 'Неизвестно',
      }
    }),
  }
}
