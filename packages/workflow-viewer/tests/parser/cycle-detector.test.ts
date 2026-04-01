import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { detectCycles } from '../../src/parser/cycle-detector'
import { GraphEdge } from '../../src/types'

const fixture = (name: string) =>
  readFileSync(join(__dirname, '../fixtures', name), 'utf-8')

describe('detectCycles', () => {
  it('detects circular task references', () => {
    const edges: GraphEdge[] = [
      {
        id: 'edge:step:task_a.call_b->task:task_b',
        source: 'step:task_a.call_b',
        target: 'task:task_b',
        type: 'task-call',
      },
      {
        id: 'edge:step:task_b.call_a->task:task_a',
        source: 'step:task_b.call_a',
        target: 'task:task_a',
        type: 'task-call',
      },
    ]

    const warnings = detectCycles(edges)
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0].severity).toBe('warning')
    expect(warnings[0].message).toMatch(/circular/i)
  })

  it('does not flag non-circular workflows', () => {
    const edges: GraphEdge[] = [
      {
        id: 'edge:step:deploy.run_build->task:build',
        source: 'step:deploy.run_build',
        target: 'task:build',
        type: 'task-call',
      },
    ]

    const warnings = detectCycles(edges)
    expect(warnings).toHaveLength(0)
  })

  it('handles empty edge list', () => {
    const warnings = detectCycles([])
    expect(warnings).toHaveLength(0)
  })

  it('handles multiple independent chains without cycles', () => {
    const edges: GraphEdge[] = [
      {
        id: 'edge:step:c.call_a->task:a',
        source: 'step:c.call_a',
        target: 'task:a',
        type: 'task-call',
      },
      {
        id: 'edge:step:c.call_b->task:b',
        source: 'step:c.call_b',
        target: 'task:b',
        type: 'task-call',
      },
    ]

    const warnings = detectCycles(edges)
    expect(warnings).toHaveLength(0)
  })
})
