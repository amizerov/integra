'use server'

import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

export async function getMyNetworkLayouts() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const layouts = await prisma.networkLayout.findMany({
      where: {
        userId: Number(session.user.id),
      },
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
      },
    })

    return layouts
  } catch (error) {
    console.error('Error fetching layouts:', error)
    return []
  }
}
