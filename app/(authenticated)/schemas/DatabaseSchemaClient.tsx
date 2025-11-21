'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import ERDiagram from './ERDiagram'
import { getDatabaseSchema, saveDatabaseSchema, exportDatabaseSchemaToErwin } from './actions'
import { FiDatabase, FiRefreshCw, FiSave, FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'

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

export default function DatabaseSchemaClient() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [schemaName, setSchemaName] = useState('')
  const [schemaDescription, setSchemaDescription] = useState('')

  useEffect(() => {
    loadSchema()
  }, [])

  const loadSchema = async () => {
    setLoading(true)
    try {
      const result = await getDatabaseSchema()
      if (result.success && result.tables) {
        setTables(result.tables)
        toast.success('Схема базы данных загружена')
      } else {
        toast.error(result.error || 'Не удалось загрузить схему')
      }
    } catch (error) {
      console.error('Error loading schema:', error)
      toast.error('Ошибка при загрузке схемы')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    setSchemaName(`DB_Schema_${new Date().toISOString().split('T')[0]}`)
    setSchemaDescription('')
    setShowSaveDialog(true)
  }

  const handleSaveConfirm = async () => {
    if (!schemaName.trim()) {
      toast.error('Введите название схемы')
      return
    }

    try {
      const result = await saveDatabaseSchema(schemaName, schemaDescription || null, tables)
      if (result.success) {
        toast.success('Схема сохранена в базу данных!')
        setShowSaveDialog(false)
        setSchemaName('')
        setSchemaDescription('')
      } else {
        toast.error(result.error || 'Не удалось сохранить схему')
      }
    } catch (error) {
      console.error('Error saving schema:', error)
      toast.error('Ошибка при сохранении схемы')
    }
  }

  const handleExport = async () => {
    try {
      const schemaName = `АИС_Интеграция_${new Date().toISOString().split('T')[0]}`
      const result = await exportDatabaseSchemaToErwin(tables, schemaName)
      
      if (result.success && result.data) {
        // Создаем blob и скачиваем файл
        const blob = new Blob([result.data], { type: 'application/xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${schemaName}.xml`
        a.click()
        URL.revokeObjectURL(url)
        
        toast.success('Схема экспортирована в формате ERwin XML')
      } else {
        toast.error(result.error || 'Не удалось экспортировать схему')
      }
    } catch (error) {
      console.error('Error exporting schema:', error)
      toast.error('Ошибка при экспорте схемы')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <FiDatabase className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Загрузка схемы базы данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки управления */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Схема данных АИС Интеграция</h1>
          <p className="text-muted-foreground">
            Физическая ER-диаграмма базы данных PostgreSQL
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSchema}>
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* ER-диаграмма */}
      <ERDiagram 
        tables={tables} 
        onSave={handleSave}
        onExport={handleExport}
      />

      {/* Диалог сохранения */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Сохранить схему базы данных</DialogTitle>
            <DialogDescription>
              Схема будет сохранена в формате ERwin XML
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schema-name">Название схемы *</Label>
              <Input
                id="schema-name"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="DB_Schema_2025-11-21"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schema-description">Описание изменений</Label>
              <Input
                id="schema-description"
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                placeholder="Краткое описание изменений в этой версии"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Схема будет сохранена в:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Таблица intgr_2_3_schemas (метаданные)</li>
                <li>Таблица intgr4_document_full_text (файл XML)</li>
                <li>Папка public/schemas (для просмотра)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveConfirm}>
              <FiSave className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
