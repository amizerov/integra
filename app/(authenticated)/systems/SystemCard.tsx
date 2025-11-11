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
      outgoingConnections?: number
      incomingConnections?: number
    }
  }
}

export default function SystemCard({ system }: SystemCardProps) {
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
            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold text-primary">{system._count.versions}</div>
              <div className="text-xs text-muted-foreground">версий</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Входящие и исходящие связи */}
          {(system._count.outgoingConnections !== undefined || system._count.incomingConnections !== undefined) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-blue-500/10 rounded">
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {system._count.outgoingConnections || 0}
                </div>
                <div className="text-muted-foreground">Исходящие</div>
              </div>
              <div className="text-center p-2 bg-green-500/10 rounded">
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {system._count.incomingConnections || 0}
                </div>
                <div className="text-muted-foreground">Входящие</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
