'use server'

import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

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
    const session = await auth()
    
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

    // Проверяем доступ
    const hasAccess = 
      layout.isPublic || 
      (session?.user?.id && layout.userId === Number(session.user.id))

    if (!hasAccess) {
      return null
    }

    return {
      ...layout,
      layoutData: JSON.parse(layout.layoutData) as LayoutData,
    }
  } catch (error) {
    console.error('Error fetching layout:', error)
    return null
  }
}
