'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function deleteUserGuide(versionId: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    // Получаем информацию о руководстве для получения fulltextDocumentId
    const userGuide = await prisma.userGuide.findUnique({
      where: { versionId },
      select: { fulltextDocumentId: true }
    })

    if (!userGuide) {
      return { success: false, error: 'Руководство не найдено' }
    }

    // Удаляем запись из intgr_2_1_user_guides
    await prisma.userGuide.delete({
      where: { versionId }
    })

    // Если есть связанный документ, удаляем его из intgr4_document_full_text
    if (userGuide.fulltextDocumentId) {
      await prisma.documentFullText.delete({
        where: { documentId: userGuide.fulltextDocumentId }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting user guide:', error)
    return { success: false, error: 'Ошибка при удалении документа' }
  }
}
