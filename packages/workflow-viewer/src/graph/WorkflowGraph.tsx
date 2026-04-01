import React, { useMemo, useCallback, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
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

export interface WorkflowGraphHandle {
  fitView: () => void
  zoomIn: () => void
  zoomOut: () => void
}

// Helper component rendered inside <ReactFlow> to access the store
const FlowControls = forwardRef<WorkflowGraphHandle, { direction: Direction }>(
  function FlowControls({ direction }, ref) {
    const { fitView, zoomIn, zoomOut } = useReactFlow()

    useImperativeHandle(ref, () => ({
      fitView: () => fitView({ padding: 0.1 }),
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut(),
    }), [fitView, zoomIn, zoomOut])

    useEffect(() => {
      const t = setTimeout(() => fitView({ padding: 0.1 }), 50)
      return () => clearTimeout(t)
    }, [direction, fitView])

    return null
  }
)

const GraphInner = forwardRef<WorkflowGraphHandle, WorkflowGraphProps>(function GraphInner({
  nodes,
  edges,
  direction,
  searchQuery,
  minimapVisible,
  onNodeSelect,
}, ref) {
  const positioned = useMemo(
    () => computeLayout(nodes, edges, direction),
    [nodes, edges, direction],
  )

  const initialFlowNodes = useMemo(() => {
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

  const initialFlowEdges = useMemo(
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

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialFlowNodes)
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialFlowEdges)

  // Sync when layout changes (new YAML, direction change, search)
  useEffect(() => {
    setFlowNodes(initialFlowNodes)
  }, [initialFlowNodes, setFlowNodes])

  useEffect(() => {
    setFlowEdges(initialFlowEdges)
  }, [initialFlowEdges, setFlowEdges])

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
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      minZoom={0.1}
      maxZoom={2}
      nodesDraggable={true}
      proOptions={{ hideAttribution: true }}
    >
      <FlowControls ref={ref} direction={direction} />
      <Background gap={16} size={1} />
      {minimapVisible && (
        <MiniMap
          nodeStrokeWidth={3}
          style={{ background: 'var(--canvas-bg, #fafafa)' }}
        />
      )}
    </ReactFlow>
  )
})

export const WorkflowGraph = forwardRef<WorkflowGraphHandle, WorkflowGraphProps>(
  function WorkflowGraph(props, ref) {
    return (
      <ReactFlowProvider>
        <GraphInner ref={ref} {...props} />
      </ReactFlowProvider>
    )
  }
)
