'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'
import { updateTechnical } from './actions'
import toast from 'react-hot-toast'

interface TechnicalProps {
  version: any
  systemId: number
}

export default function Technical({ version, systemId }: TechnicalProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    programmingTools: version.programmingTools || '',
    operatingEnvironment: version.operatingEnvironment || '',
    versionComment: version.versionComment || '',
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateTechnical(version.versionId, formData)

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
      programmingTools: version.programmingTools || '',
      operatingEnvironment: version.operatingEnvironment || '',
      versionComment: version.versionComment || '',
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Техническая информация</CardTitle>
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
          <Label className="text-sm font-medium text-muted-foreground">Средства разработки</Label>
          {isEditing ? (
            <textarea
              value={formData.programmingTools}
              onChange={(e) => setFormData({ ...formData, programmingTools: e.target.value })}
              placeholder="Средства разработки"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/50 whitespace-pre-wrap">
              {version.programmingTools || '—'}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Среда функционирования</Label>
          {isEditing ? (
            <textarea
              value={formData.operatingEnvironment}
              onChange={(e) => setFormData({ ...formData, operatingEnvironment: e.target.value })}
              placeholder="Среда функционирования"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/50 whitespace-pre-wrap">
              {version.operatingEnvironment || '—'}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Комментарий</Label>
          {isEditing ? (
            <textarea
              value={formData.versionComment}
              onChange={(e) => setFormData({ ...formData, versionComment: e.target.value })}
              placeholder="Комментарий"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/50 whitespace-pre-wrap">
              {version.versionComment || '—'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
