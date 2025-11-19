'use server'

import fs from 'fs/promises'
import path from 'path'
import { getConnectionsGraph } from './getConnectionsGraph'

interface LayoutNode {
  id: string
  x: number
  y: number
}

interface LayoutData {
  nodes: LayoutNode[]
  zoom?: number
  pan?: { x: number; y: number }
}

/**
 * Генерация DOT файла для Graphviz на основе данных соединений
 * Документация: https://graphviz.org/docs/graph/
 */
export async function generateDotContent(): Promise<string> {
  const { nodes, edges } = await getConnectionsGraph()
  
  // Генерируем DOT граф
  const dotNodes = nodes.map((node: any) => 
    `  "${node.id}" [label="${node.name}", shape=box, style="filled,rounded", fillcolor="#dbeafe", color="#3b82f6"];`
  ).join('\n')
  
  const dotEdges = edges.map((edge: any) => {
    const label = edge.label ? ` [label="${edge.label.replace(/"/g, '\\"')}"]` : ''
    return `  "${edge.source}" -> "${edge.target}"${label};`
  }).join('\n')
  
  const dotContent = `digraph NetworkGraph {
  // Graph attributes
  rankdir=TB;
  bgcolor="#ffffff";
  fontname="Arial";
  fontsize=12;
  
  // Node defaults
  node [
    fontname="Arial",
    fontsize=12,
    color="#3b82f6",
    fillcolor="#dbeafe",
    style="filled,rounded"
  ];
  
  // Edge defaults
  edge [
    fontname="Arial",
    fontsize=10,
    color="#64748b"
  ];
  
  // Nodes
${dotNodes}
  
  // Edges
${dotEdges}
}
`
  
  return dotContent
}

/**
 * Сохранить DOT файл в public/graphviz
 */
export async function saveDotFile(layoutId: number, layoutName: string): Promise<{ success: boolean; error?: string; filename?: string }> {
  try {
    const dotContent = await generateDotContent()
    
    // Создаём безопасное имя файла (удаляем спецсимволы)
    const safeFilename = layoutName
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
    
    const filename = `${layoutId}_${safeFilename}.dot`
    const dirPath = path.join(process.cwd(), 'public', 'graphviz')
    const filePath = path.join(dirPath, filename)
    
    // Создаём директорию если не существует
    await fs.mkdir(dirPath, { recursive: true })
    
    // Сохраняем файл
    await fs.writeFile(filePath, dotContent, 'utf-8')
    
    console.log(`DOT file saved: ${filename}`)
    return { success: true, filename }
  } catch (error) {
    console.error('Error saving DOT file:', error)
    return { success: false, error: 'Не удалось сохранить DOT файл' }
  }
}

/**
 * Удалить DOT файл из public/graphviz
 */
export async function deleteDotFile(layoutId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'graphviz')
    
    // Ищем файл с префиксом layoutId
    const files = await fs.readdir(dirPath)
    const targetFile = files.find(f => f.startsWith(`${layoutId}_`))
    
    if (targetFile) {
      const filePath = path.join(dirPath, targetFile)
      await fs.unlink(filePath)
      console.log(`DOT file deleted: ${targetFile}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting DOT file:', error)
    return { success: false, error: 'Не удалось удалить DOT файл' }
  }
}
