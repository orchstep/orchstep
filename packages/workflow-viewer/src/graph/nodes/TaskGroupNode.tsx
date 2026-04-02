import React, { useCallback, useRef } from 'react'
import { FolderOpen } from 'lucide-react'
import { NodeHandles } from './NodeHandles'
import { useReactFlow } from '@xyflow/react'
import type { GraphNode } from '../../types'

interface TaskGroupData extends GraphNode {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const RESIZE_HANDLE_SIZE = 12

export function TaskGroupNode({ id, data }: { id: string; data: TaskGroupData }) {
  const collapsed = data.collapsed
  const onToggleCollapse = data.onToggleCollapse
  const stepCount = data.metadata.stepCount ?? 0
  const { setNodes } = useReactFlow()
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const node = document.querySelector(`[data-id="${id}"]`) as HTMLElement
    if (!node) return

    const rect = node.getBoundingClientRect()
    const zoom = rect.width / (parseFloat(node.style.width) || rect.width)

    resizing.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: parseFloat(node.style.width) || rect.width / zoom,
      startH: parseFloat(node.style.height) || rect.height / zoom,
    }

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      const dx = (ev.clientX - resizing.current.startX) / zoom
      const dy = (ev.clientY - resizing.current.startY) / zoom
      const newW = Math.max(200, resizing.current.startW + dx)
      const newH = Math.max(100, resizing.current.startH + dy)

      setNodes(nodes => nodes.map(n =>
        n.id === id ? { ...n, style: { ...n.style, width: newW, height: newH } } : n
      ))
    }

    const onMouseUp = () => {
      resizing.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [id, setNodes])

  return (
    <div
      style={{
        border: '2px solid #333',
        borderRadius: 8,
        background: 'var(--node-bg, white)',
        width: '100%',
        height: '100%',
        boxShadow: 'var(--shadow)',
        position: 'relative',
      }}
    >
      <NodeHandles />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: '#f0f0f0',
          borderBottom: '1px solid #ddd',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer',
        }}
        onClick={onToggleCollapse}
      >
        <FolderOpen size={14} color="#333" />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#666',
          }}
        >
          Task
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #111)', flex: 1 }}>
          {data.label}
        </span>
        {onToggleCollapse && (
          <span style={{ fontSize: 12, color: '#999' }}>
            {collapsed ? '\u25b8' : '\u25be'}
          </span>
        )}
      </div>
      {collapsed && (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-secondary, #888)' }}>
          {stepCount} steps (collapsed)
        </div>
      )}
      {/* Resize handle — bottom-right corner */}
      <div
        className="nodrag"
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: RESIZE_HANDLE_SIZE,
          height: RESIZE_HANDLE_SIZE,
          cursor: 'nwse-resize',
          borderRight: '2px solid #999',
          borderBottom: '2px solid #999',
          borderRadius: '0 0 6px 0',
          opacity: 0.4,
        }}
        title="Drag to resize"
      />
    </div>
  )
}
