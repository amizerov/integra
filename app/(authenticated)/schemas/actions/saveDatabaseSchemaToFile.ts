'use server'

import { auth } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

interface Table {
  name: string
  schema: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    isPrimaryKey: boolean
    isForeignKey: boolean
    defaultValue: string | null
  }>
  foreignKeys: Array<{
    columnName: string
    referencedTable: string
    referencedColumn: string
    constraintName: string
  }>
  primaryKeys: string[]
}

interface NodePosition {
  x: number
  y: number
}

interface SchemaLayout {
  tables: Table[]
  nodePositions: Record<string, NodePosition>
  edgeOffsets?: Record<string, number>
  edgeHandles?: Record<string, { sourceHandle: string; targetHandle: string }>
  metadata: {
    name: string
    description: string | null
    savedAt: string
    savedBy: string | null
  }
}

/**
 * Сохранение схемы БД в файл public/schemas/
 * НЕ сохраняет в базу данных - только файловая система
 */
export async function saveDatabaseSchemaToFile(
  schemaName: string,
  description: string | null,
  tables: Table[],
  nodePositions: Record<string, NodePosition>,
  edgeOffsets: Record<string, number>,
  edgeHandles: Record<string, { sourceHandle: string; targetHandle: string }>,
  existingFileName?: string
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    // Формируем данные схемы
    const schemaLayout: SchemaLayout = {
      tables,
      nodePositions,
      edgeOffsets,
      edgeHandles,
      metadata: {
        name: schemaName,
        description,
        savedAt: new Date().toISOString(),
        savedBy: session.user.name || session.user.email || null,
      }
    }
    
    const jsonData = JSON.stringify(schemaLayout, null, 2)
    
    // Определяем имя файла
    let fileName: string
    if (existingFileName) {
      // Перезаписываем существующий файл
      fileName = existingFileName
    } else {
      // Создаем новый файл с уникальным именем
      const safeName = schemaName.replace(/[^a-z0-9а-яё]/gi, '_')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      fileName = `${safeName}_${timestamp}.json`
    }

    // Сохраняем в public/schemas/
    const publicDir = path.join(process.cwd(), 'public', 'schemas')
    await fs.mkdir(publicDir, { recursive: true })
    await fs.writeFile(path.join(publicDir, fileName), jsonData, 'utf-8')

    console.log('Database schema saved to file:', fileName)
    return { success: true, fileName }
  } catch (error) {
    console.error('Error saving database schema to file:', error)
    return { success: false, error: 'Не удалось сохранить схему' }
  }
}

/**
 * Получить список всех сохранённых схем из public/schemas/
 */
export async function getSavedSchemaFiles() {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'schemas')
    
    // Проверяем существование папки
    try {
      await fs.access(publicDir)
    } catch {
      return { success: true, schemas: [] }
    }

    const files = await fs.readdir(publicDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))
    
    const schemas = await Promise.all(
      jsonFiles.map(async (fileName) => {
        try {
          const filePath = path.join(publicDir, fileName)
          const content = await fs.readFile(filePath, 'utf-8')
          const data: SchemaLayout = JSON.parse(content)
          const stats = await fs.stat(filePath)
          
          return {
            fileName,
            name: data.metadata?.name || fileName.replace('.json', ''),
            description: data.metadata?.description || null,
            savedAt: data.metadata?.savedAt || stats.mtime.toISOString(),
            savedBy: data.metadata?.savedBy || null,
            tablesCount: data.tables?.length || 0,
          }
        } catch (e) {
          console.error(`Error reading schema file ${fileName}:`, e)
          return null
        }
      })
    )

    // Фильтруем null и сортируем по дате
    const validSchemas = schemas
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())

    return { success: true, schemas: validSchemas }
  } catch (error) {
    console.error('Error getting saved schema files:', error)
    return { success: false, error: 'Не удалось загрузить список схем' }
  }
}

/**
 * Загрузить схему из файла public/schemas/
 */
export async function loadSchemaFromFile(fileName: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'schemas', fileName)
    const content = await fs.readFile(filePath, 'utf-8')
    const data: SchemaLayout = JSON.parse(content)
    
    return {
      success: true,
      tables: data.tables,
      nodePositions: data.nodePositions || {},
      edgeOffsets: data.edgeOffsets || {},
      edgeHandles: data.edgeHandles || {},
      metadata: data.metadata,
    }
  } catch (error) {
    console.error('Error loading schema from file:', error)
    return { success: false, error: 'Не удалось загрузить схему' }
  }
}

/**
 * Удалить схему из public/schemas/
 */
export async function deleteSchemaFile(fileName: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    const filePath = path.join(process.cwd(), 'public', 'schemas', fileName)
    await fs.unlink(filePath)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting schema file:', error)
    return { success: false, error: 'Не удалось удалить схему' }
  }
}

/**
 * Скачать схему (вернуть содержимое файла)
 */
export async function downloadSchemaFile(fileName: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'schemas', fileName)
    const content = await fs.readFile(filePath, 'utf-8')
    
    return { success: true, data: content, fileName }
  } catch (error) {
    console.error('Error downloading schema file:', error)
    return { success: false, error: 'Не удалось скачать схему' }
  }
}

/**
 * Получить последнюю сохранённую схему
 */
export async function getLatestSchemaFile() {
  try {
    const result = await getSavedSchemaFiles()
    if (!result.success || !result.schemas || result.schemas.length === 0) {
      return { success: false, error: 'Нет сохранённых схем' }
    }

    // Первая схема - самая новая (отсортировано по дате)
    const latestSchema = result.schemas[0]
    return await loadSchemaFromFile(latestSchema.fileName)
  } catch (error) {
    console.error('Error getting latest schema file:', error)
    return { success: false, error: 'Не удалось загрузить последнюю схему' }
  }
}
