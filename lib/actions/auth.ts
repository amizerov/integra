'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'ФИО обязательно'),
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
})

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validated = registerSchema.parse(rawData)

  // Проверка существующего пользователя
  const existingUser = await prisma.allowedUser.findFirst({
    where: { eMail: validated.email },
  })

  if (existingUser) {
    throw new Error('Пользователь с таким email уже существует')
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(validated.password, 10)

  // Получаем максимальный userId
  const maxUser = await prisma.allowedUser.findFirst({
    orderBy: { userId: 'desc' }
  })
  const nextId = (maxUser?.userId || 0) + 1

  // Создание пользователя
  const user = await prisma.allowedUser.create({
    data: {
      userId: nextId,
      fio: validated.name,
      eMail: validated.email,
      passwordHash: hashedPassword,
      userLevel: 1, // Обычный пользователь
      isActive: 1, // Активен
    },
  })

  return { 
    success: true, 
    message: 'Регистрация успешна! Теперь вы можете войти в систему.' 
  }
}

