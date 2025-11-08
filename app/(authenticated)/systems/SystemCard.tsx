'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface SystemCardProps {
  system: {
    id: number
    systemId: number
    systemName: string
    systemShortName: string
    hasPersonalData: number
    createdBy?: string
    createdAt?: Date | null
    modifiedBy?: string
    modifiedAt?: Date | null
    _count: {
      versions: number
      documents: number
      connections: number
    }
  }
}

export default function SystemCard({ system }: SystemCardProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Не указано'
    return new Date(date).toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  return (
    <Link href={`/systems/${system.id}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight line-clamp-2">
                {system.systemName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>ID: {system.systemId}</span>
                {system.hasPersonalData === 1 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-xs" title="Содержит персональные данные">
                    ⚠ ПД
                  </span>
                )}
                {system.systemShortName && (
                  <>
                    <span>•</span>
                    <span className="truncate">Код: {system.systemShortName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-lg">{system._count.versions}</div>
              <div className="text-muted-foreground">Версий</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{system._count.documents}</div>
              <div className="text-muted-foreground">Документов</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{system._count.connections}</div>
              <div className="text-muted-foreground">Связей</div>
            </div>
          </div>
          
          {(system.createdBy || system.modifiedBy) && (
            <div className="pt-2 border-t text-xs">
              <div className="flex justify-between items-center gap-2">
                {system.createdBy && (
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground">Создана: </span>
                    <span className="truncate" title={`${system.createdBy}, ${formatDate(system.createdAt)}`}>
                      {system.createdBy.split(' ')[0]}, {formatDate(system.createdAt)}
                    </span>
                  </div>
                )}
                {system.modifiedBy && (
                  <div className="flex-1 min-w-0 text-right">
                    <span className="text-muted-foreground">Изменена: </span>
                    <span className="truncate" title={`${system.modifiedBy}, ${formatDate(system.modifiedAt)}`}>
                      {system.modifiedBy.split(' ')[0]}, {formatDate(system.modifiedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
