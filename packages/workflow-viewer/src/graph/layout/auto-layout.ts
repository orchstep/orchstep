import dagre from '@dagrejs/dagre'
import type { GraphNode, GraphEdge, Direction } from '../../types'

interface PositionedNode {
  id: string
  position: { x: number; y: number }
  data: GraphNode
  type: string
  parentId?: string
  style?: Record<string, unknown>
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 60
const TASK_PADDING = 20

export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: Direction
): PositionedNode[] {
  if (nodes.length === 0) return []

  const g = new dagre.graphlib.Graph({ compound: true })
  g.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    const width = node.type === 'task' ? NODE_WIDTH + TASK_PADDING * 2 : NODE_WIDTH
    const height = node.type === 'merge-dot' ? 10 : NODE_HEIGHT
    g.setNode(node.id, { width, height, label: node.label })
    if (node.parentId) {
      g.setParent(node.id, node.parentId)
    }
  }

  for (const edge of edges) {
    if (edge.source === edge.target) continue
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  const positioned: PositionedNode[] = []
  for (const node of nodes) {
    const dagreNode = g.node(node.id)
    if (!dagreNode) continue
    positioned.push({
      id: node.id,
      position: {
        x: dagreNode.x - (dagreNode.width || NODE_WIDTH) / 2,
        y: dagreNode.y - (dagreNode.height || NODE_HEIGHT) / 2,
      },
      data: node,
      type: node.type === 'merge-dot' ? 'mergeDot' : node.type,
      parentId: node.parentId,
      style: node.type === 'task' ? { width: dagreNode.width, height: dagreNode.height } : undefined,
    })
  }

  return positioned
}
