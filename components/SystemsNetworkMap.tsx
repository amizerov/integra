'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  MiniMap,
  Panel,
  Position,
  ConnectionLineType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiFilter } from 'react-icons/fi'
import CustomEdge from './CustomEdge'
import CustomNode from './CustomNode'

const edgeTypes = {
  custom: CustomEdge,
}

const nodeTypes = {
  custom: CustomNode,
}

interface NetworkNode {
  id: string
  label: string
  systemId: number
  versionId: number
  systemName: string | null
  systemShortName: string | null
  versionCode: string | null
}

interface NetworkEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface SystemsNetworkMapProps {
  initialNodes: NetworkNode[]
  initialEdges: NetworkEdge[]
}

// Функция для определения оптимальных точек соединения на основе позиций узлов
const getConnectionPositions = (sourceNode: Node, targetNode: Node): { sourcePos: Position; targetPos: Position } => {
  // Используем фактические размеры узлов или дефолтные значения
  const sourceWidth = sourceNode.width || (sourceNode as any).measured?.width || 120
  const sourceHeight = sourceNode.height || (sourceNode as any).measured?.height || 60
  const targetWidth = targetNode.width || (targetNode as any).measured?.width || 120
  const targetHeight = targetNode.height || (targetNode as any).measured?.height || 60
  
  const sourceCenterX = sourceNode.position.x + sourceWidth / 2
  const sourceCenterY = sourceNode.position.y + sourceHeight / 2
  const targetCenterX = targetNode.position.x + targetWidth / 2
  const targetCenterY = targetNode.position.y + targetHeight / 2
  
  const dx = targetCenterX - sourceCenterX
  const dy = targetCenterY - sourceCenterY
  
  // Вычисляем угол между узлами
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  
  // Определяем оптимальные позиции на основе угла
  let sourcePos: Position
  let targetPos: Position
  
  // Source position (откуда выходит стрелка)
  if (angle >= -45 && angle < 45) {
    sourcePos = Position.Right
  } else if (angle >= 45 && angle < 135) {
    sourcePos = Position.Bottom
  } else if (angle >= 135 || angle < -135) {
    sourcePos = Position.Left
  } else {
    sourcePos = Position.Top
  }
  
  // Target position (куда входит стрелка) - противоположная сторона
  if (angle >= -45 && angle < 45) {
    targetPos = Position.Left
  } else if (angle >= 45 && angle < 135) {
    targetPos = Position.Top
  } else if (angle >= 135 || angle < -135) {
    targetPos = Position.Right
  } else {
    targetPos = Position.Bottom
  }
  
  return { sourcePos, targetPos }
}

// Функция для расчета начальных позиций узлов (круговая раскладка)
const calculateCircularLayout = (nodes: NetworkNode[], totalCount: number, startIndex: number = 0): Node[] => {
  const radius = 300
  const centerX = 500
  const centerY = 400

  return nodes.map((node, index) => {
    const angle = ((startIndex + index) / totalCount) * 2 * Math.PI
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)

    return {
      id: node.id,
      type: 'custom',
      data: { 
        label: (
          <div className="text-center">
            <div className="font-semibold text-xs whitespace-nowrap">
              {node.systemShortName || `Система ${node.systemId}`}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {node.versionCode || `v${node.versionId}`}
            </div>
          </div>
        )
      },
      position: { x, y },
      style: {
        background: 'hsl(var(--color-card))',
        border: '2px solid hsl(var(--color-primary))',
        borderRadius: '8px',
        fontSize: '12px',
        minWidth: '100px',
        cursor: 'move',
      },
    }
  })
}

const convertEdges = (edges: NetworkEdge[], nodes: Node[]): Edge[] => {
  return edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    
    let sourcePosition = Position.Right
    let targetPosition = Position.Left
    let sourceHandle = 'right'
    let targetHandle = 'left-target'
    
    if (sourceNode && targetNode) {
      const positions = getConnectionPositions(sourceNode, targetNode)
      sourcePosition = positions.sourcePos
      targetPosition = positions.targetPos
      
      // Преобразуем Position в ID handle
      const posToHandleSource: Record<Position, string> = {
        [Position.Top]: 'top',
        [Position.Right]: 'right',
        [Position.Bottom]: 'bottom',
        [Position.Left]: 'left',
      }
      
      const posToHandleTarget: Record<Position, string> = {
        [Position.Top]: 'top-target',
        [Position.Right]: 'right-target',
        [Position.Bottom]: 'bottom-target',
        [Position.Left]: 'left-target',
      }
      
      sourceHandle = posToHandleSource[sourcePosition]
      targetHandle = posToHandleTarget[targetPosition]
    }
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      label: edge.label,
      type: 'custom',
      animated: false,
      style: { stroke: 'hsl(var(--color-primary) / 0.5)', strokeWidth: 2 },
      labelStyle: { fontSize: 10, fill: 'hsl(var(--color-foreground))' },
      labelBgStyle: { fill: 'hsl(var(--color-card))', fillOpacity: 0.8 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--color-primary) / 0.7)',
        width: 20,
        height: 20,
      },
    }
  })
}

export default function SystemsNetworkMap({ initialNodes, initialEdges }: SystemsNetworkMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedSystemIds, setSelectedSystemIds] = useState<Set<number>>(new Set())

  // Группируем узлы по системам
  const systemsList = useMemo(() => {
    const systemsMap = new Map<number, { id: number; name: string; shortName: string; versions: NetworkNode[] }>()
    
    initialNodes.forEach(node => {
      if (!systemsMap.has(node.systemId)) {
        systemsMap.set(node.systemId, {
          id: node.systemId,
          name: node.systemName || `Система ${node.systemId}`,
          shortName: node.systemShortName || `Система ${node.systemId}`,
          versions: []
        })
      }
      systemsMap.get(node.systemId)!.versions.push(node)
    })
    
    return Array.from(systemsMap.values()).sort((a, b) => a.shortName.localeCompare(b.shortName))
  }, [initialNodes])

  // Фильтруем узлы и рёбра на основе выбранных систем
  const filteredNodes = useMemo(() => {
    if (selectedSystemIds.size === 0) return initialNodes
    return initialNodes.filter(node => selectedSystemIds.has(node.systemId))
  }, [initialNodes, selectedSystemIds])

  const filteredEdges = useMemo(() => {
    if (selectedSystemIds.size === 0) return initialEdges
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    return initialEdges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
  }, [initialEdges, filteredNodes])

  useEffect(() => {
    const layoutedNodes = calculateCircularLayout(filteredNodes, filteredNodes.length)
    setNodes(layoutedNodes)
    setEdges(convertEdges(filteredEdges, layoutedNodes))
  }, [filteredNodes, filteredEdges, setNodes, setEdges])

  // Обработчик изменения узлов для пересчета edges при перемещении
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    
    // Проверяем, завершилось ли перетаскивание
    const dragEnd = changes.some((change: any) => 
      change.type === 'position' && change.dragging === false && change.position
    )
    
    if (dragEnd) {
      // Используем requestAnimationFrame для гарантии обновления DOM
      requestAnimationFrame(() => {
        setNodes(currentNodes => {
          // Пересчитываем edges с обновленными узлами
          const updatedEdges = convertEdges(filteredEdges, currentNodes)
          setEdges(updatedEdges)
          return currentNodes
        })
      })
    }
  }, [onNodesChange, filteredEdges, setEdges, setNodes])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const resetLayout = () => {
    const layoutedNodes = calculateCircularLayout(filteredNodes, filteredNodes.length)
    setNodes(layoutedNodes)
    // Обновляем edges с новыми позициями узлов
    setEdges(convertEdges(filteredEdges, layoutedNodes))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleSystem = (systemId: number) => {
    setSelectedSystemIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(systemId)) {
        newSet.delete(systemId)
      } else {
        newSet.add(systemId)
      }
      return newSet
    })
  }

  const selectAllSystems = () => {
    setSelectedSystemIds(new Set(systemsList.map(s => s.id)))
  }

  const deselectAllSystems = () => {
    setSelectedSystemIds(new Set())
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative'}`} style={isFullscreen ? { opacity: 1 } : undefined}>
      <Card className={`w-full overflow-hidden ${isFullscreen ? 'h-screen rounded-none' : 'h-[600px]'}`} style={isFullscreen ? { opacity: 1, background: 'hsl(var(--color-background))' } : undefined}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          edgeTypes={edgeTypes}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          connectionLineType={ConnectionLineType.Bezier}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => 'hsl(var(--color-primary))'}
            maskColor="hsl(var(--color-background) / 0.6)"
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          
          <Panel position="top-right" className="flex gap-2">
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
                  <div 
                    className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md shadow-lg z-20 bg-[hsl(var(--color-card))] border border-border" 
                    style={{ opacity: 1 }}
                  >
                    <div className="p-3 border-b border-border sticky top-0 bg-[hsl(var(--color-card))] z-10">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-sm">Выбор систем</h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={selectAllSystems}
                            className="h-6 text-xs px-2"
                          >
                            Все
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={deselectAllSystems}
                            className="h-6 text-xs px-2"
                          >
                            Сбросить
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Выбрано: {selectedSystemIds.size === 0 ? 'все' : selectedSystemIds.size} из {systemsList.length}
                      </p>
                    </div>
                    <div className="p-2">
                      {systemsList.map((system) => (
                        <label
                          key={system.id}
                          className="flex items-start gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSystemIds.size === 0 || selectedSystemIds.has(system.id)}
                            onChange={() => toggleSystem(system.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {system.shortName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {system.versions.length} {system.versions.length === 1 ? 'версия' : 'версий'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={resetLayout}
              title="Сбросить расположение"
            >
              <FiRefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            >
              {isFullscreen ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
            </Button>
          </Panel>

          <Panel position="top-left" className="bg-card/90 backdrop-blur-sm p-3 rounded-md border border-border">
            <div className="text-xs space-y-1">
              {selectedSystemIds.size > 0 && (
                <div className="text-muted-foreground">
                  Систем выбрано: {selectedSystemIds.size}
                </div>
              )}
              <div className="text-muted-foreground">Связей: {edges.length}</div>
            </div>
          </Panel>
        </ReactFlow>
      </Card>
    </div>
  )
}
