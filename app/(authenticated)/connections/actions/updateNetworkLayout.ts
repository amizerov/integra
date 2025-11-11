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
