import { notFound } from 'next/navigation'
import { getSystemById } from '@/lib/actions/systems'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function SystemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const systemId = parseInt(id)
  const system = await getSystemById(systemId)

  if (!system) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/systems">
              <Button variant="outline" size="sm">← Назад</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{system.systemName}</h1>
              <p className="text-muted-foreground">
                Код: {system.systemShortName || 'Не указан'}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/systems/${systemId}/edit`}>
          <Button>Редактировать</Button>
        </Link>
      </div>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Полное название</p>
              <p className="text-base">{system.systemName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Краткое название</p>
              <p className="text-base">{system.systemShortName || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Персональные данные</p>
              <p className="text-base">
                {system.hasPersonalData === 1 ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-950 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                    Да
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                    Нет
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата создания</p>
              <p className="text-base">
                {system.creationDate ? new Date(system.creationDate).toLocaleDateString('ru-RU') : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Версии системы */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Версии системы</CardTitle>
              <CardDescription>
                Список всех версий данной системы
              </CardDescription>
            </div>
            <Button size="sm">Добавить версию</Button>
          </div>
        </CardHeader>
        <CardContent>
          {system.versions && system.versions.length > 0 ? (
            <div className="space-y-4">
              {system.versions.map((version: any) => (
                <div
                  key={version.versionId}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        Версия {version.versionCode || version.versionId}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Год разработки</p>
                        <p className="font-medium">{version.versionDevelopmentYear || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Год запуска</p>
                        <p className="font-medium">{version.productionStartYear || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Год окончания</p>
                        <p className="font-medium">{version.endOfUsageYear || '—'}</p>
                      </div>
                      {version.developingOrganization && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Организация-разработчик</p>
                          <p className="font-medium">{version.developingOrganization}</p>
                        </div>
                      )}
                      {version.operatingUnit && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Эксплуатирующее подразделение</p>
                          <p className="font-medium">{version.operatingUnit}</p>
                        </div>
                      )}
                      {version.programmingTools && (
                        <div className="col-span-full">
                          <p className="text-muted-foreground">Средства программирования</p>
                          <p className="font-medium">{version.programmingTools}</p>
                        </div>
                      )}
                    </div>
                    {version.versionComment && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{version.versionComment}</p>
                      </div>
                    )}
                  </div>
                  <Link href={`/systems/${system.systemId}/versions/${version.versionId}`}>
                    <Button variant="ghost" size="sm">Подробнее</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Версии не добавлены
            </p>
          )}
        </CardContent>
      </Card>

      {/* Нормативные документы */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Нормативные документы</CardTitle>
              <CardDescription>
                Документы, регламентирующие работу системы
              </CardDescription>
            </div>
            <Button size="sm">Добавить документ</Button>
          </div>
        </CardHeader>
        <CardContent>
          {system.documents && system.documents.length > 0 ? (
            <div className="space-y-3">
              {system.documents.map((doc: any) => (
                <div
                  key={doc.normativeDocumentId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {doc.documentKind && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {doc.documentKind.documentTypeName}
                        </span>
                      )}
                      <p className="font-medium">
                        {doc.normativeDocumentNumber || 'Без номера'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doc.normativeDocumentDate 
                        ? new Date(doc.normativeDocumentDate).toLocaleDateString('ru-RU')
                        : 'Дата не указана'}
                      {doc.approvedBy && ` • Утверждено: ${doc.approvedBy}`}
                    </p>
                    {doc.documentBasicPoints && (
                      <p className="text-sm">{doc.documentBasicPoints}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">Открыть</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Документы не добавлены
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
