import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Package } from 'lucide-react'
import type { GraphNode } from '../../types'

export function ModuleCallNode({ data, selected }: { data: GraphNode; selected?: boolean }) {
  const color = '#4a90d9'

  return (
    <div
      style={{
        background: 'var(--node-bg, white)',
        border: `1.5px dotted ${color}`,
        borderRadius: 6,
        padding: '8px 12px',
        minWidth: 180,
        boxShadow: selected
          ? `var(--shadow), 0 0 0 3px ${color}33`
          : 'var(--shadow)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Package size={16} color={color} />
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary, #111)' }}>
            {data.label}
          </div>
          {data.metadata.moduleName && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary, #888)',
                marginTop: 2,
              }}
            >
              {data.metadata.moduleName}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}
