'use client'

import { useEffect, useRef, useState } from 'react'
import { graphviz } from 'd3-graphviz'
import * as d3 from 'd3'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiMaximize2, FiMinimize2, FiDownload, FiRefreshCw, FiEyeOff, FiEye } from 'react-icons/fi'

interface GraphvizCanvasProps {
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
  initialLayout?: 'dot' | 'neato' | 'fdp' | 'circo'
  initialShowLabels?: boolean
  renderToolbar?: (controls: {
    layoutButton: React.ReactNode
    resetButton: React.ReactNode
    labelsButton: React.ReactNode
    fullscreenButton: React.ReactNode
    downloadButton: React.ReactNode
  }) => React.ReactNode
}

export default function GraphvizCanvas({ 
  initialNodes, 
  initialEdges, 
  initialLayout = 'dot', 
  initialShowLabels = true,
  renderToolbar 
}: GraphvizCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layout, setLayout] = useState<'dot' | 'neato' | 'fdp' | 'circo'>(initialLayout)
  const [showLabels, setShowLabels] = useState(initialShowLabels)
  const [svgContent, setSvgContent] = useState<string>('')

  // Генерация DOT файла из данных
  const generateDOT = () => {
    const nodes = initialNodes.map(node => 
      `  "${node.id}" [label="${node.systemShortName || node.systemName || node.id}", shape=box, style=rounded];`
    ).join('\n')

    const edges = initialEdges.map(edge => 
      `  "${edge.source}" -> "${edge.target}"${showLabels && edge.label ? ` [label="${edge.label}"]` : ''};`
    ).join('\n')

    return `digraph G {
  rankdir=TB;
  node [fontname="Arial", fontsize=12, color="#3b82f6", fillcolor="#dbeafe", style="filled,rounded"];
  edge [fontname="Arial", fontsize=10, color="#64748b"];
  
${nodes}

${edges}
}`
  }

  // Рендеринг графа с помощью d3-graphviz с drag-and-drop
  useEffect(() => {
    if (!containerRef.current) return

    try {
      const dot = generateDOT()
      
      // Создаем Graphviz renderer
      const gv = graphviz(containerRef.current, {
        useWorker: false,
        zoom: true,
      })
        .engine(layout)
        .renderDot(dot)
        .on('end', () => {
          // После рендеринга добавляем drag-and-drop к узлам
          const svg = d3.select(containerRef.current).select('svg')
          
          // Масштабирование SVG под контейнер
          svg
            .style('width', '100%')
            .style('height', '100%')

          // Функция drag с правильным обновлением рёбер
          const dragHandler = d3.drag<SVGGElement, unknown>()
            .on('start', function(event) {
              d3.select(this).raise()
              event.sourceEvent.stopPropagation()
            })
            .on('drag', function(event) {
              const node = d3.select(this)
              const nodeTitle = node.select('title').text()
              
              // Получаем текущую трансформацию
              const transform = node.attr('transform') || ''
              const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/)
              
              let currentX = 0
              let currentY = 0
              
              if (translateMatch) {
                currentX = parseFloat(translateMatch[1])
                currentY = parseFloat(translateMatch[2])
              }
              
              // Обновляем позицию узла
              const newX = currentX + event.dx
              const newY = currentY + event.dy
              
              node.attr('transform', `translate(${newX},${newY})`)
              
              // Обновляем все рёбра, связанные с этим узлом
              svg.selectAll<SVGGElement, unknown>('.edge').each(function() {
                const edge = d3.select(this)
                const edgeTitle = edge.select('title').text()
                
                // Проверяем, связано ли ребро с перемещаемым узлом
                // Формат title в Graphviz: "source->target" или "source&#45;&gt;target"
                const edgeParts = edgeTitle.split(/->|&#45;&gt;|→/)
                if (edgeParts.length === 2) {
                  const source = edgeParts[0].trim()
                  const target = edgeParts[1].trim()
                  
                  if (source === nodeTitle || target === nodeTitle) {
                    // Получаем path элемент ребра
                    const path = edge.select<SVGPathElement>('path')
                    const pathData = path.attr('d')
                    
                    if (pathData) {
                      // Разбираем path на команды
                      const commands = pathData.match(/[A-Z][^A-Z]*/gi) || []
                      let isFirstPoint = true
                      
                      const updatedCommands = commands.map(cmd => {
                        const type = cmd[0]
                        const coords = cmd.slice(1).trim()
                        
                        if (type === 'M' || type === 'L' || type === 'C') {
                          const numbers = coords.split(/[\s,]+/).map(Number)
                          
                          // Для M (первая точка) - это точка начала (source)
                          if (type === 'M' && isFirstPoint) {
                            isFirstPoint = false
                            if (source === nodeTitle) {
                              // Обновляем начальную точку
                              return `M${numbers[0] + event.dx},${numbers[1] + event.dy}`
                            }
                            return cmd
                          }
                          
                          // Для L и C - обновляем конечные точки, если это target
                          if (type === 'L' && target === nodeTitle) {
                            return `L${numbers[0] + event.dx},${numbers[1] + event.dy}`
                          }
                          
                          if (type === 'C' && target === nodeTitle) {
                            // Для кривой Безье обновляем только последнюю контрольную точку и конечную точку
                            if (numbers.length === 6) {
                              return `C${numbers[0]},${numbers[1]} ${numbers[2] + event.dx},${numbers[3] + event.dy} ${numbers[4] + event.dx},${numbers[5] + event.dy}`
                            }
                          }
                          
                          // Если это source, обновляем контрольные точки кривой
                          if (type === 'C' && source === nodeTitle) {
                            if (numbers.length === 6) {
                              return `C${numbers[0] + event.dx},${numbers[1] + event.dy} ${numbers[2]},${numbers[3]} ${numbers[4]},${numbers[5]}`
                            }
                          }
                        }
                        
                        return cmd
                      })
                      
                      path.attr('d', updatedCommands.join(''))
                    }
                    
                    // Обновляем стрелку (polygon) - только если это target
                    if (target === nodeTitle) {
                      const polygon = edge.select<SVGPolygonElement>('polygon')
                      if (polygon.node()) {
                        const points = polygon.attr('points')
                        if (points) {
                          const updatedPoints = points.split(' ').map(point => {
                            const coords = point.split(',')
                            if (coords.length === 2) {
                              const x = parseFloat(coords[0])
                              const y = parseFloat(coords[1])
                              return `${x + event.dx},${y + event.dy}`
                            }
                            return point
                          }).join(' ')
                          polygon.attr('points', updatedPoints)
                        }
                      }
                    }
                    
                    // Обновляем текст на ребре (label) - смещаем пропорционально
                    const text = edge.select('text')
                    if (text.node()) {
                      const textX = parseFloat(text.attr('x') || '0')
                      const textY = parseFloat(text.attr('y') || '0')
                      // Смещаем label на половину движения (так как он посередине)
                      text.attr('x', textX + event.dx / 2)
                      text.attr('y', textY + event.dy / 2)
                    }
                  }
                }
              })
            })

          // Применяем drag к каждому узлу (.node - класс узлов Graphviz)
          svg.selectAll<SVGGElement, unknown>('.node')
            .call(dragHandler)
            .style('cursor', 'grab')
            .on('mousedown', function() {
              d3.select(this).style('cursor', 'grabbing')
            })
            .on('mouseup', function() {
              d3.select(this).style('cursor', 'grab')
            })

          // Сохраняем SVG для скачивания
          const svgElement = containerRef.current?.querySelector('svg')
          if (svgElement) {
            setSvgContent(svgElement.outerHTML)
          }
        })

    } catch (error) {
      console.error('Graphviz rendering error:', error)
    }
  }, [initialNodes, initialEdges, layout, showLabels])

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'network-graph.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const cycleLayout = () => {
    const layouts: Array<'dot' | 'neato' | 'fdp' | 'circo'> = ['dot', 'neato', 'fdp', 'circo']
    const currentIndex = layouts.indexOf(layout)
    const nextIndex = (currentIndex + 1) % layouts.length
    setLayout(layouts[nextIndex])
  }

  const layoutNames = {
    dot: 'Иерархия',
    neato: 'Пружины',
    fdp: 'Сила',
    circo: 'Круг'
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative h-[calc(100vh-11rem)]'}`}>
      <Card className={`w-full h-full overflow-hidden ${isFullscreen ? 'rounded-none' : ''}`}>
        {/* Toolbar - показывается только в полноэкранном режиме */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={cycleLayout}
              title={`Текущий: ${layoutNames[layout]}`}
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              {layoutNames[layout]}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setLayout('dot')}
              title="Сбросить в иерархию"
            >
              <FiRefreshCw className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowLabels(!showLabels)}
              title={showLabels ? "Скрыть надписи" : "Показать надписи"}
            >
              {showLabels ? <FiEye className="h-4 w-4" /> : <FiEyeOff className="h-4 w-4" />}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              title="Скачать SVG"
            >
              <FiDownload className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsFullscreen(false)}
              title="Выйти из полноэкранного режима"
            >
              <FiMinimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Toolbar для обычного режима - через portal */}
        {!isFullscreen && renderToolbar && renderToolbar({
          layoutButton: (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={cycleLayout}
              title={`Текущий: ${layoutNames[layout]}`}
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              {layoutNames[layout]}
            </Button>
          ),
          resetButton: (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setLayout('dot')}
              title="Сбросить в иерархию"
            >
              <FiRefreshCw className="h-4 w-4" />
            </Button>
          ),
          labelsButton: (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowLabels(!showLabels)}
              title={showLabels ? "Скрыть надписи" : "Показать надписи"}
            >
              {showLabels ? <FiEye className="h-4 w-4" /> : <FiEyeOff className="h-4 w-4" />}
            </Button>
          ),
          fullscreenButton: (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsFullscreen(true)}
              title="Полный экран"
            >
              <FiMaximize2 className="h-4 w-4" />
            </Button>
          ),
          downloadButton: (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              title="Скачать SVG"
            >
              <FiDownload className="h-4 w-4" />
            </Button>
          ),
        })}

        {/* Info panel */}
        <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm p-3 rounded-md border border-border">
          <div className="text-xs space-y-1">
            <div>Узлов: {initialNodes.length}</div>
            <div>Связей: {initialEdges.length}</div>
            <div>Алгоритм: {layoutNames[layout]}</div>
          </div>
        </div>

        {/* Graph container */}
        <div 
          ref={containerRef}
          className="w-full h-full flex items-center justify-center bg-background"
          style={{ overflow: 'auto' }}
        />
      </Card>
    </div>
  )
}
