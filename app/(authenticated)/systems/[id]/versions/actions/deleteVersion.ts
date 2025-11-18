'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function deleteVersion(versionId: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    await prisma.systemVersion.delete({
      where: { versionId },
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting version:', error)
    return { success: false, error: 'Ошибка при удалении версии' }
  }
}
