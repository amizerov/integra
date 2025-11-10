'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NetworkCanvas from '@/components/NetworkCanvas'
import { FiMap, FiList } from 'react-icons/fi'
import { formatDate } from '@/lib/utils'

interface ConnectionsListProps {
  networkData: {
    nodes: Array<{
      id: string
      label: string
      systemId: number
      versionId: number
      systemName: string | null
      systemShortName: string | null
      versionCode: string | null
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      label?: string
    }>
  }
  connectionsData: Array<{
    id: string
    streamId: number
    description: string
    source: {
      systemName: string
      versionCode: string
      versionId: number | null
    }
    recipient: {
      systemName: string
      versionCode: string
      versionId: number | null
    } | null
    shareDatabase: boolean
    createdAt: Date | null
  }>
}

export default function ConnectionsList({ networkData, connectionsData }: ConnectionsListProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('connectionsViewMode') as 'map' | 'list' | null
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  // Save view mode to localStorage when it changes
  const handleViewModeChange = (mode: 'map' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('connectionsViewMode', mode)
  }

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Связи между системами</h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === 'map' 
              ? 'Интерактивная схема потоков данных между версиями систем' 
              : 'Табличное представление потоков данных между версиями систем'
            }
          </p>
        </div>
        
        {/* View mode toggle */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewModeChange('map')}
            title="Карта"
            className={`rounded-none border-r border-border ${
              viewMode === 'map' ? 'bg-secondary hover:bg-secondary' : ''
            }`}
          >
            <FiMap className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewModeChange('list')}
            title="Таблица"
            className={`rounded-none ${
              viewMode === 'list' ? 'bg-secondary hover:bg-secondary' : ''
            }`}
          >
            <FiList className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <Card>
          <CardContent>
            <NetworkCanvas 
              initialNodes={networkData.nodes} 
              initialEdges={networkData.edges} 
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Описание потока</th>
                    <th className="text-left p-3 font-medium">Источник</th>
                    <th className="text-left p-3 font-medium">Получатель</th>
                    <th className="text-left p-3 font-medium">Формат/Протокол</th>
                    <th className="text-center p-3 font-medium">Общая база</th>
                    <th className="text-left p-3 font-medium">Дата создания</th>
                  </tr>
                </thead>
                <tbody>
                  {connectionsData.map((connection) => (
                    <tr key={connection.id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="p-3">
                        <div className="font-mono text-sm">{connection.streamId}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{connection.description}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-sm">
                          {connection.source.systemName} ({connection.source.versionId || 'N/A'})
                        </div>
                      </td>
                      <td className="p-3">
                        {connection.recipient ? (
                          <div>
                            <div className="font-medium text-sm">
                              {connection.recipient.systemName} ({connection.recipient.versionId || 'N/A'})
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Не указан
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-muted-foreground">—</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className={`inline-block w-6 h-6 rounded ${
                          connection.shareDatabase 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {connection.shareDatabase ? '✓' : '✗'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {connection.createdAt ? formatDate(connection.createdAt) : 'Не указана'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {connectionsData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Потоки данных не найдены
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}