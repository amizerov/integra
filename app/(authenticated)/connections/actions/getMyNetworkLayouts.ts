'use server'

import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

export async function getMyNetworkLayouts() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    // Показываем все карты связей всех пользователей
    const layouts = await prisma.networkLayout.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            fio: true,
          },
        },
      },
    })

    return layouts
  } catch (error) {
    console.error('Error fetching layouts:', error)
    return []
  }
}
