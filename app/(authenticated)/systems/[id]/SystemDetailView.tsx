'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FiEdit2, FiPlus, FiAlertCircle, FiSave, FiX } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { updateSystem } from '../actions/updateSystem'

interface SystemDetailViewProps {
  system: any
}

export default function SystemDetailView({ system }: SystemDetailViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'versions' | 'documents' | 'connections'>('info')
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0)
  const [isEditingSystem, setIsEditingSystem] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
    { id: 'connections' as const, label: 'Связи' },
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
      alert('Произошла ошибка при сохранении изменений')
    } finally {
      setIsSaving(false)
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
                    disabled={isSaving}
                  >
                    <FiX className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveSystem}
                    disabled={isSaving}
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

              {/* Column 2 - System Purpose */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="systemPurpose" className="text-sm font-medium text-muted-foreground">
                    Краткое описание / цель
                  </Label>
                  {isEditingSystem ? (
                    <textarea
                      id="systemPurpose"
                      value={formData.systemPurpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, systemPurpose: e.target.value }))}
                      rows={8}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                      placeholder="Краткое описание системы и её цели..."
                    />
                  ) : (
                    <p className="mt-1 text-foreground whitespace-pre-wrap">{system.systemPurpose || '-'}</p>
                  )}
                </div>
              </div>

              {/* Column 3 - Metadata */}
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
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'versions' && (
        <div className="space-y-6">
          {system.versions.length === 1 ? (
            // Single version - show card directly
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Версия {system.versions[0].versionCode || '1'}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Link href={`/systems/${system.systemId}/versions/${system.versions[0].versionId}/edit`}>
                      <Button variant="outline" size="sm">
                        <FiEdit2 className="h-4 w-4 mr-2" />
                        Редактировать
                      </Button>
                    </Link>
                    <Button size="sm">
                      <FiPlus className="h-4 w-4 mr-2" />
                      Добавить ещё версию
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Код версии</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].versionCode || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Подразделение-оператор</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].operatingUnit || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Год разработки</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].versionDevelopmentYear || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Подразделение-эксплуатант</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].technicalSupportUnit || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Год начала эксплуатации</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].productionStartYear || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Место размещения</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].operatingPlace || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Год окончания</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].endOfUsageYear || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Средства разработки</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].programmingTools || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Организация-разработчик</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].developingOrganization || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Среда функционирования</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].operatingEnvironment || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Подразделение-разработчик</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].developingUnit || '-'}</p>
                  </div>
                  {system.versions[0].versionComment && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Комментарий</label>
                      <p className="mt-0.5 text-sm">{system.versions[0].versionComment}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Авторский коллектив</label>
                    <p className="mt-0.5 text-sm">{system.versions[0].versionAuthors || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Multiple versions - show timeline + selected version
            <div className="space-y-4">
              {/* Version Timeline */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {system.versions.map((version: any, index: number) => (
                  <Button
                    key={version.versionId}
                    variant={index === selectedVersionIndex ? 'default' : 'outline'}
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => setSelectedVersionIndex(index)}
                  >
                    Версия {version.versionCode || index + 1}
                  </Button>
                ))}
                <Button size="sm" variant="outline">
                  <FiPlus className="h-4 w-4 mr-2" />
                  Добавить версию
                </Button>
              </div>

              {/* Selected Version Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Версия {system.versions[selectedVersionIndex].versionCode || selectedVersionIndex + 1}</CardTitle>
                    <Link href={`/systems/${system.systemId}/versions/${system.versions[selectedVersionIndex].versionId}/edit`}>
                      <Button variant="outline" size="sm">
                        <FiEdit2 className="h-4 w-4 mr-2" />
                        Редактировать
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Код версии</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].versionCode || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Подразделение-оператор</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].operatingUnit || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Год разработки</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].versionDevelopmentYear || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Подразделение-эксплуатант</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].technicalSupportUnit || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Год начала эксплуатации</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].productionStartYear || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Место размещения</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].operatingPlace || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Год окончания</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].endOfUsageYear || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Средства разработки</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].programmingTools || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Организация-разработчик</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].developingOrganization || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Среда функционирования</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].operatingEnvironment || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Подразделение-разработчик</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].developingUnit || '-'}</p>
                    </div>
                    {system.versions[selectedVersionIndex].versionComment && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Комментарий</label>
                        <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].versionComment}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Авторский коллектив</label>
                      <p className="mt-0.5 text-sm">{system.versions[selectedVersionIndex].versionAuthors || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Документов: {system._count?.documents || 0}
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'connections' && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Раздел в разработке
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
