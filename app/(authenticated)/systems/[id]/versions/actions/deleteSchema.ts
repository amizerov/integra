'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { unlink, rmdir } from 'fs/promises'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { logDocumentChange } from '@/lib/changeLogHelpers'

export async function deleteSchema(versionId: number, dataSchemaVersion: number, systemId: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    // Получаем информацию о схеме для получения dataSchemaDocumentId и fileName
    const schema = await prisma.schema.findUnique({
      where: { 
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion
        }
      },
      include: {
        intgr4_document_full_text: {
          select: { documentId: true, fileName: true }
        }
      }
    })

    if (!schema) {
      return { success: false, error: 'Схема не найдена' }
    }

    const fileName = schema.intgr4_document_full_text?.fileName
    const documentId = schema.dataSchemaDocumentId

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
    if (documentId) {
      await prisma.documentFullText.delete({
        where: { documentId }
      })
    }

    // Удаляем файл из папки public/docs/system{systemId}/version{versionId}/schema/
    if (fileName && systemId) {
      const filePath = join(process.cwd(), 'public', 'docs', `system${systemId}`, `version${versionId}`, 'schema', fileName)
      
      if (existsSync(filePath)) {
        await unlink(filePath)
      }

      // Проверяем, пуста ли папка schema и удаляем её если пуста
      const versionDir = join(process.cwd(), 'public', 'docs', `system${systemId}`, `version${versionId}`, 'schema')
      if (existsSync(versionDir)) {
        const files = readdirSync(versionDir)
        if (files.length === 0) {
          await rmdir(versionDir)
        }
      }
    }

    // Логируем удаление схемы
    await logDocumentChange(
      documentId || 0,
      'deleted',
      `Схема БД v${dataSchemaVersion}: ${fileName || 'schema'}`,
      { versionId, systemId, dataSchemaVersion }
    )

    return { success: true }
  } catch (error) {
    console.error('Error deleting schema:', error)
    return { success: false, error: 'Ошибка при удалении схемы' }
  }
}
