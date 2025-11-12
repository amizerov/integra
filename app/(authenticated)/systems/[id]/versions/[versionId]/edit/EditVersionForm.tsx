'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface EditVersionFormProps {
  systemId: number
  version: {
    versionId: number
    versionCode: string | null
    versionDevelopmentYear: number | null
    productionStartYear: number | null
    endOfUsageYear: number | null
    developingOrganization: string | null
    developingUnit: string | null
    versionAuthors: string | null
    operatingUnit: string | null
    technicalSupportUnit: string | null
    operatingPlace: string | null
    programmingTools: string | null
    operatingEnvironment: string | null
    versionComment: string | null
  }
  userId: number
}

export default function EditVersionForm({ systemId, version, userId }: EditVersionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    versionCode: version.versionCode || '',
    versionDevelopmentYear: version.versionDevelopmentYear?.toString() || '',
    productionStartYear: version.productionStartYear?.toString() || '',
    endOfUsageYear: version.endOfUsageYear?.toString() || '',
    developingOrganization: version.developingOrganization || '',
    developingUnit: version.developingUnit || '',
    versionAuthors: version.versionAuthors || '',
    operatingUnit: version.operatingUnit || '',
    technicalSupportUnit: version.technicalSupportUnit || '',
    operatingPlace: version.operatingPlace || '',
    programmingTools: version.programmingTools || '',
    operatingEnvironment: version.operatingEnvironment || '',
    versionComment: version.versionComment || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/systems/${systemId}/versions/${version.versionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          versionDevelopmentYear: formData.versionDevelopmentYear ? parseInt(formData.versionDevelopmentYear) : null,
          productionStartYear: formData.productionStartYear ? parseInt(formData.productionStartYear) : null,
          endOfUsageYear: formData.endOfUsageYear ? parseInt(formData.endOfUsageYear) : null,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при обновлении версии')
      }

      router.push(`/systems/${systemId}/versions/${version.versionId}`)
      router.refresh()
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Произошла ошибка при сохранении изменений')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="versionCode">Код версии</Label>
              <Input
                id="versionCode"
                value={formData.versionCode}
                onChange={(e) => handleChange('versionCode', e.target.value)}
                placeholder="Код версии"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="versionDevelopmentYear">Год разработки</Label>
              <Input
                id="versionDevelopmentYear"
                type="number"
                value={formData.versionDevelopmentYear}
                onChange={(e) => handleChange('versionDevelopmentYear', e.target.value)}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productionStartYear">Год начала эксплуатации</Label>
              <Input
                id="productionStartYear"
                type="number"
                value={formData.productionStartYear}
                onChange={(e) => handleChange('productionStartYear', e.target.value)}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endOfUsageYear">Год завершения</Label>
              <Input
                id="endOfUsageYear"
                type="number"
                value={formData.endOfUsageYear}
                onChange={(e) => handleChange('endOfUsageYear', e.target.value)}
                placeholder="2030"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Организационная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Организационная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developingOrganization">Организация-разработчик</Label>
              <Input
                id="developingOrganization"
                value={formData.developingOrganization}
                onChange={(e) => handleChange('developingOrganization', e.target.value)}
                placeholder="Название организации"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="developingUnit">Подразделение-разработчик</Label>
              <Input
                id="developingUnit"
                value={formData.developingUnit}
                onChange={(e) => handleChange('developingUnit', e.target.value)}
                placeholder="Название подразделения"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="versionAuthors">Авторский коллектив</Label>
              <Input
                id="versionAuthors"
                value={formData.versionAuthors}
                onChange={(e) => handleChange('versionAuthors', e.target.value)}
                placeholder="ФИО авторов"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatingUnit">Подразделение-оператор</Label>
              <Input
                id="operatingUnit"
                value={formData.operatingUnit}
                onChange={(e) => handleChange('operatingUnit', e.target.value)}
                placeholder="Название подразделения"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technicalSupportUnit">Подразделение-эксплуатант</Label>
              <Input
                id="technicalSupportUnit"
                value={formData.technicalSupportUnit}
                onChange={(e) => handleChange('technicalSupportUnit', e.target.value)}
                placeholder="Название подразделения"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatingPlace">Место размещения</Label>
              <Input
                id="operatingPlace"
                value={formData.operatingPlace}
                onChange={(e) => handleChange('operatingPlace', e.target.value)}
                placeholder="Адрес или местоположение"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Техническая информация */}
      <Card>
        <CardHeader>
          <CardTitle>Техническая информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="programmingTools">Средства разработки</Label>
              <Input
                id="programmingTools"
                value={formData.programmingTools}
                onChange={(e) => handleChange('programmingTools', e.target.value)}
                placeholder="Языки программирования, фреймворки"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatingEnvironment">Среда функционирования</Label>
              <Input
                id="operatingEnvironment"
                value={formData.operatingEnvironment}
                onChange={(e) => handleChange('operatingEnvironment', e.target.value)}
                placeholder="ОС, платформы"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="versionComment">Комментарий</Label>
              <Input
                id="versionComment"
                value={formData.versionComment}
                onChange={(e) => handleChange('versionComment', e.target.value)}
                placeholder="Дополнительная информация"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Кнопки действий */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
        <Link href={`/systems/${systemId}/versions/${version.versionId}`}>
          <Button type="button" variant="outline">
            Отмена
          </Button>
        </Link>
      </div>
    </form>
  )
}
