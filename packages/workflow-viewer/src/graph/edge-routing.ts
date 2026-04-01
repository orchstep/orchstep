/**
 * Smart edge routing: pick the closest source/target handles
 * based on the relative positions of connected nodes.
 */

interface NodeRect {
  x: number
  y: number
  width: number
  height: number
}

type Side = 'top' | 'right' | 'bottom' | 'left'

function getNodeCenter(rect: NodeRect): { cx: number; cy: number } {
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2,
  }
}

/**
 * Given two node rects, determine which side of source should connect
 * to which side of target for the shortest visual path.
 */
export function getBestHandles(
  source: NodeRect,
  target: NodeRect
): { sourceHandle: string; targetHandle: string } {
  const s = getNodeCenter(source)
  const t = getNodeCenter(target)

  const dx = t.cx - s.cx
  const dy = t.cy - s.cy

  let sourceSide: Side
  let targetSide: Side

  // Determine dominant direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant
    if (dx > 0) {
      sourceSide = 'right'
      targetSide = 'left'
    } else {
      sourceSide = 'left'
      targetSide = 'right'
    }
  } else {
    // Vertical dominant
    if (dy > 0) {
      sourceSide = 'bottom'
      targetSide = 'top'
    } else {
      sourceSide = 'top'
      targetSide = 'bottom'
    }
  }

  return {
    sourceHandle: sourceSide,
    targetHandle: targetSide === 'top' ? 'top' : `${targetSide}-target`,
  }
}

/**
 * Get the absolute position of a node, accounting for parent offset.
 */
export function getAbsolutePosition(
  nodeId: string,
  nodes: Array<{ id: string; position: { x: number; y: number }; parentId?: string; style?: any }>
): NodeRect {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return { x: 0, y: 0, width: 240, height: 60 }

  let x = node.position.x
  let y = node.position.y

  // If node has a parent, add parent's position
  if (node.parentId) {
    const parent = nodes.find(n => n.id === node.parentId)
    if (parent) {
      x += parent.position.x
      y += parent.position.y
    }
  }

  const width = node.style?.width ?? 240
  const height = node.style?.height ?? 60

  return { x, y, width, height }
}
