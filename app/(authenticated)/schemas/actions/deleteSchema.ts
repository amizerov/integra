'use server'

import { prisma } from '@/lib/db'
import { logDocumentChange } from '@/lib/changeLogHelpers'

export async function deleteSchema(versionId: number, dataSchemaVersion: number) {
  try {
    // Получаем информацию о схеме для удаления связанного документа
    const schema = await prisma.schema.findUnique({
      where: {
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion,
        },
      },
      include: {
        intgr4_document_full_text: true,
      },
    })

    if (!schema) {
      return { success: false, error: 'Схема не найдена' }
    }

    // Удаляем схему
    await prisma.schema.delete({
      where: {
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion,
        },
      },
    })

    // Удаляем связанный документ если он есть
    if (schema.dataSchemaDocumentId) {
      await prisma.documentFullText.delete({
        where: {
          documentId: schema.dataSchemaDocumentId,
        },
      }).catch(() => {
        // Игнорируем ошибку если документ уже удалён или используется в других местах
      })
    }

    // Логируем удаление схемы
    await logDocumentChange(
      schema.dataSchemaDocumentId || 0,
      'deleted',
      `Схема БД v${dataSchemaVersion}: ${schema.intgr4_document_full_text?.fileName || 'schema'}`,
      { versionId, dataSchemaVersion }
    )

    return { success: true }
  } catch (error) {
    console.error('Error deleting schema:', error)
    return { success: false, error: 'Не удалось удалить схему' }
  }
}
