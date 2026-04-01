import React from 'react'
import { createRoot } from 'react-dom/client'
import { parseWorkflowYaml } from '../src/parser/yaml-to-graph'

const yaml = `name: test
tasks:
  build:
    steps:
      - name: compile
        func: shell
        do: echo hello
      - name: test
        func: shell
        do: echo test
`

const logEl = document.getElementById('log')!

function log(msg: string) {
  logEl.textContent += msg + '\n'
  console.log(msg)
}

try {
  log('1. Parsing YAML...')
  const result = parseWorkflowYaml(yaml)
  log(`   Nodes: ${result.nodes.length}, Edges: ${result.edges.length}, Errors: ${result.errors.length}`)
  log(`   Node types: ${result.nodes.map(n => n.type).join(', ')}`)
  log(`   Edge types: ${result.edges.map(e => e.type).join(', ')}`)
  log('')

  log('2. Importing React Flow...')
  const rf = await import('@xyflow/react')
  log(`   ReactFlow: ${typeof rf.ReactFlow}`)
  log(`   ReactFlowProvider: ${typeof rf.ReactFlowProvider}`)
  log('')

  log('3. Importing WorkflowViewer...')
  const { WorkflowViewer } = await import('../src/WorkflowViewer')
  log(`   WorkflowViewer: ${typeof WorkflowViewer}`)
  log('')

  log('4. Rendering...')
  const root = createRoot(document.getElementById('root')!)

  class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
    state = { error: null as Error | null }
    static getDerivedStateFromError(error: Error) { return { error } }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
      log(`REACT ERROR: ${error.message}`)
      log(`Stack: ${error.stack?.split('\n').slice(0, 5).join('\n')}`)
      log(`Component: ${info.componentStack?.split('\n').slice(0, 5).join('\n')}`)
    }
    render() {
      if (this.state.error) return <div style={{color:'red',padding:20}}>Error: {this.state.error.message}</div>
      return this.props.children
    }
  }

  root.render(
    <ErrorBoundary>
      <WorkflowViewer yaml={yaml} />
    </ErrorBoundary>
  )
  log('   render() called — check above for result')

} catch (e: any) {
  log(`FATAL: ${e.message}`)
  log(e.stack)
}
