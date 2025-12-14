'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// Получить ID пользователя из сессии
async function getUserId(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  return typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id
}

// Получить аватар текущего пользователя
export async function getCurrentUserAvatar() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return null
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id

    const user = await prisma.allowedUser.findUnique({
      where: { userId },
      select: { avatarUrl: true }
    })

    return user?.avatarUrl || null
  } catch (error) {
    return null
  }
}

// Получить профиль пользователя
export async function getUserProfile() {
  const userId = await getUserId()
  
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
      comment: true,
      avatarUrl: true,
      emailVerified: true
    }
  })
}

// Обновить профиль пользователя
export async function updateUserProfile(data: {
  fio?: string
  eMail?: string
  phoneNumber?: string
}) {
  const userId = await getUserId()

  // Проверяем, изменился ли email
  const currentUser = await prisma.allowedUser.findUnique({
    where: { userId },
    select: { eMail: true, emailVerified: true }
  })

  const emailChanged = data.eMail && data.eMail !== currentUser?.eMail

  const result = await prisma.allowedUser.update({
    where: { userId },
    data: {
      fio: data.fio,
      eMail: data.eMail,
      phoneNumber: data.phoneNumber,
      // Если email изменился, сбрасываем подтверждение
      ...(emailChanged ? { emailVerified: false } : {})
    }
  })

  revalidatePath('/profile')
  return { ...result, emailChanged }
}

// Обновить только аватар
export async function updateAvatar(avatarUrl: string) {
  const userId = await getUserId()

  // Ограничиваем размер base64 (примерно 2MB)
  if (avatarUrl.length > 2 * 1024 * 1024 * 1.37) {
    throw new Error('Размер изображения слишком большой')
  }

  await prisma.allowedUser.update({
    where: { userId },
    data: { avatarUrl }
  })

  revalidatePath('/profile')
  return { success: true }
}

// Удалить аватар
export async function removeAvatar() {
  const userId = await getUserId()

  await prisma.allowedUser.update({
    where: { userId },
    data: { avatarUrl: null }
  })

  revalidatePath('/profile')
  return { success: true }
}

// Изменить пароль
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const userId = await getUserId()

  // Получаем текущего пользователя
  const user = await prisma.allowedUser.findUnique({
    where: { userId },
    select: { passwordHash: true, userPassword: true }
  })

  if (!user) throw new Error('Пользователь не найден')

  // Проверяем текущий пароль
  const passwordToCheck = user.passwordHash || user.userPassword
  
  if (passwordToCheck) {
    const isValid = await bcrypt.compare(data.currentPassword, passwordToCheck)
    if (!isValid) {
      // Также проверим незахешированный пароль для совместимости
      if (user.userPassword !== data.currentPassword) {
        throw new Error('Неверный текущий пароль')
      }
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

// Отправить письмо для подтверждения email
export async function sendVerificationEmail() {
  const userId = await getUserId()

  const user = await prisma.allowedUser.findUnique({
    where: { userId },
    select: { eMail: true, fio: true, emailVerified: true }
  })

  if (!user?.eMail) throw new Error('Email не указан')
  if (user.emailVerified) throw new Error('Email уже подтверждён')

  // Генерируем токен
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа

  // Сохраняем токен
  await prisma.allowedUser.update({
    where: { userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: expires
    }
  })

  // Формируем ссылку подтверждения
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify-email?token=${token}&userId=${userId}`

  // Создаём транспортер для отправки почты
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })

  // Отправляем письмо
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@integra.local',
      to: user.eMail,
      subject: 'Подтверждение email - Integra',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Подтверждение email</h2>
          <p>Здравствуйте${user.fio ? `, ${user.fio}` : ''}!</p>
          <p>Для подтверждения вашего email адреса нажмите на кнопку ниже:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Подтвердить email
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Или скопируйте эту ссылку в браузер:<br>
            <a href="${verificationUrl}" style="color: #0070f3;">${verificationUrl}</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Ссылка действительна 24 часа. Если вы не запрашивали подтверждение, проигнорируйте это письмо.
          </p>
        </div>
      `
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw new Error('Не удалось отправить письмо. Попробуйте позже.')
  }
}

// Подтвердить email по токену
export async function verifyEmail(token: string, userIdParam: number) {
  const user = await prisma.allowedUser.findUnique({
    where: { userId: userIdParam },
    select: { 
      emailVerificationToken: true, 
      emailVerificationExpires: true,
      emailVerified: true 
    }
  })

  if (!user) throw new Error('Пользователь не найден')
  if (user.emailVerified) return { success: true, message: 'Email уже подтверждён' }
  if (user.emailVerificationToken !== token) throw new Error('Неверный токен')
  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    throw new Error('Срок действия токена истёк')
  }

  await prisma.allowedUser.update({
    where: { userId: userIdParam },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    }
  })

  return { success: true, message: 'Email успешно подтверждён' }
}
