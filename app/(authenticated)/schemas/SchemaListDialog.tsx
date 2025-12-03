'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FiFile, FiDownload, FiTrash2, FiCalendar, FiUser, FiDatabase } from 'react-icons/fi'
import { getSavedSchemaFiles, deleteSchemaFile, downloadSchemaFile } from './actions'
import { useConfirm } from '@/components/ui/confirm-dialog'
import toast from 'react-hot-toast'

interface Schema {
  fileName: string
  name: string
  description: string | null
  savedAt: string
  savedBy: string | null
  tablesCount: number
}

interface SchemaListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchemaSelect?: (schema: Schema) => void
}

export default function SchemaListDialog({ open, onOpenChange, onSchemaSelect }: SchemaListDialogProps) {
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(false)
  const confirm = useConfirm()

  useEffect(() => {
    if (open) {
      loadSchemas()
    }
  }, [open])

  const loadSchemas = async () => {
    setLoading(true)
    try {
      const result = await getSavedSchemaFiles()
      if (result.success && result.schemas) {
        setSchemas(result.schemas)
      } else {
        toast.error('Не удалось загрузить список схем')
      }
    } catch (error) {
      console.error('Error loading schemas:', error)
      toast.error('Ошибка при загрузке схем')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (schema: Schema) => {
    try {
      const result = await downloadSchemaFile(schema.fileName)
      if (result.success && result.data && result.fileName) {
        const blob = new Blob([result.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.fileName
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Схема скачана')
      } else {
        toast.error('Не удалось скачать схему')
      }
    } catch (error) {
      console.error('Error downloading schema:', error)
      toast.error('Ошибка при скачивании')
    }
  }

  const handleDelete = async (schema: Schema) => {
    const confirmed = await confirm({
      title: 'Удаление схемы',
      message: `Вы уверены, что хотите удалить схему "${schema.name}"? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const result = await deleteSchemaFile(schema.fileName)
      if (result.success) {
        toast.success('Схема удалена')
        loadSchemas()
      } else {
        toast.error('Не удалось удалить схему')
      }
    } catch (error) {
      console.error('Error deleting schema:', error)
      toast.error('Ошибка при удалении')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Сохранённые схемы данных</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          ) : schemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FiFile className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Сохранённых схем пока нет</p>
              <p className="text-xs text-muted-foreground mt-2">Схемы сохраняются в папку public/schemas/</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schemas.map((schema) => (
                <Card key={schema.fileName} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiDatabase className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">
                          {schema.name}
                        </h3>
                      </div>
                      
                      {schema.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {schema.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {schema.savedAt && (
                          <div className="flex items-center gap-1">
                            <FiCalendar className="h-3 w-3" />
                            {new Date(schema.savedAt).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                        {schema.savedBy && (
                          <div className="flex items-center gap-1">
                            <FiUser className="h-3 w-3" />
                            {schema.savedBy}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FiFile className="h-3 w-3" />
                          {schema.tablesCount} таблиц
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onSchemaSelect?.(schema)}
                        title="Открыть"
                      >
                        <FiFile className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(schema)}
                        title="Скачать"
                      >
                        <FiDownload className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(schema)}
                        title="Удалить"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
