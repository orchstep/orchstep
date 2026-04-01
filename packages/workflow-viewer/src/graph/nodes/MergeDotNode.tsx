import React from 'react'
import { NodeHandles } from './NodeHandles'

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
      <NodeHandles />
    </div>
  )
}
