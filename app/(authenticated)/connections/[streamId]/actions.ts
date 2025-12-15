'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'
import { logStreamChange, logDocumentChange } from '@/lib/changeLogHelpers'

// Получить ID пользователя из сессии
async function getUserId(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  return typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id
}

// Получить детали потока данных
export async function getDataStream(streamId: number) {
  const stream = await prisma.dataStream.findFirst({
    where: { streamId },
    include: {
      sourceVersion: {
        include: {
          system: true
        }
      },
      recipientVersion: {
        include: {
          system: true
        }
      },
      intgr_2_2_1_exchange_formats: {
        include: {
          intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_description_document_idTointgr4_document_full_text: true,
          intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_sample_document_idTointgr4_document_full_text: true,
          allowed_users: true
        },
        orderBy: { exchangeFormatVersion: 'desc' }
      },
      allowed_users: true
    }
  })

  return stream
}

// Создать новую версию формата обмена
export async function createExchangeFormatVersion(data: {
  streamId: number
  versionId: number
}) {
  const userId = await getUserId()

  // Получить следующий номер версии формата
  const maxVersion = await prisma.exchangeFormat.aggregate({
    where: { streamId: data.streamId, versionId: data.versionId },
    _max: { exchangeFormatVersion: true }
  })

  const nextVersion = (maxVersion._max.exchangeFormatVersion || 0) + 1

  const format = await prisma.exchangeFormat.create({
    data: {
      streamId: data.streamId,
      versionId: data.versionId,
      exchangeFormatVersion: nextVersion,
      userId,
      creationDate: new Date()
    }
  })

  // Получаем информацию о потоке для логирования
  const stream = await prisma.dataStream.findUnique({
    where: { streamId_versionId: { streamId: data.streamId, versionId: data.versionId } },
    include: {
      sourceVersion: { include: { system: true } },
      recipientVersion: { include: { system: true } }
    }
  })

  // Логируем создание версии формата обмена
  if (stream) {
    const streamName = stream.recipientVersion
      ? `${stream.sourceVersion.system.systemShortName || 'Система'} → ${stream.recipientVersion.system.systemShortName || 'Система'}`
      : (stream.sourceVersion.system.systemShortName || 'Система')
    await logStreamChange(
      data.streamId,
      'created',
      streamName,
      { exchangeFormatVersion: nextVersion, versionId: data.versionId }
    )
  }

  revalidatePath(`/connections/${data.streamId}`)
  return format
}

// Удалить версию формата обмена
export async function deleteExchangeFormatVersion(data: {
  streamId: number
  exchangeFormatVersion: number
  versionId: number
}) {
  // Получаем формат для удаления связанных документов
  const format = await prisma.exchangeFormat.findUnique({
    where: {
      streamId_exchangeFormatVersion_versionId: {
        streamId: data.streamId,
        exchangeFormatVersion: data.exchangeFormatVersion,
        versionId: data.versionId
      }
    }
  })

  if (!format) throw new Error('Формат не найден')

  // Получаем информацию о потоке для логирования
  const stream = await prisma.dataStream.findUnique({
    where: { streamId_versionId: { streamId: data.streamId, versionId: data.versionId } },
    include: {
      sourceVersion: { include: { system: true } },
      recipientVersion: { include: { system: true } }
    }
  })

  const streamName = stream
    ? (stream.recipientVersion
      ? `${stream.sourceVersion.system.systemShortName || 'Система'} → ${stream.recipientVersion.system.systemShortName || 'Система'}`
      : (stream.sourceVersion.system.systemShortName || 'Система'))
    : 'Поток данных'

  // Удаляем связанные документы из БД
  if (format.formatDescriptionDocumentId) {
    await prisma.documentFullText.delete({
      where: { documentId: format.formatDescriptionDocumentId }
    }).catch(() => {})
  }
  if (format.formatSampleDocumentId) {
    await prisma.documentFullText.delete({
      where: { documentId: format.formatSampleDocumentId }
    }).catch(() => {})
  }

  // Удаляем папки с файлами
  const basePath = path.join(process.cwd(), 'public', 'docs', `stream${data.streamId}`, `version${data.exchangeFormatVersion}`)
  await fs.rm(basePath, { recursive: true, force: true }).catch(() => {})

  // Удаляем формат
  await prisma.exchangeFormat.delete({
    where: {
      streamId_exchangeFormatVersion_versionId: {
        streamId: data.streamId,
        exchangeFormatVersion: data.exchangeFormatVersion,
        versionId: data.versionId
      }
    }
  })

  // Логируем удаление версии формата обмена
  await logStreamChange(
    data.streamId,
    'deleted',
    streamName,
    { exchangeFormatVersion: data.exchangeFormatVersion, versionId: data.versionId }
  )

  revalidatePath(`/connections/${data.streamId}`)
  return { success: true }
}

// Загрузить документ (описание или пример)
export async function uploadFormatDocument(formData: FormData) {
  const userId = await getUserId()

  const file = formData.get('file') as File
  const streamId = parseInt(formData.get('streamId') as string)
  const exchangeFormatVersion = parseInt(formData.get('exchangeFormatVersion') as string)
  const versionId = parseInt(formData.get('versionId') as string)
  const documentType = formData.get('documentType') as 'description' | 'sample'

  if (!file || !streamId || !exchangeFormatVersion || !versionId || !documentType) {
    throw new Error('Не все параметры указаны')
  }

  // Читаем файл
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Получаем расширение файла
  const fileName = file.name
  const fileExtension = fileName.split('.').pop() || ''

  // Получаем следующий document_id
  const maxDocId = await prisma.documentFullText.aggregate({
    _max: { documentId: true }
  })
  const newDocumentId = (maxDocId._max.documentId || 0) + 1

  // Создаём запись в БД
  const document = await prisma.documentFullText.create({
    data: {
      documentId: newDocumentId,
      fileName,
      fileExtension,
      fileBody: buffer,
      fileSize: buffer.length,
      userId,
      creationDate: new Date()
    }
  })

  // Сохраняем копию файла на диск
  const subFolder = documentType === 'description' ? 'descr' : 'sample'
  const filePath = path.join(
    process.cwd(), 
    'public', 
    'docs', 
    `stream${streamId}`, 
    `version${exchangeFormatVersion}`,
    subFolder
  )
  
  await fs.mkdir(filePath, { recursive: true })
  await fs.writeFile(path.join(filePath, fileName), buffer)

  // Обновляем формат обмена
  const updateData = documentType === 'description'
    ? { formatDescriptionDocumentId: newDocumentId, lastChangeUser: userId, lastChangeDate: new Date() }
    : { formatSampleDocumentId: newDocumentId, lastChangeUser: userId, lastChangeDate: new Date() }

  await prisma.exchangeFormat.update({
    where: {
      streamId_exchangeFormatVersion_versionId: {
        streamId,
        exchangeFormatVersion,
        versionId
      }
    },
    data: updateData
  })

  // Логируем загрузку документа
  const docTypeRu = documentType === 'description' ? 'Описание формата' : 'Пример формата'
  await logDocumentChange(
    newDocumentId,
    'created',
    `${docTypeRu}: ${fileName}`,
    { streamId, exchangeFormatVersion, versionId, documentType }
  )

  revalidatePath(`/connections/${streamId}`)
  return document
}

// Удалить документ
export async function deleteFormatDocument(data: {
  streamId: number
  exchangeFormatVersion: number
  versionId: number
  documentType: 'description' | 'sample'
}) {
  const userId = await getUserId()

  // Получаем формат
  const format = await prisma.exchangeFormat.findUnique({
    where: {
      streamId_exchangeFormatVersion_versionId: {
        streamId: data.streamId,
        exchangeFormatVersion: data.exchangeFormatVersion,
        versionId: data.versionId
      }
    },
    include: {
      intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_description_document_idTointgr4_document_full_text: true,
      intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_sample_document_idTointgr4_document_full_text: true
    }
  })

  if (!format) throw new Error('Формат не найден')

  const documentId = data.documentType === 'description' 
    ? format.formatDescriptionDocumentId 
    : format.formatSampleDocumentId

  const document = data.documentType === 'description'
    ? format.intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_description_document_idTointgr4_document_full_text
    : format.intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_sample_document_idTointgr4_document_full_text

  const documentName = document?.fileName || 'Документ'

  if (documentId) {
    // Удаляем документ из БД
    await prisma.documentFullText.delete({
      where: { documentId }
    }).catch(() => {})

    // Удаляем файл с диска
    if (document?.fileName) {
      const subFolder = data.documentType === 'description' ? 'descr' : 'sample'
      const filePath = path.join(
        process.cwd(),
        'public',
        'docs',
        `stream${data.streamId}`,
        `version${data.exchangeFormatVersion}`,
        subFolder,
        document.fileName
      )
      await fs.unlink(filePath).catch(() => {})
    }

    // Обновляем формат
    const updateData = data.documentType === 'description'
      ? { formatDescriptionDocumentId: null, lastChangeUser: userId, lastChangeDate: new Date() }
      : { formatSampleDocumentId: null, lastChangeUser: userId, lastChangeDate: new Date() }

    await prisma.exchangeFormat.update({
      where: {
        streamId_exchangeFormatVersion_versionId: {
          streamId: data.streamId,
          exchangeFormatVersion: data.exchangeFormatVersion,
          versionId: data.versionId
        }
      },
      data: updateData
    })

    // Логируем удаление документа
    const docTypeRu = data.documentType === 'description' ? 'Описание формата' : 'Пример формата'
    await logDocumentChange(
      documentId,
      'deleted',
      `${docTypeRu}: ${documentName}`,
      { streamId: data.streamId, exchangeFormatVersion: data.exchangeFormatVersion, versionId: data.versionId, documentType: data.documentType }
    )
  }

  revalidatePath(`/connections/${data.streamId}`)
  return { success: true }
}

// Получить документ для скачивания
export async function getDocument(documentId: number) {
  const document = await prisma.documentFullText.findUnique({
    where: { documentId }
  })

  if (!document) throw new Error('Документ не найден')

  return {
    fileName: document.fileName,
    fileExtension: document.fileExtension,
    fileBody: document.fileBody ? Buffer.from(document.fileBody).toString('base64') : null,
    fileSize: document.fileSize
  }
}

// Обновить поток данных
export async function updateDataStream(data: {
  streamId: number
  versionId: number
  dataStreamDescription?: string | null
  recipientVersionId?: number | null
  shareDatabase?: number | null
}) {
  const userId = await getUserId()

  const stream = await prisma.dataStream.update({
    where: {
      streamId_versionId: {
        streamId: data.streamId,
        versionId: data.versionId
      }
    },
    data: {
      dataStreamDescription: data.dataStreamDescription,
      recipientVersionId: data.recipientVersionId,
      shareDatabase: data.shareDatabase,
      lastChangeUser: userId,
      lastChangeDate: new Date()
    },
    include: {
      sourceVersion: { include: { system: true } },
      recipientVersion: { include: { system: true } }
    }
  })

  // Логируем обновление потока данных
  const streamName = stream.recipientVersion
    ? `${stream.sourceVersion.system.systemShortName || 'Система'} → ${stream.recipientVersion.system.systemShortName || 'Система'}`
    : (stream.sourceVersion.system.systemShortName || 'Система')
  await logStreamChange(
    data.streamId,
    'updated',
    streamName,
    { versionId: data.versionId, dataStreamDescription: data.dataStreamDescription }
  )

  revalidatePath(`/connections/${data.streamId}`)
  return stream
}
