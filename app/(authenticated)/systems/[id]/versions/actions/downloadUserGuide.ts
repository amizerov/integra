'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function downloadUserGuide(versionId: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    // Получаем руководство с документом
    const userGuide = await prisma.userGuide.findUnique({
      where: { versionId },
      include: {
        intgr4_document_full_text: true
      }
    })

    if (!userGuide?.intgr4_document_full_text) {
      return { success: false, error: 'Документ не найден' }
    }

    const document = userGuide.intgr4_document_full_text

    // Конвертируем Buffer в base64 для передачи через JSON
    const base64Data = document.fileBody ? Buffer.from(document.fileBody).toString('base64') : null

    return {
      success: true,
      data: {
        fileName: document.fileName,
        fileExtension: document.fileExtension,
        fileBody: base64Data,
        fileSize: document.fileSize
      }
    }
  } catch (error) {
    console.error('Error downloading user guide:', error)
    return { success: false, error: 'Ошибка при загрузке документа' }
  }
}
