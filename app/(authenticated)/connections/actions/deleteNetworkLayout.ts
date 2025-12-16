'use server'

import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { deleteDotFile } from './generateDotFile'

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

    if (!existing) {
      throw new Error('Схема не найдена')
    }

    // Администратор может удалять любые схемы, обычный пользователь - только свои
    const isAdmin = (session.user as any)?.userLevel === 9
    if (!isAdmin && existing.userId !== Number(session.user.id)) {
      throw new Error('Нет доступа к этой схеме')
    }

    await prisma.networkLayout.delete({
      where: { id: layoutId },
    })

    console.log('Layout deleted:', layoutId)
    
    // Удаляем DOT файл
    const dotResult = await deleteDotFile(layoutId)
    if (!dotResult.success) {
      console.warn('Failed to delete DOT file:', dotResult.error)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting layout:', error)
    return { success: false, error: 'Не удалось удалить схему' }
  }
}
