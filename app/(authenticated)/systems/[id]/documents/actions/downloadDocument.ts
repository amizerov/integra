'use server'

import { prisma } from '@/lib/db'

export async function downloadDocument(documentId: number) {
  try {
    const doc = await prisma.documentFullText.findUnique({
      where: { documentId },
      select: {
        fileName: true,
        fileExtension: true,
        fileBody: true,
        fileSize: true,
      }
    })

    if (!doc || !doc.fileBody) {
      return { success: false, error: 'Документ не найден' }
    }

    // Convert Buffer to base64 for transfer
    const base64Data = Buffer.from(doc.fileBody).toString('base64')

    return {
      success: true,
      fileName: doc.fileName || 'document',
      fileExtension: doc.fileExtension || '',
      data: base64Data,
      fileSize: doc.fileSize
    }
  } catch (error) {
    console.error('Error downloading document:', error)
    return { success: false, error: 'Ошибка при скачивании документа' }
  }
}
