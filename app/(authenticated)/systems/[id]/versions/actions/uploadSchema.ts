'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function uploadSchema(
  versionId: number,
  formData: FormData
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'Файл не выбран' }
    }

    const dataSchemaVersionStr = formData.get('dataSchemaVersion') as string
    if (!dataSchemaVersionStr) {
      return { success: false, error: 'Версия схемы не указана' }
    }

    const dataSchemaVersion = parseInt(dataSchemaVersionStr)
    if (isNaN(dataSchemaVersion) || dataSchemaVersion < 1) {
      return { success: false, error: 'Некорректная версия схемы' }
    }

    const changesInTheCurrentVersion = formData.get('changesInTheCurrentVersion') as string

    // Проверяем, не существует ли уже такая версия схемы
    const existingSchema = await prisma.schema.findUnique({
      where: {
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion
        }
      }
    })

    if (existingSchema) {
      return { success: false, error: `Версия схемы ${dataSchemaVersion} уже существует` }
    }

    // Читаем содержимое файла
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Получаем расширение файла
    const fileExtension = file.name.split('.').pop() || ''

    // Получаем максимальный documentId для создания нового
    const maxDoc = await prisma.documentFullText.findFirst({
      orderBy: { documentId: 'desc' },
      select: { documentId: true }
    })
    const newDocId = (maxDoc?.documentId || 0) + 1

    // Создаем запись в intgr4_document_full_text
    const document = await prisma.documentFullText.create({
      data: {
        documentId: newDocId,
        fileName: file.name,
        fileExtension: fileExtension,
        fileBody: buffer,
        fileSize: file.size,
        userId: Number(session.user.id),
        creationDate: new Date(),
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
    })

    // Создаем запись в intgr_2_3_schemas с указанной версией
    const schema = await prisma.schema.create({
      data: {
        versionId,
        dataSchemaVersion: dataSchemaVersion,
        changesInTheCurrentVersion: changesInTheCurrentVersion || null,
        dataSchemaDocumentId: document.documentId,
        userId: Number(session.user.id),
        creationDate: new Date(),
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
    })

    return { success: true, data: schema }
  } catch (error) {
    console.error('Error uploading schema:', error)
    return { success: false, error: 'Ошибка при загрузке схемы' }
  }
}
