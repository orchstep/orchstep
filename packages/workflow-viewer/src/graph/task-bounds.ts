/**
 * Recalculate task container bounds to tightly fit their children.
 * Handles auto-shrink when children are moved closer together,
 * and auto-grow when children are moved apart.
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
  [key: string]: any
}

/**
 * Recalculate all task node bounds based on their current children positions.
 * Returns updated nodes array if any task changed, or null if no changes.
 */
export function recalcTaskBounds(nodes: FlowNode[]): FlowNode[] | null {
  const taskNodes = nodes.filter(n => n.type === 'task')
  if (taskNodes.length === 0) return null

  let changed = false
  let updated = [...nodes]

  for (const task of taskNodes) {
    const children = nodes.filter(n => n.parentId === task.id)
    if (children.length === 0) continue

    // Get child bounding box (positions are relative to parent)
    const minX = Math.min(...children.map(c => c.position.x))
    const minY = Math.min(...children.map(c => c.position.y))
    const maxX = Math.max(...children.map(c => c.position.x + getChildWidth(c)))
    const maxY = Math.max(...children.map(c => c.position.y + getChildHeight(c)))

    const newWidth = maxX - minX + PADDING * 2
    const newHeight = maxY - minY + PADDING * 2 + HEADER_HEIGHT

    const currentWidth = task.style?.width ?? newWidth
    const currentHeight = task.style?.height ?? newHeight

    // Check if bounds need updating (with a small tolerance to avoid jitter)
    const widthDiff = Math.abs(newWidth - currentWidth)
    const heightDiff = Math.abs(newHeight - currentHeight)

    if (widthDiff > 2 || heightDiff > 2) {
      // Compute how much the children need to shift so the top-left child
      // is at (PADDING, PADDING + HEADER_HEIGHT)
      const shiftX = PADDING - minX
      const shiftY = PADDING + HEADER_HEIGHT - minY

      updated = updated.map(n => {
        if (n.id === task.id) {
          // Update task size and position
          const newPos = {
            x: task.position.x - shiftX,
            y: task.position.y - shiftY,
          }
          return {
            ...n,
            position: newPos,
            style: { ...n.style, width: newWidth, height: newHeight },
          }
        }
        if (n.parentId === task.id) {
          // Shift children so they're properly positioned relative to new parent
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
  return node.style?.width ?? CHILD_WIDTH
}

function getChildHeight(node: FlowNode): number {
  if (node.type === 'mergeDot') return 10
  return node.style?.height ?? CHILD_HEIGHT
}
