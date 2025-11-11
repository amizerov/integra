'use server'

import prisma from '@/lib/db'

export async function getPublicNetworkLayouts() {
  try {
    const layouts = await prisma.networkLayout.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            fio: true,
          },
        },
      },
    })

    return layouts
  } catch (error) {
    console.error('Error fetching public layouts:', error)
    return []
  }
}
