'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'
import { updateCommon } from './actions'
import toast from 'react-hot-toast'

interface CommonProps {
  version: any
  systemId: number
}

export default function Common({ version, systemId }: CommonProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    versionCode: version.versionCode || '',
    operatingUnit: version.operatingUnit || '',
    technicalSupportUnit: version.technicalSupportUnit || '',
    versionDevelopmentYear: version.versionDevelopmentYear || '',
    productionStartYear: version.productionStartYear || '',
    operatingPlace: version.operatingPlace || '',
    endOfUsageYear: version.endOfUsageYear || '',
  })

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('ru-RU')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateCommon(version.versionId, {
        versionCode: formData.versionCode,
        operatingUnit: formData.operatingUnit,
        technicalSupportUnit: formData.technicalSupportUnit,
        versionDevelopmentYear: formData.versionDevelopmentYear ? parseInt(formData.versionDevelopmentYear) : undefined,
        productionStartYear: formData.productionStartYear ? parseInt(formData.productionStartYear) : undefined,
        operatingPlace: formData.operatingPlace,
        endOfUsageYear: formData.endOfUsageYear ? parseInt(formData.endOfUsageYear) : undefined,
      })

      if (!result.success) {
        throw new Error(result.error || 'Ошибка при сохранении')
      }

      toast.success('Изменения сохранены')
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Произошла ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      versionCode: version.versionCode || '',
      operatingUnit: version.operatingUnit || '',
      technicalSupportUnit: version.technicalSupportUnit || '',
      versionDevelopmentYear: version.versionDevelopmentYear || '',
      productionStartYear: version.productionStartYear || '',
      operatingPlace: version.operatingPlace || '',
      endOfUsageYear: version.endOfUsageYear || '',
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Основная информация</CardTitle>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <FiX className="h-4 w-4 mr-2" />
                Отмена
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <FiSave className="h-4 w-4 mr-2" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <FiEdit2 className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Код версии</Label>
            {isEditing ? (
              <Input
                value={formData.versionCode}
                onChange={(e) => setFormData({ ...formData, versionCode: e.target.value })}
                placeholder="Код версии"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {version.versionCode || '—'}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Подразделение-оператор</Label>
            {isEditing ? (
              <Input
                value={formData.operatingUnit}
                onChange={(e) => setFormData({ ...formData, operatingUnit: e.target.value })}
                placeholder="Подразделение-оператор"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {version.operatingUnit || '—'}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Подразделение-эксплуатант</Label>
            {isEditing ? (
              <Input
                value={formData.technicalSupportUnit}
                onChange={(e) => setFormData({ ...formData, technicalSupportUnit: e.target.value })}
                placeholder="Подразделение-эксплуатант"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {version.technicalSupportUnit || '—'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Год разработки</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.versionDevelopmentYear}
                onChange={(e) => setFormData({ ...formData, versionDevelopmentYear: e.target.value })}
                placeholder="Год разработки"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {version.versionDevelopmentYear || '—'}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Год начала эксплуатации</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.productionStartYear}
                onChange={(e) => setFormData({ ...formData, productionStartYear: e.target.value })}
                placeholder="Год начала эксплуатации"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {version.productionStartYear || '—'}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Место размещения</Label>
            {isEditing ? (
              <Input
                value={formData.operatingPlace}
                onChange={(e) => setFormData({ ...formData, operatingPlace: e.target.value })}
                placeholder="Место размещения"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {version.operatingPlace || '—'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Год окончания</Label>
          {isEditing ? (
            <Input
              type="number"
              value={formData.endOfUsageYear}
              onChange={(e) => setFormData({ ...formData, endOfUsageYear: e.target.value })}
              placeholder="Год окончания"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/50">
              {version.endOfUsageYear || '—'}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Служебная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Пользователь создатель</Label>
              <div className="p-2 border rounded-md bg-muted/50">
                {version.creator 
                  ? `${version.creator.fio} (ID: ${version.creator.userId})`
                  : version.userId 
                    ? `ID: ${version.userId}`
                    : '—'
                }
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Дата создания</Label>
              <div className="p-2 border rounded-md bg-muted/50">
                {formatDate(version.creationDate)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Последние изменения сделал</Label>
              <div className="p-2 border rounded-md bg-muted/50">
                {version.modifier 
                  ? `${version.modifier.fio} (ID: ${version.modifier.userId})`
                  : version.lastChangeUser 
                    ? `ID: ${version.lastChangeUser}`
                    : '—'
                }
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Дата последнего изменения</Label>
              <div className="p-2 border rounded-md bg-muted/50">
                {formatDate(version.lastChangeDate)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
