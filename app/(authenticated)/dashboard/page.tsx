import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDashboardStats } from '@/lib/actions/systems'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { FiArrowRight, FiMap } from 'react-icons/fi'

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  return (
    <div className="space-y-6">
      {/* Две колонки: Статистика и Последние изменения */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Статистика */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика системы</CardTitle>
            <CardDescription>
              Основные показатели
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Основные системы */}
            <div>
              <h4 className="text-sm font-semibold text-[color:var(--color-foreground)] mb-3">Системы и связи</h4>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/systems" className="flex items-center justify-between p-3 bg-[color:var(--color-muted)] rounded-lg hover:bg-[color:var(--color-muted)]/80 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs text-[color:var(--color-muted-foreground)] uppercase tracking-wide">Системы</p>
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">Из них {stats.systemsWithPersonalData} содержат персональные данные</p>
                  </div>
                  <p className="text-xl font-bold text-[color:var(--color-primary)]">{stats.totalSystems}</p>
                </Link>
                
                <div className="flex items-center justify-between p-3 bg-[color:var(--color-muted)] rounded-lg">
                  <div>
                    <p className="text-xs text-[color:var(--color-muted-foreground)] uppercase tracking-wide">Версии</p>
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">{stats.activeVersions} активных</p>
                  </div>
                  <p className="text-xl font-bold text-[color:var(--color-primary)]">{stats.totalVersions}</p>
                </div>
                
                <Link href="/connections" className="flex items-center justify-between p-3 bg-[color:var(--color-muted)] rounded-lg hover:bg-[color:var(--color-muted)]/80 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs text-[color:var(--color-muted-foreground)] uppercase tracking-wide">Связи</p>
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">между системами</p>
                  </div>
                  <p className="text-xl font-bold text-[color:var(--color-primary)]">{stats.totalConnections}</p>
                </Link>
                
                <div className="flex items-center justify-between p-3 bg-[color:var(--color-muted)] rounded-lg">
                  <div>
                    <p className="text-xs text-[color:var(--color-muted-foreground)] uppercase tracking-wide">Платформы</p>
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">типов СУБД</p>
                  </div>
                  <p className="text-xl font-bold text-[color:var(--color-primary)]">{stats.systemsByPlatform.length}</p>
                </div>
              </div>
            </div>

            {/* Документация */}
            <div>
              <h4 className="text-sm font-semibold text-[color:var(--color-foreground)] mb-3">Документация</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-[color:var(--color-muted)] rounded-lg">
                  <p className="text-lg font-bold text-[color:var(--color-primary)]">{stats.totalManagingDocuments}</p>
                  <p className="text-xs text-[color:var(--color-muted-foreground)]">Управленческие</p>
                </div>
                
                <div className="text-center p-3 bg-[color:var(--color-muted)] rounded-lg">
                  <p className="text-lg font-bold text-[color:var(--color-primary)]">{stats.totalFullTextDocuments}</p>
                  <p className="text-xs text-[color:var(--color-muted-foreground)]">Полнотекстовые</p>
                </div>
                
                <div className="text-center p-3 bg-[color:var(--color-muted)] rounded-lg">
                  <p className="text-lg font-bold text-[color:var(--color-primary)]">{stats.totalUserGuides}</p>
                  <p className="text-xs text-[color:var(--color-muted-foreground)]">Методички</p>
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
                      <p className="text-sm text-[color:var(--color-muted-foreground)]">
                        Код: {system.systemCode} • Изменил: {system.modifiedBy}
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-[color:var(--color-muted-foreground)]">
                      {formatDate(system.updatedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--color-muted-foreground)]">Нет данных</p>
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
                    <div className="flex-1 bg-[color:var(--color-secondary)] rounded-full h-2">
                      <div 
                        className="bg-[color:var(--color-primary)] h-2 rounded-full" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-[color:var(--color-muted-foreground)]">
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
                    <div className="flex-1 bg-[color:var(--color-secondary)] rounded-full h-2">
                      <div 
                        className="bg-[color:var(--color-primary)] h-2 rounded-full" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-[color:var(--color-muted-foreground)]">
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
