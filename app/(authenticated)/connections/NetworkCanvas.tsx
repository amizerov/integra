'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiFilter, FiSave, FiPlus, FiMinus, FiDownload, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { saveNetworkLayout, getMyNetworkLayouts, getPublicNetworkLayouts, getNetworkLayout, deleteNetworkLayout, updateNetworkLayout } from '@/app/(authenticated)/connections/actions'
import { calculateOptimalLayout, calculateCircularLayout as circularLayout } from '@/app/(authenticated)/connections/actions/graph-layout'

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
  renderToolbar?: (controls: {
    filterButton: React.ReactNode
    resetButton: React.ReactNode
    zoomInButton: React.ReactNode
    zoomOutButton: React.ReactNode
    fullscreenButton: React.ReactNode
    saveButton: React.ReactNode
    loadButton: React.ReactNode
  }) => React.ReactNode
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 70

export default function NetworkCanvas({ initialNodes, initialEdges, renderToolbar }: NetworkCanvasProps) {
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
  const [editingLayout, setEditingLayout] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

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

  // Инициализация - загрузка сохранённых настроек один раз при монтировании
  useEffect(() => {
    const viewStateKey = 'network-view-state'
    const filterKey = 'network-filter-systems'
    const savedViewState = localStorage.getItem(viewStateKey)
    const savedFilter = localStorage.getItem(filterKey)
    
    console.log('Loading saved state on mount...')
    
    // Восстановление фильтра систем
    if (savedFilter) {
      try {
        const filterArray = JSON.parse(savedFilter)
        if (Array.isArray(filterArray) && filterArray.length > 0) {
          setSelectedSystemIds(new Set(filterArray))
          console.log('Restored filter:', filterArray)
        }
      } catch {
        // Игнорируем ошибки парсинга
      }
    }
    
    // Восстановление zoom и pan
    if (savedViewState) {
      try {
        const viewState = JSON.parse(savedViewState)
        if (viewState.zoom) setZoom(viewState.zoom)
        if (viewState.pan) setPan(viewState.pan)
        console.log('Restored view state:', viewState)
      } catch {
        // Игнорируем ошибки парсинга
      }
    }
  }, []) // Только при монтировании!

  // Инициализация узлов с позициями
  useEffect(() => {
    const layoutKey = 'network-layout'
    const savedLayout = localStorage.getItem(layoutKey)
    
    console.log('Initializing nodes, saved layout exists:', !!savedLayout)
    
    // Восстановление позиций узлов
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        console.log('Loaded layout with', parsed.length, 'nodes')
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
          console.log('Has new nodes, calculating layout for them')
          // Только новые узлы размещаем по кругу, старые оставляем на месте
          const existingNodes = layoutedNodes.filter(n => n.x !== 0 || n.y !== 0)
          const newNodesList = filteredInitialNodes.filter(n => {
            const saved = positionMap.get(n.id)
            return !saved
          })
          const newNodesLayout = calculateCircularLayout(newNodesList)
          setNodes([...existingNodes, ...newNodesLayout])
        } else {
          console.log('All nodes have saved positions')
          setNodes(layoutedNodes)
        }
      } catch (e) {
        console.error('Error loading layout:', e)
        setNodes(calculateCircularLayout(filteredInitialNodes))
      }
    } else {
      console.log('No saved layout, using circular layout')
      setNodes(calculateCircularLayout(filteredInitialNodes))
    }
  }, [filteredInitialNodes])

  // Автоматическое сохранение при размонтировании компонента (уход со страницы)
  useEffect(() => {
    return () => {
      // Cleanup - сохраняем текущее состояние перед уходом
      if (nodes.length > 0) {
        const layoutKey = 'network-layout'
        const layoutData = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
        localStorage.setItem(layoutKey, JSON.stringify(layoutData))
        
        const viewStateKey = 'network-view-state'
        localStorage.setItem(viewStateKey, JSON.stringify({ zoom, pan }))
        
        console.log('Auto-saved on unmount:', layoutData.length, 'nodes')
      }
    }
  }, [nodes, zoom, pan])

  // Автоматическое сохранение при изменении nodes, zoom или pan (debounced)
  useEffect(() => {
    if (nodes.length === 0) return

    const saveTimeout = setTimeout(() => {
      const layoutKey = 'network-layout'
      const layoutData = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
      localStorage.setItem(layoutKey, JSON.stringify(layoutData))
      
      const viewStateKey = 'network-view-state'
      localStorage.setItem(viewStateKey, JSON.stringify({ zoom, pan }))
      
      console.log('Auto-saved (debounced):', layoutData.length, 'nodes, zoom:', zoom)
    }, 1000) // Сохраняем через 1 секунду после последнего изменения

    return () => clearTimeout(saveTimeout)
  }, [nodes, zoom, pan])

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
    // Используем функцию из lib/graph-layout.ts
    const containerWidth = svgRef.current?.clientWidth || 1200
    const containerHeight = svgRef.current?.clientHeight || 800
    
    return circularLayout(nodeList, containerWidth, containerHeight) as NetworkNode[]
  }
  
  // Оптимальная раскладка с минимизацией пересечений
  function calculateOptimalLayoutNodes(nodeList: typeof initialNodes): NetworkNode[] {
    const containerWidth = svgRef.current?.clientWidth || 1200
    const containerHeight = svgRef.current?.clientHeight || 800
    
    const edgesForLayout = filteredInitialEdges.map(e => ({
      source: e.source,
      target: e.target,
    }))
    
    return calculateOptimalLayout(nodeList, edgesForLayout, {
      width: containerWidth,
      height: containerHeight,
      iterations: 1000,
      temperature: 500,
      repulsionStrength: 100000,
      attractionStrength: 0.0005,
      centerGravity: 0.005,
    }) as NetworkNode[]
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
      
      const newPan = {
        x: pan.x + dx,
        y: pan.y + dy,
      }
      
      setPan(newPan)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [draggedNode, dragOffset, zoom, pan, isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null)
    setIsPanning(false)
    // Сохранение происходит автоматически через useEffect
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta))
    setZoom(newZoom)
    // Сохранение происходит автоматически через useEffect
  }, [zoom])

  // Pan canvas
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !draggedNode) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      // Сбрасываем выделение ребра при клике на пустое место
      setSelectedEdgeId(null)
    }
  }, [draggedNode])

  // Сбросить layout
  const resetLayout = useCallback(() => {
    const newNodes = calculateOptimalLayoutNodes(filteredInitialNodes)
    setNodes(newNodes)
    // Сохранение происходит автоматически через useEffect
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
      // Сохраняем выбранные системы
      const filterKey = 'network-filter-systems'
      localStorage.setItem(filterKey, JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }, [])

  const selectAllSystems = useCallback(() => {
    const newSet = new Set(systemsList.map(s => s.id))
    setSelectedSystemIds(newSet)
    // Сохраняем
    const filterKey = 'network-filter-systems'
    localStorage.setItem(filterKey, JSON.stringify(Array.from(newSet)))
  }, [systemsList])

  const deselectAllSystems = useCallback(() => {
    setSelectedSystemIds(new Set())
    // Сохраняем
    const filterKey = 'network-filter-systems'
    localStorage.setItem(filterKey, JSON.stringify([]))
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
    const updatedNodes = nodes.map(node => {
      const saved = savedNodes.find((n: any) => n.id === node.id)
      return saved ? { ...node, x: saved.x, y: saved.y } : node
    })
    setNodes(updatedNodes)

    const newZoom = savedZoom || zoom
    const newPan = savedPan || pan
    
    if (savedZoom) setZoom(newZoom)
    if (savedPan) setPan(newPan)

    // Сохраняем загруженную схему в localStorage
    const layoutKey = 'network-layout'
    const layoutData = updatedNodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
    localStorage.setItem(layoutKey, JSON.stringify(layoutData))
    
    const viewStateKey = 'network-view-state'
    localStorage.setItem(viewStateKey, JSON.stringify({ zoom: newZoom, pan: newPan }))
    
    console.log('Layout loaded from DB and saved to localStorage:', layoutData.length, 'nodes')

    setShowLoadDialog(false)
    alert('Схема загружена!')
  }, [nodes, zoom, pan])

  // Открыть диалог редактирования схемы
  const handleEditLayout = useCallback((layout: any) => {
    setEditingLayout(layout)
    setEditName(layout.name)
    setEditDescription(layout.description || '')
    setEditIsPublic(layout.isPublic || false)
    setShowEditDialog(true)
    setShowLoadDialog(false)
  }, [])

  // Сохранить изменения схемы
  const handleUpdateLayout = useCallback(async () => {
    if (!editingLayout || !editName.trim()) {
      alert('Введите название схемы')
      return
    }

    const layout = await getNetworkLayout(editingLayout.id)
    if (!layout) {
      alert('Схема не найдена')
      return
    }

    const result = await updateNetworkLayout(
      editingLayout.id,
      editName,
      editDescription || null,
      layout.layoutData,
      editIsPublic
    )

    if (result.success) {
      alert('Схема обновлена!')
      setShowEditDialog(false)
      setEditingLayout(null)
      // Обновляем список
      const [myLayouts, pubLayouts] = await Promise.all([
        getMyNetworkLayouts(),
        getPublicNetworkLayouts(),
      ])
      setSavedLayouts(myLayouts)
      setPublicLayouts(pubLayouts)
      setShowLoadDialog(true)
    } else {
      alert(result.error || 'Ошибка обновления')
    }
  }, [editingLayout, editName, editDescription, editIsPublic])

  // Удалить схему
  const handleDeleteLayout = useCallback(async (layoutId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту схему?')) {
      return
    }

    const result = await deleteNetworkLayout(layoutId)

    if (result.success) {
      alert('Схема удалена!')
      // Обновляем список
      const [myLayouts, pubLayouts] = await Promise.all([
        getMyNetworkLayouts(),
        getPublicNetworkLayouts(),
      ])
      setSavedLayouts(myLayouts)
      setPublicLayouts(pubLayouts)
    } else {
      alert(result.error || 'Ошибка удаления')
    }
  }, [])

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative h-[calc(100vh-11rem)]'}`}>
      <Card className={`w-full h-full overflow-hidden ${isFullscreen ? 'rounded-none' : ''}`}>
        {/* Toolbar будет рендериться через renderToolbar prop */}
        {renderToolbar && renderToolbar({
          filterButton: (
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
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md shadow-lg z-20 bg-card border border-border">
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
          ),
          resetButton: (
            <Button size="sm" variant="outline" onClick={resetLayout} title="Сбросить расположение">
              <FiRefreshCw className="h-4 w-4" />
            </Button>
          ),
          zoomInButton: (
            <Button size="sm" variant="outline" onClick={() => {
              setZoom(prev => Math.min(3, prev * 1.2))
              // Сохранение происходит автоматически через useEffect
            }} title="Увеличить">
              <FiPlus className="h-4 w-4" />
            </Button>
          ),
          zoomOutButton: (
            <Button size="sm" variant="outline" onClick={() => {
              setZoom(prev => Math.max(0.1, prev * 0.8))
              // Сохранение происходит автоматически через useEffect
            }} title="Уменьшить">
              <FiMinus className="h-4 w-4" />
            </Button>
          ),
          fullscreenButton: (
            <Button size="sm" variant="outline" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Выйти" : "Полный экран"}>
              {isFullscreen ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
            </Button>
          ),
          saveButton: (
            <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(true)} title="Сохранить схему">
              <FiSave className="h-4 w-4" />
            </Button>
          ),
          loadButton: (
            <Button size="sm" variant="outline" onClick={handleOpenLoadDialog} title="Загрузить схему">
              <FiDownload className="h-4 w-4" />
            </Button>
          ),
        })}

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
              <path d="M0,0 L0,6 L9,3 z" fill="var(--color-primary)" opacity="0.7" />
            </marker>
            
            <marker
              id="arrowhead-selected"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="var(--color-primary)" opacity="1" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Рисуем edges - сначала невыбранные, потом выбранные */}
            {edges
              .sort((a, b) => {
                // Выбранные рёбра рисуем последними (поверх остальных)
                if (a.id === selectedEdgeId) return 1
                if (b.id === selectedEdgeId) return -1
                return 0
              })
              .map(edge => {
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
              
              const isSelected = edge.id === selectedEdgeId
              
              return (
                <g key={edge.id}>
                  {/* Невидимая широкая область для клика */}
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth="20"
                    fill="none"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEdgeId(isSelected ? null : edge.id)
                    }}
                  />
                  
                  {/* Видимая линия */}
                  <path
                    d={path}
                    stroke="var(--color-primary)"
                    strokeWidth={isSelected ? "3" : "2"}
                    fill="none"
                    opacity={isSelected ? "1" : "0.5"}
                    markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                    style={{ pointerEvents: 'none' }}
                  />
                  
                  {/* Label - показываем только для невыбранных рёбер или без label */}
                  {edge.label && !isSelected && (() => {
                    // Вычисляем центр линии с учётом offset
                    const dx = targetNode.x - sourceNode.x
                    const dy = targetNode.y - sourceNode.y
                    const length = Math.sqrt(dx * dx + dy * dy)
                    const perpX = -dy / length * (edge.offset || 0)
                    const perpY = dx / length * (edge.offset || 0)
                    
                    const centerX = (sourceNode.x + targetNode.x) / 2 + perpX
                    const centerY = (sourceNode.y + targetNode.y) / 2 + perpY
                    
                    const labelWidth = 80
                    const labelHeight = 16
                    
                    return (
                      <>
                        {/* Background for label */}
                        <rect
                          x={centerX - labelWidth / 2}
                          y={centerY - labelHeight / 2}
                          width={labelWidth}
                          height={labelHeight}
                          fill="var(--color-card)"
                          opacity="0.95"
                          rx="3"
                          stroke="var(--color-border)"
                          strokeWidth="1"
                        />
                        <text
                          x={centerX}
                          y={centerY + 4}
                          fontSize="10"
                          fill="var(--color-foreground)"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {edge.label}
                        </text>
                      </>
                    )
                  })()}
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
                  fill="var(--color-card)"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  filter="url(#nodeShadow)"
                />
                
                {/* Background for text to prevent overlap */}
                <rect
                  x={node.x + 5}
                  y={node.y + node.height / 2 - 25}
                  width={node.width - 10}
                  height={40}
                  fill="var(--color-card)"
                  opacity="0.95"
                  rx="4"
                />
                
                {/* Node text */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2}
                  fontSize="16"
                  fontWeight="600"
                  fill="var(--color-foreground)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                >
                  {node.systemShortName || node.systemName || `Система ${node.systemId}`}
                </text>
              </g>
            ))}
            
            {/* Выбранное ребро - рисуем поверх всего с ярким label */}
            {selectedEdgeId && (() => {
              const edge = edges.find(e => e.id === selectedEdgeId)
              if (!edge || !edge.label) return null
              
              const sourceNode = nodes.find(n => n.id === edge.source)
              const targetNode = nodes.find(n => n.id === edge.target)
              
              if (!sourceNode || !targetNode) return null
              
              // Вычисляем центр линии с учётом offset
              const dx = targetNode.x - sourceNode.x
              const dy = targetNode.y - sourceNode.y
              const length = Math.sqrt(dx * dx + dy * dy)
              const perpX = -dy / length * (edge.offset || 0)
              const perpY = dx / length * (edge.offset || 0)
              
              const centerX = (sourceNode.x + targetNode.x) / 2 + perpX
              const centerY = (sourceNode.y + targetNode.y) / 2 + perpY
              
              // Вычисляем ширину текста (примерная)
              const labelWidth = Math.max(120, edge.label.length * 8)
              const labelHeight = 30
              
              return (
                <g style={{ pointerEvents: 'none' }}>
                  {/* Яркий фон */}
                  <rect
                    x={centerX - labelWidth / 2}
                    y={centerY - labelHeight / 2}
                    width={labelWidth}
                    height={labelHeight}
                    fill="var(--color-primary)"
                    opacity="1"
                    rx="6"
                    filter="url(#nodeShadow)"
                  />
                  {/* Яркий текст */}
                  <text
                    x={centerX}
                    y={centerY + 1}
                    fontSize="14"
                    fontWeight="600"
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {edge.label}
                  </text>
                </g>
              )
            })()}
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
          <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Управление схемами</DialogTitle>
              <DialogDescription>
                Загрузка, редактирование и удаление сохранённых схем
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(85vh-180px)] pr-2">
              {savedLayouts.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Мои схемы</h4>
                  <div className="space-y-2">
                    {savedLayouts.map((layout) => (
                      <div
                        key={layout.id}
                        className="p-3 border border-border rounded hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoadLayout(layout.id)}>
                            <div className="font-medium truncate">{layout.name}</div>
                            {layout.description && (
                              <div className="text-sm text-muted-foreground truncate">{layout.description}</div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <div>Создана: {new Date(layout.createdAt).toLocaleString('ru-RU')}</div>
                              <div>Изменена: {new Date(layout.updatedAt).toLocaleString('ru-RU')}</div>
                              {layout.isPublic && (
                                <div className="text-primary font-medium">Публичная схема</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditLayout(layout)
                              }}
                              title="Редактировать"
                              className="h-8 w-8 p-0"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLayout(layout.id)
                              }}
                              title="Удалить"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <div>Автор: {layout.user.fio}</div>
                          <div>Создана: {new Date(layout.createdAt).toLocaleString('ru-RU')}</div>
                          <div>Изменена: {new Date(layout.updatedAt).toLocaleString('ru-RU')}</div>
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

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Редактировать схему</DialogTitle>
              <DialogDescription>
                Изменение названия и параметров схемы
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Название *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Название схемы"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Описание</Label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Краткое описание схемы (опционально)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-public"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="edit-is-public" className="cursor-pointer">
                  Сделать публичной (доступна всем пользователям)
                </Label>
              </div>
              {editingLayout && (
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <div>Создана: {new Date(editingLayout.createdAt).toLocaleString('ru-RU')}</div>
                  <div>Последнее изменение: {new Date(editingLayout.updatedAt).toLocaleString('ru-RU')}</div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false)
                  setShowLoadDialog(true)
                }}
              >
                Отмена
              </Button>
              <Button onClick={handleUpdateLayout}>
                Сохранить изменения
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}
