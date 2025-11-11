'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { createSystem } from '../actions/createSystem'

interface CreateSystemFormProps {
  userId: number
}

export default function CreateSystemForm({ userId }: CreateSystemFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    systemName: '',
    systemShortName: '',
    hasPersonalData: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const system = await createSystem({
        systemName: formData.systemName,
        systemShortName: formData.systemShortName || undefined,
        hasPersonalData: formData.hasPersonalData,
        userId,
      })

      router.push(`/systems/${system.systemId}`)
      router.refresh()
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Произошла ошибка при создании системы')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemName">
              Название системы <span className="text-destructive">*</span>
            </Label>
            <Input
              id="systemName"
              value={formData.systemName}
              onChange={(e) => handleChange('systemName', e.target.value)}
              placeholder="Полное название системы"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemShortName">Краткое обозначение (код)</Label>
            <Input
              id="systemShortName"
              value={formData.systemShortName}
              onChange={(e) => handleChange('systemShortName', e.target.value)}
              placeholder="Краткое обозначение"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasPersonalData"
              checked={formData.hasPersonalData}
              onChange={(e) => handleChange('hasPersonalData', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="hasPersonalData" className="cursor-pointer">
              Содержит персональные данные
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || !formData.systemName}>
          {isSubmitting ? 'Создание...' : 'Создать систему'}
        </Button>
        <Link href="/systems">
          <Button type="button" variant="outline">
            Отмена
          </Button>
        </Link>
      </div>
    </form>
  )
}
