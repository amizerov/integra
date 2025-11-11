/**
 * Алгоритм оптимального размещения узлов графа для минимизации пересечений
 * Использует Force-Directed Layout (алгоритм Fruchterman-Reingold)
 */

interface Node {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface Edge {
  source: string
  target: string
}

interface LayoutOptions {
  width?: number
  height?: number
  iterations?: number
  temperature?: number
  coolingFactor?: number
  repulsionStrength?: number
  attractionStrength?: number
  centerGravity?: number
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  width: 1200,
  height: 800,
  iterations: 1000,
  temperature: 500,
  coolingFactor: 0.98,
  repulsionStrength: 100000,
  attractionStrength: 0.0005,
  centerGravity: 0.005,
}

/**
 * Вычисляет оптимальное расположение узлов с минимизацией пересечений
 */
export function calculateOptimalLayout<T extends { id: string }>(
  nodes: T[],
  edges: Edge[],
  options: LayoutOptions = {}
): Array<T & { x: number; y: number; width: number; height: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Инициализация позиций узлов - равномерное распределение по ВСЕЙ области
  const nodeMap = new Map<string, Node>()
  
  // Используем практически всю доступную область
  const padding = 80
  const usableWidth = opts.width - padding * 2
  const usableHeight = opts.height - padding * 2
  
  // Вычисляем сетку для начального равномерного распределения
  const gridSize = Math.ceil(Math.sqrt(nodes.length))
  const cellWidth = usableWidth / gridSize
  const cellHeight = usableHeight / gridSize
  
  nodes.forEach((node, i) => {
    // Размещаем в сетке с небольшой случайностью
    const row = Math.floor(i / gridSize)
    const col = i % gridSize
    
    const baseX = padding + col * cellWidth + cellWidth / 2
    const baseY = padding + row * cellHeight + cellHeight / 2
    
    // Добавляем случайное смещение в пределах ячейки
    const randomX = (Math.random() - 0.5) * cellWidth * 0.5
    const randomY = (Math.random() - 0.5) * cellHeight * 0.5
    
    nodeMap.set(node.id, {
      id: node.id,
      x: baseX + randomX,
      y: baseY + randomY,
      width: 140,
      height: 70,
    })
  })
  
  let temperature = opts.temperature
  
  // Основной цикл итераций
  for (let iteration = 0; iteration < opts.iterations; iteration++) {
    const forces = new Map<string, { x: number; y: number }>()
    
    // Инициализация сил
    nodeMap.forEach((node) => {
      forces.set(node.id, { x: 0, y: 0 })
    })
    
    // 1. Силы отталкивания между всеми узлами (предотвращение наложения)
    const nodeArray = Array.from(nodeMap.values())
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const node1 = nodeArray[i]
        const node2 = nodeArray[j]
        
        const dx = node2.x - node1.x
        const dy = node2.y - node1.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        
        // Отталкивание обратно пропорционально квадрату расстояния
        const repulsion = opts.repulsionStrength / (distance * distance)
        const fx = (dx / distance) * repulsion
        const fy = (dy / distance) * repulsion
        
        const force1 = forces.get(node1.id)!
        const force2 = forces.get(node2.id)!
        
        force1.x -= fx
        force1.y -= fy
        force2.x += fx
        force2.y += fy
      }
    }
    
    // 2. Силы притяжения вдоль рёбер (связанные узлы притягиваются)
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      
      if (!source || !target) return
      
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1
      
      // Притяжение пропорционально расстоянию (закон Гука)
      const attraction = distance * opts.attractionStrength
      const fx = (dx / distance) * attraction
      const fy = (dy / distance) * attraction
      
      const forceSource = forces.get(source.id)!
      const forceTarget = forces.get(target.id)!
      
      forceSource.x += fx
      forceSource.y += fy
      forceTarget.x -= fx
      forceTarget.y -= fy
    })
    
    // 3. Гравитация к центру (предотвращение разлёта графа)
    nodeMap.forEach((node) => {
      const force = forces.get(node.id)!
      const dx = opts.width / 2 - node.x
      const dy = opts.height / 2 - node.y
      
      force.x += dx * opts.centerGravity
      force.y += dy * opts.centerGravity
    })
    
    // 4. Применение сил с учётом температуры
    nodeMap.forEach((node) => {
      const force = forces.get(node.id)!
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y)
      
      if (magnitude > 0) {
        // Ограничиваем смещение температурой
        const displacement = Math.min(magnitude, temperature)
        
        node.x += (force.x / magnitude) * displacement
        node.y += (force.y / magnitude) * displacement
        
        // Держим узлы в границах с учетом размера узла
        const margin = 80
        node.x = Math.max(margin, Math.min(opts.width - margin, node.x))
        node.y = Math.max(margin, Math.min(opts.height - margin, node.y))
      }
    })
    
    // Охлаждение (уменьшение температуры)
    temperature *= opts.coolingFactor
  }
  
  // Дополнительная оптимизация: распределение узлов для минимизации пересечений рёбер
  // Увеличено количество итераций для лучшего результата
  resolveEdgeCrossings(nodeMap, edges, 100)
  
  // Нормализация и масштабирование под доступную область
  normalizeAndScaleLayout(nodeMap, opts.width, opts.height)
  
  // Возвращаем обновлённые узлы
  return nodes.map((node) => {
    const positioned = nodeMap.get(node.id)!
    return {
      ...node,
      x: positioned.x,
      y: positioned.y,
      width: positioned.width,
      height: positioned.height,
    }
  })
}

/**
 * Дополнительная оптимизация для уменьшения пересечений рёбер
 */
function resolveEdgeCrossings(
  nodeMap: Map<string, Node>,
  edges: Edge[],
  iterations: number
) {
  for (let i = 0; i < iterations; i++) {
    let improved = false
    
    // Пробуем небольшие перемещения узлов для уменьшения пересечений
    nodeMap.forEach((node) => {
      const currentCrossings = countCrossingsForNode(node.id, nodeMap, edges)
      
      // Пробуем 8 направлений с большим шагом
      const directions = [
        { x: 20, y: 0 },
        { x: -20, y: 0 },
        { x: 0, y: 20 },
        { x: 0, y: -20 },
        { x: 14, y: 14 },
        { x: -14, y: 14 },
        { x: 14, y: -14 },
        { x: -14, y: -14 },
      ]
      
      for (const dir of directions) {
        const originalX = node.x
        const originalY = node.y
        
        node.x += dir.x
        node.y += dir.y
        
        const newCrossings = countCrossingsForNode(node.id, nodeMap, edges)
        
        if (newCrossings < currentCrossings) {
          improved = true
          break // Нашли улучшение, оставляем новую позицию
        } else {
          // Возвращаем обратно
          node.x = originalX
          node.y = originalY
        }
      }
    })
    
    if (!improved) break // Не можем улучшить, выходим
  }
}

/**
 * Подсчитывает количество пересечений рёбер для конкретного узла
 */
function countCrossingsForNode(
  nodeId: string,
  nodeMap: Map<string, Node>,
  edges: Edge[]
): number {
  let crossings = 0
  
  // Находим все рёбра, связанные с этим узлом
  const nodeEdges = edges.filter(
    (e) => e.source === nodeId || e.target === nodeId
  )
  
  // Проверяем пересечения с другими рёбрами
  for (const edge1 of nodeEdges) {
    const source1 = nodeMap.get(edge1.source)
    const target1 = nodeMap.get(edge1.target)
    if (!source1 || !target1) continue
    
    for (const edge2 of edges) {
      if (edge1 === edge2) continue
      if (edge1.source === edge2.source && edge1.target === edge2.target) continue
      if (edge1.source === edge2.target && edge1.target === edge2.source) continue
      
      const source2 = nodeMap.get(edge2.source)
      const target2 = nodeMap.get(edge2.target)
      if (!source2 || !target2) continue
      
      if (doEdgesIntersect(source1, target1, source2, target2)) {
        crossings++
      }
    }
  }
  
  return crossings
}

/**
 * Проверяет, пересекаются ли два ребра
 */
function doEdgesIntersect(
  p1: Node,
  p2: Node,
  p3: Node,
  p4: Node
): boolean {
  // Используем векторное произведение для определения пересечения отрезков
  const ccw = (A: Node, B: Node, C: Node) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
  }
  
  // Не считаем пересечением, если рёбра имеют общую вершину
  if (p1.id === p3.id || p1.id === p4.id || p2.id === p3.id || p2.id === p4.id) {
    return false
  }
  
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
}

/**
 * Центрирует layout в заданной области
 */
function centerLayout(
  nodeMap: Map<string, Node>,
  width: number,
  height: number
) {
  const nodes = Array.from(nodeMap.values())
  
  if (nodes.length === 0) return
  
  // Находим границы
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  
  nodes.forEach((node) => {
    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x)
    minY = Math.min(minY, node.y)
    maxY = Math.max(maxY, node.y)
  })
  
  // Вычисляем смещение для центрирования
  const currentCenterX = (minX + maxX) / 2
  const currentCenterY = (minY + maxY) / 2
  const targetCenterX = width / 2
  const targetCenterY = height / 2
  
  const offsetX = targetCenterX - currentCenterX
  const offsetY = targetCenterY - currentCenterY
  
  // Применяем смещение
  nodes.forEach((node) => {
    node.x += offsetX
    node.y += offsetY
  })
}

/**
 * Нормализует и масштабирует layout для использования всей доступной области
 */
function normalizeAndScaleLayout(
  nodeMap: Map<string, Node>,
  width: number,
  height: number
) {
  const nodes = Array.from(nodeMap.values())
  
  if (nodes.length === 0) return
  
  // Находим текущие границы
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  
  nodes.forEach((node) => {
    minX = Math.min(minX, node.x - node.width / 2)
    maxX = Math.max(maxX, node.x + node.width / 2)
    minY = Math.min(minY, node.y - node.height / 2)
    maxY = Math.max(maxY, node.y + node.height / 2)
  })
  
  const currentWidth = maxX - minX
  const currentHeight = maxY - minY
  
  // Вычисляем масштаб для заполнения области (с отступами)
  const padding = 120
  const targetWidth = width - padding * 2
  const targetHeight = height - padding * 2
  
  const scaleX = currentWidth > 0 ? targetWidth / currentWidth : 1
  const scaleY = currentHeight > 0 ? targetHeight / currentHeight : 1
  
  // Используем минимальный масштаб, чтобы вписаться в область
  // Не увеличиваем больше чем на 20%, чтобы сохранить разреженность
  const scale = Math.min(scaleX, scaleY, 1.2)
  
  // Применяем масштаб и центрируем
  const currentCenterX = (minX + maxX) / 2
  const currentCenterY = (minY + maxY) / 2
  
  nodes.forEach((node) => {
    // Масштабируем относительно центра текущего layout
    node.x = (node.x - currentCenterX) * scale + width / 2
    node.y = (node.y - currentCenterY) * scale + height / 2
  })
}

/**
 * Простой круговой layout (для сравнения)
 */
export function calculateCircularLayout<T extends { id: string }>(
  nodes: T[],
  width: number = 1200,
  height: number = 800
): Array<T & { x: number; y: number; width: number; height: number }> {
  const radius = Math.min(width, height) * 0.35
  const centerX = width / 2
  const centerY = height / 2
  
  return nodes.map((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      width: 140,
      height: 70,
    }
  })
}
