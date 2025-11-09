'use server'

import { prisma } from '@/lib/db'

export async function getSystemsNetworkData() {
  try {
    // Получаем все версии систем
    const versions = await prisma.systemVersion.findMany({
      include: {
        system: {
          select: {
            systemShortName: true,
            systemName: true,
          }
        }
      }
    })

    // Получаем все потоки данных
    const dataStreams = await prisma.dataStream.findMany({
      include: {
        sourceVersion: {
          include: {
            system: true
          }
        }
      }
    })

    // Получаем информацию о версиях-получателях
    const recipientVersionIds = dataStreams
      .filter(ds => ds.recipientVersionId)
      .map(ds => ds.recipientVersionId!)
    
    const recipientVersions = await prisma.systemVersion.findMany({
      where: {
        versionId: {
          in: recipientVersionIds
        }
      },
      include: {
        system: {
          select: {
            systemShortName: true,
            systemName: true,
          }
        }
      }
    })

    const recipientMap = new Map(recipientVersions.map(v => [v.versionId, v]))

    // Формируем узлы (nodes) - версии систем
    const nodes = versions.map((version: any) => ({
      id: version.versionId.toString(),
      label: `${version.system.systemShortName || 'Система ' + version.systemId}\n(v.${version.versionCode || version.versionId})`,
      systemId: version.systemId,
      versionId: version.versionId,
      systemName: version.system.systemName,
      systemShortName: version.system.systemShortName,
      versionCode: version.versionCode,
    }))

    // Формируем связи (edges) - потоки данных
    const edges: Array<{
      id: string
      source: string
      target: string
      label?: string
    }> = []

    dataStreams.forEach((stream: any) => {
      if (stream.recipientVersionId) {
        edges.push({
          id: `${stream.versionId}-${stream.recipientVersionId}-${stream.streamId}`,
          source: stream.versionId.toString(),
          target: stream.recipientVersionId.toString(),
          label: stream.dataStreamDescription || undefined,
        })
      }
    })

    console.log(`Total nodes: ${nodes.length}, Total edges: ${edges.length}`)
    
    return { nodes, edges }
  } catch (error) {
    console.error('Error fetching network data:', error)
    return { nodes: [], edges: [] }
  }
}
