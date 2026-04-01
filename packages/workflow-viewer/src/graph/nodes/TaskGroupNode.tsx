import React from 'react'
import { FolderOpen } from 'lucide-react'
import { NodeHandles } from './NodeHandles'
import type { GraphNode } from '../../types'

interface TaskGroupData extends GraphNode {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function TaskGroupNode({ data }: { data: TaskGroupData }) {
  const collapsed = data.collapsed
  const onToggleCollapse = data.onToggleCollapse
  const stepCount = data.metadata.stepCount ?? 0

  return (
    <div
      style={{
        border: '2px solid #333',
        borderRadius: 8,
        background: 'var(--node-bg, white)',
        width: '100%',
        height: '100%',
        boxShadow: 'var(--shadow)',
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
    </div>
  )
}
