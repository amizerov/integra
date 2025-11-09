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

export async function saveNetworkLayout(
  name: string,
  description: string | null,
  layoutData: LayoutData,
  isPublic: boolean = false
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    const layout = await prisma.networkLayout.create({
      data: {
        name,
        description,
        userId: Number(session.user.id),
        layoutData: JSON.stringify(layoutData),
        isPublic,
      },
    })

    console.log('Layout saved:', layout.id)
    return { success: true, layoutId: layout.id }
  } catch (error) {
    console.error('Error saving layout:', error)
    return { success: false, error: 'Не удалось сохранить схему' }
  }
}

export async function updateNetworkLayout(
  layoutId: number,
  name: string,
  description: string | null,
  layoutData: LayoutData,
  isPublic: boolean = false
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    // Проверяем права доступа
    const existing = await prisma.networkLayout.findUnique({
      where: { id: layoutId },
    })

    if (!existing || existing.userId !== Number(session.user.id)) {
      throw new Error('Нет доступа к этой схеме')
    }

    const layout = await prisma.networkLayout.update({
      where: { id: layoutId },
      data: {
        name,
        description,
        layoutData: JSON.stringify(layoutData),
        isPublic,
      },
    })

    console.log('Layout updated:', layout.id)
    return { success: true, layoutId: layout.id }
  } catch (error) {
    console.error('Error updating layout:', error)
    return { success: false, error: 'Не удалось обновить схему' }
  }
}

export async function getMyNetworkLayouts() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const layouts = await prisma.networkLayout.findMany({
      where: {
        userId: Number(session.user.id),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return layouts
  } catch (error) {
    console.error('Error fetching layouts:', error)
    return []
  }
}

export async function getPublicNetworkLayouts() {
  try {
    const layouts = await prisma.networkLayout.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            fio: true,
          },
        },
      },
    })

    return layouts
  } catch (error) {
    console.error('Error fetching public layouts:', error)
    return []
  }
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

export async function deleteNetworkLayout(layoutId: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    // Проверяем права доступа
    const existing = await prisma.networkLayout.findUnique({
      where: { id: layoutId },
    })

    if (!existing || existing.userId !== Number(session.user.id)) {
      throw new Error('Нет доступа к этой схеме')
    }

    await prisma.networkLayout.delete({
      where: { id: layoutId },
    })

    console.log('Layout deleted:', layoutId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting layout:', error)
    return { success: false, error: 'Не удалось удалить схему' }
  }
}
