'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logSystemChange } from '@/lib/changeLogHelpers'

export async function updateSystem(
  systemId: number,
  data: {
    systemName: string
    systemShortName: string
    systemPurpose: string
    hasPersonalData: number
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    const updatedSystem = await prisma.informationSystem.update({
      where: { systemId },
      data: {
        systemName: data.systemName,
        systemShortName: data.systemShortName,
        systemPurpose: data.systemPurpose,
        hasPersonalData: data.hasPersonalData,
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
    })

    // Логируем изменение системы
    await logSystemChange(
      systemId,
      'updated',
      updatedSystem.systemShortName || 'Система',
      { systemName: updatedSystem.systemName }
    )

    revalidatePath(`/systems/${systemId}`)
    revalidatePath('/systems')

    return { success: true, system: updatedSystem }
  } catch (error) {
    console.error('Error updating system:', error)
    return { success: false, error: 'Не удалось обновить систему' }
  }
}
