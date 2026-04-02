import React, { useMemo, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
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
import type { Node, NodeChange } from '@xyflow/react'
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
import { getBestHandles, getAbsolutePosition } from './edge-routing'
import { resolveTaskCollision } from './collision'
import { recalcTaskBounds } from './task-bounds'
import { EDGE_COLORS, DARK_EDGE_COLORS } from '../theme'
import type { GraphNode, GraphEdge, Direction, Theme } from '../types'

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
  theme: Theme
  searchQuery: string
  minimapVisible: boolean
  onNodeSelect: (node: GraphNode | null) => void
}

export interface WorkflowGraphHandle {
  fitView: () => void
  zoomIn: () => void
  zoomOut: () => void
}

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

/**
 * Compute edges with smart handle selection based on current node positions.
 */
function computeSmartEdges(
  graphEdges: GraphEdge[],
  flowNodes: Array<{ id: string; position: { x: number; y: number }; parentId?: string; style?: any }>,
  theme: Theme = 'light',
) {
  const colors = theme === 'dark' ? DARK_EDGE_COLORS : EDGE_COLORS
  return graphEdges.map((e) => {
    const sourceRect = getAbsolutePosition(e.source, flowNodes)
    const targetRect = getAbsolutePosition(e.target, flowNodes)
    const { sourceHandle, targetHandle } = getBestHandles(sourceRect, targetRect)

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      type: 'custom' as const,
      data: { edgeType: e.type, label: e.label },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: colors[e.type] ?? '#999',
      },
    }
  })
}

const GraphInner = forwardRef<WorkflowGraphHandle, WorkflowGraphProps>(function GraphInner({
  nodes,
  edges,
  direction,
  theme,
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
    () => computeSmartEdges(edges, initialFlowNodes, theme),
    [edges, initialFlowNodes, theme],
  )

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialFlowNodes as any)
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialFlowEdges as any)

  // Sync when layout changes (new YAML, direction change, search)
  useEffect(() => {
    setFlowNodes(initialFlowNodes as any)
  }, [initialFlowNodes, setFlowNodes])

  useEffect(() => {
    setFlowEdges(initialFlowEdges as any)
  }, [initialFlowEdges, setFlowEdges])

  // Handle node changes: auto-resize tasks, recompute edges, resolve collisions
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)

    const isDragging = changes.some(c => c.type === 'position' && c.dragging === true)
    const dragEnded = changes.some(c => c.type === 'position' && c.dragging === false)

    // Recompute edges during and after drag
    if (isDragging || dragEnded) {
      setTimeout(() => {
        setFlowNodes(currentNodes => {
          const smartEdges = computeSmartEdges(edges, currentNodes as any, theme)
          setFlowEdges(smartEdges as any)
          return currentNodes
        })
      }, 0)
    }

    // After any drag ends: auto-resize task containers + resolve collisions
    if (dragEnded) {
      setTimeout(() => {
        setFlowNodes(currentNodes => {
          let updated = [...currentNodes]
          let changed = false

          // 1. Auto-resize all task containers to fit their children
          const boundsResult = recalcTaskBounds(updated as any)
          if (boundsResult) {
            updated = boundsResult as any
            changed = true
          }

          // 2. Resolve task-to-task collisions
          for (const change of changes) {
            if (change.type === 'position' && !change.dragging && change.id) {
              const adjusted = resolveTaskCollision(change.id, updated as any)
              if (adjusted) {
                updated = updated.map(n =>
                  n.id === change.id ? { ...n, position: adjusted } : n
                )
                changed = true
              }
            }
          }

          // 3. Recalc bounds again after collision pushes
          if (changed) {
            const boundsResult2 = recalcTaskBounds(updated as any)
            if (boundsResult2) updated = boundsResult2 as any

            const smartEdges = computeSmartEdges(edges, updated as any, theme)
            setFlowEdges(smartEdges as any)
          }
          return changed ? updated : currentNodes
        })
      }, 50)
    }
  }, [onNodesChange, edges, theme, setFlowNodes, setFlowEdges])

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
      onNodesChange={handleNodesChange}
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
