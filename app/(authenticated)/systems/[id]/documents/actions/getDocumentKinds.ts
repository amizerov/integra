'use server'

import { prisma } from '@/lib/db'

export async function getDocumentKinds() {
  try {
    const kinds = await prisma.documentKind.findMany({
      orderBy: { docKindId: 'asc' }
    })

    return {
      success: true,
      kinds: kinds.map(k => ({
        id: k.docKindId,
        name: k.documentTypeName || `Тип ${k.docKindId}`
      }))
    }
  } catch (error) {
    console.error('Error fetching document kinds:', error)
    return { success: false, error: 'Ошибка при загрузке типов документов' }
  }
}
