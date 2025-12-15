'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logVersionChange } from '@/lib/changeLogHelpers'

export async function createVersion(systemId: number) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Необходима авторизация' }
  }

  const userId = Number(session.user.id)

  if (Number.isNaN(userId)) {
    return { success: false, error: 'Некорректный идентификатор пользователя' }
  }

  try {
    // Get next versionId
    const maxVersion = await prisma.systemVersion.findFirst({
      orderBy: { versionId: 'desc' },
      select: { versionId: true }
    })
    const nextVersionId = (maxVersion?.versionId || 0) + 1

    // Count existing versions for this system to generate version code
    const existingVersionsCount = await prisma.systemVersion.count({
      where: { systemId }
    })
    const versionCode = `v${existingVersionsCount + 1}`

    const currentYear = new Date().getFullYear()

    const version = await prisma.systemVersion.create({
      data: {
        versionId: nextVersionId,
        systemId,
        versionCode,
        versionDevelopmentYear: currentYear,
        productionStartYear: currentYear,
        userId,
        creationDate: new Date(),
        lastChangeUser: userId,
        lastChangeDate: new Date()
      },
      include: {
        system: {
          select: {
            systemShortName: true,
            systemName: true
          }
        }
      }
    })

    // Логируем создание версии
    await logVersionChange(
      version.versionId,
      'created',
      version.system.systemShortName || 'Система',
      versionCode,
      { systemId, versionDevelopmentYear: currentYear }
    )

    revalidatePath(`/systems/${systemId}`)

    return { success: true, versionId: version.versionId }
  } catch (error) {
    console.error('Error creating version:', error)
    return { success: false, error: 'Не удалось создать версию' }
  }
}
