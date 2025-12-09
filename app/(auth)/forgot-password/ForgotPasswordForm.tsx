'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)
      
      if (result.success) {
        setSent(true)
      } else {
        setError(result.error || 'Ошибка отправки')
      }
    } catch (err) {
      setError('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FiCheck className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Письмо отправлено</CardTitle>
          <CardDescription>
            Если указанный email зарегистрирован в системе, на него будет отправлена ссылка для восстановления пароля
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Проверьте папку «Входящие» и «Спам». Ссылка действительна в течение 1 часа.
          </p>
          <Link href="/login" className="block">
            <Button className="w-full" variant="outline">
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Вернуться на страницу входа
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
        <CardDescription>
          Введите email, указанный при регистрации
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить ссылку'}
          </Button>

          <Link href="/login" className="block">
            <Button type="button" variant="ghost" className="w-full">
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Назад к входу
            </Button>
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}
