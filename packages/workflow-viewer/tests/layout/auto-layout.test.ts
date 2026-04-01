import { describe, it, expect } from 'vitest'
import { computeLayout } from '../../src/graph/layout/auto-layout'
import type { GraphNode, GraphEdge } from '../../src/types'

describe('computeLayout', () => {
  it('positions nodes without overlap', () => {
    const nodes: GraphNode[] = [
      { id: 'task:a', type: 'task', label: 'a', metadata: {} },
      { id: 'step:a.1', type: 'step', label: 's1', parentId: 'task:a', metadata: { func: 'shell' } },
      { id: 'step:a.2', type: 'step', label: 's2', parentId: 'task:a', metadata: { func: 'shell' } },
    ]
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'step:a.1', target: 'step:a.2', type: 'sequential' },
    ]

    const positioned = computeLayout(nodes, edges, 'TB')

    for (const node of positioned) {
      expect(node.position.x).toBeDefined()
      expect(node.position.y).toBeDefined()
    }

    const positions = positioned.map(n => `${n.position.x},${n.position.y}`)
    const unique = new Set(positions)
    expect(unique.size).toBe(positions.length)
  })

  it('handles TB and LR directions', () => {
    const nodes: GraphNode[] = [
      { id: 'n1', type: 'step', label: 'a', metadata: { func: 'shell' } },
      { id: 'n2', type: 'step', label: 'b', metadata: { func: 'shell' } },
    ]
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'n1', target: 'n2', type: 'sequential' },
    ]

    const tb = computeLayout(nodes, edges, 'TB')
    const lr = computeLayout(nodes, edges, 'LR')

    const tb1 = tb.find(n => n.id === 'n1')!
    const tb2 = tb.find(n => n.id === 'n2')!
    expect(tb2.position.y).toBeGreaterThan(tb1.position.y)

    const lr1 = lr.find(n => n.id === 'n1')!
    const lr2 = lr.find(n => n.id === 'n2')!
    expect(lr2.position.x).toBeGreaterThan(lr1.position.x)
  })

  it('handles empty input', () => {
    const positioned = computeLayout([], [], 'TB')
    expect(positioned).toHaveLength(0)
  })
})
