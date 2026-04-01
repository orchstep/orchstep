import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseWorkflowYaml } from '../../src/parser/yaml-to-graph'

const fixture = (name: string) =>
  readFileSync(join(__dirname, '../fixtures', name), 'utf-8')

describe('parseWorkflowYaml', () => {
  describe('simple workflow', () => {
    it('creates task nodes for each task', () => {
      const result = parseWorkflowYaml(fixture('simple.yml'))
      const taskNodes = result.nodes.filter((n) => n.type === 'task')
      expect(taskNodes).toHaveLength(2)
      expect(taskNodes.map((n) => n.id)).toContain('task:build')
      expect(taskNodes.map((n) => n.id)).toContain('task:deploy')
    })

    it('creates step nodes for each step', () => {
      const result = parseWorkflowYaml(fixture('simple.yml'))
      const stepNodes = result.nodes.filter((n) => n.type === 'step')
      // build has 2 steps, deploy has 3 (1 task ref + 2 plain steps)
      // task ref steps are still step nodes
      expect(stepNodes.length).toBeGreaterThanOrEqual(4)
    })

    it('creates sequential edges between steps', () => {
      const result = parseWorkflowYaml(fixture('simple.yml'))
      const seqEdges = result.edges.filter((e) => e.type === 'sequential')
      // build: compile -> run_tests (1 sequential)
      // deploy: run_build -> push_image -> apply_config (2 sequential)
      expect(seqEdges).toHaveLength(3)
    })

    it('creates task-call edges for task references', () => {
      const result = parseWorkflowYaml(fixture('simple.yml'))
      const taskCallEdges = result.edges.filter((e) => e.type === 'task-call')
      // deploy.run_build references build
      expect(taskCallEdges).toHaveLength(1)
      expect(taskCallEdges[0].target).toBe('task:build')
    })

    it('extracts step metadata correctly', () => {
      const result = parseWorkflowYaml(fixture('simple.yml'))
      const compile = result.nodes.find((n) => n.id === 'step:build.compile')
      expect(compile).toBeDefined()
      expect(compile!.metadata.func).toBe('shell')
      expect(compile!.metadata.command).toBe('go build -o app ./cmd/app')
      expect(compile!.metadata.timeout).toBe('60s')
      expect(compile!.metadata.description).toBe('Compile source code')
    })

    it('captures outputs on steps', () => {
      const result = parseWorkflowYaml(fixture('simple.yml'))
      const runTests = result.nodes.find(
        (n) => n.id === 'step:build.run_tests'
      )
      expect(runTests).toBeDefined()
      expect(runTests!.metadata.outputs).toEqual({
        test_result: '{{ result.output }}',
      })
    })
  })

  describe('error handling', () => {
    it('handles malformed YAML without crashing', () => {
      const result = parseWorkflowYaml(fixture('malformed.yml'))
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].severity).toBe('error')
    })

    it('handles empty string', () => {
      const result = parseWorkflowYaml('')
      expect(result.nodes).toHaveLength(0)
      expect(result.edges).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('handles YAML with no tasks', () => {
      const result = parseWorkflowYaml('name: no-tasks\ndesc: nothing')
      expect(result.nodes).toHaveLength(0)
      expect(result.edges).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('circular references', () => {
    it('detects circular task references as warnings', () => {
      const result = parseWorkflowYaml(fixture('circular.yml'))
      const warnings = result.errors.filter((e) => e.severity === 'warning')
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0].message).toMatch(/circular/i)
    })
  })
})
