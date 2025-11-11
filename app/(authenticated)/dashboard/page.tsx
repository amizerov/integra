import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDashboardStats } from './actions'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { FiArrowRight, FiMap } from 'react-icons/fi'
import DatabaseErrorScreen from '@/components/DatabaseErrorScreen'
import TopSystemsCards from './TopSystems'

export default async function DashboardPage() {
  let stats
  
  try {
    stats = await getDashboardStats()
  } catch (error: any) {
    // Если ошибка связана с подключением к БД, показываем красивый экран
    if (error.message?.includes("Can't reach database server") || 
        error.code === 'P1001' || 
        error.name === 'PrismaClientInitializationError') {
      return <DatabaseErrorScreen />
    }
    // Для других ошибок пробрасываем дальше
    throw error
  }
  
  return (
    <div className="space-y-6">
      {/* Топ АИС по количеству связей */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Самые связанные системы</h2>
          <Link href="/connections">
            <Button variant="outline" size="sm">
              <FiMap className="h-4 w-4 mr-2" />
              Все связи
            </Button>
          </Link>
        </div>
        <TopSystemsCards systems={stats.topConnectedSystems} />
      </div>

      {/* Две колонки: Статистика и Последние изменения */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Статистика */}
        <Card>
          <CardHeader>
            <CardTitle>Основные показатели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Основные системы */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Системы и связи</h4>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/systems" className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Системы</p>
                    <p className="text-sm text-muted-foreground">Из них {stats.systemsWithPersonalData} содержат персональные данные</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{stats.totalSystems}</p>
                </Link>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Версии</p>
                    <p className="text-sm text-muted-foreground">{stats.activeVersions} активных</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{stats.totalVersions}</p>
                </div>
                
                <Link href="/connections" className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Связи</p>
                    <p className="text-sm text-muted-foreground">между системами</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{stats.totalConnections}</p>
                </Link>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Платформы</p>
                    <p className="text-sm text-muted-foreground">типов СУБД</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{stats.systemsByPlatform.length}</p>
                </div>
              </div>
            </div>

            {/* Документация */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Документация</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-lg font-bold text-primary">{stats.totalManagingDocuments}</p>
                  <p className="text-xs text-muted-foreground">Управленческие</p>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-lg font-bold text-primary">{stats.totalFullTextDocuments}</p>
                  <p className="text-xs text-muted-foreground">Полнотекстовые</p>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-lg font-bold text-primary">{stats.totalUserGuides}</p>
                  <p className="text-xs text-muted-foreground">Методички</p>
                </div>
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
                    <div className="ml-4 space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {system.systemName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Код: {system.systemCode} • Изменил: {system.modifiedBy}
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
