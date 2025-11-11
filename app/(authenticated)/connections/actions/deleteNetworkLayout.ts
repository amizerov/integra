'use server'

import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

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
