'use server'

import { prisma } from '@/lib/db'

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

export async function getConnectionsGraph() {
  const connections = await getConnections()
  
  // Transform data for graph visualization
  const nodes = new Map()
  const edges: any[] = []
  
  connections.forEach((connection: any) => {
    const sourceSystem = connection.sourceVersion?.system
    const recipientSystem = connection.recipientVersion?.system
    
    if (sourceSystem) {
      nodes.set(sourceSystem.systemId, {
        id: sourceSystem.systemId,
        name: sourceSystem.systemShortName || sourceSystem.systemName
      })
    }
    
    if (recipientSystem) {
      nodes.set(recipientSystem.systemId, {
        id: recipientSystem.systemId,
        name: recipientSystem.systemShortName || recipientSystem.systemName
      })
    }
    
    if (sourceSystem && recipientSystem) {
      edges.push({
        id: connection.streamId,
        source: sourceSystem.systemId,
        target: recipientSystem.systemId,
        label: connection.dataStreamDescription
      })
    }
  })
  
  return {
    nodes: Array.from(nodes.values()),
    edges
  }
}
