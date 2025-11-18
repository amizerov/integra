'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiEdit2 } from 'react-icons/fi'

interface ConnectionsProps {
  version: any
  systemId: number
}

export default function Connections({ version, systemId }: ConnectionsProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Потоки данных</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <FiEdit2 className="h-4 w-4 mr-2" />
            {isEditing ? 'Отменить' : 'Редактировать'}
          </Button>
        </div>
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
  )
}
