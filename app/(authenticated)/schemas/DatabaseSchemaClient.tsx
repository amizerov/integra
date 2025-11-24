'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import ERDiagram from './ERDiagram'
import SchemaListDialog from './SchemaListDialog'
import { getDatabaseSchema, saveDatabaseSchema, exportDatabaseSchemaToErwin, getDatabaseSchemaLayout, getAllSchemas } from './actions'
import { FiDatabase, FiRefreshCw, FiSave, FiDownload, FiFolder, FiMaximize2 } from 'react-icons/fi'
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
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [edgeOffsets, setEdgeOffsets] = useState<Record<string, number>>({})
  const [edgeOffsetsSeed, setEdgeOffsetsSeed] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSchemaListDialog, setShowSchemaListDialog] = useState(false)
  const [schemaName, setSchemaName] = useState('')
  const [schemaDescription, setSchemaDescription] = useState('')
  const [schemaType, setSchemaType] = useState<'physical' | 'logical'>('physical')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [existingSchemas, setExistingSchemas] = useState<any[]>([])
  const [selectedSchemaVersion, setSelectedSchemaVersion] = useState<number | undefined>(undefined)
  const [isNewVersion, setIsNewVersion] = useState(true)

  useEffect(() => {
    loadLatestSavedSchema()
  }, [])

  // Обработка клавиши Escape для выхода из полноэкранного режима
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  const loadLatestSavedSchema = async () => {
    setLoading(true)
    try {
      // Пытаемся загрузить последнюю сохраненную схему
      const schemasResult = await fetch('/api/schemas/latest').then(r => r.json())
      
      if (schemasResult.success && schemasResult.schema) {
        const { versionId, dataSchemaVersion } = schemasResult.schema
        const result = await getDatabaseSchemaLayout(versionId, dataSchemaVersion)
        
        if (result.success && result.tables) {
          setTables(result.tables)
          setNodePositions(result.nodePositions || {})
          const offsets = result.edgeOffsets || {}
          setEdgeOffsets(offsets)
          setEdgeOffsetsSeed(offsets)
          toast.success('Загружена последняя сохраненная схема')
          return
        }
      }
      
      // Если не удалось загрузить сохраненную схему, загружаем из БД
      await loadSchema()
    } catch (error) {
      console.error('Error loading latest schema:', error)
      await loadSchema()
    } finally {
      setLoading(false)
    }
  }

  const loadSchema = async () => {
    setLoading(true)
    try {
      const result = await getDatabaseSchema()
      if (result.success && result.tables) {
        setTables(result.tables)
        setNodePositions({}) // Сбрасываем позиции - будет сетка по умолчанию
        setEdgeOffsets({})
        setEdgeOffsetsSeed({})
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

  const loadSavedSchema = async (versionId: number, dataSchemaVersion: number) => {
    console.log('Loading schema:', versionId, dataSchemaVersion)
    
    // Сначала закрываем диалог
    setShowSchemaListDialog(false)
    setLoading(true)
    
    try {
      const result = await getDatabaseSchemaLayout(versionId, dataSchemaVersion)
      console.log('Loaded schema result:', result)
      if (result.success && result.tables) {
        console.log('Setting tables:', result.tables.length)
        console.log('Setting positions:', result.nodePositions)
        setTables(result.tables)
        setNodePositions(result.nodePositions || {})
        const offsets = result.edgeOffsets || {}
        setEdgeOffsets(offsets)
        setEdgeOffsetsSeed(offsets)
        toast.success(`Схема версии ${dataSchemaVersion} загружена`)
      } else {
        toast.error(result.error || 'Не удалось загрузить схему')
      }
    } catch (error) {
      console.error('Error loading saved schema:', error)
      toast.error('Ошибка при загрузке схемы')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClick = async () => {
    // Загружаем список существующих схем
    const result = await getAllSchemas()
    if (result.success && result.schemas) {
      setExistingSchemas(result.schemas)
    }
    
    setSchemaName(`DB_Schema_${new Date().toISOString().split('T')[0]}`)
    setSchemaDescription('')
    setSelectedSchemaVersion(undefined)
    setIsNewVersion(true)
    setShowSaveDialog(true)
  }

  const handleSaveConfirm = async () => {
    if (isNewVersion && !schemaName.trim()) {
      toast.error('Введите название схемы')
      return
    }

    if (!isNewVersion && !selectedSchemaVersion) {
      toast.error('Выберите схему для перезаписи')
      return
    }

    console.log('Saving schema with positions:', nodePositions)
    console.log('Number of tables:', tables.length)
    console.log('Number of positions:', Object.keys(nodePositions).length)

    try {
      const result = await saveDatabaseSchema(
        schemaName, 
        schemaDescription || null, 
        tables, 
        nodePositions,
        edgeOffsets,
        isNewVersion ? undefined : selectedSchemaVersion
      )
      if (result.success) {
        toast.success(isNewVersion ? 'Схема сохранена в базу данных!' : 'Схема перезаписана!')
        setShowSaveDialog(false)
        setSchemaName('')
        setSchemaDescription('')
        setSelectedSchemaVersion(undefined)
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
      {/* Панель инструментов */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSchemaListDialog(true)} 
            title="Открыть список схем"
          >
            <FiFolder className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSaveClick} 
            title="Сохранить схему"
          >
            <FiSave className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport} 
            title="Экспорт в ERwin"
          >
            <FiDownload className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)} 
            title="Полноэкранный режим"
          >
            <FiMaximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Переключатель Физическая/Логическая */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSchemaType('physical')}
            title="Физическая схема"
            className={`rounded-none border-r border-border px-3 ${
              schemaType === 'physical' ? 'bg-secondary hover:bg-secondary' : ''
            }`}
          >
            Физическая
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSchemaType('logical')}
            title="Логическая схема"
            className={`rounded-none px-3 ${
              schemaType === 'logical' ? 'bg-secondary hover:bg-secondary' : ''
            }`}
          >
            Логическая
          </Button>
        </div>
      </div>

      {/* ER-диаграмма */}
      <ERDiagram 
        tables={tables}
        initialNodePositions={nodePositions}
        initialEdgeOffsets={edgeOffsetsSeed}
        onNodePositionsChange={setNodePositions}
        onEdgeOffsetsChange={setEdgeOffsets}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
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
            {/* Переключатель новая/перезаписать */}
            <div className="flex gap-2 border border-border rounded-md p-1">
              <Button
                type="button"
                variant={isNewVersion ? "secondary" : "ghost"}
                className="flex-1"
                onClick={() => {
                  setIsNewVersion(true)
                  setSelectedSchemaVersion(undefined)
                }}
              >
                Новая версия
              </Button>
              <Button
                type="button"
                variant={!isNewVersion ? "secondary" : "ghost"}
                className="flex-1"
                onClick={() => setIsNewVersion(false)}
              >
                Перезаписать
              </Button>
            </div>

            {isNewVersion ? (
              <>
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
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Выберите схему для перезаписи *</Label>
                  <div className="max-h-48 overflow-y-auto border border-border rounded-md">
                    {existingSchemas.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Нет сохраненных схем
                      </div>
                    ) : (
                      existingSchemas.map((schema) => (
                        <button
                          key={schema.dataSchemaVersion}
                          type="button"
                          onClick={() => {
                            setSelectedSchemaVersion(schema.dataSchemaVersion)
                            setSchemaName(schema.fileName || `DB_Schema_v${schema.dataSchemaVersion}`)
                            setSchemaDescription(schema.changesInTheCurrentVersion || '')
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0 ${
                            selectedSchemaVersion === schema.dataSchemaVersion ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="font-medium">Версия {schema.dataSchemaVersion}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {schema.changesInTheCurrentVersion || 'Без описания'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(schema.creationDate).toLocaleDateString('ru-RU')}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                {selectedSchemaVersion && (
                  <div className="space-y-2">
                    <Label htmlFor="schema-description-update">Обновить описание</Label>
                    <Input
                      id="schema-description-update"
                      value={schemaDescription}
                      onChange={(e) => setSchemaDescription(e.target.value)}
                      placeholder="Новое описание изменений"
                    />
                  </div>
                )}
              </>
            )}

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

      {/* Диалог списка схем */}
      <SchemaListDialog
        open={showSchemaListDialog}
        onOpenChange={setShowSchemaListDialog}
        onSchemaSelect={(schema) => loadSavedSchema(schema.versionId, schema.dataSchemaVersion)}
      />
    </div>
  )
}
