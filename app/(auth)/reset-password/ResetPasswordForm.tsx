'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi'
import { validateResetToken, resetPassword } from '../forgot-password/actions'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [email, setEmail] = useState('')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Проверка токена при загрузке
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setValidating(false)
        return
      }

      const result = await validateResetToken(token)
      setTokenValid(result.valid)
      if (result.email) setEmail(result.email)
      setValidating(false)
    }

    checkToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(token!, password)
      
      if (result.success) {
        setSuccess(true)
        // Редирект на логин через 3 секунды
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error || 'Ошибка сброса пароля')
      }
    } catch (err) {
      setError('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Проверка ссылки...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!token || !tokenValid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FiX className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Ссылка недействительна</CardTitle>
          <CardDescription>
            Ссылка для сброса пароля истекла или уже была использована
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/forgot-password" className="block">
            <Button className="w-full">
              Запросить новую ссылку
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Вернуться на страницу входа
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FiCheck className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Пароль изменён</CardTitle>
          <CardDescription>
            Ваш пароль успешно изменён. Сейчас вы будете перенаправлены на страницу входа.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="block">
            <Button className="w-full">
              Войти в систему
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Новый пароль</CardTitle>
        <CardDescription>
          {email ? `Создайте новый пароль для ${email}` : 'Введите новый пароль'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Новый пароль</Label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Минимум 6 символов"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Повторите пароль"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
