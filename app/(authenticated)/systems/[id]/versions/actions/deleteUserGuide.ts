'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { unlink, rmdir } from 'fs/promises'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'

export async function deleteUserGuide(versionId: number, systemId: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    // Получаем информацию о руководстве для получения fulltextDocumentId и fileName
    const userGuide = await prisma.userGuide.findUnique({
      where: { versionId },
      include: {
        intgr4_document_full_text: {
          select: { documentId: true, fileName: true }
        }
      }
    })

    if (!userGuide) {
      return { success: false, error: 'Руководство не найдено' }
    }

    const fileName = userGuide.intgr4_document_full_text?.fileName
    const documentId = userGuide.fulltextDocumentId

    // Удаляем запись из intgr_2_1_user_guides
    await prisma.userGuide.delete({
      where: { versionId }
    })

    // Если есть связанный документ, удаляем его из intgr4_document_full_text
    if (documentId) {
      await prisma.documentFullText.delete({
        where: { documentId }
      })
    }

    // Удаляем файл из папки public/docs/system{systemId}/version{versionId}/manual/
    if (fileName) {
      const filePath = join(process.cwd(), 'public', 'docs', `system${systemId}`, `version${versionId}`, 'manual', fileName)
      
      if (existsSync(filePath)) {
        await unlink(filePath)
      }

      // Проверяем, пуста ли папка manual и удаляем её если пуста
      const versionDir = join(process.cwd(), 'public', 'docs', `system${systemId}`, `version${versionId}`, 'manual')
      if (existsSync(versionDir)) {
        const files = readdirSync(versionDir)
        if (files.length === 0) {
          await rmdir(versionDir)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting user guide:', error)
    return { success: false, error: 'Ошибка при удалении документа' }
  }
}
