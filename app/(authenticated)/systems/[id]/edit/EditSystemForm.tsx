'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

interface EditSystemFormProps {
  system: any
}

export default function EditSystemForm({ system }: EditSystemFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implement update system action
      toast.success('Изменения сохранены')
      router.push(`/systems/${system.systemId}`)
    } catch (error) {
      toast.error('Ошибка при сохранении')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Редактирование системы</h1>
          <p className="text-muted-foreground">
            Изменение информации о системе
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>
              Базовые параметры системы
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">Полное название *</Label>
                <Input
                  id="systemName"
                  name="systemName"
                  required
                  placeholder="Название системы"
                  defaultValue={system.systemName || ''}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemShortName">Краткое название (код)</Label>
                <Input
                  id="systemShortName"
                  name="systemShortName"
                  placeholder="Код системы"
                  defaultValue={system.systemShortName || ''}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2 col-span-full">
                <Label htmlFor="hasPersonalData">Персональные данные</Label>
                <select
                  id="hasPersonalData"
                  name="hasPersonalData"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  defaultValue={system.hasPersonalData || 0}
                  disabled={isLoading}
                >
                  <option value="0">Нет</option>
                  <option value="1">Да</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </form>
    </div>
  )
}
