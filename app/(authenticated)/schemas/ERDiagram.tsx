'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiMinimize2 } from 'react-icons/fi'

interface Column {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  defaultValue: string | null
}

interface ForeignKey {
  columnName: string
  referencedTable: string
  referencedColumn: string
  constraintName: string
}

interface Table {
  name: string
  schema: string
  columns: Column[]
  foreignKeys: ForeignKey[]
  primaryKeys: string[]
}

interface ERDiagramProps {
  tables: Table[]
  initialNodePositions?: Record<string, { x: number; y: number }>
  onNodePositionsChange?: (positions: Record<string, { x: number; y: number }>) => void
  initialEdgeOffsets?: Record<string, number>
  onEdgeOffsetsChange?: (offsets: Record<string, number>) => void
  initialEdgeHandles?: Record<string, { sourceHandle: string; targetHandle: string }>
  onEdgeHandlesChange?: (handles: Record<string, { sourceHandle: string; targetHandle: string }>) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

// Кастомный компонент для отображения таблицы
function TableNode({ data }: { data: Table }) {
  return (
    <div className="bg-card border-2 border-primary rounded-lg shadow-lg min-w-[200px]">
      {/* Заголовок таблицы */}
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-t-md font-semibold text-sm">
        {data.name}
      </div>
      
      {/* Колонки */}
      <div className="divide-y divide-border">
        {data.columns.map((column, index) => (
          <div
            key={index}
            className="px-3 py-1.5 text-xs flex items-center justify-between hover:bg-accent/50 relative"
          >
            {/* Handles для внешнего ключа (source - откуда идёт связь) - с обеих сторон */}
            {column.isForeignKey && (
              <>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${data.name}-${column.name}-source-right`}
                  className="!w-2 !h-2 !bg-blue-500 !right-0"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <Handle
                  type="source"
                  position={Position.Left}
                  id={`${data.name}-${column.name}-source-left`}
                  className="!w-2 !h-2 !bg-blue-500 !left-0"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </>
            )}
            
            {/* Handles для первичного ключа (target - куда приходит связь) - с обеих сторон */}
            {column.isPrimaryKey && (
              <>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${data.name}-${column.name}-target-left`}
                  className="!w-2 !h-2 !bg-yellow-500 !left-0"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <Handle
                  type="target"
                  position={Position.Right}
                  id={`${data.name}-${column.name}-target-right`}
                  className="!w-2 !h-2 !bg-yellow-500 !right-0"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </>
            )}
            
            <div className="flex items-center gap-2">
              {column.isPrimaryKey && (
                <span className="text-yellow-500 font-bold" title="Primary Key">🔑</span>
              )}
              {column.isForeignKey && (
                <span className="text-blue-500" title="Foreign Key">🔗</span>
              )}
              <span className={column.isPrimaryKey ? 'font-semibold' : ''}>
                {column.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {column.type}
              </span>
              {!column.nullable && (
                <span className="text-red-500 text-[10px]" title="NOT NULL">*</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNode,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function AdjustableEdge(props: EdgeProps) {
  const {
    id,
    markerEnd,
    style,
    data,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    source,
    target,
    sourceHandleId,
    targetHandleId,
  } = props

  const offset = data?.offset ?? 0
  const { setEdges } = useReactFlow()
  const [isDragging, setIsDragging] = useState(false)
  const pathRef = useRef<SVGPathElement | null>(null)

  // Определяем тип соединения
  const isVerticalLayout = sourcePosition === targetPosition
  const isHorizontalConnection = !isVerticalLayout // Right→Left или Left→Right
  
  // Для горизонтальных соединений используем centerX для позиционирования вертикального сегмента
  // Для вертикальных соединений используем offset
  const defaultCenterX = (sourceX + targetX) / 2
  const baseOffset = isVerticalLayout ? 50 : 0

  const pathOptions: Parameters<typeof getSmoothStepPath>[0] = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  }

  if (isHorizontalConnection) {
    // Для Right→Left: centerX определяет где будет вертикальный сегмент
    pathOptions.centerX = defaultCenterX + offset
  } else {
    // Для вертикальных связей (обе точки с одной стороны)
    pathOptions.offset = baseOffset + offset
  }

  const [edgePath] = getSmoothStepPath(pathOptions)

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGPathElement>) => {
      event.stopPropagation()
      setIsDragging(true)
      const initialOffset = offset
      const startX = event.clientX
      
      // Определяем тип соединения
      const isHorizontalConn = sourcePosition !== targetPosition
      const direction = isHorizontalConn ? 1 : (sourcePosition === Position.Right ? 1 : -1)

      // Порог для переключения сторон (в пикселях смещения)
      const switchThreshold = 150

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX
        const newOffset = initialOffset + deltaX * direction
        
        setEdges((currentEdges) =>
          currentEdges.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  data: {
                    ...edge.data,
                    offset: clamp(newOffset, -400, 400),
                  },
                }
              : edge
          )
        )
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [id, offset, setEdges, sourcePosition, targetPosition]
  )

  // Функция для переключения сторон подключения (вызывается по двойному клику)
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<SVGPathElement>) => {
      event.stopPropagation()
      
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          if (edge.id !== id) return edge
          
          // Переключаем стороны: left↔right для обеих точек
          const currentSourceSide = edge.sourceHandle?.includes('-right') ? 'right' : 'left'
          const currentTargetSide = edge.targetHandle?.includes('-right') ? 'right' : 'left'
          
          const newSourceSide = currentSourceSide === 'right' ? 'left' : 'right'
          const newTargetSide = currentTargetSide === 'right' ? 'left' : 'right'
          
          const sourceHandleBase = edge.sourceHandle?.replace(/-source-(left|right)$/, '')
          const targetHandleBase = edge.targetHandle?.replace(/-target-(left|right)$/, '')
          
          return {
            ...edge,
            sourceHandle: `${sourceHandleBase}-source-${newSourceSide}`,
            targetHandle: `${targetHandleBase}-target-${newTargetSide}`,
            data: {
              ...edge.data,
              offset: 0, // Сбрасываем offset при переключении
            },
          }
        })
      )
    },
    [id, setEdges]
  )

  const highlightStyle = isDragging
    ? {
        ...(style || {}),
        strokeWidth: Number(style?.strokeWidth ?? 2) + 2,
        stroke: style?.stroke || '#1d4ed8',
      }
    : style

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={highlightStyle} />
      <path
        ref={pathRef}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      />
    </>
  )
}

const edgeTypes = {
  adjustable: AdjustableEdge,
}

export default function ERDiagram({ tables, initialNodePositions, onNodePositionsChange, initialEdgeOffsets, onEdgeOffsetsChange, initialEdgeHandles, onEdgeHandlesChange, isFullscreen = false, onToggleFullscreen }: ERDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const edgeOffsetsRef = useRef<Map<string, number>>(new Map())
  const edgeHandlesRef = useRef<Map<string, { sourceHandle: string; targetHandle: string }>>(new Map())
  const lastSentOffsetsRef = useRef<string>('')
  const lastSentHandlesRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  // Инициализируем refs только при первой загрузке
  useEffect(() => {
    if (!isInitializedRef.current) {
      edgeOffsetsRef.current = new Map(Object.entries(initialEdgeOffsets || {}))
      lastSentOffsetsRef.current = JSON.stringify(initialEdgeOffsets || {})
      edgeHandlesRef.current = new Map(Object.entries(initialEdgeHandles || {}))
      lastSentHandlesRef.current = JSON.stringify(initialEdgeHandles || {})
    }
  }, [initialEdgeOffsets, initialEdgeHandles])

  // Отслеживаем изменения offsets
  useEffect(() => {
    const map = new Map(edges.map((edge) => [edge.id, edge.data?.offset ?? 0]))
    edgeOffsetsRef.current = map
    const obj = Object.fromEntries(map)
    const serialized = JSON.stringify(obj)
    if (serialized !== lastSentOffsetsRef.current) {
      lastSentOffsetsRef.current = serialized
      onEdgeOffsetsChange?.(obj)
    }
  }, [edges, onEdgeOffsetsChange])

  // Отслеживаем изменения handles
  useEffect(() => {
    const map = new Map(edges.map((edge) => [edge.id, { sourceHandle: edge.sourceHandle || '', targetHandle: edge.targetHandle || '' }]))
    edgeHandlesRef.current = map
    const obj = Object.fromEntries(map)
    const serialized = JSON.stringify(obj)
    if (serialized !== lastSentHandlesRef.current) {
      lastSentHandlesRef.current = serialized
      onEdgeHandlesChange?.(obj)
    }
  }, [edges, onEdgeHandlesChange])

  // Функция для создания связей - использует сохранённые handles если есть,
  // иначе вычисляет по позиции таблиц (только при первой загрузке)
  const recalculateEdges = useCallback((currentNodes: Node[], existingEdges?: Edge[]) => {
    const nodePositions: Record<string, { x: number; y: number }> = {}
    currentNodes.forEach(node => {
      nodePositions[node.id] = node.position
    })

    // Создаём map текущих offsets из существующих edges
    const currentOffsets = new Map<string, number>()
    const currentHandles = new Map<string, { sourceHandle: string; targetHandle: string }>()
    if (existingEdges) {
      existingEdges.forEach(edge => {
        currentOffsets.set(edge.id, edge.data?.offset ?? 0)
        if (edge.sourceHandle && edge.targetHandle) {
          currentHandles.set(edge.id, { sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle })
        }
      })
    }

    const updatedEdges: Edge[] = []

    tables.forEach((table) => {
      table.foreignKeys.forEach((fk, fkIndex) => {
        const sourcePos = nodePositions[table.name]
        const targetPos = nodePositions[fk.referencedTable]

        if (!sourcePos || !targetPos) return

        const edgeId = `${table.name}-${fk.referencedTable}-${fkIndex}`
        
        // Приоритет handles: существующий из edges > ref > вычисленный по позиции
        let sourceHandle: string
        let targetHandle: string
        
        const savedHandles = currentHandles.get(edgeId) || edgeHandlesRef.current.get(edgeId)
        
        if (savedHandles && savedHandles.sourceHandle && savedHandles.targetHandle) {
          // Используем сохранённые handles
          sourceHandle = savedHandles.sourceHandle
          targetHandle = savedHandles.targetHandle
        } else {
          // Вычисляем handles по позиции таблиц (только при первой загрузке)
          const deltaX = targetPos.x - sourcePos.x
          const deltaY = targetPos.y - sourcePos.y
          
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
              sourceHandle = `${table.name}-${fk.columnName}-source-right`
              targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-left`
            } else {
              sourceHandle = `${table.name}-${fk.columnName}-source-left`
              targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-right`
            }
          } else {
            if (deltaX >= 0) {
              sourceHandle = `${table.name}-${fk.columnName}-source-right`
              targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-right`
            } else {
              sourceHandle = `${table.name}-${fk.columnName}-source-left`
              targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-left`
            }
          }
        }
        
        // Приоритет offset: существующий из edges > ref > 0
        const edgeOffset = currentOffsets.get(edgeId) ?? edgeOffsetsRef.current.get(edgeId) ?? 0

        updatedEdges.push({
          id: edgeId,
          source: table.name,
          target: fk.referencedTable,
          sourceHandle,
          targetHandle,
          type: 'adjustable',
          animated: false,
          label: fk.columnName,
          labelStyle: { fontSize: 10, fill: '#666', fontWeight: 500 },
          labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
          data: {
            offset: edgeOffset,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#3b82f6',
          },
          style: {
            strokeWidth: 2,
            stroke: '#3b82f6',
          },
        })
      })
    })

    return updatedEdges
  }, [tables])

  // Обработчик изменения узлов - только сохраняем позиции, НЕ пересчитываем связи
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    
    // Сохраняем позиции при окончании перетаскивания
    const hasMoveChange = changes.some((change: any) => change.type === 'position' && change.dragging === false)
    
    if (hasMoveChange) {
      setNodes((currentNodes) => {
        // Сохраняем позиции узлов асинхронно
        setTimeout(() => {
          if (onNodePositionsChange) {
            const positions: Record<string, { x: number; y: number }> = {}
            currentNodes.forEach(node => {
              positions[node.id] = node.position
            })
            onNodePositionsChange(positions)
          }
        }, 0)
        
        return currentNodes
      })
    }
  }, [onNodesChange, setNodes, onNodePositionsChange])

  // Генерация nodes и edges - только при изменении tables или начальных позиций
  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (isInitializedRef.current && tables.length > 0 && nodes.length > 0) {
      return
    }
    
    // Инициализируем refs при первой загрузке
    edgeOffsetsRef.current = new Map(Object.entries(initialEdgeOffsets || {}))
    edgeHandlesRef.current = new Map(Object.entries(initialEdgeHandles || {}))

    // Генерируем узлы из таблиц
    const generatedNodes: Node[] = []

    // Размещаем таблицы по сетке для лучшей видимости связей
    const tableCount = tables.length
    const cols = Math.ceil(Math.sqrt(tableCount))
    const spacing = 350 // Расстояние между таблицами

    tables.forEach((table, index) => {
      // Используем сохранённые позиции если есть, иначе сетка
      let x, y
      if (initialNodePositions && initialNodePositions[table.name]) {
        x = initialNodePositions[table.name].x
        y = initialNodePositions[table.name].y
      } else {
        const row = Math.floor(index / cols)
        const col = index % cols
        x = col * spacing + 100
        y = row * spacing + 100
      }

      generatedNodes.push({
        id: table.name,
        type: 'tableNode',
        position: { x, y },
        data: table,
      })
    })
    
    setNodes(generatedNodes)
    
    // Вычисляем начальные связи
    const initialEdges = recalculateEdges(generatedNodes)
    setEdges(initialEdges)
    
    isInitializedRef.current = true
  }, [tables, initialNodePositions, initialEdgeOffsets, initialEdgeHandles, setNodes, setEdges, recalculateEdges, nodes.length])

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative h-[calc(100vh-12rem)]'}`}>
      <Card className={`w-full h-full overflow-hidden ${isFullscreen ? 'rounded-none' : ''}`}>
        {/* Кнопка выхода из полноэкранного режима */}
        {isFullscreen && onToggleFullscreen && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleFullscreen}
              title="Выйти из полноэкранного режима (Esc)"
              className="bg-card/95 backdrop-blur-sm shadow-lg"
            >
              <FiMinimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ReactFlow диаграмма */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Card>
    </div>
  )
}
