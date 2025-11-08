import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'

export default async function AdminPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any

  // Проверка прав администратора (userLevel === 0)
  if (user?.userLevel !== 0) {
    redirect('/dashboard')
  }

  // Получение статистики
  const [
    totalUsers,
    totalSystems,
    totalVersions,
    totalDocuments,
    totalConnections,
    recentUsers
  ] = await Promise.all([
    prisma.allowedUser.count(),
    prisma.informationSystem.count(),
    prisma.systemVersion.count(),
    prisma.managingDocument.count(),
    prisma.dataStream.count(),
    prisma.allowedUser.findMany({
      take: 10,
      orderBy: { userId: 'desc' },
      select: {
        userId: true,
        fio: true,
        eMail: true,
        userLevel: true,
        isActive: true,
      }
    })
  ])

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Пользователи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSystems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Версии
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVersions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Документы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Связи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConnections}</div>
          </CardContent>
        </Card>
      </div>

      {/* Управление пользователями */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Пользователи</CardTitle>
              <CardDescription>
                Управление учетными записями пользователей
              </CardDescription>
            </div>
            <Button disabled>Добавить пользователя</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      ФИО
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Уровень
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Статус
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user: any) => (
                    <tr key={user.userId} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        {user.userId}
                      </td>
                      <td className="p-4 align-middle font-medium">
                        {user.fio || '—'}
                      </td>
                      <td className="p-4 align-middle">
                        {user.eMail || '—'}
                      </td>
                      <td className="p-4 align-middle">
                        {user.userLevel === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400">
                            Администратор
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                            Пользователь
                          </span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {user.isActive === 1 ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-50 dark:bg-gray-950 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
                            Неактивен
                          </span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm" disabled>
                          Редактировать
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Системные операции */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Резервное копирование</CardTitle>
            <CardDescription>
              Управление резервными копиями базы данных
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Последняя копия</p>
                <p className="text-xs text-muted-foreground">Не создавалась</p>
              </div>
              <Button variant="outline" disabled>Создать</Button>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <div>
                <p className="text-sm font-medium">Автоматическое резервирование</p>
                <p className="text-xs text-muted-foreground">Не настроено</p>
              </div>
              <Button variant="outline" disabled>Настроить</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Журнал событий</CardTitle>
            <CardDescription>
              Аудит действий пользователей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Записей в журнале</p>
                <p className="text-xs text-muted-foreground">Не отслеживается</p>
              </div>
              <Button variant="outline" disabled>Просмотреть</Button>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <div>
                <p className="text-sm font-medium">Экспорт журнала</p>
                <p className="text-xs text-muted-foreground">Скачать отчет</p>
              </div>
              <Button variant="outline" disabled>Экспорт</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Обслуживание */}
      <Card>
        <CardHeader>
          <CardTitle>Обслуживание системы</CardTitle>
          <CardDescription>
            Инструменты для администрирования
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" disabled className="h-auto py-4 flex-col">
              <span className="font-semibold">Очистка кэша</span>
              <span className="text-xs text-muted-foreground mt-1">Удалить временные данные</span>
            </Button>
            <Button variant="outline" disabled className="h-auto py-4 flex-col">
              <span className="font-semibold">Проверка целостности</span>
              <span className="text-xs text-muted-foreground mt-1">Проверить БД на ошибки</span>
            </Button>
            <Button variant="outline" disabled className="h-auto py-4 flex-col">
              <span className="font-semibold">Обновление индексов</span>
              <span className="text-xs text-muted-foreground mt-1">Оптимизировать базу данных</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
