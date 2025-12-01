'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function uploadUserGuide(
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

    const title = formData.get('title') as string
    const yearPublished = formData.get('yearPublished') as string
    const authorsList = formData.get('authorsList') as string
    const publisher = formData.get('publisher') as string
    const systemId = formData.get('systemId') as string

    // Читаем содержимое файла
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Получаем расширение файла
    const fileExtension = file.name.split('.').pop() || ''

    // Проверяем, есть ли уже руководство с документом (для обновления)
    const existingGuide = await prisma.userGuide.findUnique({
      where: { versionId },
      select: { fulltextDocumentId: true }
    })

    let documentId: number

    if (existingGuide?.fulltextDocumentId) {
      // Обновляем существующий документ
      await prisma.documentFullText.update({
        where: { documentId: existingGuide.fulltextDocumentId },
        data: {
          fileName: file.name,
          fileExtension: fileExtension,
          fileBody: buffer,
          fileSize: file.size,
          lastChangeUser: Number(session.user.id),
          lastChangeDate: new Date(),
        },
      })
      documentId = existingGuide.fulltextDocumentId
    } else {
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
      documentId = document.documentId
    }

    // Сохраняем файл в папку public/docs/system{systemId}/version{versionId}/manual/
    if (systemId) {
      const docsDir = join(process.cwd(), 'public', 'docs', `system${systemId}`, `version${versionId}`, 'manual')
      
      // Создаем папки если не существуют
      if (!existsSync(docsDir)) {
        await mkdir(docsDir, { recursive: true })
      }
      
      // Сохраняем файл с оригинальным именем (перезаписываем если существует)
      const filePath = join(docsDir, file.name)
      await writeFile(filePath, buffer)
    }

    // Создаем или обновляем запись в intgr_2_1_user_guides
    const userGuide = await prisma.userGuide.upsert({
      where: { versionId },
      create: {
        versionId,
        title: title || file.name,
        yearPublished: yearPublished ? parseInt(yearPublished) : null,
        authorsList: authorsList || null,
        publisher: publisher || null,
        fulltextDocumentId: documentId,
        userId: Number(session.user.id),
        creationDate: new Date(),
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
      update: {
        title: title || file.name,
        yearPublished: yearPublished ? parseInt(yearPublished) : null,
        authorsList: authorsList || null,
        publisher: publisher || null,
        fulltextDocumentId: documentId,
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
    })

    return { success: true, data: userGuide }
  } catch (error) {
    console.error('Error uploading user guide:', error)
    return { success: false, error: 'Ошибка при загрузке документа' }
  }
}
