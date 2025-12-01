'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getDataStreams(versionId: number) {
  try {
    const streams = await prisma.dataStream.findMany({
      where: { versionId },
      include: {
        recipientVersion: {
          include: {
            system: {
              select: {
                systemId: true,
                systemName: true,
                systemShortName: true,
              }
            }
          }
        },
        allowed_users: {
          select: { fio: true }
        }
      },
      orderBy: { streamId: 'asc' }
    })

    return {
      success: true,
      streams: streams.map(s => ({
        streamId: s.streamId,
        versionId: s.versionId,
        recipientVersionId: s.recipientVersionId,
        recipientSystemName: s.recipientVersion?.system?.systemName || null,
        recipientSystemShortName: s.recipientVersion?.system?.systemShortName || null,
        recipientVersionCode: s.recipientVersion?.versionCode || null,
        dataStreamDescription: s.dataStreamDescription,
        shareDatabase: s.shareDatabase,
        createdBy: s.allowed_users?.fio || null,
        creationDate: s.creationDate,
        lastChangeDate: s.lastChangeDate,
      }))
    }
  } catch (error) {
    console.error('Error fetching data streams:', error)
    return { success: false, error: 'Ошибка при загрузке потоков данных' }
  }
}

export async function getIncomingDataStreams(versionId: number) {
  try {
    const streams = await prisma.dataStream.findMany({
      where: { recipientVersionId: versionId },
      include: {
        sourceVersion: {
          include: {
            system: {
              select: {
                systemId: true,
                systemName: true,
                systemShortName: true,
              }
            }
          }
        },
        allowed_users: {
          select: { fio: true }
        }
      },
      orderBy: { streamId: 'asc' }
    })

    return {
      success: true,
      streams: streams.map(s => ({
        streamId: s.streamId,
        versionId: s.versionId,
        sourceSystemName: s.sourceVersion?.system?.systemName || null,
        sourceSystemShortName: s.sourceVersion?.system?.systemShortName || null,
        sourceVersionCode: s.sourceVersion?.versionCode || null,
        dataStreamDescription: s.dataStreamDescription,
        shareDatabase: s.shareDatabase,
        createdBy: s.allowed_users?.fio || null,
        creationDate: s.creationDate,
        lastChangeDate: s.lastChangeDate,
      }))
    }
  } catch (error) {
    console.error('Error fetching incoming data streams:', error)
    return { success: false, error: 'Ошибка при загрузке входящих потоков' }
  }
}

export async function getAllVersionsForSelect() {
  try {
    const versions = await prisma.systemVersion.findMany({
      include: {
        system: {
          select: {
            systemId: true,
            systemName: true,
            systemShortName: true,
          }
        }
      },
      orderBy: [
        { system: { systemName: 'asc' } },
        { versionId: 'asc' }
      ]
    })

    return {
      success: true,
      versions: versions.map(v => ({
        versionId: v.versionId,
        versionCode: v.versionCode,
        systemId: v.system.systemId,
        systemName: v.system.systemName,
        systemShortName: v.system.systemShortName,
        label: `${v.system.systemShortName || v.system.systemName} - ${v.versionCode || `v${v.versionId}`}`
      }))
    }
  } catch (error) {
    console.error('Error fetching versions:', error)
    return { success: false, error: 'Ошибка при загрузке версий' }
  }
}

export async function createDataStream(
  versionId: number,
  data: {
    recipientVersionId?: number | null
    dataStreamDescription?: string
    shareDatabase?: boolean
  }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Необходима авторизация' }
  }

  const userId = Number(session.user.id)

  try {
    // Get next streamId
    const maxStream = await prisma.dataStream.findFirst({
      orderBy: { streamId: 'desc' },
      select: { streamId: true }
    })
    const nextStreamId = (maxStream?.streamId || 0) + 1

    const stream = await prisma.dataStream.create({
      data: {
        streamId: nextStreamId,
        versionId,
        recipientVersionId: data.recipientVersionId || null,
        dataStreamDescription: data.dataStreamDescription?.trim() || null,
        shareDatabase: data.shareDatabase ? 1 : 0,
        userId,
        creationDate: new Date(),
        lastChangeUser: userId,
        lastChangeDate: new Date()
      }
    })

    revalidatePath(`/systems`)

    return { success: true, streamId: stream.streamId }
  } catch (error) {
    console.error('Error creating data stream:', error)
    return { success: false, error: 'Ошибка при создании потока данных' }
  }
}

export async function updateDataStream(
  streamId: number,
  versionId: number,
  data: {
    recipientVersionId?: number | null
    dataStreamDescription?: string
    shareDatabase?: boolean
  }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Необходима авторизация' }
  }

  const userId = Number(session.user.id)

  try {
    await prisma.dataStream.update({
      where: {
        streamId_versionId: { streamId, versionId }
      },
      data: {
        recipientVersionId: data.recipientVersionId || null,
        dataStreamDescription: data.dataStreamDescription?.trim() || null,
        shareDatabase: data.shareDatabase ? 1 : 0,
        lastChangeUser: userId,
        lastChangeDate: new Date()
      }
    })

    revalidatePath(`/systems`)

    return { success: true }
  } catch (error) {
    console.error('Error updating data stream:', error)
    return { success: false, error: 'Ошибка при обновлении потока данных' }
  }
}

export async function deleteDataStream(streamId: number, versionId: number) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Необходима авторизация' }
  }

  try {
    // Check if there are exchange formats linked to this stream
    const formatsCount = await prisma.exchangeFormat.count({
      where: { streamId, versionId }
    })

    if (formatsCount > 0) {
      return { success: false, error: 'Сначала удалите все форматы обмена для этого потока' }
    }

    await prisma.dataStream.delete({
      where: {
        streamId_versionId: { streamId, versionId }
      }
    })

    revalidatePath(`/systems`)

    return { success: true }
  } catch (error) {
    console.error('Error deleting data stream:', error)
    return { success: false, error: 'Ошибка при удалении потока данных' }
  }
}
