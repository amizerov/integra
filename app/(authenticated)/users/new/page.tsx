'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUser } from '../actions'
import { FiSave, FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    userLogin: '',
    password: '',
    fio: '',
    eMail: '',
    userLevel: 1,
    isActive: 1,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await createUser(formData)

    if (result.success) {
      router.push('/users')
      router.refresh()
    } else {
      alert(result.error || 'Ошибка создания пользователя')
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/users">
          <Button variant="ghost" size="icon">
            <FiArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Новый пользователь</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <Label htmlFor="userLogin">Логин *</Label>
            <Input
              id="userLogin"
              value={formData.userLogin}
              onChange={(e) => setFormData({ ...formData, userLogin: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Пароль *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="fio">ФИО *</Label>
            <Input
              id="fio"
              value={formData.fio}
              onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="eMail">Email *</Label>
            <Input
              id="eMail"
              type="email"
              value={formData.eMail}
              onChange={(e) => setFormData({ ...formData, eMail: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="userLevel">Уровень доступа</Label>
            <select
              id="userLevel"
              value={formData.userLevel}
              onChange={(e) => setFormData({ ...formData, userLevel: Number(e.target.value) })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={1}>Пользователь</option>
              <option value={9}>Администратор</option>
            </select>
          </div>

          <div>
            <Label htmlFor="isActive">Статус</Label>
            <select
              id="isActive"
              value={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: Number(e.target.value) })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={1}>Активен</option>
              <option value={0}>Заблокирован</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button type="submit" disabled={isLoading}>
            <FiSave className="mr-2 h-4 w-4" />
            {isLoading ? 'Создание...' : 'Создать'}
          </Button>
          <Link href="/users">
            <Button type="button" variant="outline" disabled={isLoading}>
              Отмена
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
