import dagre from '@dagrejs/dagre'
import type { GraphNode, GraphEdge, Direction } from '../../types'

interface PositionedNode {
  id: string
  position: { x: number; y: number }
  data: GraphNode
  type: string
  parentId?: string
  extent?: 'parent'
  expandParent?: boolean
  draggable?: boolean
  style?: Record<string, unknown>
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 60
const TASK_PADDING = 24
const TASK_HEADER = 40

export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: Direction
): PositionedNode[] {
  if (nodes.length === 0) return []

  // Step 1: Layout only non-task nodes using dagre (flat graph)
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    if (node.type === 'task') continue
    const height = node.type === 'merge-dot' ? 10 : NODE_HEIGHT
    g.setNode(node.id, { width: NODE_WIDTH, height, label: node.label })
  }

  for (const edge of edges) {
    if (edge.source === edge.target) continue
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  // Step 2: Collect absolute positions from dagre
  const absPositions = new Map<string, { x: number; y: number; w: number; h: number }>()
  for (const node of nodes) {
    if (node.type === 'task') continue
    const dn = g.node(node.id)
    if (!dn) continue
    const w = dn.width || NODE_WIDTH
    const h = dn.height || NODE_HEIGHT
    absPositions.set(node.id, {
      x: dn.x - w / 2,
      y: dn.y - h / 2,
      w,
      h,
    })
  }

  // Step 3: Compute task container bounds from their children
  const taskBounds = new Map<string, { x: number; y: number; w: number; h: number }>()
  for (const node of nodes) {
    if (node.type !== 'task') continue

    const children = nodes.filter(n => n.parentId === node.id)
    const childBounds = children
      .map(c => absPositions.get(c.id))
      .filter((p): p is { x: number; y: number; w: number; h: number } => p != null)

    if (childBounds.length === 0) {
      taskBounds.set(node.id, { x: 0, y: 0, w: NODE_WIDTH + TASK_PADDING * 2, h: 80 })
      continue
    }

    const minX = Math.min(...childBounds.map(p => p.x)) - TASK_PADDING
    const minY = Math.min(...childBounds.map(p => p.y)) - TASK_PADDING - TASK_HEADER
    const maxX = Math.max(...childBounds.map(p => p.x + p.w)) + TASK_PADDING
    const maxY = Math.max(...childBounds.map(p => p.y + p.h)) + TASK_PADDING

    taskBounds.set(node.id, { x: minX, y: minY, w: maxX - minX, h: maxY - minY })
  }

  // Step 4: Build positioned nodes
  // Task nodes come first (React Flow requires parents before children)
  const positioned: PositionedNode[] = []

  for (const node of nodes) {
    if (node.type !== 'task') continue
    const bounds = taskBounds.get(node.id)!
    positioned.push({
      id: node.id,
      position: { x: bounds.x, y: bounds.y },
      data: node,
      type: 'task',
      draggable: true,
      style: {
        width: bounds.w,
        height: bounds.h,
        zIndex: -1,
      },
    })
  }

  // Child nodes: position relative to parent task, constrained within it
  for (const node of nodes) {
    if (node.type === 'task') continue
    const abs = absPositions.get(node.id)
    if (!abs) continue

    const parentBounds = node.parentId ? taskBounds.get(node.parentId) : null

    if (parentBounds) {
      // Position relative to parent
      positioned.push({
        id: node.id,
        position: {
          x: abs.x - parentBounds.x,
          y: abs.y - parentBounds.y,
        },
        data: node,
        type: node.type === 'merge-dot' ? 'mergeDot' : node.type,
        parentId: node.parentId,
        extent: 'parent',
        expandParent: true,
        draggable: true,
      })
    } else {
      // No parent — absolute position
      positioned.push({
        id: node.id,
        position: { x: abs.x, y: abs.y },
        data: node,
        type: node.type === 'merge-dot' ? 'mergeDot' : node.type,
        draggable: true,
      })
    }
  }

  return positioned
}
