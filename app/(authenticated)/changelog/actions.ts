'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Получить ID текущего пользователя
async function getUserId(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  return typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id
}

// Логировать изменение
export async function logChange(data: {
  entityType: string
  entityId: number
  action: 'created' | 'updated' | 'deleted'
  description: string
  metadata?: Record<string, any>
}) {
  try {
    const userId = await getUserId()
    
    await prisma.changeLog.create({
      data: {
        userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      }
    })
    
    revalidatePath('/changelog')
  } catch (error) {
    console.error('Failed to log change:', error)
  }
}

// Получить историю изменений
export async function getChangeLogs(limit: number = 50) {
  try {
    await getUserId() // Проверка авторизации
    
    const logs = await prisma.changeLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            fio: true,
            avatarUrl: true,
          }
        }
      }
    })
    
    return { success: true, data: logs }
  } catch (error) {
    return { success: false, error: 'Ошибка загрузки истории' }
  }
}

// Получить количество непросмотренных изменений
export async function getUnreadChangesCount() {
  try {
    const userId = await getUserId()
    
    // Получить время последнего просмотра
    const view = await prisma.changeLogView.findUnique({
      where: { userId }
    })
    
    if (!view) {
      // Если пользователь никогда не смотрел, посчитать все изменения
      const count = await prisma.changeLog.count()
      return { success: true, count }
    }
    
    // Посчитать изменения после последнего просмотра
    const count = await prisma.changeLog.count({
      where: {
        createdAt: {
          gt: view.lastViewedAt
        }
      }
    })
    
    return { success: true, count }
  } catch (error) {
    return { success: false, count: 0 }
  }
}

// Отметить историю как просмотренную
export async function markChangeLogsAsViewed() {
  try {
    const userId = await getUserId()
    
    await prisma.changeLogView.upsert({
      where: { userId },
      update: {
        lastViewedAt: new Date()
      },
      create: {
        userId,
        lastViewedAt: new Date()
      }
    })
    
    revalidatePath('/changelog')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Ошибка обновления' }
  }
}
