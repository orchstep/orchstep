/**
 * Recalculate task container bounds to tightly fit their children.
 * Always sets the container size to exactly wrap children + padding.
 * Handles both shrinking (child moved inward) and growing (child moved outward).
 */

const PADDING = 24
const HEADER_HEIGHT = 40
const CHILD_WIDTH = 240
const CHILD_HEIGHT = 60

interface FlowNode {
  id: string
  position: { x: number; y: number }
  parentId?: string
  type?: string
  style?: Record<string, any>
  data?: any
  measured?: { width?: number; height?: number }
  [key: string]: any
}

export function recalcTaskBounds(nodes: FlowNode[]): FlowNode[] | null {
  const taskNodes = nodes.filter(n => n.type === 'task')
  if (taskNodes.length === 0) return null

  let changed = false
  let updated = [...nodes]

  for (const task of taskNodes) {
    const children = updated.filter(n => n.parentId === task.id)
    if (children.length === 0) continue

    // Child positions are relative to parent
    const minX = Math.min(...children.map(c => c.position.x))
    const minY = Math.min(...children.map(c => c.position.y))
    const maxX = Math.max(...children.map(c => c.position.x + getChildWidth(c)))
    const maxY = Math.max(...children.map(c => c.position.y + getChildHeight(c)))

    // Desired size with padding
    const desiredWidth = (maxX - minX) + PADDING * 2
    const desiredHeight = (maxY - minY) + PADDING * 2 + HEADER_HEIGHT

    // Where children should start (relative to parent top-left)
    const idealMinX = PADDING
    const idealMinY = PADDING + HEADER_HEIGHT

    const shiftX = idealMinX - minX
    const shiftY = idealMinY - minY

    // Get current actual size (from style or measured)
    const currentWidth = task.style?.width ?? task.measured?.width ?? desiredWidth
    const currentHeight = task.style?.height ?? task.measured?.height ?? desiredHeight

    const sizeDiff = Math.abs(desiredWidth - currentWidth) > 2 ||
                     Math.abs(desiredHeight - currentHeight) > 2
    const positionDiff = Math.abs(shiftX) > 1 || Math.abs(shiftY) > 1

    if (sizeDiff || positionDiff) {
      updated = updated.map(n => {
        if (n.id === task.id) {
          return {
            ...n,
            position: positionDiff ? {
              x: n.position.x - shiftX,
              y: n.position.y - shiftY,
            } : n.position,
            style: {
              ...n.style,
              width: desiredWidth,
              height: desiredHeight,
            },
          }
        }
        if (n.parentId === task.id && positionDiff) {
          return {
            ...n,
            position: {
              x: n.position.x + shiftX,
              y: n.position.y + shiftY,
            },
          }
        }
        return n
      })
      changed = true
    }
  }

  return changed ? updated : null
}

function getChildWidth(node: FlowNode): number {
  return node.measured?.width ?? node.style?.width ?? CHILD_WIDTH
}

function getChildHeight(node: FlowNode): number {
  if (node.type === 'mergeDot') return 10
  return node.measured?.height ?? node.style?.height ?? CHILD_HEIGHT
}
