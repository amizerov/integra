'use server'

import { prisma } from '@/lib/db'

export async function downloadSchema(versionId: number, dataSchemaVersion: number) {
  try {
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

    if (!schema || !schema.intgr4_document_full_text) {
      return { success: false, error: 'Схема не найдена' }
    }

    const document = schema.intgr4_document_full_text
    const fileBody = document.fileBody

    if (!fileBody) {
      return { success: false, error: 'Файл схемы не найден' }
    }

    // Конвертируем Buffer в строку
    const xmlContent = fileBody.toString()

    return {
      success: true,
      data: xmlContent,
      fileName: document.fileName || `schema_v${dataSchemaVersion}.xml`,
    }
  } catch (error) {
    console.error('Error downloading schema:', error)
    return { success: false, error: 'Не удалось скачать схему' }
  }
}
