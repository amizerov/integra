'use server'

import { prisma } from '@/lib/db'

/**
 * Получить общую статистику по системам
 */
export async function getSystemsStats() {
  const [
    totalSystems,
    systemsWithPersonalData,
    totalVersions,
    activeVersions,
  ] = await Promise.all([
    prisma.informationSystem.count(),
    prisma.informationSystem.count({
      where: { hasPersonalData: 1 }
    }),
    prisma.systemVersion.count(),
    prisma.systemVersion.count(), // Можно добавить фильтр для активных версий
  ])

  return {
    totalSystems,
    systemsWithPersonalData,
    activeSystems: totalSystems,
    totalVersions,
    activeVersions,
  }
}
