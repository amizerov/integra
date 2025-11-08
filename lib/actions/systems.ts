'use server'

import { prisma } from '@/lib/db'

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
    totalVersions,
    totalConnections,
    recentSystems
  ] = await Promise.all([
    prisma.informationSystem.count(),
    prisma.systemVersion.count(),
    prisma.dataStream.count(),
    prisma.informationSystem.findMany({
      take: 5,
      orderBy: { lastChangeDate: 'desc' },
      select: {
        systemId: true,
        systemName: true,
        systemShortName: true,
        lastChangeDate: true,
      },
    }),
  ])
  
  return {
    totalSystems,
    activeSystems: totalSystems,
    totalVersions,
    activeVersions: totalVersions,
    totalConnections,
    systemsByPlatform: [],
    systemsByDatabase: [],
    recentSystems: recentSystems.map((s: any) => ({
      id: s.systemId,
      systemCode: s.systemShortName || '',
      systemName: s.systemName || '',
      updatedAt: s.lastChangeDate || new Date(),
    })),
  }
}
