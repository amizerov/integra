'use server'

import { prisma } from '@/lib/db'

/**
 * Получить распределение систем по платформам
 */
export async function getSystemsByPlatform() {
  // Здесь можно добавить логику группировки по платформам
  // Пока возвращаем пустой массив
  return []
}

/**
 * Получить распределение систем по базам данных
 */
export async function getSystemsByDatabase() {
  // Здесь можно добавить логику группировки по БД
  // Пока возвращаем пустой массив
  return []
}
