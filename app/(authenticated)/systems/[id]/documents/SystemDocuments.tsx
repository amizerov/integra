'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FiPlus, FiDownload, FiTrash2, FiFile, FiFileText, FiImage, FiCalendar, FiUser } from 'react-icons/fi'
import { getDocuments, uploadDocument, deleteDocument, downloadDocument, getDocumentKinds } from './actions'
import toast from 'react-hot-toast'

interface Document {
  systemId: number
  normativeDocumentId: number
  normativeDocumentDate: Date | null
  normativeDocumentNumber: string | null
  approvedBy: string | null
  documentBasicPoints: string | null
  onlyYearIsKnown: number | null
  docKindId: number | null
  docKindName: string | null
  scanDocument: { documentId: number; fileName: string | null; fileExtension: string | null; fileSize: number | null } | null
  textDocument: { documentId: number; fileName: string | null; fileExtension: string | null; fileSize: number | null } | null
  createdBy: string | null
  creationDate: Date | null
  lastChangeDate: Date | null
}

interface DocumentKind {
  id: number
  name: string
}

interface SystemDocumentsProps {
  systemId: number
}

export default function SystemDocuments({ systemId }: SystemDocumentsProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentKinds, setDocumentKinds] = useState<DocumentKind[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    docKindId: '',
    normativeDocumentNumber: '',
    normativeDocumentDate: '',
    approvedBy: '',
    documentBasicPoints: '',
    documentType: 'text' as 'scan' | 'text'
  })

  useEffect(() => {
    loadDocuments()
    loadDocumentKinds()
  }, [systemId])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getDocuments(systemId)
      if (result.success && result.documents) {
        setDocuments(result.documents)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Ошибка при загрузке документов')
    } finally {
      setLoading(false)
    }
  }

  const loadDocumentKinds = async () => {
    try {
      const result = await getDocumentKinds()
      if (result.success && result.kinds) {
        setDocumentKinds(result.kinds)
      }
    } catch (error) {
      console.error('Error loading document kinds:', error)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Выберите файл')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('docKindId', uploadForm.docKindId)
      formData.append('normativeDocumentNumber', uploadForm.normativeDocumentNumber)
      formData.append('normativeDocumentDate', uploadForm.normativeDocumentDate)
      formData.append('approvedBy', uploadForm.approvedBy)
      formData.append('documentBasicPoints', uploadForm.documentBasicPoints)
      formData.append('documentType', uploadForm.documentType)

      const result = await uploadDocument(systemId, formData)
      if (result.success) {
        toast.success('Документ загружен')
        setShowUploadDialog(false)
        resetUploadForm()
        loadDocuments()
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при загрузке')
      }
    } catch (error) {
      console.error('Error uploading:', error)
      toast.error('Ошибка при загрузке документа')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (doc: Document) => {
    const confirmed = window.confirm('Удалить документ? Это действие нельзя отменить.')
    if (!confirmed) return

    try {
      const result = await deleteDocument(systemId, doc.normativeDocumentId)
      if (result.success) {
        toast.success('Документ удалён')
        loadDocuments()
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Ошибка при удалении документа')
    }
  }

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const result = await downloadDocument(documentId)
      if (result.success && result.data) {
        // Convert base64 to blob
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray])
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
        
        toast.success('Документ скачан')
      } else {
        toast.error(result.error || 'Ошибка при скачивании')
      }
    } catch (error) {
      console.error('Error downloading:', error)
      toast.error('Ошибка при скачивании документа')
    }
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setUploadForm({
      docKindId: '',
      normativeDocumentNumber: '',
      normativeDocumentDate: '',
      approvedBy: '',
      documentBasicPoints: '',
      documentType: 'text'
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('ru-RU')
  }

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  }

  const getFileIcon = (extension: string | null | undefined) => {
    if (!extension) return <FiFile className="h-5 w-5" />
    const ext = extension.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'pdf'].includes(ext)) {
      return <FiImage className="h-5 w-5" />
    }
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
      return <FiFileText className="h-5 w-5" />
    }
    return <FiFile className="h-5 w-5" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Документы системы</CardTitle>
            <Button size="sm" onClick={() => setShowUploadDialog(true)}>
              <FiPlus className="h-4 w-4 mr-2" />
              Добавить документ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FiFile className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Документов пока нет</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowUploadDialog(true)}
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Добавить первый документ
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div 
                  key={`${doc.systemId}-${doc.normativeDocumentId}`}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getFileIcon(doc.scanDocument?.fileExtension || doc.textDocument?.fileExtension)}
                      <span className="font-medium">
                        {doc.scanDocument?.fileName || doc.textDocument?.fileName || 'Без названия'}
                      </span>
                      {doc.docKindName && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {doc.docKindName}
                        </span>
                      )}
                    </div>
                    
                    {doc.documentBasicPoints && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {doc.documentBasicPoints}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {doc.normativeDocumentNumber && (
                        <span>№ {doc.normativeDocumentNumber}</span>
                      )}
                      {doc.normativeDocumentDate && (
                        <span className="flex items-center gap-1">
                          <FiCalendar className="h-3 w-3" />
                          {formatDate(doc.normativeDocumentDate)}
                        </span>
                      )}
                      {doc.createdBy && (
                        <span className="flex items-center gap-1">
                          <FiUser className="h-3 w-3" />
                          {doc.createdBy}
                        </span>
                      )}
                      <span>
                        {formatFileSize(doc.scanDocument?.fileSize || doc.textDocument?.fileSize)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {(doc.scanDocument || doc.textDocument) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(
                          doc.scanDocument?.documentId || doc.textDocument?.documentId || 0,
                          doc.scanDocument?.fileName || doc.textDocument?.fileName || 'document'
                        )}
                        title="Скачать"
                      >
                        <FiDownload className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc)}
                      title="Удалить"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить документ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Файл *</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.jpg,.jpeg,.png,.gif"
              />
            </div>

            <div className="space-y-2">
              <Label>Тип документа</Label>
              <select
                value={uploadForm.docKindId}
                onChange={(e) => setUploadForm({ ...uploadForm, docKindId: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не указан</option>
                {documentKinds.map(kind => (
                  <option key={kind.id} value={kind.id}>{kind.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер документа</Label>
                <Input
                  value={uploadForm.normativeDocumentNumber}
                  onChange={(e) => setUploadForm({ ...uploadForm, normativeDocumentNumber: e.target.value })}
                  placeholder="№ документа"
                />
              </div>
              <div className="space-y-2">
                <Label>Дата документа</Label>
                <Input
                  type="date"
                  value={uploadForm.normativeDocumentDate}
                  onChange={(e) => setUploadForm({ ...uploadForm, normativeDocumentDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Утверждён</Label>
              <Input
                value={uploadForm.approvedBy}
                onChange={(e) => setUploadForm({ ...uploadForm, approvedBy: e.target.value })}
                placeholder="Кем утверждён документ"
              />
            </div>

            <div className="space-y-2">
              <Label>Основные положения</Label>
              <textarea
                value={uploadForm.documentBasicPoints}
                onChange={(e) => setUploadForm({ ...uploadForm, documentBasicPoints: e.target.value })}
                placeholder="Краткое описание содержания"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Тип файла</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="documentType"
                    value="text"
                    checked={uploadForm.documentType === 'text'}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value as 'text' })}
                  />
                  <span className="text-sm">Текстовый документ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="documentType"
                    value="scan"
                    checked={uploadForm.documentType === 'scan'}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value as 'scan' })}
                  />
                  <span className="text-sm">Скан-копия</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUploadDialog(false); resetUploadForm() }}>
              Отмена
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
              {isUploading ? 'Загрузка...' : 'Загрузить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
