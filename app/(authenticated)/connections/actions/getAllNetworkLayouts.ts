'use server'

import prisma from '@/lib/db'

export async function getAllNetworkLayouts() {
  try {
    // Показываем все карты связей всех пользователей (без проверки авторизации)
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

