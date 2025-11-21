'use server'

import { prisma } from '@/lib/db'

interface Column {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  defaultValue: string | null
}

interface ForeignKey {
  columnName: string
  referencedTable: string
  referencedColumn: string
  constraintName: string
}

interface Table {
  name: string
  schema: string
  columns: Column[]
  foreignKeys: ForeignKey[]
  primaryKeys: string[]
}

export async function getDatabaseSchema() {
  try {
    // Получаем список всех таблиц из schema public
    const tablesResult = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    const tables: Table[] = []

    for (const { tablename } of tablesResult) {
      // Получаем информацию о колонках
      const columnsResult = await prisma.$queryRaw<Array<{
        column_name: string
        data_type: string
        is_nullable: string
        column_default: string | null
      }>>`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = ${tablename}
        ORDER BY ordinal_position
      `

      // Получаем первичные ключи
      const primaryKeysResult = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ${tablename}
      `

      const primaryKeys = primaryKeysResult.map(pk => pk.column_name)

      // Получаем внешние ключи
      const foreignKeysResult = await prisma.$queryRaw<Array<{
        column_name: string
        foreign_table_name: string
        foreign_column_name: string
        constraint_name: string
      }>>`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ${tablename}
      `

      const foreignKeys: ForeignKey[] = foreignKeysResult.map(fk => ({
        columnName: fk.column_name,
        referencedTable: fk.foreign_table_name,
        referencedColumn: fk.foreign_column_name,
        constraintName: fk.constraint_name,
      }))

      const columns: Column[] = columnsResult.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        isPrimaryKey: primaryKeys.includes(col.column_name),
        isForeignKey: foreignKeys.some(fk => fk.columnName === col.column_name),
        defaultValue: col.column_default,
      }))

      tables.push({
        name: tablename,
        schema: 'public',
        columns,
        foreignKeys,
        primaryKeys,
      })
    }

    return { success: true, tables }
  } catch (error) {
    console.error('Error fetching database schema:', error)
    return { success: false, error: 'Не удалось получить схему базы данных' }
  }
}
