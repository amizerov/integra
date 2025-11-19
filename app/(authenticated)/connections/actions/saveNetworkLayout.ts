'use server'

import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { saveDotFile } from './generateDotFile'

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
    
    // Сохраняем DOT файл в public/graphviz
    const dotResult = await saveDotFile(layout.id, name)
    if (!dotResult.success) {
      console.warn('Failed to save DOT file:', dotResult.error)
    }
    
    return { success: true, layoutId: layout.id }
  } catch (error) {
    console.error('Error saving layout:', error)
    return { success: false, error: 'Не удалось сохранить схему' }
  }
}
