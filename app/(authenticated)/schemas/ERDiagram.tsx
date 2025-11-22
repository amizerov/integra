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
  onSave?: () => void
  onExport?: () => void
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

export default function ERDiagram({ tables, onSave, onExport }: ERDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isFullscreen, setIsFullscreen] = useState(false)

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
        const updatedEdges = recalculateEdges(currentNodes)
        setEdges(updatedEdges)
        return currentNodes
      })
    }
  }, [onNodesChange, recalculateEdges, setNodes, setEdges])

  useEffect(() => {
    // Генерируем узлы и рёбра из таблиц
    const generatedNodes: Node[] = []

    // Размещаем таблицы по сетке для лучшей видимости связей
    const tableCount = tables.length
    const cols = Math.ceil(Math.sqrt(tableCount))
    const spacing = 350 // Расстояние между таблицами

    tables.forEach((table, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const x = col * spacing + 100
      const y = row * spacing + 100

      generatedNodes.push({
        id: table.name,
        type: 'tableNode',
        position: { x, y },
        data: table,
      })
    })

    console.log('Generated nodes:', generatedNodes.length)
    
    setNodes(generatedNodes)
    
    // Вычисляем начальные связи
    const initialEdges = recalculateEdges(generatedNodes)
    console.log('Generated edges:', initialEdges.length)
    setEdges(initialEdges)
  }, [tables, setNodes, setEdges, recalculateEdges])

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave()
    }
  }, [onSave])

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport()
    }
  }, [onExport])

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative h-[calc(100vh-12rem)]'}`}>
      <Card className={`w-full h-full overflow-hidden ${isFullscreen ? 'rounded-none' : ''}`}>
        {/* Панель инструментов */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-card/95 backdrop-blur-sm p-2 rounded-lg border border-border shadow-lg">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            title="Сохранить схему"
          >
            <FiSave className="h-4 w-4 mr-2" />
            Сохранить
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            title="Экспорт в ERwin"
          >
            <FiDownload className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
          >
            {isFullscreen ? (
              <>
                <FiMinimize2 className="h-4 w-4 mr-2" />
                Выйти
              </>
            ) : (
              <FiMaximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Информационная панель */}
        <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm p-3 rounded-md border border-border">
          <div className="text-xs space-y-1">
            <div className="text-muted-foreground">Таблиц: {tables.length}</div>
            <div className="text-muted-foreground">
              Связей: {tables.reduce((sum, t) => sum + t.foreignKeys.length, 0)}
            </div>
          </div>
        </div>

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
