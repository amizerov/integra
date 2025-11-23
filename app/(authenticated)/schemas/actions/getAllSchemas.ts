'use server'

import { prisma } from '@/lib/db'

export async function getAllSchemas() {
  try {
    const schemas = await prisma.schema.findMany({
      where: {
        versionId: 0, // Только схемы для АИС Интеграция
      },
      orderBy: {
        dataSchemaVersion: 'desc',
      },
      include: {
        allowed_users: {
          select: {
            fio: true,
          },
        },
        intgr4_document_full_text: {
          select: {
            fileName: true,
          },
        },
      },
    })

    const formattedSchemas = schemas.map((schema) => ({
      versionId: schema.versionId,
      dataSchemaVersion: schema.dataSchemaVersion,
      changesInTheCurrentVersion: schema.changesInTheCurrentVersion,
      creationDate: schema.creationDate,
      userId: schema.userId,
      userName: schema.allowed_users?.fio || null,
      fileName: schema.intgr4_document_full_text?.fileName || null,
    }))

    return { success: true, schemas: formattedSchemas }
  } catch (error) {
    console.error('Error fetching schemas:', error)
    return { success: false, error: 'Не удалось загрузить схемы' }
  }
}
