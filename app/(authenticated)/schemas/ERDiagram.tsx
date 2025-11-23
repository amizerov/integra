'use client'

import { useCallback, useEffect, useState } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiDownload, FiSave, FiMaximize2, FiMinimize2 } from 'react-icons/fi'

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

export default function ERDiagram({ tables, initialNodePositions, onNodePositionsChange, isFullscreen = false, onToggleFullscreen }: ERDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Функция для пересчёта handles связей на основе текущих позиций узлов
  const recalculateEdges = useCallback((currentNodes: Node[]) => {
    const nodePositions: Record<string, { x: number; y: number }> = {}
    currentNodes.forEach(node => {
      nodePositions[node.id] = node.position
    })

    const updatedEdges: Edge[] = []

    tables.forEach((table) => {
      table.foreignKeys.forEach((fk, fkIndex) => {
        const sourcePos = nodePositions[table.name]
        const targetPos = nodePositions[fk.referencedTable]

        if (!sourcePos || !targetPos) return

        // Вычисляем расстояния для всех 4 комбинаций подключения
        const deltaX = targetPos.x - sourcePos.x
        const deltaY = targetPos.y - sourcePos.y
        
        // Расстояние для подключения справа-слева (right to left)
        const distRightLeft = Math.sqrt(Math.pow(Math.abs(deltaX), 2) + Math.pow(deltaY, 2))
        
        // Расстояние для подключения слева-справа (left to right)  
        const distLeftRight = Math.sqrt(Math.pow(Math.abs(deltaX), 2) + Math.pow(deltaY, 2))
        
        // Расстояние для подключения справа-справа (right to right)
        const distRightRight = Math.sqrt(Math.pow(Math.abs(deltaX) + 400, 2) + Math.pow(deltaY, 2))
        
        // Расстояние для подключения слева-слева (left to left)
        const distLeftLeft = Math.sqrt(Math.pow(Math.abs(deltaX) + 400, 2) + Math.pow(deltaY, 2))
        
        // Выбираем handles в зависимости от взаимного расположения таблиц
        let sourceHandle: string
        let targetHandle: string
        
        // Если таблицы расположены почти горизонтально (deltaX значительно больше deltaY)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            // Целевая таблица справа - используем правый source и левый target
            sourceHandle = `${table.name}-${fk.columnName}-source-right`
            targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-left`
          } else {
            // Целевая таблица слева - используем левый source и правый target
            sourceHandle = `${table.name}-${fk.columnName}-source-left`
            targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-right`
          }
        } else {
          // Таблицы расположены вертикально - выбираем одну сторону для обоих
          // Используем направление по X для выбора стороны
          if (deltaX >= 0) {
            // Используем правые handles для обоих
            sourceHandle = `${table.name}-${fk.columnName}-source-right`
            targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-right`
          } else {
            // Используем левые handles для обоих
            sourceHandle = `${table.name}-${fk.columnName}-source-left`
            targetHandle = `${fk.referencedTable}-${fk.referencedColumn}-target-left`
          }
        }

        updatedEdges.push({
          id: `${table.name}-${fk.referencedTable}-${fkIndex}`,
          source: table.name,
          target: fk.referencedTable,
          sourceHandle,
          targetHandle,
          type: 'smoothstep',
          animated: false,
          label: fk.columnName,
          labelStyle: { fontSize: 10, fill: '#666', fontWeight: 500 },
          labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
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

  // Обработчик изменения узлов с пересчётом связей
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    
    // Пересчитываем связи при перемещении узлов
    const hasMoveChange = changes.some((change: any) => change.type === 'position' && change.dragging === false)
    
    if (hasMoveChange) {
      setNodes((currentNodes) => {
        // Пересчитываем связи
        const updatedEdges = recalculateEdges(currentNodes)
        setEdges(updatedEdges)
        
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
  }, [onNodesChange, recalculateEdges, setNodes, setEdges, onNodePositionsChange])

  useEffect(() => {
    // Генерируем узлы и рёбра из таблиц
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
        console.log(`Loading saved position for ${table.name}:`, x, y)
      } else {
        const row = Math.floor(index / cols)
        const col = index % cols
        x = col * spacing + 100
        y = row * spacing + 100
        console.log(`Using grid position for ${table.name}:`, x, y)
      }

      generatedNodes.push({
        id: table.name,
        type: 'tableNode',
        position: { x, y },
        data: table,
      })
    })

    console.log('Generated nodes:', generatedNodes.length)
    console.log('Initial positions received:', initialNodePositions)
    
    setNodes(generatedNodes)
    
    // Вычисляем начальные связи
    const initialEdges = recalculateEdges(generatedNodes)
    console.log('Generated edges:', initialEdges.length)
    setEdges(initialEdges)
  }, [tables, initialNodePositions, setNodes, setEdges, recalculateEdges])

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
