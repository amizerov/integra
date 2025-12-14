import DatabaseSchemaClient from './DatabaseSchemaClient'

// Схема - интерактивный клиентский компонент
export const dynamic = 'force-dynamic'

export default function SchemasPage() {
  return <DatabaseSchemaClient />
}
