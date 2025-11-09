'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiFilter, FiSave, FiPlus, FiMinus, FiDownload } from 'react-icons/fi'
import { saveNetworkLayout, getMyNetworkLayouts, getPublicNetworkLayouts, getNetworkLayout } from '@/lib/actions/layouts'

interface NetworkNode {
  id: string
  label: string
  systemId: number
  versionId: number
  systemName: string | null
  systemShortName: string | null
  versionCode: string | null
  x: number
  y: number
  width: number
  height: number
}

interface NetworkEdge {
  id: string
  source: string
  target: string
  label?: string
  sourceHandle?: 'top' | 'right' | 'bottom' | 'left'
  targetHandle?: 'top' | 'right' | 'bottom' | 'left'
  offset?: number // Для раздвигания стрелок
}

interface ConnectionPoint {
  x: number
  y: number
  handle: 'top' | 'right' | 'bottom' | 'left'
}

interface NetworkCanvasProps {
  initialNodes: Array<{
    id: string
    label: string
    systemId: number
    versionId: number
    systemName: string | null
    systemShortName: string | null
    versionCode: string | null
  }>
  initialEdges: Array<{
    id: string
    source: string
    target: string
    label?: string
  }>
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 70

export default function NetworkCanvas({ initialNodes, initialEdges }: NetworkCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedSystemIds, setSelectedSystemIds] = useState<Set<number>>(new Set())
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [layoutName, setLayoutName] = useState('')
  const [layoutDescription, setLayoutDescription] = useState('')
  const [savedLayouts, setSavedLayouts] = useState<any[]>([])
  const [publicLayouts, setPublicLayouts] = useState<any[]>([])

  // Получаем список систем для фильтрации
  const systemsList = Array.from(
    initialNodes.reduce((map, node) => {
      if (!map.has(node.systemId)) {
        map.set(node.systemId, {
          id: node.systemId,
          name: node.systemName || `Система ${node.systemId}`,
          shortName: node.systemShortName || `Система ${node.systemId}`,
        })
      }
      return map
    }, new Map<number, { id: number; name: string; shortName: string }>())
  ).map(([, v]) => v).sort((a, b) => a.shortName.localeCompare(b.shortName))

  // Фильтрация узлов - используем useMemo для стабильной ссылки
  const filteredInitialNodes = useMemo(() => {
    return selectedSystemIds.size === 0 
      ? initialNodes 
      : initialNodes.filter(n => selectedSystemIds.has(n.systemId))
  }, [selectedSystemIds, initialNodes])

  // Фильтрация рёбер
  const filteredInitialEdges = useMemo(() => {
    const nodeIds = new Set(filteredInitialNodes.map(n => n.id))
    return initialEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [filteredInitialNodes, initialEdges])

  // Инициализация узлов с позициями
  useEffect(() => {
    const layoutKey = 'network-layout'
    const savedLayout = localStorage.getItem(layoutKey)
    
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        const positionMap = new Map<string, { x: number; y: number }>(
          parsed.map((n: any) => [n.id, { x: n.x, y: n.y }])
        )
        
        const layoutedNodes = filteredInitialNodes.map(node => {
          const saved = positionMap.get(node.id)
          return {
            ...node,
            x: saved?.x ?? 0,
            y: saved?.y ?? 0,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
          }
        })
        
        // Если есть новые узлы, которых не было в сохранённом layout
        const hasNewNodes = layoutedNodes.some(n => n.x === 0 && n.y === 0)
        if (hasNewNodes) {
          setNodes(calculateCircularLayout(filteredInitialNodes))
        } else {
          setNodes(layoutedNodes)
        }
      } catch {
        setNodes(calculateCircularLayout(filteredInitialNodes))
      }
    } else {
      setNodes(calculateCircularLayout(filteredInitialNodes))
    }
  }, [filteredInitialNodes])

  // Вычисляем edges с оптимальными connection points
  const edges = useMemo(() => {
    if (nodes.length === 0) return []
    
    const optimizedEdges = filteredInitialEdges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      
      if (!sourceNode || !targetNode) {
        return {
          ...edge,
          sourceHandle: 'right' as const,
          targetHandle: 'left' as const,
          offset: 0,
        }
      }
      
      const { sourceHandle, targetHandle } = findShortestConnection(sourceNode, targetNode)
      
      return {
        ...edge,
        sourceHandle,
        targetHandle,
        offset: 0,
      }
    })
    
    // Вычисляем offsets для раздвигания стрелок
    return calculateEdgeOffsets(optimizedEdges, nodes)
  }, [nodes, filteredInitialEdges])

  // Круговая раскладка
  function calculateCircularLayout(nodeList: typeof initialNodes): NetworkNode[] {
    const radius = 300
    const centerX = 500
    const centerY = 400
    
    return nodeList.map((node, index) => {
      const angle = (index / nodeList.length) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      
      return {
        ...node,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }
    })
  }

  // Получить координаты точки соединения
  function getConnectionPoint(node: NetworkNode, handle: 'top' | 'right' | 'bottom' | 'left'): ConnectionPoint {
    const { x, y, width, height } = node
    
    switch (handle) {
      case 'top':
        return { x: x + width / 2, y, handle }
      case 'right':
        return { x: x + width, y: y + height / 2, handle }
      case 'bottom':
        return { x: x + width / 2, y: y + height, handle }
      case 'left':
        return { x, y: y + height / 2, handle }
    }
  }

  // Найти кратчайшее соединение между узлами
  function findShortestConnection(
    sourceNode: NetworkNode,
    targetNode: NetworkNode
  ): { sourceHandle: 'top' | 'right' | 'bottom' | 'left'; targetHandle: 'top' | 'right' | 'bottom' | 'left' } {
    const handles: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left']
    
    let minDistance = Infinity
    let bestSource: 'top' | 'right' | 'bottom' | 'left' = 'right'
    let bestTarget: 'top' | 'right' | 'bottom' | 'left' = 'left'
    
    for (const sourceHandle of handles) {
      for (const targetHandle of handles) {
        const sourcePoint = getConnectionPoint(sourceNode, sourceHandle)
        const targetPoint = getConnectionPoint(targetNode, targetHandle)
        
        const distance = Math.sqrt(
          Math.pow(targetPoint.x - sourcePoint.x, 2) +
          Math.pow(targetPoint.y - sourcePoint.y, 2)
        )
        
        if (distance < minDistance) {
          minDistance = distance
          bestSource = sourceHandle
          bestTarget = targetHandle
        }
      }
    }
    
    return { sourceHandle: bestSource, targetHandle: bestTarget }
  }

  // Вычислить offsets для раздвигания стрелок
  function calculateEdgeOffsets(edgeList: NetworkEdge[], nodeList: NetworkNode[]): NetworkEdge[] {
    // Группируем рёбра по парам узлов
    const edgeGroups = new Map<string, NetworkEdge[]>()
    
    edgeList.forEach(edge => {
      const key = [edge.source, edge.target, edge.sourceHandle, edge.targetHandle].sort().join('-')
      if (!edgeGroups.has(key)) {
        edgeGroups.set(key, [])
      }
      edgeGroups.get(key)!.push(edge)
    })
    
    // Назначаем offsets для групп с несколькими рёбрами
    const result: NetworkEdge[] = []
    edgeGroups.forEach(group => {
      if (group.length === 1) {
        result.push({ ...group[0], offset: 0 })
      } else {
        // Раздвигаем стрелки
        group.forEach((edge, index) => {
          const totalOffsets = group.length
          const offset = ((index - (totalOffsets - 1) / 2) * 15) // 15px между стрелками
          result.push({ ...edge, offset })
        })
      }
    })
    
    return result
  }

  // Создать SVG path для Bezier curve
  function createBezierPath(
    sourceNode: NetworkNode,
    targetNode: NetworkNode,
    sourceHandle: 'top' | 'right' | 'bottom' | 'left',
    targetHandle: 'top' | 'right' | 'bottom' | 'left',
    offset: number = 0
  ): string {
    const sourcePoint = getConnectionPoint(sourceNode, sourceHandle)
    const targetPoint = getConnectionPoint(targetNode, targetHandle)
    
    // Применяем offset перпендикулярно линии
    const dx = targetPoint.x - sourcePoint.x
    const dy = targetPoint.y - sourcePoint.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const perpX = -dy / length * offset
    const perpY = dx / length * offset
    
    const sx = sourcePoint.x + perpX
    const sy = sourcePoint.y + perpY
    const tx = targetPoint.x + perpX
    const ty = targetPoint.y + perpY
    
    // Вычисляем control points для Bezier
    const controlOffset = 50
    let c1x = sx
    let c1y = sy
    let c2x = tx
    let c2y = ty
    
    switch (sourceHandle) {
      case 'top':
        c1y -= controlOffset
        break
      case 'right':
        c1x += controlOffset
        break
      case 'bottom':
        c1y += controlOffset
        break
      case 'left':
        c1x -= controlOffset
        break
    }
    
    switch (targetHandle) {
      case 'top':
        c2y -= controlOffset
        break
      case 'right':
        c2x += controlOffset
        break
      case 'bottom':
        c2y += controlOffset
        break
      case 'left':
        c2x -= controlOffset
        break
    }
    
    return `M ${sx},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`
  }

  // Обработчики мыши для drag
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return // Только левая кнопка
    
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const svgRect = svgRef.current?.getBoundingClientRect()
    if (!svgRect) return
    
    const mouseX = (e.clientX - svgRect.left - pan.x) / zoom
    const mouseY = (e.clientY - svgRect.top - pan.y) / zoom
    
    setDraggedNode(nodeId)
    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y,
    })
    
    e.stopPropagation()
  }, [nodes, zoom, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNode) {
      const svgRect = svgRef.current?.getBoundingClientRect()
      if (!svgRect) return
      
      const mouseX = (e.clientX - svgRect.left - pan.x) / zoom
      const mouseY = (e.clientY - svgRect.top - pan.y) / zoom
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode
          ? { ...node, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }
          : node
      ))
    } else if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))
      
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [draggedNode, dragOffset, zoom, pan, isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    if (draggedNode) {
      // Сохраняем layout в localStorage
      const layoutKey = 'network-layout'
      const layout = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
      localStorage.setItem(layoutKey, JSON.stringify(layout))
    }
    
    setDraggedNode(null)
    setIsPanning(false)
  }, [draggedNode, nodes])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)))
  }, [])

  // Pan canvas
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !draggedNode) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [draggedNode])

  // Сбросить layout
  const resetLayout = useCallback(() => {
    const newNodes = calculateCircularLayout(filteredInitialNodes)
    setNodes(newNodes)
    const layoutKey = 'network-layout'
    const layout = newNodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
    localStorage.setItem(layoutKey, JSON.stringify(layout))
  }, [filteredInitialNodes])

  // Фильтрация
  const toggleSystem = useCallback((systemId: number) => {
    setSelectedSystemIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(systemId)) {
        newSet.delete(systemId)
      } else {
        newSet.add(systemId)
      }
      return newSet
    })
  }, [])

  const selectAllSystems = useCallback(() => {
    setSelectedSystemIds(new Set(systemsList.map(s => s.id)))
  }, [systemsList])

  const deselectAllSystems = useCallback(() => {
    setSelectedSystemIds(new Set())
  }, [])

  // Сохранить схему в базу
  const handleSaveLayout = useCallback(async () => {
    if (!layoutName.trim()) {
      alert('Введите название схемы')
      return
    }

    const layoutData = {
      nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
      zoom,
      pan,
    }

    const result = await saveNetworkLayout(layoutName, layoutDescription || null, layoutData, false)
    
    if (result.success) {
      alert('Схема сохранена!')
      setShowSaveDialog(false)
      setLayoutName('')
      setLayoutDescription('')
    } else {
      alert(result.error || 'Ошибка сохранения')
    }
  }, [layoutName, layoutDescription, nodes, zoom, pan])

  // Загрузить список схем
  const handleOpenLoadDialog = useCallback(async () => {
    const [myLayouts, pubLayouts] = await Promise.all([
      getMyNetworkLayouts(),
      getPublicNetworkLayouts(),
    ])
    setSavedLayouts(myLayouts)
    setPublicLayouts(pubLayouts)
    setShowLoadDialog(true)
  }, [])

  // Применить сохранённую схему
  const handleLoadLayout = useCallback(async (layoutId: number) => {
    const layout = await getNetworkLayout(layoutId)
    
    if (!layout) {
      alert('Схема не найдена')
      return
    }

    const { nodes: savedNodes, zoom: savedZoom, pan: savedPan } = layout.layoutData

    // Обновляем позиции узлов
    setNodes(prev => prev.map(node => {
      const saved = savedNodes.find((n: any) => n.id === node.id)
      return saved ? { ...node, x: saved.x, y: saved.y } : node
    }))

    if (savedZoom) setZoom(savedZoom)
    if (savedPan) setPan(savedPan)

    setShowLoadDialog(false)
    alert('Схема загружена!')
  }, [])

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative'}`}>
      <Card className={`w-full overflow-hidden ${isFullscreen ? 'h-screen rounded-none' : 'h-[600px]'}`}>
        {/* Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="Фильтр систем"
            >
              <FiFilter className="h-4 w-4" />
            </Button>
            
            {showFilterMenu && (
              <>
                <div 
                  className="fixed inset-0"
                  onClick={() => setShowFilterMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md shadow-lg z-20 bg-card border border-border">
                  <div className="p-3 border-b border-border sticky top-0 bg-card z-10">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-sm">Выбор систем</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={selectAllSystems} className="h-6 text-xs px-2">
                          Все
                        </Button>
                        <Button size="sm" variant="ghost" onClick={deselectAllSystems} className="h-6 text-xs px-2">
                          Сбросить
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Выбрано: {selectedSystemIds.size === 0 ? 'все' : selectedSystemIds.size} из {systemsList.length}
                    </p>
                  </div>
                  <div className="p-2">
                    {systemsList.map(system => (
                      <label key={system.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSystemIds.size === 0 || selectedSystemIds.has(system.id)}
                          onChange={() => toggleSystem(system.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{system.shortName}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <Button size="sm" variant="outline" onClick={resetLayout} title="Сбросить расположение">
            <FiRefreshCw className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={() => setZoom(prev => Math.min(3, prev * 1.2))} title="Увеличить">
            <FiPlus className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={() => setZoom(prev => Math.max(0.1, prev * 0.8))} title="Уменьшить">
            <FiMinus className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Выйти" : "Полный экран"}>
            {isFullscreen ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
          </Button>
          
          <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(true)} title="Сохранить схему">
            <FiSave className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleOpenLoadDialog} title="Загрузить схему">
            <FiDownload className="h-4 w-4" />
          </Button>
        </div>

        {/* Info panel */}
        <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm p-3 rounded-md border border-border">
          <div className="text-xs space-y-1">
            {selectedSystemIds.size > 0 && (
              <div className="text-muted-foreground">Систем выбрано: {selectedSystemIds.size}</div>
            )}
            <div className="text-muted-foreground">Узлов: {nodes.length}</div>
            <div className="text-muted-foreground">Связей: {edges.length}</div>
            <div className="text-muted-foreground">Масштаб: {(zoom * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move bg-gray-50"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
        >
          <defs>
            {/* Shadow filter for nodes */}
            <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" opacity="0.7" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Рисуем edges */}
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source)
              const targetNode = nodes.find(n => n.id === edge.target)
              
              if (!sourceNode || !targetNode || !edge.sourceHandle || !edge.targetHandle) return null
              
              const path = createBezierPath(
                sourceNode,
                targetNode,
                edge.sourceHandle,
                edge.targetHandle,
                edge.offset || 0
              )
              
              return (
                <g key={edge.id}>
                  <path
                    d={path}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.5"
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.label && (
                    <>
                      {/* Background for label */}
                      <rect
                        x={(sourceNode.x + targetNode.x) / 2 - 40}
                        y={(sourceNode.y + targetNode.y) / 2 - 10}
                        width="80"
                        height="16"
                        fill="white"
                        opacity="0.9"
                        rx="3"
                      />
                      <text
                        x={(sourceNode.x + targetNode.x) / 2}
                        y={(sourceNode.y + targetNode.y) / 2}
                        fontSize="10"
                        fill="#1f2937"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        {edge.label}
                      </text>
                    </>
                  )}
                </g>
              )
            })}

            {/* Рисуем nodes */}
            {nodes.map(node => (
              <g
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                className="cursor-move"
              >
                {/* Node rectangle */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="8"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  filter="url(#nodeShadow)"
                />
                
                {/* Connection handles */}
                {(['top', 'right', 'bottom', 'left'] as const).map(handle => {
                  const point = getConnectionPoint(node, handle)
                  return (
                    <circle
                      key={handle}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="1"
                    />
                  )
                })}
                
                {/* Background for text to prevent overlap */}
                <rect
                  x={node.x + 5}
                  y={node.y + node.height / 2 - 25}
                  width={node.width - 10}
                  height={40}
                  fill="white"
                  opacity="0.95"
                  rx="4"
                />
                
                {/* Node text */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 - 8}
                  fontSize="12"
                  fontWeight="600"
                  fill="#1f2937"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {node.systemShortName || `Система ${node.systemId}`}
                </text>
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 + 8}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {node.versionCode || `v${node.versionId}`}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Save Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Сохранить схему</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="layout-name">Название</Label>
                <Input
                  id="layout-name"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="Моя схема"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="layout-description">Описание (опционально)</Label>
                <Input
                  id="layout-description"
                  value={layoutDescription}
                  onChange={(e) => setLayoutDescription(e.target.value)}
                  placeholder="Краткое описание схемы"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveLayout}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Load Dialog */}
        <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Загрузить схему</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(85vh-180px)] pr-2">
              {savedLayouts.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Мои схемы</h4>
                  <div className="space-y-2">
                    {savedLayouts.map((layout) => (
                      <div
                        key={layout.id}
                        className="p-3 border border-border rounded hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleLoadLayout(layout.id)}
                      >
                        <div className="font-medium">{layout.name}</div>
                        {layout.description && (
                          <div className="text-sm text-muted-foreground">{layout.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(layout.updatedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {publicLayouts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Публичные схемы</h4>
                  <div className="space-y-2">
                    {publicLayouts.map((layout) => (
                      <div
                        key={layout.id}
                        className="p-3 border border-border rounded hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleLoadLayout(layout.id)}
                      >
                        <div className="font-medium">{layout.name}</div>
                        {layout.description && (
                          <div className="text-sm text-muted-foreground">{layout.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Автор: {layout.user.fio} • {new Date(layout.updatedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedLayouts.length === 0 && publicLayouts.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  Сохранённых схем пока нет
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}
