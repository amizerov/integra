'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function deleteVersion(versionId: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Не авторизован' }
    }

    // Используем транзакцию для удаления всех связанных записей
    await prisma.$transaction(async (tx) => {
      // 1. Получаем все потоки данных этой версии (исходящие)
      const dataStreams = await tx.dataStream.findMany({
        where: { versionId },
        select: { streamId: true, versionId: true }
      })

      // 2. Удаляем форматы обмена для всех потоков данных
      if (dataStreams.length > 0) {
        await tx.exchangeFormat.deleteMany({
          where: {
            OR: dataStreams.map(ds => ({
              streamId: ds.streamId,
              versionId: ds.versionId
            }))
          }
        })
      }

      // 3. Удаляем исходящие потоки данных (где эта версия - источник)
      await tx.dataStream.deleteMany({
        where: { versionId }
      })

      // 4. Обнуляем ссылки на эту версию как получателя в других потоках
      await tx.dataStream.updateMany({
        where: { recipientVersionId: versionId },
        data: { recipientVersionId: null }
      })

      // 5. Удаляем схемы данных
      await tx.schema.deleteMany({
        where: { versionId }
      })

      // 6. Удаляем руководство пользователя
      await tx.userGuide.deleteMany({
        where: { versionId }
      })

      // 7. Наконец удаляем саму версию
      await tx.systemVersion.delete({
        where: { versionId }
      })
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting version:', error)
    return { success: false, error: 'Ошибка при удалении версии' }
  }
}
