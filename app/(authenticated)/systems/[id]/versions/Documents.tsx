'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiPlus, FiUpload, FiTrash2, FiDownload, FiEye } from 'react-icons/fi'
import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  uploadUserGuide, 
  deleteUserGuide, 
  downloadUserGuide, 
  saveUserGuideToPublic, 
  uploadSchema,
  deleteSchema,
  downloadSchema,
  saveSchemaToPublic
} from './actions'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useConfirm } from '@/components/ui/confirm-dialog'

interface DocumentsProps {
  version: any
  systemId: number
}

export default function Documents({ version, systemId }: DocumentsProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const schemaFileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    yearPublished: '',
    authorsList: '',
    publisher: '',
  })
  const [schemaFormData, setSchemaFormData] = useState({
    dataSchemaVersion: '',
    changesInTheCurrentVersion: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedSchemaFile, setSelectedSchemaFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Обновляем название и год при выборе файла
      // Убираем расширение из имени файла для названия
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setFormData(prev => ({ 
        ...prev, 
        title: nameWithoutExt,
        yearPublished: new Date().getFullYear().toString()
      }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Выберите файл')
      return
    }

    setIsUploading(true)
    try {
      const data = new FormData()
      data.append('file', selectedFile)
      data.append('title', formData.title)
      data.append('yearPublished', formData.yearPublished)
      data.append('authorsList', formData.authorsList)
      data.append('publisher', formData.publisher)
      data.append('systemId', systemId.toString())

      const result = await uploadUserGuide(version.versionId, data)

      if (result.success) {
        toast.success('Документ успешно загружен')
        setIsDialogOpen(false)
        setFormData({ title: '', yearPublished: '', authorsList: '', publisher: '' })
        setSelectedFile(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при загрузке')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Ошибка при загрузке документа')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Удаление руководства',
      message: 'Вы действительно хотите удалить руководство пользователя? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const result = await deleteUserGuide(version.versionId, systemId)
      
      if (result.success) {
        toast.success('Документ успешно удален')
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при удалении')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Ошибка при удалении документа')
    }
  }

  const handleDownload = async () => {
    try {
      const result = await downloadUserGuide(version.versionId)
      
      if (result.success && result.data && result.data.fileBody) {
        // Декодируем base64 в бинарные данные
        const binaryString = atob(result.data.fileBody)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        // Создаем Blob из данных
        const blob = new Blob([bytes])
        const url = window.URL.createObjectURL(blob)
        
        // Создаем ссылку для скачивания
        const a = document.createElement('a')
        a.href = url
        a.download = result.data.fileName || 'document'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success('Документ загружен')
      } else {
        toast.error(result.error || 'Ошибка при загрузке')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Ошибка при загрузке документа')
    }
  }

  const handleView = async () => {
    try {
      const result = await saveUserGuideToPublic(version.versionId, systemId)
      
      if (result.success && result.url) {
        // Открываем файл из public/docs в новом окне
        window.open(result.url, '_blank')
      } else {
        toast.error(result.error || 'Ошибка при открытии')
      }
    } catch (error) {
      console.error('View error:', error)
      toast.error('Ошибка при открытии документа')
    }
  }

  const handleSchemaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedSchemaFile(file)
    }
  }

  const handleSchemaUpload = async () => {
    if (!selectedSchemaFile) {
      toast.error('Выберите файл')
      return
    }

    if (!schemaFormData.dataSchemaVersion) {
      toast.error('Укажите версию схемы')
      return
    }

    setIsUploading(true)
    try {
      const data = new FormData()
      data.append('file', selectedSchemaFile)
      data.append('dataSchemaVersion', schemaFormData.dataSchemaVersion)
      data.append('changesInTheCurrentVersion', schemaFormData.changesInTheCurrentVersion)
      data.append('systemId', systemId.toString())

      const result = await uploadSchema(version.versionId, data)

      if (result.success) {
        toast.success('Схема успешно загружена')
        setIsSchemaDialogOpen(false)
        setSchemaFormData({ dataSchemaVersion: '', changesInTheCurrentVersion: '' })
        setSelectedSchemaFile(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при загрузке')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Ошибка при загрузке схемы')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSchemaDelete = async (dataSchemaVersion: number) => {
    const confirmed = await confirm({
      title: 'Удаление схемы данных',
      message: 'Вы действительно хотите удалить эту схему данных? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const result = await deleteSchema(version.versionId, dataSchemaVersion, systemId)
      
      if (result.success) {
        toast.success('Схема успешно удалена')
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при удалении')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Ошибка при удалении схемы')
    }
  }

  const handleSchemaDownload = async (dataSchemaVersion: number) => {
    try {
      const result = await downloadSchema(version.versionId, dataSchemaVersion)
      
      if (result.success && result.data && result.data.fileBody) {
        // Декодируем base64 в бинарные данные
        const binaryString = atob(result.data.fileBody)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        // Создаем Blob из данных
        const blob = new Blob([bytes])
        const url = window.URL.createObjectURL(blob)
        
        // Создаем ссылку для скачивания
        const a = document.createElement('a')
        a.href = url
        a.download = result.data.fileName || 'schema'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success('Документ загружен')
      } else {
        toast.error(result.error || 'Ошибка при загрузке')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Ошибка при загрузке документа')
    }
  }

  const handleSchemaView = async (dataSchemaVersion: number) => {
    try {
      const result = await saveSchemaToPublic(version.versionId, dataSchemaVersion, systemId)
      
      if (result.success && result.url) {
        // Открываем файл из public/docs в новом окне
        window.open(result.url, '_blank')
      } else {
        toast.error(result.error || 'Ошибка при открытии')
      }
    } catch (error) {
      console.error('View error:', error)
      toast.error('Ошибка при открытии документа')
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Руководства пользователя */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Руководства пользователя</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <FiPlus className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Добавить</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {version.userGuides ? (
              <div className="p-3 border rounded-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium wrap-break-word">{version.userGuides.title || 'Руководство'}</p>
                      {version.userGuides.intgr4_document_full_text?.fileExtension && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded shrink-0">
                          .{version.userGuides.intgr4_document_full_text.fileExtension}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {version.userGuides.yearPublished && `Год: ${version.userGuides.yearPublished}`}
                      {version.userGuides.publisher && ` • ${version.userGuides.publisher}`}
                    </p>
                    {version.userGuides.authorsList && (
                      <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                        Авторы: {version.userGuides.authorsList}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={handleView}
                      title="Открыть в новом окне"
                    >
                      <FiEye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={handleDownload}
                      title="Скачать"
                    >
                      <FiDownload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      title="Удалить"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* Схемы данных */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Схемы данных</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsSchemaDialogOpen(true)}
              >
                <FiPlus className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Добавить</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {version.schemas && version.schemas.length > 0 ? (
              <div className="space-y-2">
                {version.schemas.map((schema: any) => (
                  <div key={`${schema.versionId}-${schema.dataSchemaVersion}`} className="p-3 border rounded-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">Версия схемы: {schema.dataSchemaVersion}</p>
                          {schema.intgr4_document_full_text?.fileExtension && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded shrink-0">
                              .{schema.intgr4_document_full_text.fileExtension}
                            </span>
                          )}
                        </div>
                        {schema.changesInTheCurrentVersion && (
                          <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                            {schema.changesInTheCurrentVersion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          onClick={() => handleSchemaView(schema.dataSchemaVersion)}
                          title="Открыть в новом окне"
                        >
                          <FiEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          onClick={() => handleSchemaDownload(schema.dataSchemaVersion)}
                          title="Скачать"
                        >
                          <FiDownload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleSchemaDelete(schema.dataSchemaVersion)}
                          title="Удалить"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Диалог загрузки руководства */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          // Очищаем форму при закрытии диалога
          setFormData({ title: '', yearPublished: '', authorsList: '', publisher: '' })
          setSelectedFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить руководство пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Файл документа *</Label>
              <div className="relative">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="cursor-pointer"
                />
                <FiUpload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Выбран: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} КБ)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Название документа"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearPublished">Год публикации</Label>
              <Input
                id="yearPublished"
                type="number"
                value={formData.yearPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, yearPublished: e.target.value }))}
                placeholder="2024"
                min="1900"
                max="2100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorsList">Авторы</Label>
              <Input
                id="authorsList"
                value={formData.authorsList}
                onChange={(e) => setFormData(prev => ({ ...prev, authorsList: e.target.value }))}
                placeholder="Список авторов"
                maxLength={1000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Издатель</Label>
              <Input
                id="publisher"
                value={formData.publisher}
                onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                placeholder="Название издателя"
                maxLength={255}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUploading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Загрузка...' : 'Загрузить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог загрузки схемы */}
      <Dialog open={isSchemaDialogOpen} onOpenChange={(open) => {
        setIsSchemaDialogOpen(open)
        if (!open) {
          // Очищаем форму при закрытии диалога
          setSchemaFormData({ dataSchemaVersion: '', changesInTheCurrentVersion: '' })
          setSelectedSchemaFile(null)
          if (schemaFileInputRef.current) {
            schemaFileInputRef.current.value = ''
          }
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить схему данных</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schemaFile">Файл схемы *</Label>
              <div className="relative">
                <Input
                  id="schemaFile"
                  type="file"
                  ref={schemaFileInputRef}
                  onChange={handleSchemaFileSelect}
                  accept=".xsd,.xml,.json,.pdf,.doc,.docx"
                  className="cursor-pointer"
                />
                <FiUpload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {selectedSchemaFile && (
                <p className="text-sm text-muted-foreground">
                  Выбран: {selectedSchemaFile.name} ({Math.round(selectedSchemaFile.size / 1024)} КБ)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataSchemaVersion" className="text-sm font-medium">
                Версия схемы <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dataSchemaVersion"
                type="number"
                value={schemaFormData.dataSchemaVersion}
                onChange={(e) => setSchemaFormData(prev => ({ ...prev, dataSchemaVersion: e.target.value }))}
                placeholder="Введите номер версии"
                min="1"
                className={!schemaFormData.dataSchemaVersion && selectedSchemaFile ? 'border-destructive' : ''}
              />
              {!schemaFormData.dataSchemaVersion && selectedSchemaFile && (
                <p className="text-xs text-destructive">Обязательное поле</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="changesInTheCurrentVersion">Изменения в текущей версии</Label>
              <textarea
                id="changesInTheCurrentVersion"
                value={schemaFormData.changesInTheCurrentVersion}
                onChange={(e) => setSchemaFormData(prev => ({ ...prev, changesInTheCurrentVersion: e.target.value }))}
                placeholder="Описание изменений в схеме данных"
                maxLength={1000}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsSchemaDialogOpen(false)}
                disabled={isUploading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSchemaUpload}
                disabled={!selectedSchemaFile || !schemaFormData.dataSchemaVersion || isUploading}
              >
                {isUploading ? 'Загрузка...' : 'Загрузить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
