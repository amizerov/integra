import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Личная информация</CardTitle>
          <CardDescription>
            Ваши основные данные в системе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 pb-4 border-b">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-3xl font-bold">
                {user?.fio?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'У'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.fio || user?.name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.userLevel === 0 ? 'Администратор' : 'Пользователь'}
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fio">ФИО</Label>
                <Input
                  id="fio"
                  name="fio"
                  defaultValue={user?.fio || user?.name || ''}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">ID пользователя</Label>
                <Input
                  id="userId"
                  name="userId"
                  defaultValue={user?.id || ''}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userLevel">Уровень доступа</Label>
                <Input
                  id="userLevel"
                  name="userLevel"
                  defaultValue={user?.userLevel === 0 ? 'Администратор' : 'Пользователь'}
                  disabled
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" disabled>
                Редактировать профиль
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Безопасность */}
      <Card>
        <CardHeader>
          <CardTitle>Безопасность</CardTitle>
          <CardDescription>
            Настройки безопасности вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Пароль</h4>
              <p className="text-sm text-muted-foreground">
                Последнее изменение: неизвестно
              </p>
            </div>
            <Button variant="outline" disabled>
              Изменить пароль
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Двухфакторная аутентификация</h4>
                <p className="text-sm text-muted-foreground">
                  Повысьте безопасность аккаунта
                </p>
              </div>
              <Button variant="outline" disabled>
                Настроить
              </Button>
            </div>
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
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Последний вход</p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                История активности пока не отслеживается
              </p>
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email уведомления</h4>
              <p className="text-sm text-muted-foreground">
                Получать уведомления на почту
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <h4 className="font-medium">Уведомления в системе</h4>
              <p className="text-sm text-muted-foreground">
                Показывать уведомления в интерфейсе
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
