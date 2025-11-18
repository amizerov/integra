'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'
import { updateOrganization } from './actions'
import toast from 'react-hot-toast'

interface OrganizationProps {
  version: any
  systemId: number
}

export default function Organization({ version, systemId }: OrganizationProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    developingOrganization: version.developingOrganization || '',
    developingUnit: version.developingUnit || '',
    versionAuthors: version.versionAuthors || '',
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateOrganization(version.versionId, formData)

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
      developingOrganization: version.developingOrganization || '',
      developingUnit: version.developingUnit || '',
      versionAuthors: version.versionAuthors || '',
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Организационная информация</CardTitle>
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
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Организация-разработчик</Label>
          {isEditing ? (
            <Input
              value={formData.developingOrganization}
              onChange={(e) => setFormData({ ...formData, developingOrganization: e.target.value })}
              placeholder="Организация-разработчик"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/50">
              {version.developingOrganization || '—'}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Подразделение-разработчик</Label>
          {isEditing ? (
            <Input
              value={formData.developingUnit}
              onChange={(e) => setFormData({ ...formData, developingUnit: e.target.value })}
              placeholder="Подразделение-разработчик"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/50">
              {version.developingUnit || '—'}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Авторский коллектив</Label>
          {isEditing ? (
            <textarea
              value={formData.versionAuthors}
              onChange={(e) => setFormData({ ...formData, versionAuthors: e.target.value })}
              placeholder="Авторский коллектив"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/50 whitespace-pre-wrap">
              {version.versionAuthors || '—'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
