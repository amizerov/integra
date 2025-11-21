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
  tables: Table[]
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Необходима авторизация')
    }

    // Генерируем ERwin XML
    const erwinXML = generateErwinXML(tables, schemaName)
    const fileBuffer = Buffer.from(erwinXML, 'utf-8')
    const fileName = `${schemaName.replace(/[^a-z0-9]/gi, '_')}.xml`
    const fileSize = fileBuffer.length

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
        fileExtension: 'xml',
        fileBody: fileBuffer,
        fileSize,
        userId: Number(session.user.id),
      },
    })

    // Сохраняем метаданные в intgr_2_3_schemas
    // Для схемы БД используем versionId = 0 (специальное значение для схемы самой АИС Интеграция)
    const schema = await prisma.schema.create({
      data: {
        versionId: 0, // Специальное значение
        dataSchemaVersion: await getNextSchemaVersion(),
        changesInTheCurrentVersion: description || 'Схема базы данных АИС Интеграция',
        dataSchemaDocumentId: document.documentId,
        userId: Number(session.user.id),
      },
    })

    // Также сохраняем файл в public/schemas для просмотра
    const publicDir = path.join(process.cwd(), 'public', 'schemas')
    await fs.mkdir(publicDir, { recursive: true })
    await fs.writeFile(path.join(publicDir, fileName), erwinXML, 'utf-8')

    console.log('Database schema saved:', schema)
    return { success: true, schemaId: schema.dataSchemaVersion }
  } catch (error) {
    console.error('Error saving database schema:', error)
    return { success: false, error: 'Не удалось сохранить схему' }
  }
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
