import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any

  return (
    <div className="space-y-6">
      {/* Общие настройки */}
      <Card>
        <CardHeader>
          <CardTitle>Общие настройки</CardTitle>
          <CardDescription>
            Основные параметры системы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemName">Название системы</Label>
            <Input
              id="systemName"
              defaultValue="АИС Интеграция МГУ"
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Версия</Label>
            <Input
              id="version"
              defaultValue="1.2"
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Организация</Label>
            <Input
              id="organization"
              defaultValue="МГУ имени М.В.Ломоносова"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Интерфейс */}
      <Card>
        <CardHeader>
          <CardTitle>Интерфейс</CardTitle>
          <CardDescription>
            Настройки внешнего вида и поведения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Тема оформления</h4>
              <p className="text-sm text-muted-foreground">
                Автоматическое переключение между светлой и темной темой
              </p>
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" disabled>
              <option>Системная</option>
              <option>Светлая</option>
              <option>Темная</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <h4 className="font-medium">Язык интерфейса</h4>
              <p className="text-sm text-muted-foreground">
                Выберите предпочитаемый язык
              </p>
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" disabled>
              <option>Русский</option>
              <option>English</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <h4 className="font-medium">Компактный режим</h4>
              <p className="text-sm text-muted-foreground">
                Уменьшить отступы и размеры элементов
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* База данных */}
      <Card>
        <CardHeader>
          <CardTitle>База данных</CardTitle>
          <CardDescription>
            Информация о подключении к базе данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип СУБД</Label>
              <Input value="PostgreSQL" disabled />
            </div>
            <div className="space-y-2">
              <Label>База данных</Label>
              <Input value="MyDB" disabled />
            </div>
            <div className="space-y-2">
              <Label>Хост</Label>
              <Input value="localhost:5432" disabled />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <div className="flex items-center h-10">
                <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
                  Подключено
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" disabled>
              Проверить подключение
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Резервное копирование */}
      <Card>
        <CardHeader>
          <CardTitle>Резервное копирование</CardTitle>
          <CardDescription>
            Управление резервными копиями данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Автоматическое резервное копирование</h4>
              <p className="text-sm text-muted-foreground">
                Создавать резервные копии по расписанию
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Последняя резервная копия: не создавалась
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                Создать резервную копию
              </Button>
              <Button variant="outline" disabled>
                Восстановить из копии
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Журнал событий */}
      <Card>
        <CardHeader>
          <CardTitle>Журнал событий</CardTitle>
          <CardDescription>
            Настройки логирования системных событий
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Детальное логирование</h4>
              <p className="text-sm text-muted-foreground">
                Записывать подробную информацию о всех действиях
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <h4 className="font-medium">Хранить логи (дней)</h4>
              <p className="text-sm text-muted-foreground">
                Автоматически удалять старые записи
              </p>
            </div>
            <Input
              type="number"
              defaultValue="90"
              className="w-24"
              disabled
            />
          </div>

          <div className="pt-3 border-t">
            <Button variant="outline" disabled>
              Просмотреть журнал
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Безопасность */}
      <Card>
        <CardHeader>
          <CardTitle>Безопасность</CardTitle>
          <CardDescription>
            Настройки безопасности системы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Требовать сложные пароли</h4>
              <p className="text-sm text-muted-foreground">
                Минимум 8 символов, цифры и специальные знаки
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked disabled />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <h4 className="font-medium">Автоматический выход (минут)</h4>
              <p className="text-sm text-muted-foreground">
                Выход из системы при неактивности
              </p>
            </div>
            <Input
              type="number"
              defaultValue="30"
              className="w-24"
              disabled
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <h4 className="font-medium">Блокировка после неудачных попыток</h4>
              <p className="text-sm text-muted-foreground">
                Количество неверных попыток входа
              </p>
            </div>
            <Input
              type="number"
              defaultValue="5"
              className="w-24"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Сохранение */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" disabled>
          Сбросить все настройки
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">Отмена</Button>
          <Button disabled>Сохранить изменения</Button>
        </div>
      </div>
    </div>
  )
}
