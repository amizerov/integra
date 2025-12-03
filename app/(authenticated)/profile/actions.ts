'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function getUserProfile(userId: number) {
  return prisma.allowedUser.findUnique({
    where: { userId },
    select: {
      userId: true,
      fio: true,
      eMail: true,
      phoneNumber: true,
      userLevel: true,
      userLogin: true,
      isActive: true,
      comment: true
    }
  })
}

export async function updateUserProfile(data: {
  fio?: string
  eMail?: string
  phoneNumber?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')

  const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id

  const result = await prisma.allowedUser.update({
    where: { userId },
    data: {
      fio: data.fio,
      eMail: data.eMail,
      phoneNumber: data.phoneNumber
    }
  })

  revalidatePath('/profile')
  return result
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')

  const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id

  // Получаем текущего пользователя
  const user = await prisma.allowedUser.findUnique({
    where: { userId },
    select: { passwordHash: true, userPassword: true }
  })

  if (!user) throw new Error('Пользователь не найден')

  // Проверяем текущий пароль
  const passwordToCheck = user.passwordHash || user.userPassword
  if (!passwordToCheck) throw new Error('Пароль не установлен')

  const isValid = await bcrypt.compare(data.currentPassword, passwordToCheck)
  if (!isValid) {
    // Также проверим незахешированный пароль для совместимости
    if (user.userPassword !== data.currentPassword) {
      throw new Error('Неверный текущий пароль')
    }
  }

  // Хешируем новый пароль
  const newPasswordHash = await bcrypt.hash(data.newPassword, 10)

  // Обновляем пароль
  await prisma.allowedUser.update({
    where: { userId },
    data: {
      passwordHash: newPasswordHash,
      userPassword: null // Удаляем незахешированный пароль
    }
  })

  revalidatePath('/profile')
  return { success: true }
}
