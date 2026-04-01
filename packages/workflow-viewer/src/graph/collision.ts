/**
 * Collision detection for task container nodes.
 * Prevents task nodes from overlapping when dragged.
 */

const MIN_GAP = 20 // Minimum gap between task containers in pixels

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function getNodeRect(node: { id: string; position: { x: number; y: number }; style?: any }): Rect {
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.style?.width ?? 280,
    height: node.style?.height ?? 100,
  }
}

function rectsOverlap(a: Rect, b: Rect, gap: number): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  )
}

/**
 * After a task node is dragged, check if it overlaps any other task node.
 * If so, push the dragged node to the nearest non-overlapping position.
 * Returns the adjusted position, or the original if no collision.
 */
export function resolveTaskCollision(
  draggedId: string,
  nodes: Array<{ id: string; position: { x: number; y: number }; data?: any; type?: string; style?: any }>
): { x: number; y: number } | null {
  const dragged = nodes.find(n => n.id === draggedId)
  if (!dragged || dragged.type !== 'task') return null

  const draggedRect = getNodeRect(dragged)
  const otherTasks = nodes.filter(n => n.id !== draggedId && n.type === 'task')

  let hasCollision = false
  for (const other of otherTasks) {
    const otherRect = getNodeRect(other)
    if (rectsOverlap(draggedRect, otherRect, MIN_GAP)) {
      hasCollision = true
      break
    }
  }

  if (!hasCollision) return null

  // Find the nearest non-overlapping position by trying small adjustments
  const pos = { x: dragged.position.x, y: dragged.position.y }
  const step = 5
  const maxAttempts = 100

  // Try pushing in the direction away from the nearest overlapping task
  for (const other of otherTasks) {
    const otherRect = getNodeRect(other)
    if (!rectsOverlap(draggedRect, otherRect, MIN_GAP)) continue

    // Determine which direction to push
    const overlapX =
      Math.min(draggedRect.x + draggedRect.width, otherRect.x + otherRect.width) -
      Math.max(draggedRect.x, otherRect.x)
    const overlapY =
      Math.min(draggedRect.y + draggedRect.height, otherRect.y + otherRect.height) -
      Math.max(draggedRect.y, otherRect.y)

    if (overlapX < overlapY) {
      // Push horizontally
      if (draggedRect.x < otherRect.x) {
        pos.x = otherRect.x - draggedRect.width - MIN_GAP
      } else {
        pos.x = otherRect.x + otherRect.width + MIN_GAP
      }
    } else {
      // Push vertically
      if (draggedRect.y < otherRect.y) {
        pos.y = otherRect.y - draggedRect.height - MIN_GAP
      } else {
        pos.y = otherRect.y + otherRect.height + MIN_GAP
      }
    }
    break // Fix collision with the first overlapping task
  }

  return pos
}
