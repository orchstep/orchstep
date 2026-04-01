import React from 'react'
import { Handle, Position } from '@xyflow/react'

export function MergeDotNode() {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#999',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}
