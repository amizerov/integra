'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function saveSchemaToPublic(versionId: number, dataSchemaVersion: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    // Получаем схему с документом
    const schema = await prisma.schema.findUnique({
      where: { 
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion
        }
      },
      include: {
        intgr4_document_full_text: true
      }
    })

    if (!schema?.intgr4_document_full_text) {
      return { success: false, error: 'Документ не найден' }
    }

    const document = schema.intgr4_document_full_text

    if (!document.fileBody || !document.fileName) {
      return { success: false, error: 'Файл не найден' }
    }

    // Путь к папке public/docs
    const docsDir = join(process.cwd(), 'public', 'docs')
    const filePath = join(docsDir, document.fileName)

    // Сохраняем файл (перезаписываем если существует)
    await writeFile(filePath, document.fileBody)

    // Возвращаем URL для просмотра
    const fileUrl = `/docs/${document.fileName}`

    return { 
      success: true, 
      url: fileUrl,
      fileName: document.fileName 
    }
  } catch (error) {
    console.error('Error saving schema:', error)
    return { success: false, error: 'Ошибка при сохранении документа' }
  }
}
