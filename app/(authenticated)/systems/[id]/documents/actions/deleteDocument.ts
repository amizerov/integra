'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { unlink } from 'fs/promises'
import path from 'path'

export async function deleteDocument(
  systemId: number,
  normativeDocumentId: number
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Необходима авторизация' }
  }

  try {
    // Get the document to find linked files
    const doc = await prisma.managingDocument.findUnique({
      where: {
        systemId_normativeDocumentId: {
          systemId,
          normativeDocumentId
        }
      },
      include: {
        intgr4_document_full_text_intgr3_managing_documents_scan_document_idTointgr4_document_full_text: true,
        intgr4_document_full_text_intgr3_managing_documents_text_document_idTointgr4_document_full_text: true,
      }
    })

    if (!doc) {
      return { success: false, error: 'Документ не найден' }
    }

    // Get file names for deletion from public folder
    const scanDoc = doc.intgr4_document_full_text_intgr3_managing_documents_scan_document_idTointgr4_document_full_text
    const textDoc = doc.intgr4_document_full_text_intgr3_managing_documents_text_document_idTointgr4_document_full_text

    // Delete managing document record
    await prisma.managingDocument.delete({
      where: {
        systemId_normativeDocumentId: {
          systemId,
          normativeDocumentId
        }
      }
    })

    // Delete document full text records
    if (doc.scanDocumentId) {
      await prisma.documentFullText.delete({
        where: { documentId: doc.scanDocumentId }
      }).catch(() => {})
    }

    if (doc.textDocumentId) {
      await prisma.documentFullText.delete({
        where: { documentId: doc.textDocumentId }
      }).catch(() => {})
    }

    // Try to delete files from public folder
    const publicDir = path.join(process.cwd(), 'public', 'docs', `system${systemId}`)
    
    if (scanDoc?.fileName) {
      try {
        await unlink(path.join(publicDir, scanDoc.fileName))
      } catch {
        // File might not exist, ignore
      }
    }

    if (textDoc?.fileName) {
      try {
        await unlink(path.join(publicDir, textDoc.fileName))
      } catch {
        // File might not exist, ignore
      }
    }

    revalidatePath(`/systems/${systemId}`)

    return { success: true }
  } catch (error) {
    console.error('Error deleting document:', error)
    return { success: false, error: 'Ошибка при удалении документа' }
  }
}
