'use server'

import { prisma } from '@/lib/db'

/**
 * Получить недавно обновленные системы
 */
export async function getRecentSystems(limit: number = 5) {
  const recentSystemsData = await prisma.informationSystem.findMany({
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
  })

  // Сортируем системы по дате изменения их последней версии
  const sortedSystems = recentSystemsData
    .filter(s => s.versions.length > 0)
    .sort((a, b) => {
      const dateA = a.versions[0]?.lastChangeDate || new Date(0)
      const dateB = b.versions[0]?.lastChangeDate || new Date(0)
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, limit)
  
  return sortedSystems.map((s: any) => {
    const latestVersion = s.versions[0]
    return {
      id: s.systemId,
      systemCode: s.systemShortName || '',
      systemName: s.systemName || '',
      updatedAt: latestVersion?.lastChangeDate || new Date(),
      modifiedBy: latestVersion?.modifier?.fio || 'Неизвестно',
    }
  })
}
