import dagre from '@dagrejs/dagre'
import type { GraphNode, GraphEdge, Direction } from '../../types'

interface PositionedNode {
  id: string
  position: { x: number; y: number }
  data: GraphNode
  type: string
  parentId?: string
  draggable?: boolean
  style?: Record<string, unknown>
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 60

export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: Direction
): PositionedNode[] {
  if (nodes.length === 0) return []

  // Use flat layout (no compound/setParent) to avoid dagre crash
  // when edges cross compound group boundaries
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  })
  g.setDefaultEdgeLabel(() => ({}))

  // Only add non-task nodes to dagre (tasks are rendered as visual containers)
  for (const node of nodes) {
    if (node.type === 'task') continue
    const height = node.type === 'merge-dot' ? 10 : NODE_HEIGHT
    g.setNode(node.id, { width: NODE_WIDTH, height, label: node.label })
  }

  // Add edges (skip self-loops and edges to/from missing nodes)
  for (const edge of edges) {
    if (edge.source === edge.target) continue
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  // Build positioned nodes for non-task nodes
  const positioned: PositionedNode[] = []
  const nodePositions = new Map<string, { x: number; y: number; w: number; h: number }>()

  for (const node of nodes) {
    if (node.type === 'task') continue
    const dagreNode = g.node(node.id)
    if (!dagreNode) continue

    const w = dagreNode.width || NODE_WIDTH
    const h = dagreNode.height || NODE_HEIGHT
    const pos = {
      x: dagreNode.x - w / 2,
      y: dagreNode.y - h / 2,
    }
    nodePositions.set(node.id, { ...pos, w, h })

    positioned.push({
      id: node.id,
      position: pos,
      data: node,
      type: node.type === 'merge-dot' ? 'mergeDot' : node.type,
    })
  }

  // Create task group nodes as visual containers positioned around their children
  for (const node of nodes) {
    if (node.type !== 'task') continue

    // Find all children (steps, conditions, loops, error handlers, merge dots)
    const children = nodes.filter(n => n.parentId === node.id)
    const childBounds = children
      .map(c => nodePositions.get(c.id))
      .filter((p): p is { x: number; y: number; w: number; h: number } => p != null)

    if (childBounds.length === 0) {
      // Task with no positioned children — give it a default position
      positioned.push({
        id: node.id,
        position: { x: 0, y: 0 },
        data: node,
        type: 'task',
        draggable: true,
        style: { width: NODE_WIDTH + 40, height: 80 },
      })
      continue
    }

    const padding = 24
    const headerHeight = 40
    const minX = Math.min(...childBounds.map(p => p.x)) - padding
    const minY = Math.min(...childBounds.map(p => p.y)) - padding - headerHeight
    const maxX = Math.max(...childBounds.map(p => p.x + p.w)) + padding
    const maxY = Math.max(...childBounds.map(p => p.y + p.h)) + padding

    positioned.push({
      id: node.id,
      position: { x: minX, y: minY },
      data: node,
      type: 'task',
      draggable: true,
      style: {
        width: maxX - minX,
        height: maxY - minY,
        zIndex: -1,
      },
    })
  }

  return positioned
}
