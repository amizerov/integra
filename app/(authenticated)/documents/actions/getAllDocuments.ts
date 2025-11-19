'use server'

import { prisma } from '@/lib/db'

export async function getAllDocuments() {
  try {
    // Получаем руководства пользователя
    const userGuides = await prisma.userGuide.findMany({
      include: {
        intgr4_document_full_text: {
          select: {
            documentId: true,
            fileName: true,
            fileExtension: true,
            fileSize: true,
            creationDate: true,
          }
        },
        version: {
          include: {
            system: {
              select: {
                systemName: true,
                systemShortName: true,
              }
            }
          }
        }
      },
      orderBy: {
        creationDate: 'desc'
      }
    })

    // Получаем схемы данных
    const schemas = await prisma.schema.findMany({
      include: {
        intgr4_document_full_text: {
          select: {
            documentId: true,
            fileName: true,
            fileExtension: true,
            fileSize: true,
            creationDate: true,
          }
        },
        version: {
          include: {
            system: {
              select: {
                systemName: true,
                systemShortName: true,
              }
            }
          }
        }
      },
      orderBy: {
        creationDate: 'desc'
      }
    })

    // Получаем нормативные документы
    const managingDocuments = await prisma.managingDocument.findMany({
      include: {
        intgr4_document_full_text_intgr3_managing_documents_scan_document_idTointgr4_document_full_text: {
          select: {
            documentId: true,
            fileName: true,
            fileExtension: true,
            fileSize: true,
            creationDate: true,
          }
        },
        intgr4_document_full_text_intgr3_managing_documents_text_document_idTointgr4_document_full_text: {
          select: {
            documentId: true,
            fileName: true,
            fileExtension: true,
            fileSize: true,
            creationDate: true,
          }
        },
        system: {
          select: {
            systemName: true,
            systemShortName: true,
          }
        },
        documentKind: {
          select: {
            documentTypeName: true,
          }
        }
      },
      orderBy: {
        creationDate: 'desc'
      }
    })

    // Форматируем данные в единый формат
    const allDocuments = [
      ...userGuides.map(guide => ({
        id: guide.intgr4_document_full_text?.documentId || 0,
        type: 'Руководство пользователя',
        fileName: guide.intgr4_document_full_text?.fileName || guide.title || '-',
        fileExtension: guide.intgr4_document_full_text?.fileExtension || '',
        fileSize: guide.intgr4_document_full_text?.fileSize || 0,
        systemName: guide.version.system.systemName || '-',
        systemShortName: guide.version.system.systemShortName || '-',
        title: guide.title || '-',
        additionalInfo: `Год: ${guide.yearPublished || '-'}`,
        creationDate: guide.creationDate || guide.intgr4_document_full_text?.creationDate,
      })),
      ...schemas.map(schema => ({
        id: schema.intgr4_document_full_text?.documentId || 0,
        type: 'Схема данных',
        fileName: schema.intgr4_document_full_text?.fileName || '-',
        fileExtension: schema.intgr4_document_full_text?.fileExtension || '',
        fileSize: schema.intgr4_document_full_text?.fileSize || 0,
        systemName: schema.version.system.systemName || '-',
        systemShortName: schema.version.system.systemShortName || '-',
        title: `Версия схемы: ${schema.dataSchemaVersion}`,
        additionalInfo: schema.changesInTheCurrentVersion || '-',
        creationDate: schema.creationDate || schema.intgr4_document_full_text?.creationDate,
      })),
      ...managingDocuments.flatMap(doc => {
        const docs = []
        const scanDoc = doc.intgr4_document_full_text_intgr3_managing_documents_scan_document_idTointgr4_document_full_text
        const textDoc = doc.intgr4_document_full_text_intgr3_managing_documents_text_document_idTointgr4_document_full_text
        
        if (scanDoc) {
          docs.push({
            id: scanDoc.documentId,
            type: 'Нормативный документ (скан)',
            fileName: scanDoc.fileName || '-',
            fileExtension: scanDoc.fileExtension || '',
            fileSize: scanDoc.fileSize || 0,
            systemName: doc.system.systemName || '-',
            systemShortName: doc.system.systemShortName || '-',
            title: doc.normativeDocumentNumber?.trim() || '-',
            additionalInfo: `${doc.documentKind?.documentTypeName || ''} • ${doc.approvedBy || ''}`,
            creationDate: doc.creationDate || scanDoc.creationDate,
          })
        }
        
        if (textDoc) {
          docs.push({
            id: textDoc.documentId,
            type: 'Нормативный документ (текст)',
            fileName: textDoc.fileName || '-',
            fileExtension: textDoc.fileExtension || '',
            fileSize: textDoc.fileSize || 0,
            systemName: doc.system.systemName || '-',
            systemShortName: doc.system.systemShortName || '-',
            title: doc.normativeDocumentNumber?.trim() || '-',
            additionalInfo: `${doc.documentKind?.documentTypeName || ''} • ${doc.approvedBy || ''}`,
            creationDate: doc.creationDate || textDoc.creationDate,
          })
        }
        
        return docs
      })
    ]

    // Сортируем по дате создания (новые первыми)
    allDocuments.sort((a, b) => {
      const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0
      const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0
      return dateB - dateA
    })

    return { success: true, data: allDocuments }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return { success: false, error: 'Ошибка при загрузке документов' }
  }
}
