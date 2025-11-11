'use server'

import { prisma } from '@/lib/db'

/**
 * Получить статистику по документации
 */
export async function getDocumentationStats() {
  const [
    totalManagingDocuments,
    totalFullTextDocuments,
    totalUserGuides,
  ] = await Promise.all([
    prisma.managingDocument.count(),
    prisma.documentFullText.count(),
    prisma.userGuide.count(),
  ])

  return {
    totalManagingDocuments,
    totalFullTextDocuments,
    totalUserGuides,
  }
}
