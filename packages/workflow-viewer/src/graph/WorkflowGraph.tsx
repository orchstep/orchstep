import React, { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  useReactFlow,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { StepNode } from './nodes/StepNode'
import { TaskGroupNode } from './nodes/TaskGroupNode'
import { ConditionNode } from './nodes/ConditionNode'
import { LoopNode } from './nodes/LoopNode'
import { ModuleCallNode } from './nodes/ModuleCallNode'
import { ErrorHandlerNode } from './nodes/ErrorHandlerNode'
import { MergeDotNode } from './nodes/MergeDotNode'
import { CustomEdge } from './edges/CustomEdge'
import { computeLayout } from './layout/auto-layout'
import { EDGE_COLORS } from '../theme'
import type { GraphNode, GraphEdge, Direction } from '../types'

const nodeTypes: Record<string, any> = {
  step: StepNode,
  task: TaskGroupNode,
  condition: ConditionNode,
  loop: LoopNode,
  'module-call': ModuleCallNode,
  'error-handler': ErrorHandlerNode,
  mergeDot: MergeDotNode,
}

const edgeTypes: Record<string, any> = {
  custom: CustomEdge,
}

interface WorkflowGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  direction: Direction
  searchQuery: string
  minimapVisible: boolean
  onNodeSelect: (node: GraphNode | null) => void
}

function GraphInner({
  nodes,
  edges,
  direction,
  searchQuery,
  minimapVisible,
  onNodeSelect,
}: WorkflowGraphProps) {
  const { fitView, zoomIn: rfZoomIn, zoomOut: rfZoomOut } = useReactFlow()

  const positioned = useMemo(
    () => computeLayout(nodes, edges, direction),
    [nodes, edges, direction],
  )

  const flowNodes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return positioned.map((n) => {
      const matches =
        !query ||
        n.data.label.toLowerCase().includes(query) ||
        (n.data.metadata.func ?? '').toLowerCase().includes(query)
      return {
        ...n,
        style: {
          ...n.style,
          opacity: query && !matches ? 0.2 : 1,
          transition: 'opacity 0.2s',
        },
      }
    })
  }, [positioned, searchQuery])

  const flowEdges = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'custom' as const,
        data: { edgeType: e.type, label: e.label },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: EDGE_COLORS[e.type] ?? '#999',
        },
      })),
    [edges],
  )

  useEffect(() => {
    // small delay to let layout settle before fitting
    const t = setTimeout(() => fitView({ padding: 0.1 }), 50)
    return () => clearTimeout(t)
  }, [direction, fitView])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      const graphNode = node.data as GraphNode
      onNodeSelect(graphNode)
    },
    [onNodeSelect],
  )

  const onPaneClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={16} size={1} />
      {minimapVisible && (
        <MiniMap
          nodeStrokeWidth={3}
          style={{ background: 'var(--canvas-bg, #fafafa)' }}
        />
      )}
    </ReactFlow>
  )
}

export function WorkflowGraph(props: WorkflowGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  )
}

// Export zoom helpers — consumers can use useReactFlow directly or
// we expose a ref-based approach via the parent component.
export { useReactFlow }
