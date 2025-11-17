'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiEdit2 } from 'react-icons/fi'

interface VersionProps {
  version: any
  systemId: number
}

export default function Version({ version, systemId }: VersionProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'technical' | 'documents' | 'connections'>('info')

  const versionTabs = [
    { id: 'info' as const, label: 'Общая информация' },
    { id: 'technical' as const, label: 'Техническая информация' },
    { id: 'documents' as const, label: 'Документы' },
    { id: 'connections' as const, label: 'Связи' },
  ]

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('ru-RU')
  }

  return (
    <div className="space-y-6">
      {/* Version Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {versionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Основная информация</CardTitle>
              <Button variant="outline" size="sm">
                <FiEdit2 className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Код версии</label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {version.versionCode || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Подразделение-оператор</label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {version.operatingUnit || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Подразделение-эксплуатант</label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {version.technicalSupportUnit || '—'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Год разработки</label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {version.versionDevelopmentYear || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Год начала эксплуатации</label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {version.productionStartYear || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Место размещения</label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {version.operatingPlace || '—'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Год окончания</label>
              <div className="p-2 border rounded-md bg-muted/50">
                {version.endOfUsageYear || '—'}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Организационная информация</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Организация-разработчик</label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {version.developingOrganization || '—'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Подразделение-разработчик</label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {version.developingUnit || '—'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Авторский коллектив</label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {version.versionAuthors || '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Служебная информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Пользователь создатель</label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {version.creator 
                      ? `${version.creator.fio} (ID: ${version.creator.userId})`
                      : version.userId 
                        ? `ID: ${version.userId}`
                        : '—'
                    }
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Дата создания</label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {formatDate(version.creationDate)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Последние изменения сделал</label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {version.modifier 
                      ? `${version.modifier.fio} (ID: ${version.modifier.userId})`
                      : version.lastChangeUser 
                        ? `ID: ${version.lastChangeUser}`
                        : '—'
                    }
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Дата последнего изменения</label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {formatDate(version.lastChangeDate)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'technical' && (
        <Card>
          <CardHeader>
            <CardTitle>Техническая информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Средства разработки</label>
              <div className="p-2 border rounded-md bg-muted/50">
                {version.programmingTools || '—'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Среда функционирования</label>
              <div className="p-2 border rounded-md bg-muted/50">
                {version.operatingEnvironment || '—'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Комментарий</label>
              <div className="p-2 border rounded-md bg-muted/50">
                {version.versionComment || '—'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
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
      )}

      {activeTab === 'connections' && (
        <Card>
          <CardHeader>
            <CardTitle>Потоки данных</CardTitle>
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

            {version.dataStreamsRecipient && version.dataStreamsRecipient.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm">Входящие потоки:</h4>
                {version.dataStreamsRecipient.map((stream: any) => (
                  <div key={stream.streamId} className="p-3 border rounded-md">
                    <p className="font-medium">Поток #{stream.streamId}</p>
                    {stream.dataStreamDescription && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {stream.dataStreamDescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
