import { FC, memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

const CustomNode: FC<NodeProps> = ({ data }) => {
  const handleStyle = { 
    background: 'hsl(var(--color-primary))',
    width: '8px',
    height: '8px',
    border: '2px solid hsl(var(--color-card))',
  }

  return (
    <>
      {/* Handle точки для соединений на краях узла */}
      {/* Верхняя сторона - 2 точки */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, left: '40%' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ ...handleStyle, left: '60%', opacity: 0, pointerEvents: 'none' }}
      />
      
      {/* Правая сторона - 2 точки */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, top: '40%' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ ...handleStyle, top: '60%', opacity: 0, pointerEvents: 'none' }}
      />
      
      {/* Нижняя сторона - 2 точки */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, left: '40%' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ ...handleStyle, left: '60%', opacity: 0, pointerEvents: 'none' }}
      />
      
      {/* Левая сторона - 2 точки */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, top: '40%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ ...handleStyle, top: '60%', opacity: 0, pointerEvents: 'none' }}
      />
      
      {/* Содержимое узла с padding внутри */}
      <div style={{ padding: '8px 12px' }}>
        {data.label}
      </div>
    </>
  )
}

export default memo(CustomNode)
