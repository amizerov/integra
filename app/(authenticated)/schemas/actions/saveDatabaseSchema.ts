'use server'

import { prisma } from '@/lib/db'
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
}

/**
 * Генерация ERwin XML формата
 * Упрощенная версия для демонстрации
 */
function generateErwinXML(tables: Table[], schemaName: string): string {
  const timestamp = new Date().toISOString()
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ERwin_Model>
  <Model_Props>
    <Name>${schemaName}</Name>
    <Author>АИС Интеграция МГУ</Author>
    <Created>${timestamp}</Created>
    <Modified>${timestamp}</Modified>
    <Version>1.0</Version>
  </Model_Props>
  <Entities>\n`

  // Генерируем сущности (таблицы)
  tables.forEach((table, tableIndex) => {
    xml += `    <Entity id="entity_${tableIndex}" name="${table.name}">\n`
    xml += `      <Physical_Name>${table.name}</Physical_Name>\n`
    xml += `      <Attributes>\n`

    table.columns.forEach((column, columnIndex) => {
      xml += `        <Attribute id="attr_${tableIndex}_${columnIndex}">\n`
      xml += `          <Name>${column.name}</Name>\n`
      xml += `          <Data_Type>${column.type}</Data_Type>\n`
      xml += `          <Nullable>${column.nullable}</Nullable>\n`
      xml += `          <Primary_Key>${column.isPrimaryKey}</Primary_Key>\n`
      xml += `          <Foreign_Key>${column.isForeignKey}</Foreign_Key>\n`
      if (column.defaultValue) {
        xml += `          <Default_Value>${column.defaultValue}</Default_Value>\n`
      }
      xml += `        </Attribute>\n`
    })

    xml += `      </Attributes>\n`
    xml += `    </Entity>\n`
  })

  xml += `  </Entities>\n`
  xml += `  <Relationships>\n`

  // Генерируем связи (foreign keys)
  let relationshipId = 0
  tables.forEach((table) => {
    table.foreignKeys.forEach((fk) => {
      xml += `    <Relationship id="rel_${relationshipId++}">\n`
      xml += `      <Parent_Entity>${fk.referencedTable}</Parent_Entity>\n`
      xml += `      <Child_Entity>${table.name}</Child_Entity>\n`
      xml += `      <Parent_Attribute>${fk.referencedColumn}</Parent_Attribute>\n`
      xml += `      <Child_Attribute>${fk.columnName}</Child_Attribute>\n`
      xml += `      <Constraint_Name>${fk.constraintName}</Constraint_Name>\n`
      xml += `      <Cardinality>1:N</Cardinality>\n`
      xml += `    </Relationship>\n`
    })
  })

  xml += `  </Relationships>\n`
  xml += `</ERwin_Model>`

  return xml
}

export async function saveDatabaseSchema(
  schemaName: string,
  description: string | null,
  tables: Table[],
  nodePositions: Record<string, NodePosition>,
  existingSchemaVersion?: number
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    // Проверяем и создаём системную запись для АИС Интеграция (systemId = 0, versionId = 0)
    await ensureSystemVersionExists(Number(session.user.id))

    console.log('Saving schema with:', {
      tablesCount: tables.length,
      positionsCount: Object.keys(nodePositions).length,
      positions: nodePositions,
      existingSchemaVersion,
    })

    // Сохраняем схему как JSON с позициями узлов
    const schemaLayout: SchemaLayout = {
      tables,
      nodePositions,
    }
    const jsonData = JSON.stringify(schemaLayout, null, 2)
    console.log('JSON data length:', jsonData.length)
    console.log('JSON preview:', jsonData.substring(0, 500))
    
    const fileBuffer = Buffer.from(jsonData, 'utf-8')
    const fileName = `${schemaName.replace(/[^a-z0-9]/gi, '_')}.json`
    const fileSize = fileBuffer.length

    if (existingSchemaVersion) {
      // Режим перезаписи - обновляем существующую схему
      const existingSchema = await prisma.schema.findFirst({
        where: {
          versionId: 0,
          dataSchemaVersion: existingSchemaVersion,
        },
      })

      if (!existingSchema) {
        return { success: false, error: 'Схема не найдена' }
      }

      if (!existingSchema.dataSchemaDocumentId) {
        return { success: false, error: 'Документ схемы не найден' }
      }

      // Обновляем документ
      await prisma.documentFullText.update({
        where: { documentId: existingSchema.dataSchemaDocumentId },
        data: {
          fileName,
          fileBody: fileBuffer,
          fileSize,
          userId: Number(session.user.id),
        },
      })

      // Обновляем метаданные схемы
      await prisma.schema.update({
        where: {
          versionId_dataSchemaVersion: {
            versionId: 0,
            dataSchemaVersion: existingSchemaVersion,
          },
        },
        data: {
          changesInTheCurrentVersion: description || 'Схема базы данных АИС Интеграция',
          userId: Number(session.user.id),
        },
      })

      // Также обновляем файл в public/schemas
      const publicDir = path.join(process.cwd(), 'public', 'schemas')
      await fs.mkdir(publicDir, { recursive: true })
      await fs.writeFile(path.join(publicDir, fileName), jsonData, 'utf-8')

      console.log('Database schema updated:', existingSchemaVersion)
      return { success: true, schemaId: existingSchemaVersion }
    } else {
      // Режим создания новой версии
      // Получаем следующий documentId
      const lastDocument = await prisma.documentFullText.findFirst({
        orderBy: { documentId: 'desc' },
      })
      const nextDocumentId = (lastDocument?.documentId || 0) + 1

      // Сохраняем в intgr4_document_full_text
      const document = await prisma.documentFullText.create({
        data: {
          documentId: nextDocumentId,
          fileName,
          fileExtension: 'json',
          fileBody: fileBuffer,
          fileSize,
          userId: Number(session.user.id),
        },
      })

      // Сохраняем метаданные в intgr_2_3_schemas
      const schema = await prisma.schema.create({
        data: {
          versionId: 0,
          dataSchemaVersion: await getNextSchemaVersion(),
          changesInTheCurrentVersion: description || 'Схема базы данных АИС Интеграция',
          dataSchemaDocumentId: document.documentId,
          userId: Number(session.user.id),
        },
      })

      // Также сохраняем файл в public/schemas для просмотра
      const publicDir = path.join(process.cwd(), 'public', 'schemas')
      await fs.mkdir(publicDir, { recursive: true })
      await fs.writeFile(path.join(publicDir, fileName), jsonData, 'utf-8')

      console.log('Database schema saved:', schema)
      return { success: true, schemaId: schema.dataSchemaVersion }
    }
  } catch (error) {
    console.error('Error saving database schema:', error)
    return { success: false, error: 'Не удалось сохранить схему' }
  }
}

// Проверяет и создаёт системную запись для АИС Интеграция
async function ensureSystemVersionExists(userId: number): Promise<void> {
  // Проверяем существование версии
  const existingVersion = await prisma.systemVersion.findUnique({
    where: { versionId: 0 },
  })

  if (existingVersion) {
    return // Уже существует
  }

  // Проверяем существование системы
  const existingSystem = await prisma.informationSystem.findUnique({
    where: { systemId: 0 },
  })

  if (!existingSystem) {
    // Создаём запись для самой АИС Интеграция
    await prisma.informationSystem.create({
      data: {
        systemId: 0,
        systemShortName: 'АИС Интеграция',
        systemName: 'Автоматизированная информационная система "Интеграция" МГУ',
        systemPurpose: 'Система для управления информацией о информационных системах университета',
        hasPersonalData: 0,
        userId: userId,
      },
    })
  }

  // Создаём системную версию
  await prisma.systemVersion.create({
    data: {
      versionId: 0,
      systemId: 0,
      versionCode: '1.0',
      versionComment: 'Системная версия для хранения схемы базы данных АИС Интеграция',
      userId: userId,
    },
  })
}

// Получить следующий номер версии схемы
async function getNextSchemaVersion(): Promise<number> {
  const lastSchema = await prisma.schema.findFirst({
    where: { versionId: 0 },
    orderBy: { dataSchemaVersion: 'desc' },
  })
  return (lastSchema?.dataSchemaVersion || 0) + 1
}

// Экспорт схемы в формате ERwin XML (для скачивания)
export async function exportDatabaseSchemaToErwin(tables: Table[], schemaName: string) {
  try {
    const erwinXML = generateErwinXML(tables, schemaName)
    return { success: true, data: erwinXML }
  } catch (error) {
    console.error('Error exporting to ERwin:', error)
    return { success: false, error: 'Не удалось экспортировать схему' }
  }
}
