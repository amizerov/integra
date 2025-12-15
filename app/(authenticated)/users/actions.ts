'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function getUsers() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Не авторизован' }
  }

  try {
    const users = await prisma.allowedUser.findMany({
      orderBy: { userId: 'asc' },
      select: {
        userId: true,
        userLogin: true,
        fio: true,
        eMail: true,
        userLevel: true,
        isActive: true,
      }
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { success: false, error: 'Ошибка загрузки пользователей' }
  }
}

export async function getUserById(userId: number) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Не авторизован' }
  }

  try {
    const user = await prisma.allowedUser.findUnique({
      where: { userId },
      select: {
        userId: true,
        userLogin: true,
        fio: true,
        eMail: true,
        userLevel: true,
        isActive: true,
      }
    })

    if (!user) {
      return { success: false, error: 'Пользователь не найден' }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error('Error fetching user:', error)
    return { success: false, error: 'Ошибка загрузки пользователя' }
  }
}

export async function updateUser(
  userId: number,
  data: {
    userLogin?: string
    fio?: string
    eMail?: string
    userLevel?: number
    isActive?: number
    password?: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Не авторизован' }
  }

  try {
    const updateData: any = {
      userLogin: data.userLogin,
      fio: data.fio,
      eMail: data.eMail,
      userLevel: data.userLevel,
      isActive: data.isActive,
    }

    // Если передан новый пароль, хешируем его
    if (data.password && data.password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.allowedUser.update({
      where: { userId },
      data: updateData,
    })

    revalidatePath('/users')
    revalidatePath(`/users/${userId}`)

    return { success: true, data: user }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: 'Ошибка обновления пользователя' }
  }
}

export async function deleteUser(userId: number) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Не авторизован' }
  }

  // Проверяем, что пользователь не удаляет сам себя
  if (Number(session.user.id) === userId) {
    return { success: false, error: 'Нельзя удалить свою учетную запись' }
  }

  try {
    await prisma.allowedUser.delete({
      where: { userId },
    })

    revalidatePath('/users')

    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Ошибка удаления пользователя' }
  }
}

export async function createUser(data: {
  userLogin: string
  password: string
  fio: string
  eMail: string
  userLevel?: number
  isActive?: number
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Не авторизован' }
  }

  try {
    // Получаем максимальный userId
    const maxUser = await prisma.allowedUser.findFirst({
      orderBy: { userId: 'desc' },
      select: { userId: true }
    })
    const nextUserId = (maxUser?.userId || 0) + 1

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.allowedUser.create({
      data: {
        userId: nextUserId,
        userLogin: data.userLogin,
        passwordHash: hashedPassword,
        fio: data.fio,
        eMail: data.eMail,
        userLevel: data.userLevel ?? 1,
        isActive: data.isActive ?? 1,
      },
    })

    revalidatePath('/users')

    return { success: true, data: user }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: 'Ошибка создания пользователя' }
  }
}
