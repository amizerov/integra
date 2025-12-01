'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function saveUserGuideToPublic(versionId: number, systemId: number) {
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

    if (!document.fileBody || !document.fileName) {
      return { success: false, error: 'Файл не найден' }
    }

    // Путь к папке public/docs/system{systemId}/version{versionId}/manual/
    const docsDir = join(process.cwd(), 'public', 'docs', `system${systemId}`, `version${versionId}`, 'manual')
    
    // Создаем папки если не существуют
    if (!existsSync(docsDir)) {
      await mkdir(docsDir, { recursive: true })
    }
    
    const filePath = join(docsDir, document.fileName)

    // Сохраняем файл (перезаписываем если существует)
    await writeFile(filePath, document.fileBody)

    // Возвращаем URL для просмотра
    const fileUrl = `/docs/system${systemId}/version${versionId}/manual/${encodeURIComponent(document.fileName)}`

    return { 
      success: true, 
      url: fileUrl,
      fileName: document.fileName 
    }
  } catch (error) {
    console.error('Error saving user guide:', error)
    return { success: false, error: 'Ошибка при сохранении документа' }
  }
}
