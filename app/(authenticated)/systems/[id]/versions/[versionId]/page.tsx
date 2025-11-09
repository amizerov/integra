import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function VersionPage({ 
  params 
}: { 
  params: Promise<{ id: string; versionId: string }> 
}) {
  const { id, versionId } = await params
  const systemId = parseInt(id)
  const versionIdNum = parseInt(versionId)

  const [system, version] = await Promise.all([
    prisma.informationSystem.findUnique({
      where: { systemId }
    }),
    prisma.systemVersion.findUnique({
      where: { versionId: versionIdNum },
      include: {
        system: true,
        userGuides: true,
        schemas: true,
        dataStreamsSource: true,
        dataStreamsRecipient: true,
        creator: {
          select: {
            userId: true,
            fio: true,
          }
        },
        modifier: {
          select: {
            userId: true,
            fio: true,
          }
        }
      }
    })
  ])

  if (!system || !version) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href={`/systems/${systemId}`}>
              <Button variant="outline" size="sm">← Назад</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">
                Версия {version.versionCode || version.versionId}
              </h1>
              <p className="text-muted-foreground">
                {system.systemName}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/systems/${systemId}/versions/${versionIdNum}/edit`}>
          <Button>Редактировать</Button>
        </Link>
      </div>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Код системы</p>
              <p className="text-base">{version.versionCode || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Id версии</p>
              <p className="text-base">{version.versionId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Краткое обозначение системы</p>
              <p className="text-base">{system.systemShortName || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Год начала разработки версии</p>
              <p className="text-base">{version.versionDevelopmentYear || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Год начала эксплуатации версии</p>
              <p className="text-base">{version.productionStartYear || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Год завершения эксплуатации версии</p>
              <p className="text-base">{version.endOfUsageYear || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Организационная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Организационная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Организация-разработчик</p>
            <p className="text-base">{version.developingOrganization || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Подразделение-разработчик</p>
            <p className="text-base">{version.developingUnit || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Авторский коллектив</p>
            <p className="text-base">{version.versionAuthors || '—'}</p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Подразделение-оператор</p>
            <p className="text-base">{version.operatingUnit || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Подразделение-эксплуатант</p>
            <p className="text-base">{version.technicalSupportUnit || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Место размещения</p>
            <p className="text-base">{version.operatingPlace || '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Техническая информация */}
      <Card>
        <CardHeader>
          <CardTitle>Техническая информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Средства разработки</p>
            <p className="text-base">{version.programmingTools || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Среда функционирования</p>
            <p className="text-base">{version.operatingEnvironment || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Комментарий</p>
            <p className="text-base">{version.versionComment || '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Служебная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Служебная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Пользователь создатель</p>
              <p className="text-base">
                {version.creator 
                  ? `${version.creator.fio} (ID: ${version.creator.userId})`
                  : version.userId 
                    ? `ID: ${version.userId}`
                    : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата создания</p>
              <p className="text-base">
                {version.creationDate 
                  ? new Date(version.creationDate).toLocaleString('ru-RU')
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Последние изменения сделал</p>
              <p className="text-base">
                {version.modifier 
                  ? `${version.modifier.fio} (ID: ${version.modifier.userId})`
                  : version.lastChangeUser 
                    ? `ID: ${version.lastChangeUser}`
                    : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата последнего изменения</p>
              <p className="text-base">
                {version.lastChangeDate 
                  ? new Date(version.lastChangeDate).toLocaleString('ru-RU')
                  : '—'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Связанные данные */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Руководства пользователя */}
        <Card>
          <CardHeader>
            <CardTitle>Руководства пользователя</CardTitle>
          </CardHeader>
          <CardContent>
            {version.userGuides ? (
              <div className="p-3 border rounded-md">
                <p className="font-medium">{version.userGuides.title || 'Руководство'}</p>
                <p className="text-sm text-muted-foreground">
                  {version.userGuides.yearPublished && `Год: ${version.userGuides.yearPublished}`}
                  {version.userGuides.publisher && ` • ${version.userGuides.publisher}`}
                </p>
                {version.userGuides.authorsList && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Авторы: {version.userGuides.authorsList}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* Схемы данных */}
        <Card>
          <CardHeader>
            <CardTitle>Схемы данных</CardTitle>
          </CardHeader>
          <CardContent>
            {version.schemas && version.schemas.length > 0 ? (
              <div className="space-y-2">
                {version.schemas.map((schema: any) => (
                  <div key={`${schema.versionId}-${schema.dataSchemaVersion}`} className="p-3 border rounded-md">
                    <p className="font-medium">Версия схемы: {schema.dataSchemaVersion}</p>
                    {schema.changesInTheCurrentVersion && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {schema.changesInTheCurrentVersion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Потоки данных */}
      <Card>
        <CardHeader>
          <CardTitle>Потоки данных</CardTitle>
          <CardDescription>
            Связи с другими системами
          </CardDescription>
        </CardHeader>
        <CardContent>
          {version.dataStreamsSource && version.dataStreamsSource.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Исходящие потоки:</h4>
              {version.dataStreamsSource.map((stream: any) => (
                <div key={stream.streamId} className="p-3 border rounded-md">
                  <p className="font-medium">Поток #{stream.streamId}</p>
                  {stream.dataStreamDescription && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {stream.dataStreamDescription}
                    </p>
                  )}
                  {stream.shareDatabase === 1 && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 mt-2">
                      Общая БД
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Нет исходящих потоков</p>
          )}
        </CardContent>
      </Card>

      {/* Действия */}
      <div className="flex gap-2">
        <Link href={`/systems/${systemId}/versions/${versionIdNum}/edit`}>
          <Button>Редактировать версию</Button>
        </Link>
        <Button variant="outline" disabled>Удалить версию</Button>
      </div>
    </div>
  )
}
