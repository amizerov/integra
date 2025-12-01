'use server'

import { prisma } from '@/lib/db'

export async function getDocuments(systemId: number) {
  try {
    const documents = await prisma.managingDocument.findMany({
      where: { systemId },
      include: {
        documentKind: true,
        intgr4_document_full_text_intgr3_managing_documents_scan_document_idTointgr4_document_full_text: {
          select: {
            documentId: true,
            fileName: true,
            fileExtension: true,
            fileSize: true,
          }
        },
        intgr4_document_full_text_intgr3_managing_documents_text_document_idTointgr4_document_full_text: {
          select: {
            documentId: true,
            fileName: true,
            fileExtension: true,
            fileSize: true,
          }
        },
        allowed_users: {
          select: {
            fio: true,
          }
        }
      },
      orderBy: { normativeDocumentId: 'desc' }
    })

    return {
      success: true,
      documents: documents.map(doc => ({
        systemId: doc.systemId,
        normativeDocumentId: doc.normativeDocumentId,
        normativeDocumentDate: doc.normativeDocumentDate,
        normativeDocumentNumber: doc.normativeDocumentNumber?.trim() || null,
        approvedBy: doc.approvedBy,
        documentBasicPoints: doc.documentBasicPoints,
        onlyYearIsKnown: doc.onlyYearIsKnown,
        docKindId: doc.docKindId,
        docKindName: doc.documentKind?.documentTypeName || null,
        scanDocument: doc.intgr4_document_full_text_intgr3_managing_documents_scan_document_idTointgr4_document_full_text,
        textDocument: doc.intgr4_document_full_text_intgr3_managing_documents_text_document_idTointgr4_document_full_text,
        createdBy: doc.allowed_users?.fio || null,
        creationDate: doc.creationDate,
        lastChangeDate: doc.lastChangeDate,
      }))
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return { success: false, error: 'Ошибка при загрузке документов' }
  }
}
