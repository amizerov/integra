'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logVersionChange } from '@/lib/changeLogHelpers'

export async function updateOrganization(
  versionId: number,
  data: {
    developingOrganization?: string
    developingUnit?: string
    versionAuthors?: string
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
      include: {
        system: {
          select: {
            systemShortName: true
          }
        }
      }
    })

    // Логируем обновление версии
    await logVersionChange(
      versionId,
      'updated',
      version.system.systemShortName || 'Система',
      version.versionCode || 'Версия',
      { updateType: 'organization', ...data }
    )

    return { success: true, data: version }
  } catch (error) {
    console.error('Error updating version organization info:', error)
    return { success: false, error: 'Ошибка при обновлении организационной информации' }
  }
}
