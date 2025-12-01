'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FiEdit2, FiPlus, FiAlertCircle, FiSave, FiX } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { updateSystem } from '../actions/updateSystem'
import { deleteSystem } from '../actions/createSystem'
import { createVersion } from './versions/actions'
import Version from './Version'
import SystemDocuments from './documents/SystemDocuments'
import { useConfirm } from '@/components/ui/confirm-dialog'

interface SystemDetailViewProps {
  system: any
}

export default function SystemDetailView({ system }: SystemDetailViewProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [activeTab, setActiveTab] = useState<'info' | 'versions' | 'documents'>('info')
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0)
  const [isEditingSystem, setIsEditingSystem] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [formData, setFormData] = useState({
    systemName: system.systemName || '',
    systemShortName: system.systemShortName || '',
    systemPurpose: system.systemPurpose || '',
    hasPersonalData: system.hasPersonalData || 0,
  })

  const tabs = [
    { id: 'info' as const, label: 'Общая информация' },
    { id: 'versions' as const, label: 'Версии' },
    { id: 'documents' as const, label: 'Документы' },
  ]

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSaveSystem = async () => {
    setIsSaving(true)
    try {
      const result = await updateSystem(system.systemId, formData)

      if (!result.success) {
        throw new Error(result.error || 'Ошибка при обновлении системы')
      }

      setIsEditingSystem(false)
      router.refresh()
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Произошла ошибка при сохранении изменений')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSystem = async () => {
    if (isDeleting) {
      return
    }

    const confirmed = await confirm({
      title: 'Удаление системы',
      message: 'Вы действительно хотите удалить эту систему? Все версии, документы и связанные данные будут безвозвратно удалены.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteSystem(system.systemId)
      if (!result?.success) {
        toast.error(result?.error || 'Не удалось удалить систему')
        return
      }

      toast.success('Система удалена')
      router.push('/systems')
      router.refresh()
    } catch (error) {
      console.error('Ошибка удаления системы:', error)
      toast.error('Ошибка при удалении системы')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      systemName: system.systemName || '',
      systemShortName: system.systemShortName || '',
      systemPurpose: system.systemPurpose || '',
      hasPersonalData: system.hasPersonalData || 0,
    })
    setIsEditingSystem(false)
  }

  const handleCreateVersion = async () => {
    if (isCreatingVersion) return

    setIsCreatingVersion(true)
    try {
      const result = await createVersion(system.systemId)
      if (!result?.success) {
        throw new Error(result?.error || 'Не удалось создать версию')
      }

      toast.success('Версия создана')
      router.refresh()
    } catch (error) {
      console.error('Ошибка создания версии:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при создании версии')
    } finally {
      setIsCreatingVersion(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/systems" className="hover:text-foreground transition-colors">
          Системы
        </Link>
        <span>/</span>
        <span className="text-foreground">{system.systemName}</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Основная информация</CardTitle>
              {isEditingSystem ? (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving || isDeleting}
                  >
                    <FiX className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveSystem}
                    disabled={isSaving || isDeleting}
                  >
                    <FiSave className="h-4 w-4 mr-2" />
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditingSystem(true)}
                >
                  <FiEdit2 className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="systemName" className="text-sm font-medium text-muted-foreground">
                    Название системы
                  </Label>
                  {isEditingSystem ? (
                    <Input
                      id="systemName"
                      value={formData.systemName}
                      onChange={(e) => setFormData(prev => ({ ...prev, systemName: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{system.systemName || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="systemShortName" className="text-sm font-medium text-muted-foreground">
                    Код системы
                  </Label>
                  {isEditingSystem ? (
                    <Input
                      id="systemShortName"
                      value={formData.systemShortName}
                      onChange={(e) => setFormData(prev => ({ ...prev, systemShortName: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{system.systemShortName || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hasPersonalData" className="text-sm font-medium text-muted-foreground">
                    Персональные данные
                  </Label>
                  {isEditingSystem ? (
                    <select
                      id="hasPersonalData"
                      value={formData.hasPersonalData}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasPersonalData: parseInt(e.target.value) }))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value={0}>Нет</option>
                      <option value={1}>Да</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-foreground">
                      {system.hasPersonalData === 1 ? 'Да' : 'Нет'}
                    </p>
                  )}
                </div>
              </div>

              {/* Column 2 - Metadata */}
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-muted-foreground">ID системы</label>
                  <p className="mt-1 text-foreground font-mono">{system.systemId}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Создано</label>
                  <p className="mt-1 text-foreground">
                    {system.creator?.fio || '-'} • {formatDate(system.creationDate)}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground">Последнее изменение</label>
                  <p className="mt-1 text-foreground">
                    {system.modifier?.fio || '-'} • {formatDate(system.lastChangeDate)}
                  </p>
                </div>
              </div>

              {/* Column 3 - Empty for now */}
              <div></div>
            </div>

            {/* System Purpose - Full Width Below */}
            <div className="mt-6 pt-6 border-t">
              <div>
                <Label htmlFor="systemPurpose" className="text-sm font-medium text-muted-foreground">
                  Описание / назначение системы
                </Label>
                {isEditingSystem ? (
                  <textarea
                    id="systemPurpose"
                    value={formData.systemPurpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPurpose: e.target.value }))}
                    rows={12}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="Описание и назначение системы..."
                  />
                ) : (
                  <p className="mt-1 text-foreground whitespace-pre-wrap min-h-[300px]">{system.systemPurpose || '-'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кнопка удаления внизу справа, только в режиме редактирования */}
        {isEditingSystem && (
          <div className="flex justify-end mt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSystem}
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить систему'}
            </Button>
          </div>
        )}
      </>
      )}

      {activeTab === 'versions' && (
        <div className="flex gap-6">
          {/* Version Tabs - Left Side */}
          {system.versions && system.versions.length > 0 && (
            <div className="shrink-0 flex flex-col gap-2">
              {system.versions.map((version: any, index: number) => (
                <button
                  key={version.versionId}
                  onClick={() => setSelectedVersionIndex(index)}
                  className={`text-left px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    index === selectedVersionIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  <span className="hidden lg:inline">Версия {version.versionCode || index + 1}</span>
                  <span className="lg:hidden">{version.versionCode || index + 1}</span>
                </button>
              ))}
              <Button 
                size="sm" 
                variant="outline" 
                className="whitespace-nowrap"
                onClick={handleCreateVersion}
                disabled={isCreatingVersion}
              >
                <FiPlus className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">{isCreatingVersion ? 'Создание...' : 'Добавить'}</span>
              </Button>
            </div>
          )}

          {/* Version Content - Right Side */}
          <div className="flex-1">
            {system.versions && system.versions.length > 0 ? (
              <Version 
                version={system.versions[selectedVersionIndex]} 
                systemId={system.systemId}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Нет версий</p>
                    <Button 
                      size="sm"
                      onClick={handleCreateVersion}
                      disabled={isCreatingVersion}
                    >
                      <FiPlus className="h-4 w-4 mr-2" />
                      {isCreatingVersion ? 'Создание...' : 'Добавить первую версию'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <SystemDocuments systemId={system.systemId} />
      )}
    </div>
  )
}
