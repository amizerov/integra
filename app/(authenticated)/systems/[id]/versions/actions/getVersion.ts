'use server'

import { prisma } from '@/lib/db'

export async function getVersion(versionId: number) {
  try {
    const version = await prisma.systemVersion.findUnique({
      where: { versionId },
      include: {
        creator: {
          select: {
            userId: true,
            fio: true,
          },
        },
        modifier: {
          select: {
            userId: true,
            fio: true,
          },
        },
        userGuides: true,
        schemas: true,
        dataStreamsSource: true,
        dataStreamsRecipient: true,
      },
    })

    return { success: true, data: version }
  } catch (error) {
    console.error('Error fetching version:', error)
    return { success: false, error: 'Ошибка при загрузке версии' }
  }
}
