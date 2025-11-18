'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function updateCommon(
  versionId: number,
  data: {
    versionCode?: string
    operatingUnit?: string
    technicalSupportUnit?: string
    versionDevelopmentYear?: number
    productionStartYear?: number
    operatingPlace?: string
    endOfUsageYear?: number
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    const version = await prisma.systemVersion.update({
      where: { versionId },
      data: {
        ...data,
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
    })

    return { success: true, data: version }
  } catch (error) {
    console.error('Error updating version common info:', error)
    return { success: false, error: 'Ошибка при обновлении версии' }
  }
}
