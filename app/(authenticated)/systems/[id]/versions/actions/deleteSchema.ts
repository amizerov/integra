'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function deleteSchema(versionId: number, dataSchemaVersion: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    // Получаем информацию о схеме для получения dataSchemaDocumentId
    const schema = await prisma.schema.findUnique({
      where: { 
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion
        }
      },
      select: { dataSchemaDocumentId: true }
    })

    if (!schema) {
      return { success: false, error: 'Схема не найдена' }
    }

    // Удаляем запись из intgr_2_3_schemas
    await prisma.schema.delete({
      where: { 
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion
        }
      }
    })

    // Если есть связанный документ, удаляем его из intgr4_document_full_text
    if (schema.dataSchemaDocumentId) {
      await prisma.documentFullText.delete({
        where: { documentId: schema.dataSchemaDocumentId }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting schema:', error)
    return { success: false, error: 'Ошибка при удалении схемы' }
  }
}
