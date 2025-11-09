'use server'

import { prisma } from '@/lib/db'

export async function getSystems() {
  const systems = await prisma.informationSystem.findMany({
    include: {
      versions: {
        include: {
          dataStreamsSource: true,
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
      // Подсчет только исходящих потоков данных (WHERE version_id IN ...)
      const allOutgoingStreams = system.versions.flatMap((v: any) => v.dataStreamsSource || [])
      
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
          connections: allOutgoingStreams.length,
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
    recentSystemsData
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
