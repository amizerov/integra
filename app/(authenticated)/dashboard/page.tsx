import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats } from '@/lib/actions/systems'
import { getSystemsNetworkData } from '@/lib/actions/network'
import { formatDate } from '@/lib/utils'
import NetworkCanvas from '@/components/NetworkCanvas'

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const networkData = await getSystemsNetworkData()
  return (
    <div className="space-y-6">
      {/* Карта связей версий систем */}
      <Card>
        <CardHeader>
          <CardTitle>Карта связей версий систем</CardTitle>
          <CardDescription>
            Интерактивная схема потоков данных между версиями систем. Можно перемещать узлы для удобства просмотра.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NetworkCanvas 
            initialNodes={networkData.nodes} 
            initialEdges={networkData.edges} 
          />
        </CardContent>
      </Card>

      {/* Две колонки: Статистика и Последние изменения */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Статистика */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
            <CardDescription>
              Общие показатели системы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Всего систем</p>
                <p className="text-2xl font-bold">{stats.totalSystems}</p>
                <p className="text-xs text-muted-foreground">{stats.activeSystems} активных</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Версий систем</p>
                <p className="text-2xl font-bold">{stats.totalVersions}</p>
                <p className="text-xs text-muted-foreground">{stats.activeVersions} активных</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Связей данных</p>
                <p className="text-2xl font-bold">{stats.totalConnections}</p>
                <p className="text-xs text-muted-foreground">Межсистемных соединений</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Платформ</p>
                <p className="text-2xl font-bold">{stats.systemsByPlatform.length}</p>
                <p className="text-xs text-muted-foreground">Типов платформ</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Управленческие документы</p>
                <p className="text-2xl font-bold">{stats.totalManagingDocuments}</p>
                <p className="text-xs text-muted-foreground">Нормативные документы</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Полнотекстовые документы</p>
                <p className="text-2xl font-bold">{stats.totalFullTextDocuments}</p>
                <p className="text-xs text-muted-foreground">Обычные документы</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Методички</p>
                <p className="text-2xl font-bold">{stats.totalUserGuides}</p>
                <p className="text-xs text-muted-foreground">Руководства пользователя</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
      </div>

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
