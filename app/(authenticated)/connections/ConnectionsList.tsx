'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NetworkCanvas from '@/app/(authenticated)/connections/NetworkCanvas'
import GraphvizCanvas from '@/app/(authenticated)/connections/GraphvizCanvas'
import { FiMap, FiList, FiFilter, FiLayers, FiArrowUp, FiArrowDown, FiGitBranch } from 'react-icons/fi'
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
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [schemaType, setSchemaType] = useState<'manual' | 'graphviz'>('manual')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showGroupMenu, setShowGroupMenu] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
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
      {/* Toolbar with filters, grouping, sorting and view toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {viewMode === 'list' ? (
          <div className="flex items-center gap-2">
            {/* Filter button */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu)
                  setShowGroupMenu(false)
                  setShowSortMenu(false)
                }}
              >
                <FiFilter className="h-4 w-4 mr-2" />
                Фильтр
              </Button>
              {showFilterMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg z-20 bg-card border border-border">
                    <div className="p-3">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm">С общей базой данных</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm">Без общей базы данных</span>
                        </label>
                        <div className="border-t border-border pt-2 mt-2">
                          <div className="text-xs text-muted-foreground mb-2 px-2">По источнику:</div>
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded">
                            <input type="checkbox" className="w-4 h-4" />
                            <span className="text-sm">Абитуриент</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded">
                            <input type="checkbox" className="w-4 h-4" />
                            <span className="text-sm">УПлан</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Group button */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowGroupMenu(!showGroupMenu)
                  setShowFilterMenu(false)
                  setShowSortMenu(false)
                }}
              >
                <FiLayers className="h-4 w-4 mr-2" />
                Группировка
              </Button>
              
              {showGroupMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowGroupMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-20 bg-card border border-border">
                    <div className="py-1">
                      <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        Без группировки
                      </button>
                      <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        По источнику
                      </button>
                      <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        По получателю
                      </button>
                      <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        По дате создания
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sort button */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSortMenu(!showSortMenu)
                  setShowFilterMenu(false)
                  setShowGroupMenu(false)
                }}
              >
                <FiArrowUp className="h-4 w-4 mr-2" />
                Сортировка
              </Button>
              
              {showSortMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg z-20 bg-card border border-border">
                    <div className="py-1">
                      <button className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        <span>По ID</span>
                        <FiArrowUp className="h-4 w-4" />
                      </button>
                      <button className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        <span>По описанию</span>
                        <FiArrowUp className="h-4 w-4" />
                      </button>
                      <button className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        <span>По источнику</span>
                        <FiArrowUp className="h-4 w-4" />
                      </button>
                      <button className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        <span>По получателю</span>
                        <FiArrowUp className="h-4 w-4" />
                      </button>
                      <button className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent transition-colors text-left">
                        <span>По дате создания</span>
                        <FiArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
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
      )}
    </div>
  )
}