import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats } from '@/lib/actions/systems'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего систем
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSystems}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSystems} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Версий систем
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVersions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeVersions} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Связей данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConnections}</div>
            <p className="text-xs text-muted-foreground">
              Межсистемных соединений
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Платформ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemsByPlatform.length}</div>
            <p className="text-xs text-muted-foreground">
              Типов платформ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Последние изменения */}
      <Card>
        <CardHeader>
          <CardTitle>Последние изменения</CardTitle>
          <CardDescription>
            Недавно обновленные системы и версии
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentSystems.length > 0 ? (
              stats.recentSystems.map((system: any) => (
                <div key={system.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {system.systemName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Код: {system.systemCode}
                    </p>
                  </div>
                  <div className="ml-auto text-sm text-muted-foreground">
                    {formatDate(system.updatedAt)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Системы по платформам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Распределение по платформам</CardTitle>
            <CardDescription>
              Количество версий систем по типам платформ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.systemsByPlatform.map((item: any) => {
                const maxCount = Math.max(...stats.systemsByPlatform.map((i: any) => i.count))
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.platform} className="flex items-center">
                    <div className="w-32 text-sm font-medium">{item.platform}</div>
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-muted-foreground">
                      {item.count}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Типы баз данных</CardTitle>
            <CardDescription>
              Используемые СУБД в системах
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.systemsByDatabase.map((item: any) => {
                const maxCount = Math.max(...stats.systemsByDatabase.map((i: any) => i.count))
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.database} className="flex items-center">
                    <div className="w-32 text-sm font-medium">{item.database}</div>
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-muted-foreground">
                      {item.count}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
