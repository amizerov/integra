'use client'

import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { FiPlus, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi'

interface ChangeLog {
  id: number
  userId: number
  entityType: string
  entityId: number
  action: string
  description: string
  metadata: string | null
  createdAt: Date
  user: {
    fio: string | null
    avatarUrl: string | null
  }
}

interface ChangeLogListProps {
  logs: ChangeLog[]
}

const actionIcons = {
  created: FiPlus,
  updated: FiEdit2,
  deleted: FiTrash2,
}

const actionColors = {
  created: 'text-green-600 bg-green-50 dark:bg-green-950',
  updated: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  deleted: 'text-red-600 bg-red-50 dark:bg-red-950',
}

const actionLabels = {
  created: 'Создано',
  updated: 'Изменено',
  deleted: 'Удалено',
}

const entityTypeLabels: Record<string, string> = {
  system: 'Система',
  version: 'Версия системы',
  stream: 'Поток данных',
  document: 'Документ',
  schema: 'Схема данных',
  exchange_format: 'Формат обмена',
  network_layout: 'Карта связей',
}

export default function ChangeLogList({ logs }: ChangeLogListProps) {
  if (logs.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">История пуста</p>
          <p className="text-sm">Изменения будут отображаться здесь</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || FiEdit2
        const actionColor = actionColors[log.action as keyof typeof actionColors] || actionColors.updated
        const actionLabel = actionLabels[log.action as keyof typeof actionLabels] || log.action
        const entityLabel = entityTypeLabels[log.entityType] || log.entityType

        return (
          <Card key={log.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`p-2 rounded-lg ${actionColor} shrink-0`}>
                <ActionIcon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{actionLabel}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{entityLabel}</span>
                    </div>
                    <p className="text-sm">{log.description}</p>
                  </div>

                  {/* Time */}
                  <div className="text-xs text-muted-foreground text-right shrink-0">
                    {formatDate(log.createdAt)}
                  </div>
                </div>

                {/* User */}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {log.user.avatarUrl ? (
                    <img 
                      src={log.user.avatarUrl} 
                      alt={log.user.fio || 'User'} 
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <FiUser className="h-3 w-3" />
                    </div>
                  )}
                  <span>{log.user.fio || 'Пользователь'}</span>
                </div>

                {/* Metadata */}
                {log.metadata && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Подробности
                    </summary>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
