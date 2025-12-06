'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import NetworkCanvas from '@/app/(authenticated)/connections/NetworkCanvas'
import GraphvizCanvas from '@/app/(authenticated)/connections/GraphvizCanvas'
import { FiMap, FiList, FiArrowUp, FiArrowDown, FiGitBranch, FiSearch } from 'react-icons/fi'
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
  initialFilterSystemId?: number
}

export default function ConnectionsList({ networkData, connectionsData, initialFilterSystemId }: ConnectionsListProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [schemaType, setSchemaType] = useState<'manual' | 'graphviz'>('manual')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<'streamId' | 'description' | 'source' | 'recipient' | 'createdAt'>('streamId')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isLoadingView, setIsLoadingView] = useState(true)
  const toolbarPortalRef = useRef<HTMLDivElement>(null)

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('connectionsViewMode') as 'map' | 'list' | null
    const savedSchemaType = localStorage.getItem('connectionsSchemaType') as 'manual' | 'graphviz' | null
    
    // Если есть фильтр по системе, автоматически переключаемся на схему Graphviz
    if (initialFilterSystemId) {
      setViewMode('map')
      setSchemaType('graphviz')
      localStorage.setItem('connectionsViewMode', 'map')
      localStorage.setItem('connectionsSchemaType', 'graphviz')
    } else if (savedViewMode) {
      setViewMode(savedViewMode)
    }
    
    if (savedSchemaType && !initialFilterSystemId) {
      setSchemaType(savedSchemaType)
    }
    // Задержка для плавной загрузки
    const timer = setTimeout(() => {
      setIsLoadingView(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [initialFilterSystemId])

  // Фильтрация и сортировка данных
  const filteredAndSortedData = useMemo(() => {
    let result = [...connectionsData]

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(connection => 
        connection.streamId.toString().includes(query) ||
        connection.description?.toLowerCase().includes(query) ||
        connection.source.systemName?.toLowerCase().includes(query) ||
        connection.source.versionCode?.toLowerCase().includes(query) ||
        connection.recipient?.systemName?.toLowerCase().includes(query) ||
        connection.recipient?.versionCode?.toLowerCase().includes(query)
      )
    }

    // Сортировка
    result.sort((a, b) => {
      let comparison = 0
      switch (sortColumn) {
        case 'streamId':
          comparison = a.streamId - b.streamId
          break
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '')
          break
        case 'source':
          comparison = (a.source.systemName || '').localeCompare(b.source.systemName || '')
          break
        case 'recipient':
          comparison = (a.recipient?.systemName || '').localeCompare(b.recipient?.systemName || '')
          break
        case 'createdAt':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          comparison = dateA - dateB
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [connectionsData, searchQuery, sortColumn, sortDirection])

  // Переключение сортировки
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Иконка сортировки
  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) {
      return <FiArrowUp className="h-3 w-3 opacity-30" />
    }
    return sortDirection === 'asc' 
      ? <FiArrowUp className="h-3 w-3" /> 
      : <FiArrowDown className="h-3 w-3" />
  }

  // Save view mode to localStorage when it changes
  const handleViewModeChange = (mode: 'map' | 'list') => {
    setIsLoadingView(true)
    setViewMode(mode)
    localStorage.setItem('connectionsViewMode', mode)
    // Небольшая задержка для плавного перехода
    setTimeout(() => {
      setIsLoadingView(false)
    }, 100)
  }

  // Фильтрация данных по системе
  const filteredNetworkData = initialFilterSystemId ? (() => {
    console.log('Filtering for systemId:', initialFilterSystemId)
    
    // Находим все версии выбранной системы
    const selectedSystemVersionIds = networkData.nodes
      .filter(node => node.systemId === initialFilterSystemId)
      .map(node => node.id)
    
    console.log('Selected system version IDs:', selectedSystemVersionIds)
    
    // Находим связанные узлы (напрямую связанные с выбранной системой)
    const connectedNodeIds = new Set<string>()
    selectedSystemVersionIds.forEach(id => connectedNodeIds.add(id))
    
    networkData.edges.forEach(edge => {
      if (selectedSystemVersionIds.includes(edge.source)) {
        connectedNodeIds.add(edge.target)
      }
      if (selectedSystemVersionIds.includes(edge.target)) {
        connectedNodeIds.add(edge.source)
      }
    })
    
    console.log('Connected node IDs:', Array.from(connectedNodeIds))
    
    // Фильтруем узлы и рёбра
    const filteredNodes = networkData.nodes.filter(node => 
      connectedNodeIds.has(node.id)
    )
    
    const filteredEdges = networkData.edges.filter(edge =>
      connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target)
    )
    
    console.log('Filtered nodes count:', filteredNodes.length, 'of', networkData.nodes.length)
    console.log('Filtered edges count:', filteredEdges.length, 'of', networkData.edges.length)
    
    return { nodes: filteredNodes, edges: filteredEdges }
  })() : networkData

  return (
    <div className="space-y-4">
      {/* Toolbar with search and view toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {viewMode === 'list' ? (
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск по названию системы, описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-80"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div ref={toolbarPortalRef} id="schema-toolbar-placeholder" />
            
            {/* Schema type toggle */}
            <div className="flex border border-border rounded-md overflow-hidden ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSchemaType('manual')
                  localStorage.setItem('connectionsSchemaType', 'manual')
                }}
                title="Ручная схема"
                className={`rounded-none border-r border-border px-2 ${
                  schemaType === 'manual' ? 'bg-secondary hover:bg-secondary' : ''
                }`}
              >
                <FiMap className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSchemaType('graphviz')
                  localStorage.setItem('connectionsSchemaType', 'graphviz')
                }}
                title="Graphviz"
                className={`rounded-none px-2 ${
                  schemaType === 'graphviz' ? 'bg-secondary hover:bg-secondary' : ''
                }`}
              >
                <FiGitBranch className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* View mode toggle */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewModeChange('map')}
            title="Схема"
            className={`rounded-none border-r border-border px-3 ${
              viewMode === 'map' ? 'bg-secondary hover:bg-secondary' : ''
            }`}
          >
            <FiMap className="h-4 w-4 mr-2" />
            <span className="text-sm">Схема</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewModeChange('list')}
            title="Список"
            className={`rounded-none px-3 ${
              viewMode === 'list' ? 'bg-secondary hover:bg-secondary' : ''
            }`}
          >
            <FiList className="h-4 w-4 mr-2" />
            <span className="text-sm">Список</span>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoadingView ? (
        <Card>
          <CardContent className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground text-sm">Загрузка...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in">
          {/* Content */}
          {viewMode === 'map' ? (
            schemaType === 'manual' ? (
              <NetworkCanvas 
                initialNodes={filteredNetworkData.nodes} 
                initialEdges={filteredNetworkData.edges}
                renderToolbar={(controls) => {
                  if (!toolbarPortalRef.current) return null
                  return createPortal(
                    <div className="flex items-center gap-2">
                      {controls.filterButton}
                      {controls.resetButton}
                      {controls.zoomInButton}
                      {controls.zoomOutButton}
                      {controls.fullscreenButton}
                      {controls.saveButton}
                      {controls.loadButton}
                    </div>,
                    toolbarPortalRef.current
                  )
                }}
              />
            ) : (
              <GraphvizCanvas 
                initialNodes={filteredNetworkData.nodes} 
                initialEdges={filteredNetworkData.edges}
                initialLayout={initialFilterSystemId ? 'circo' : undefined}
                initialShowLabels={initialFilterSystemId ? false : true}
                renderToolbar={(controls) => {
                  if (!toolbarPortalRef.current) return null
                  return createPortal(
                    <div className="flex items-center gap-2">
                      {controls.layoutButton}
                      {controls.resetButton}
                      {controls.labelsButton}
                      {controls.fullscreenButton}
                      {controls.downloadButton}
                    </div>,
                    toolbarPortalRef.current
                  )
                }}
              />
            )
          ) : (
            <Card>
              <CardContent>
                <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('streamId')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        ID
                        <SortIcon column="streamId" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('description')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        Описание потока
                        <SortIcon column="description" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('source')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        Источник
                        <SortIcon column="source" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('recipient')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        Получатель
                        <SortIcon column="recipient" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Формат/Протокол</th>
                    <th className="text-center p-3 font-medium">Общая база</th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        Дата создания
                        <SortIcon column="createdAt" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((connection) => (
                    <tr 
                      key={connection.id} 
                      onClick={() => router.push(`/connections/${connection.streamId}`)}
                      className="border-b border-border hover:bg-accent transition-colors cursor-pointer"
                    >
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
              
              {filteredAndSortedData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'Ничего не найдено' : 'Потоки данных не найдены'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          )}
        </div>
      )}
    </div>
  )
}