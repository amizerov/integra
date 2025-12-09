'use server'

import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function requestPasswordReset(email: string) {
  try {
    // Ищем пользователя по email
    const user = await prisma.allowedUser.findFirst({
      where: { eMail: email }
    })

    if (!user) {
      // Не сообщаем что пользователь не найден (защита от перебора)
      return { success: true }
    }

    // Генерируем токен сброса
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 час

    // Сохраняем токен в БД
    await prisma.allowedUser.update({
      where: { userId: user.userId },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires
      }
    })

    // Отправляем email
    await sendPasswordResetEmail(email, token)

    return { success: true }
  } catch (error: any) {
    console.error('Password reset request error:', error)
    return { success: false, error: 'Ошибка отправки письма' }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    // Ищем пользователя по токену
    const user = await prisma.allowedUser.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return { success: false, error: 'Ссылка недействительна или истекла' }
    }

    // Хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Обновляем пароль и очищаем токен
    await prisma.allowedUser.update({
      where: { userId: user.userId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Password reset error:', error)
    return { success: false, error: 'Ошибка сброса пароля' }
  }
}

export async function validateResetToken(token: string) {
  try {
    const user = await prisma.allowedUser.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      },
      select: {
        userId: true,
        eMail: true
      }
    })

    if (!user) {
      return { valid: false }
    }

    return { valid: true, email: user.eMail }
  } catch (error) {
    return { valid: false }
  }
}
