'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiPlus, FiUpload, FiTrash2, FiDownload, FiEye } from 'react-icons/fi'
import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadUserGuide, deleteUserGuide, downloadUserGuide, saveUserGuideToPublic } from './actions'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface DocumentsProps {
  version: any
  systemId: number
}

export default function Documents({ version, systemId }: DocumentsProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    yearPublished: '',
    authorsList: '',
    publisher: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
    if (!confirm('Удалить документ? Это действие нельзя отменить.')) {
      return
    }

    try {
      const result = await deleteUserGuide(version.versionId)
      
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
      const result = await saveUserGuideToPublic(version.versionId)
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Руководства пользователя */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Руководства пользователя</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {version.userGuides ? (
              <div className="p-3 border rounded-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{version.userGuides.title || 'Руководство'}</p>
                      {version.userGuides.intgr4_document_full_text?.fileExtension && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          .{version.userGuides.intgr4_document_full_text.fileExtension}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {version.userGuides.yearPublished && `Год: ${version.userGuides.yearPublished}`}
                      {version.userGuides.publisher && ` • ${version.userGuides.publisher}`}
                    </p>
                    {version.userGuides.authorsList && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Авторы: {version.userGuides.authorsList}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Схемы данных</CardTitle>
              <Button variant="outline" size="sm">
                <FiPlus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {version.schemas && version.schemas.length > 0 ? (
              <div className="space-y-2">
                {version.schemas.map((schema: any) => (
                  <div key={`${schema.versionId}-${schema.dataSchemaVersion}`} className="p-3 border rounded-md">
                    <p className="font-medium">Версия схемы: {schema.dataSchemaVersion}</p>
                    {schema.changesInTheCurrentVersion && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {schema.changesInTheCurrentVersion}
                      </p>
                    )}
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
    </>
  )
}
