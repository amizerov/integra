'use server'

import { prisma } from '@/lib/db'
import { getTopConnectedSystems } from './getTopConnectedSystems'

export async function getDashboardStats() {
  const [
    totalSystems,
    systemsWithPersonalData,
    totalVersions,
    totalConnections,
    totalManagingDocuments,
    totalUserGuides,
    totalSchemas,
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
    prisma.userGuide.count(),
    prisma.schema.count(),
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
    totalUserGuides,
    totalSchemas,
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
