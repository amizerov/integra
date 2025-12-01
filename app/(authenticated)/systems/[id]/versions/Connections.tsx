'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiArrowLeft, FiDatabase } from 'react-icons/fi'
import { 
  getDataStreams, 
  getIncomingDataStreams, 
  getAllVersionsForSelect, 
  createDataStream, 
  updateDataStream, 
  deleteDataStream 
} from './actions'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ui/confirm-dialog'

interface DataStream {
  streamId: number
  versionId: number
  recipientVersionId: number | null
  recipientSystemName: string | null
  recipientSystemShortName: string | null
  recipientVersionCode: string | null
  dataStreamDescription: string | null
  shareDatabase: number | null
  createdBy: string | null
  creationDate: Date | null
  lastChangeDate: Date | null
}

interface IncomingStream {
  streamId: number
  versionId: number
  sourceSystemName: string | null
  sourceSystemShortName: string | null
  sourceVersionCode: string | null
  dataStreamDescription: string | null
  shareDatabase: number | null
  createdBy: string | null
  creationDate: Date | null
  lastChangeDate: Date | null
}

interface VersionOption {
  versionId: number
  versionCode: string | null
  systemId: number
  systemName: string | null
  systemShortName: string | null
  label: string
}

interface ConnectionsProps {
  version: any
  systemId: number
}

export default function Connections({ version, systemId }: ConnectionsProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [outgoingStreams, setOutgoingStreams] = useState<DataStream[]>([])
  const [incomingStreams, setIncomingStreams] = useState<IncomingStream[]>([])
  const [versionOptions, setVersionOptions] = useState<VersionOption[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [editingStream, setEditingStream] = useState<DataStream | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    recipientVersionId: '',
    dataStreamDescription: '',
    shareDatabase: false
  })

  useEffect(() => {
    loadData()
  }, [version.versionId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [outResult, inResult, versionsResult] = await Promise.all([
        getDataStreams(version.versionId),
        getIncomingDataStreams(version.versionId),
        getAllVersionsForSelect()
      ])

      if (outResult.success && outResult.streams) {
        setOutgoingStreams(outResult.streams)
      }
      if (inResult.success && inResult.streams) {
        setIncomingStreams(inResult.streams)
      }
      if (versionsResult.success && versionsResult.versions) {
        // Filter out current version
        setVersionOptions(versionsResult.versions.filter(v => v.versionId !== version.versionId))
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (stream?: DataStream) => {
    if (stream) {
      setEditingStream(stream)
      setFormData({
        recipientVersionId: stream.recipientVersionId?.toString() || '',
        dataStreamDescription: stream.dataStreamDescription || '',
        shareDatabase: stream.shareDatabase === 1
      })
    } else {
      setEditingStream(null)
      setFormData({
        recipientVersionId: '',
        dataStreamDescription: '',
        shareDatabase: false
      })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editingStream) {
        // Update
        const result = await updateDataStream(
          editingStream.streamId,
          version.versionId,
          {
            recipientVersionId: formData.recipientVersionId ? parseInt(formData.recipientVersionId) : null,
            dataStreamDescription: formData.dataStreamDescription,
            shareDatabase: formData.shareDatabase
          }
        )
        if (result.success) {
          toast.success('Поток обновлён')
          setShowDialog(false)
          loadData()
          router.refresh()
        } else {
          toast.error(result.error || 'Ошибка при обновлении')
        }
      } else {
        // Create
        const result = await createDataStream(version.versionId, {
          recipientVersionId: formData.recipientVersionId ? parseInt(formData.recipientVersionId) : null,
          dataStreamDescription: formData.dataStreamDescription,
          shareDatabase: formData.shareDatabase
        })
        if (result.success) {
          toast.success('Поток создан')
          setShowDialog(false)
          loadData()
          router.refresh()
        } else {
          toast.error(result.error || 'Ошибка при создании')
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (stream: DataStream) => {
    const confirmed = await confirm({
      title: 'Удаление потока данных',
      message: 'Вы действительно хотите удалить этот поток данных? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!confirmed) return

    try {
      const result = await deleteDataStream(stream.streamId, stream.versionId)
      if (result.success) {
        toast.success('Поток удалён')
        loadData()
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Ошибка при удалении')
    }
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
      <div className="space-y-6">
        {/* Outgoing streams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiArrowRight className="h-5 w-5 text-primary" />
                <CardTitle>Исходящие потоки данных</CardTitle>
                <span className="text-sm text-muted-foreground">({outgoingStreams.length})</span>
              </div>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <FiPlus className="h-4 w-4 mr-2" />
                Добавить поток
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {outgoingStreams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FiArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Исходящих потоков нет</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleOpenDialog()}
                >
                  <FiPlus className="h-4 w-4 mr-2" />
                  Добавить первый поток
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingStreams.map((stream) => (
                  <div 
                    key={`${stream.streamId}-${stream.versionId}`}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Поток #{stream.streamId}</span>
                        <FiArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-primary font-medium">
                          {stream.recipientSystemShortName || stream.recipientSystemName || 'Не указан получатель'}
                        </span>
                        {stream.recipientVersionCode && (
                          <span className="text-xs text-muted-foreground">
                            ({stream.recipientVersionCode})
                          </span>
                        )}
                        {stream.shareDatabase === 1 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                            <FiDatabase className="h-3 w-3" />
                            Общая БД
                          </span>
                        )}
                      </div>
                      
                      {stream.dataStreamDescription && (
                        <p className="text-sm text-muted-foreground">
                          {stream.dataStreamDescription}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(stream)}
                        title="Редактировать"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(stream)}
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

        {/* Incoming streams (read-only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FiArrowLeft className="h-5 w-5 text-green-600" />
              <CardTitle>Входящие потоки данных</CardTitle>
              <span className="text-sm text-muted-foreground">({incomingStreams.length})</span>
            </div>
          </CardHeader>
          <CardContent>
            {incomingStreams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FiArrowLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Входящих потоков нет</p>
                <p className="text-xs mt-2">Входящие потоки создаются из других систем</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingStreams.map((stream) => (
                  <div 
                    key={`in-${stream.streamId}-${stream.versionId}`}
                    className="flex items-start p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 font-medium">
                          {stream.sourceSystemShortName || stream.sourceSystemName || 'Неизвестный источник'}
                        </span>
                        {stream.sourceVersionCode && (
                          <span className="text-xs text-muted-foreground">
                            ({stream.sourceVersionCode})
                          </span>
                        )}
                        <FiArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Поток #{stream.streamId}</span>
                        {stream.shareDatabase === 1 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                            <FiDatabase className="h-3 w-3" />
                            Общая БД
                          </span>
                        )}
                      </div>
                      
                      {stream.dataStreamDescription && (
                        <p className="text-sm text-muted-foreground">
                          {stream.dataStreamDescription}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStream ? 'Редактировать поток данных' : 'Добавить поток данных'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Получатель (система-версия)</Label>
              <select
                value={formData.recipientVersionId}
                onChange={(e) => setFormData({ ...formData, recipientVersionId: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не указан</option>
                {versionOptions.map(v => (
                  <option key={v.versionId} value={v.versionId}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Описание потока</Label>
              <textarea
                value={formData.dataStreamDescription}
                onChange={(e) => setFormData({ ...formData, dataStreamDescription: e.target.value })}
                placeholder="Описание передаваемых данных..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shareDatabase"
                checked={formData.shareDatabase}
                onChange={(e) => setFormData({ ...formData, shareDatabase: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="shareDatabase" className="cursor-pointer">
                Общая база данных
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : (editingStream ? 'Сохранить' : 'Создать')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
