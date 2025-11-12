'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateVersion(
  versionId: number,
  systemId: number,
  data: {
    versionCode: string
    versionDevelopmentYear: number | null
    productionStartYear: number | null
    endOfUsageYear: number | null
    developingOrganization: string
    developingUnit: string
    versionAuthors: string
    operatingUnit: string
    technicalSupportUnit: string
    operatingPlace: string
    programmingTools: string
    operatingEnvironment: string
    versionComment: string
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    const updatedVersion = await prisma.systemVersion.update({
      where: { versionId },
      data: {
        versionCode: data.versionCode,
        versionDevelopmentYear: data.versionDevelopmentYear,
        productionStartYear: data.productionStartYear,
        endOfUsageYear: data.endOfUsageYear,
        developingOrganization: data.developingOrganization,
        developingUnit: data.developingUnit,
        versionAuthors: data.versionAuthors,
        operatingUnit: data.operatingUnit,
        technicalSupportUnit: data.technicalSupportUnit,
        operatingPlace: data.operatingPlace,
        programmingTools: data.programmingTools,
        operatingEnvironment: data.operatingEnvironment,
        versionComment: data.versionComment,
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
    })

    revalidatePath(`/systems/${systemId}/versions/${versionId}`)
    revalidatePath(`/systems/${systemId}`)
    revalidatePath('/systems')

    return { success: true, version: updatedVersion }
  } catch (error) {
    console.error('Error updating version:', error)
    return { success: false, error: 'Не удалось обновить версию' }
  }
}
