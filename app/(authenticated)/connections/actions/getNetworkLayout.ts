'use server'

import prisma from '@/lib/db'

interface LayoutNode {
  id: string
  x: number
  y: number
}

interface LayoutData {
  nodes: LayoutNode[]
  zoom?: number
  pan?: { x: number; y: number }
}

export async function getNetworkLayout(layoutId: number) {
  try {
    const layout = await prisma.networkLayout.findUnique({
      where: { id: layoutId },
      include: {
        user: {
          select: {
            fio: true,
          },
        },
      },
    })

    if (!layout) {
      return null
    }

    // Все карты доступны всем пользователям
    return {
      ...layout,
      layoutData: JSON.parse(layout.layoutData) as LayoutData,
    }
  } catch (error) {
    console.error('Error fetching layout:', error)
    return null
  }
}

