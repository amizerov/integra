'use server'

import { prisma } from '@/lib/db'

interface NodePosition {
  x: number
  y: number
}

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

interface SchemaLayout {
  tables: Table[]
  nodePositions: Record<string, NodePosition>
}

export async function getDatabaseSchemaLayout(versionId: number, dataSchemaVersion: number) {
  try {
    console.log('getDatabaseSchemaLayout called with:', versionId, dataSchemaVersion)
    
    const schema = await prisma.schema.findUnique({
      where: {
        versionId_dataSchemaVersion: {
          versionId,
          dataSchemaVersion,
        },
      },
      include: {
        intgr4_document_full_text: true,
      },
    })

    console.log('Schema found:', schema ? 'yes' : 'no')

    if (!schema || !schema.intgr4_document_full_text) {
      return { success: false, error: 'Схема не найдена' }
    }

    const document = schema.intgr4_document_full_text
    const fileBody = document.fileBody

    console.log('File body exists:', fileBody ? 'yes' : 'no')
    console.log('File body type:', typeof fileBody)
    console.log('Is Buffer:', Buffer.isBuffer(fileBody))

    if (!fileBody) {
      return { success: false, error: 'Файл схемы не найден' }
    }

    // Декодируем Buffer в строку UTF-8
    let jsonContent: string
    if (Buffer.isBuffer(fileBody)) {
      jsonContent = fileBody.toString('utf-8')
    } else if (typeof fileBody === 'string') {
      jsonContent = fileBody
    } else {
      // Если это Uint8Array или другой тип
      jsonContent = Buffer.from(fileBody as any).toString('utf-8')
    }
    
    console.log('JSON content length:', jsonContent.length)
    console.log('JSON preview (first 100 chars):', jsonContent.substring(0, 100))
    
    const schemaLayout: SchemaLayout = JSON.parse(jsonContent)

    console.log('Parsed schema layout:', {
      tablesCount: schemaLayout.tables?.length,
      positionsCount: Object.keys(schemaLayout.nodePositions || {}).length,
    })

    return {
      success: true,
      tables: schemaLayout.tables,
      nodePositions: schemaLayout.nodePositions,
    }
  } catch (error) {
    console.error('Error loading schema layout:', error)
    return { success: false, error: 'Не удалось загрузить схему' }
  }
}
