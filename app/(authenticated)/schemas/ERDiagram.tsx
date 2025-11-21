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
            {/* Handle для внешнего ключа (source - откуда идёт связь) */}
            {column.isForeignKey && (
              <Handle
                type="source"
                position={Position.Right}
                id={`${data.name}-${column.name}-source`}
                className="!w-2 !h-2 !bg-blue-500 !right-0"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            )}
            
            {/* Handle для первичного ключа (target - куда приходит связь) */}
            {column.isPrimaryKey && (
              <Handle
                type="target"
                position={Position.Left}
                id={`${data.name}-${column.name}-target`}
                className="!w-2 !h-2 !bg-yellow-500 !left-0"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
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

  useEffect(() => {
    // Генерируем узлы и рёбра из таблиц
    const generatedNodes: Node[] = []
    const generatedEdges: Edge[] = []

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
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })

      // Создаём рёбра для внешних ключей
      table.foreignKeys.forEach((fk, fkIndex) => {
        generatedEdges.push({
          id: `${table.name}-${fk.referencedTable}-${fkIndex}`,
          source: table.name,
          target: fk.referencedTable,
          sourceHandle: `${table.name}-${fk.columnName}-source`,
          targetHandle: `${fk.referencedTable}-${fk.referencedColumn}-target`,
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

    console.log('Generated nodes:', generatedNodes.length)
    console.log('Generated edges:', generatedEdges.length)
    
    setNodes(generatedNodes)
    setEdges(generatedEdges)
  }, [tables, setNodes, setEdges])

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
          onNodesChange={onNodesChange}
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
