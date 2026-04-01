import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseWorkflowYaml } from '../../src/parser/yaml-to-graph'

const fixture = (name: string) =>
  readFileSync(join(__dirname, '../fixtures', name), 'utf-8')

describe('parseSteps', () => {
  describe('conditional steps', () => {
    it('creates condition nodes for if/else', () => {
      const result = parseWorkflowYaml(fixture('conditions.yml'))
      const condNodes = result.nodes.filter((n) => n.type === 'condition')
      expect(condNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('creates conditional-true and conditional-false edges', () => {
      const result = parseWorkflowYaml(fixture('conditions.yml'))
      const trueEdges = result.edges.filter(
        (e) => e.type === 'conditional-true'
      )
      const falseEdges = result.edges.filter(
        (e) => e.type === 'conditional-false'
      )
      expect(trueEdges.length).toBeGreaterThanOrEqual(1)
      expect(falseEdges.length).toBeGreaterThanOrEqual(1)
    })

    it('creates conditional-elif edges for elif branches', () => {
      const result = parseWorkflowYaml(fixture('conditions.yml'))
      const elifEdges = result.edges.filter(
        (e) => e.type === 'conditional-elif'
      )
      // graded task has 2 elif branches
      expect(elifEdges).toHaveLength(2)
    })

    it('creates merge-dot nodes after conditions', () => {
      const result = parseWorkflowYaml(fixture('conditions.yml'))
      const mergeNodes = result.nodes.filter((n) => n.type === 'merge-dot')
      expect(mergeNodes.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('loop steps', () => {
    it('creates loop nodes', () => {
      const result = parseWorkflowYaml(fixture('loops.yml'))
      const loopNodes = result.nodes.filter((n) => n.type === 'loop')
      expect(loopNodes).toHaveLength(3)
    })

    it('creates loop-body self-loop edges', () => {
      const result = parseWorkflowYaml(fixture('loops.yml'))
      const loopEdges = result.edges.filter((e) => e.type === 'loop-body')
      expect(loopEdges).toHaveLength(3)
      // Each loop-body edge should be a self-loop
      for (const edge of loopEdges) {
        expect(edge.source).toBe(edge.target)
      }
    })

    it('extracts loop config for items loop', () => {
      const result = parseWorkflowYaml(fixture('loops.yml'))
      const itemsLoop = result.nodes.find(
        (n) => n.id === 'loop:main.deploy_to_all'
      )
      expect(itemsLoop).toBeDefined()
      expect(itemsLoop!.metadata.loopConfig?.items).toBe('{{ vars.servers }}')
    })

    it('extracts loop config for range loop', () => {
      const result = parseWorkflowYaml(fixture('loops.yml'))
      const rangeLoop = result.nodes.find(
        (n) => n.id === 'loop:main.retry_check'
      )
      expect(rangeLoop).toBeDefined()
      expect(rangeLoop!.metadata.loopConfig?.range).toEqual([1, 5])
      expect(rangeLoop!.metadata.loopConfig?.as).toBe('attempt')
    })

    it('extracts loop config for count loop', () => {
      const result = parseWorkflowYaml(fixture('loops.yml'))
      const countLoop = result.nodes.find(
        (n) => n.id === 'loop:main.counted_loop'
      )
      expect(countLoop).toBeDefined()
      expect(countLoop!.metadata.loopConfig?.count).toBe(3)
    })
  })

  describe('module call steps', () => {
    it('creates module-call nodes', () => {
      const result = parseWorkflowYaml(fixture('modules.yml'))
      const moduleNodes = result.nodes.filter((n) => n.type === 'module-call')
      expect(moduleNodes).toHaveLength(2)
    })

    it('creates module-call edges', () => {
      const result = parseWorkflowYaml(fixture('modules.yml'))
      const moduleEdges = result.edges.filter((e) => e.type === 'module-call')
      expect(moduleEdges).toHaveLength(2)
    })

    it('extracts module metadata', () => {
      const result = parseWorkflowYaml(fixture('modules.yml'))
      const healthCheck = result.nodes.find(
        (n) =>
          n.type === 'module-call' && n.id === 'step:main.check_health'
      )
      expect(healthCheck).toBeDefined()
      expect(healthCheck!.metadata.moduleName).toBe('healthcheck')
      expect(healthCheck!.metadata.taskRef).toBe('run')
      expect(healthCheck!.metadata.with).toEqual({
        endpoint: 'https://api.example.com/health',
      })
    })
  })

  describe('catch/finally on steps', () => {
    it('creates error-handler nodes for step catch', () => {
      const result = parseWorkflowYaml(fixture('error-handling.yml'))
      const errorNodes = result.nodes.filter((n) => n.type === 'error-handler')
      // task-level catch (1) + task-level finally (1) + step-level catch (1) + step-level finally (1)
      expect(errorNodes.length).toBeGreaterThanOrEqual(2)
    })

    it('creates error-path edges for catch blocks', () => {
      const result = parseWorkflowYaml(fixture('error-handling.yml'))
      const errorEdges = result.edges.filter((e) => e.type === 'error-path')
      expect(errorEdges.length).toBeGreaterThanOrEqual(1)
    })

    it('creates cleanup-path edges for finally blocks', () => {
      const result = parseWorkflowYaml(fixture('error-handling.yml'))
      const cleanupEdges = result.edges.filter((e) => e.type === 'cleanup-path')
      expect(cleanupEdges.length).toBeGreaterThanOrEqual(1)
    })

    it('parses retry config correctly', () => {
      const result = parseWorkflowYaml(fixture('error-handling.yml'))
      const apply = result.nodes.find((n) => n.id === 'step:deploy.apply')
      expect(apply).toBeDefined()
      expect(apply!.metadata.retry).toBeDefined()
      expect(apply!.metadata.retry!.maxAttempts).toBe(3)
      expect(apply!.metadata.retry!.interval).toBe('2s')
      expect(apply!.metadata.retry!.backoffRate).toBe(1.5)
    })
  })

  describe('complex workflow', () => {
    it('parses all node types without errors', () => {
      const result = parseWorkflowYaml(fixture('complex.yml'))
      expect(result.errors.filter((e) => e.severity === 'error')).toHaveLength(
        0
      )

      const nodeTypes = new Set(result.nodes.map((n) => n.type))
      expect(nodeTypes.has('task')).toBe(true)
      expect(nodeTypes.has('step')).toBe(true)
      expect(nodeTypes.has('condition')).toBe(true)
      expect(nodeTypes.has('loop')).toBe(true)
      expect(nodeTypes.has('error-handler')).toBe(true)
      // module-call appears in modules.yml fixture; complex.yml has module usage
      // inside finally blocks which are parsed as error-handler nodes
    })

    it('includes module-call nodes when modules are used as steps', () => {
      const result = parseWorkflowYaml(fixture('modules.yml'))
      const nodeTypes = new Set(result.nodes.map((n) => n.type))
      expect(nodeTypes.has('module-call')).toBe(true)
    })
  })
})
