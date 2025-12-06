'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/components/ui/confirm-dialog'
import toast from 'react-hot-toast'
import { 
  FiArrowLeft, FiArrowRight, FiEdit2, FiPlus, FiTrash2, FiSave, FiX, 
  FiDatabase, FiFileText, FiCalendar, FiUser, FiUpload, FiDownload, FiFile
} from 'react-icons/fi'
import { formatDate } from '@/lib/utils'
import { 
  updateDataStream, 
  createExchangeFormatVersion, 
  deleteExchangeFormatVersion,
  uploadFormatDocument,
  deleteFormatDocument,
  getDocument
} from './actions'

interface ExchangeFormat {
  streamId: number
  exchangeFormatVersion: number
  versionId: number
  formatDescriptionDocumentId: number | null
  formatSampleDocumentId: number | null
  creationDate: Date | null
  lastChangeDate: Date | null
  allowed_users: { fio: string | null } | null
  intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_description_document_idTointgr4_document_full_text: {
    documentId: number
    fileName: string | null
    fileExtension: string | null
    fileSize: number | null
  } | null
  intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_sample_document_idTointgr4_document_full_text: {
    documentId: number
    fileName: string | null
    fileExtension: string | null
    fileSize: number | null
  } | null
}

interface StreamDetailsClientProps {
  stream: {
    streamId: number
    versionId: number
    dataStreamDescription: string | null
    shareDatabase: number | null
    creationDate: Date | null
    lastChangeDate: Date | null
    sourceVersion: {
      versionId: number
      versionCode: string | null
      system: {
        systemId: number
        systemName: string | null
        systemShortName: string | null
      }
    }
    recipientVersion: {
      versionId: number
      versionCode: string | null
      system: {
        systemId: number
        systemName: string | null
        systemShortName: string | null
      }
    } | null
    intgr_2_2_1_exchange_formats: ExchangeFormat[]
    allowed_users: { fio: string | null } | null
  }
}

export function StreamDetailsClient({ stream }: StreamDetailsClientProps) {
  const confirm = useConfirm()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addingVersion, setAddingVersion] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  
  // Состояние редактирования потока
  const [description, setDescription] = useState(stream.dataStreamDescription || '')
  const [shareDatabase, setShareDatabase] = useState(stream.shareDatabase === 1)

  // Refs для input файлов
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Сохранить изменения потока
  const handleSaveStream = async () => {
    setSaving(true)
    try {
      await updateDataStream({
        streamId: stream.streamId,
        versionId: stream.versionId,
        dataStreamDescription: description || null,
        shareDatabase: shareDatabase ? 1 : 0
      })
      toast.success('Поток обновлён')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  // Отмена редактирования потока
  const handleCancelEdit = () => {
    setDescription(stream.dataStreamDescription || '')
    setShareDatabase(stream.shareDatabase === 1)
    setIsEditing(false)
  }

  // Добавить версию формата
  const handleAddVersion = async () => {
    setAddingVersion(true)
    try {
      await createExchangeFormatVersion({
        streamId: stream.streamId,
        versionId: stream.versionId
      })
      toast.success('Версия формата создана')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания версии')
    } finally {
      setAddingVersion(false)
    }
  }

  // Удалить версию формата
  const handleDeleteVersion = async (format: ExchangeFormat) => {
    const confirmed = await confirm({
      title: 'Удалить версию формата?',
      message: `Вы уверены, что хотите удалить версию ${format.exchangeFormatVersion}? Все связанные документы будут удалены.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteExchangeFormatVersion({
        streamId: format.streamId,
        exchangeFormatVersion: format.exchangeFormatVersion,
        versionId: format.versionId
      })
      toast.success('Версия удалена')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления')
    }
  }

  // Загрузить документ
  const handleUploadDocument = async (
    format: ExchangeFormat, 
    documentType: 'description' | 'sample',
    file: File
  ) => {
    const key = `${format.exchangeFormatVersion}-${documentType}`
    setUploadingDoc(key)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('streamId', format.streamId.toString())
      formData.append('exchangeFormatVersion', format.exchangeFormatVersion.toString())
      formData.append('versionId', format.versionId.toString())
      formData.append('documentType', documentType)

      await uploadFormatDocument(formData)
      toast.success('Документ загружен')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки')
    } finally {
      setUploadingDoc(null)
    }
  }

  // Удалить документ
  const handleDeleteDocument = async (
    format: ExchangeFormat, 
    documentType: 'description' | 'sample'
  ) => {
    const docName = documentType === 'description' ? 'описание формата' : 'пример формата'
    const confirmed = await confirm({
      title: 'Удалить документ?',
      message: `Вы уверены, что хотите удалить ${docName}?`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteFormatDocument({
        streamId: format.streamId,
        exchangeFormatVersion: format.exchangeFormatVersion,
        versionId: format.versionId,
        documentType
      })
      toast.success('Документ удалён')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления')
    }
  }

  // Скачать документ
  const handleDownloadDocument = async (documentId: number, fileName: string | null) => {
    try {
      const doc = await getDocument(documentId)
      if (doc.fileBody) {
        const byteCharacters = atob(doc.fileBody)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray])
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName || doc.fileName || 'document'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки документа')
    }
  }

  // Компонент документа
  const DocumentBlock = ({ 
    format, 
    documentType, 
    document, 
    label 
  }: { 
    format: ExchangeFormat
    documentType: 'description' | 'sample'
    document: ExchangeFormat['intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_description_document_idTointgr4_document_full_text']
    label: string 
  }) => {
    const key = `${format.exchangeFormatVersion}-${documentType}`
    const isUploading = uploadingDoc === key
    const inputRef = (el: HTMLInputElement | null) => {
      fileInputRefs.current[key] = el
    }

    return (
      <div className="flex-1 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">{label}</span>
        </div>
        
        {document ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded bg-background border">
              <FiFile className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{document.fileName}</span>
              <span className="text-xs text-muted-foreground">
                {document.fileSize ? `${Math.round(document.fileSize / 1024)} KB` : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleDownloadDocument(document.documentId, document.fileName)}
              >
                <FiDownload className="h-3 w-3 mr-1" />
                Скачать
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeleteDocument(format, documentType)}
                className="text-destructive hover:text-destructive"
              >
                <FiTrash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleUploadDocument(format, documentType, file)
                }
                e.target.value = ''
              }}
            />
            <Button 
              variant="outline" 
              className="w-full"
              disabled={isUploading}
              onClick={() => fileInputRefs.current[key]?.click()}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Загрузка...
                </>
              ) : (
                <>
                  <FiUpload className="h-4 w-4 mr-2" />
                  Загрузить
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/connections">
            <Button variant="ghost" size="sm">
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Поток данных #{stream.streamId}</h1>
            <p className="text-muted-foreground">
              {stream.sourceVersion.system.systemShortName || stream.sourceVersion.system.systemName}
              {' → '}
              {stream.recipientVersion?.system.systemShortName || stream.recipientVersion?.system.systemName || 'Не указан'}
            </p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <FiEdit2 className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSaveStream} disabled={saving}>
              <FiSave className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
              <FiX className="h-4 w-4 mr-2" />
              Отмена
            </Button>
          </div>
        )}
      </div>

      {/* Основная информация */}
      <div className="flex items-center gap-2">
        <Link href={`/systems/${stream.sourceVersion.system.systemId}`} className="flex-1">
          <Card className="py-0 hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <FiDatabase className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">Источник</div>
                  <div className="font-medium truncate">
                    {stream.sourceVersion.system.systemName}
                    {stream.sourceVersion.system.systemShortName && (
                      <span className="text-muted-foreground ml-1">
                        ({stream.sourceVersion.system.systemShortName})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">Версия</div>
                  <div className="font-medium">{stream.sourceVersion.versionCode || stream.sourceVersion.versionId}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Стрелка */}
        <div className="flex items-center justify-center shrink-0 px-2">
          <div className="flex items-center text-primary">
            <div className="w-8 h-0.5 bg-primary rounded-l-full" />
            <FiArrowRight className="h-6 w-6 -ml-1" />
          </div>
        </div>

        {stream.recipientVersion ? (
          <Link href={`/systems/${stream.recipientVersion.system.systemId}`} className="flex-1">
            <Card className="py-0 hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <FiDatabase className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-0.5">Получатель</div>
                    <div className="font-medium truncate">
                      {stream.recipientVersion.system.systemName}
                      {stream.recipientVersion.system.systemShortName && (
                        <span className="text-muted-foreground ml-1">
                          ({stream.recipientVersion.system.systemShortName})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Версия</div>
                    <div className="font-medium">{stream.recipientVersion.versionCode || stream.recipientVersion.versionId}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="py-0 flex-1">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <FiDatabase className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">Получатель</div>
                  <div className="text-muted-foreground">Не указан</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Описание потока */}
      <Card>
        <CardHeader>
          <CardTitle>Описание потока</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background resize-y"
                  placeholder="Введите описание потока данных..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shareDatabase"
                  checked={shareDatabase}
                  onChange={(e) => setShareDatabase(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="shareDatabase">Общая база данных</Label>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">{stream.dataStreamDescription || 'Описание не указано'}</p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-2">
                  <FiDatabase className="h-4 w-4" />
                  <span>Общая база: {stream.shareDatabase === 1 ? 'Да' : 'Нет'}</span>
                </div>
                {stream.creationDate && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="h-4 w-4" />
                    <span>Создан: {formatDate(stream.creationDate)}</span>
                  </div>
                )}
                {stream.allowed_users?.fio && (
                  <div className="flex items-center gap-2">
                    <FiUser className="h-4 w-4" />
                    <span>Автор: {stream.allowed_users.fio}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Формат обмена */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FiFileText className="h-5 w-5" />
                Формат обмена
              </CardTitle>
              <CardDescription>
                Версии формата обмена данными для этого потока
              </CardDescription>
            </div>
            <Button onClick={handleAddVersion} disabled={addingVersion}>
              <FiPlus className="h-4 w-4 mr-2" />
              {addingVersion ? 'Создание...' : 'Добавить версию'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stream.intgr_2_2_1_exchange_formats.length > 0 ? (
            <div className="space-y-6">
              {stream.intgr_2_2_1_exchange_formats.map((format) => (
                <div 
                  key={`${format.streamId}-${format.exchangeFormatVersion}-${format.versionId}`} 
                  className="border rounded-lg p-4"
                >
                  {/* Заголовок версии */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">Версия {format.exchangeFormatVersion}</span>
                      {format.creationDate && (
                        <span className="text-sm text-muted-foreground">
                          от {formatDate(format.creationDate)}
                        </span>
                      )}
                      {format.allowed_users?.fio && (
                        <span className="text-sm text-muted-foreground">
                          • {format.allowed_users.fio}
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteVersion(format)}
                      className="text-destructive hover:text-destructive"
                    >
                      <FiTrash2 className="h-4 w-4 mr-1" />
                      Удалить версию
                    </Button>
                  </div>

                  {/* Документы */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentBlock 
                      format={format}
                      documentType="description"
                      document={format.intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_description_document_idTointgr4_document_full_text}
                      label="Описание формата"
                    />
                    <DocumentBlock 
                      format={format}
                      documentType="sample"
                      document={format.intgr4_document_full_text_intgr_2_2_1_exchange_formats_format_sample_document_idTointgr4_document_full_text}
                      label="Пример формата"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FiFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Версии формата обмена не добавлены</p>
              <p className="text-sm mt-1">Нажмите "Добавить версию" чтобы создать первую версию формата</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
