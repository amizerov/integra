'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiLock, FiEdit2, FiSave, FiX, FiEye, FiEyeOff, FiCamera, FiCheck, FiAlertCircle, FiTrash2 } from 'react-icons/fi'
import { updateUserProfile, changePassword, updateAvatar, removeAvatar, sendVerificationEmail } from './actions'

interface ProfileClientProps {
  user: {
    id: string | number
    fio?: string | null
    name?: string | null
    eMail?: string | null
    phoneNumber?: string | null
    userLevel?: number | null
    userLogin?: string | null
    avatarUrl?: string | null
    emailVerified?: boolean | null
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const searchParams = useSearchParams()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [sessionTime, setSessionTime] = useState<string>('')

  // Form state
  const [fio, setFio] = useState(user.fio || user.name || '')
  const [email, setEmail] = useState(user.eMail || '')
  const [phone, setPhone] = useState(user.phoneNumber || '')
  const [emailVerified, setEmailVerified] = useState(user.emailVerified || false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null)
  const [savingAvatar, setSavingAvatar] = useState(false)

  // Проверяем URL параметры для уведомлений
  useEffect(() => {
    const verified = searchParams.get('verified')
    const error = searchParams.get('error')

    if (verified === 'true') {
      toast.success('Email успешно подтверждён!')
      setEmailVerified(true)
      window.history.replaceState({}, '', '/profile')
    } else if (error) {
      toast.error(decodeURIComponent(error))
      window.history.replaceState({}, '', '/profile')
    }
  }, [searchParams])

  // Устанавливаем время сессии только на клиенте
  useEffect(() => {
    setSessionTime(new Date().toLocaleString('ru-RU'))
  }, [])

  const handleSave = async () => {
    if (!fio.trim()) {
      toast.error('ФИО не может быть пустым')
      return
    }

    if (!email.trim()) {
      toast.error('Email не может быть пустым')
      return
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Введите корректный email')
      return
    }

    setSaving(true)
    try {
      const result = await updateUserProfile({
        fio: fio.trim(),
        eMail: email.trim(),
        phoneNumber: phone.trim() || undefined
      })
      
      if (result.emailChanged) {
        setEmailVerified(false)
        toast.success('Профиль обновлён. Email изменён — требуется подтверждение.')
      } else {
        toast.success('Профиль успешно обновлён')
      }
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFio(user.fio || user.name || '')
    setEmail(user.eMail || '')
    setPhone(user.phoneNumber || '')
    setIsEditing(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Введите текущий пароль')
      return
    }

    if (!newPassword) {
      toast.error('Введите новый пароль')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    setChangingPassword(true)
    try {
      await changePassword({
        currentPassword,
        newPassword
      })
      toast.success('Пароль успешно изменён')
      setPasswordDialogOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка изменения пароля')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 2MB')
      return
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение')
      return
    }

    setSavingAvatar(true)
    
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      try {
        await updateAvatar(base64)
        setAvatarUrl(base64)
        toast.success('Аватар успешно обновлён')
      } catch (error: any) {
        toast.error(error.message || 'Ошибка сохранения аватара')
      } finally {
        setSavingAvatar(false)
      }
    }
    reader.onerror = () => {
      toast.error('Ошибка чтения файла')
      setSavingAvatar(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    setSavingAvatar(true)
    try {
      await removeAvatar()
      setAvatarUrl(null)
      toast.success('Аватар удалён')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления аватара')
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleSendVerification = async () => {
    setSendingVerification(true)
    try {
      await sendVerificationEmail()
      toast.success('Письмо отправлено на ' + email)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отправки письма')
    } finally {
      setSendingVerification(false)
    }
  }

  const getInitials = () => {
    const name = fio || user.name || email || 'У'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>
                Ваши основные данные в системе
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <FiEdit2 className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <FiSave className="h-4 w-4 mr-2" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <FiX className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Аватар */}
          <div className="flex items-center space-x-6 pb-6 border-b">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground text-4xl font-bold">
                    {getInitials()}
                  </span>
                )}
                {savingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <label className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors">
                  <FiCamera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={savingAvatar}
                  />
                </label>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={savingAvatar}
                    className="w-8 h-8 rounded-full bg-destructive border-2 border-background flex items-center justify-center cursor-pointer hover:bg-destructive/80 transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{fio || user.name || 'Не указано'}</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{email}</span>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <FiCheck className="h-3 w-3" />
                    подтверждён
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <FiAlertCircle className="h-3 w-3" />
                    не подтверждён
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {user.userLevel === 0 ? 'Администратор' : 'Пользователь'}
              </p>
            </div>
          </div>

          {/* Форма */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fio" className="flex items-center gap-2">
                <FiUser className="h-4 w-4" />
                ФИО
              </Label>
              <Input
                id="fio"
                value={fio}
                onChange={(e) => setFio(e.target.value)}
                disabled={!isEditing}
                placeholder="Введите ФИО..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <FiMail className="h-4 w-4" />
                Email
                {!emailVerified && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={handleSendVerification}
                    disabled={sendingVerification || isEditing}
                  >
                    {sendingVerification ? 'Отправка...' : 'Подтвердить'}
                  </Button>
                )}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                placeholder="Введите email..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <FiPhone className="h-4 w-4" />
                Телефон
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">ID пользователя</Label>
              <Input
                id="userId"
                value={user.id}
                disabled
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userLogin">Логин</Label>
              <Input
                id="userLogin"
                value={user.userLogin || user.eMail || '—'}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userLevel">Уровень доступа</Label>
              <Input
                id="userLevel"
                value={user.userLevel === 0 ? 'Администратор' : 'Пользователь'}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Безопасность */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiLock className="h-5 w-5" />
            Безопасность
          </CardTitle>
          <CardDescription>
            Настройки безопасности вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
            <div>
              <h4 className="font-medium">Пароль</h4>
              <p className="text-sm text-muted-foreground">
                Регулярно меняйте пароль для безопасности
              </p>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              <FiLock className="h-4 w-4 mr-2" />
              Изменить пароль
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 opacity-60">
            <div>
              <h4 className="font-medium">Двухфакторная аутентификация</h4>
              <p className="text-sm text-muted-foreground">
                Повысьте безопасность аккаунта (скоро)
              </p>
            </div>
            <Button variant="outline" disabled>
              Настроить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Активность */}
      <Card>
        <CardHeader>
          <CardTitle>Активность</CardTitle>
          <CardDescription>
            История ваших действий в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/20">
              <div>
                <p className="font-medium">Текущая сессия</p>
                <p className="text-sm text-muted-foreground">
                  Вход выполнен: {sessionTime || '—'}
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Активна
              </span>
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              Подробная история активности пока не отслеживается
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Настройки уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
          <CardDescription>
            Управление уведомлениями и оповещениями
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
            <div>
              <h4 className="font-medium">Email уведомления</h4>
              <p className="text-sm text-muted-foreground">
                Получать уведомления на почту
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
            <div>
              <h4 className="font-medium">Уведомления в системе</h4>
              <p className="text-sm text-muted-foreground">
                Показывать уведомления в интерфейсе
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Диалог изменения пароля */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FiLock className="h-5 w-5" />
              Изменение пароля
            </DialogTitle>
            <DialogDescription>
              Введите текущий пароль и новый пароль для изменения
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль..."
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов..."
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль..."
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Пароли не совпадают</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPasswordDialogOpen(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              {changingPassword ? 'Сохранение...' : 'Изменить пароль'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
