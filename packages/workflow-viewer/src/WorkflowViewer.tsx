import React, { useState, useMemo, useCallback, useRef } from 'react'
import { parseWorkflowYaml } from './parser/yaml-to-graph'
import { Toolbar } from './controls/Toolbar'
import { DetailPanel } from './panel/DetailPanel'
import { WorkflowGraph } from './graph/WorkflowGraph'
import { LIGHT_THEME, DARK_THEME } from './theme'
import type { WorkflowViewerProps, GraphNode, Direction, Theme } from './types'

export function WorkflowViewer({
  yaml,
  direction: initialDirection = 'AUTO',
  theme: initialTheme = 'light',
  onNodeClick,
  collapsed: initialCollapsed = false,
  interactive = true,
  className,
}: WorkflowViewerProps) {
  const [direction, setDirection] = useState<Direction>(initialDirection)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [minimapVisible, setMinimapVisible] = useState(false)
  const [allCollapsed, setAllCollapsed] = useState(initialCollapsed)

  const graphRef = useRef<{ fitView: () => void; zoomIn: () => void; zoomOut: () => void } | null>(null)

  const parseResult = useMemo(() => parseWorkflowYaml(yaml), [yaml])

  const themeVars = theme === 'dark' ? DARK_THEME : LIGHT_THEME

  const handleNodeSelect = useCallback(
    (node: GraphNode | null) => {
      setSelectedNode(node)
      if (node && onNodeClick) {
        onNodeClick(node)
      }
    },
    [onNodeClick],
  )

  const handleExport = useCallback(() => {
    const svgEl = document.querySelector('.react-flow__viewport')
    if (!svgEl) return
    // Simple PNG export via canvas
    const canvas = document.createElement('canvas')
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const a = document.createElement('a')
        a.download = 'workflow.png'
        a.href = canvas.toDataURL('image/png')
        a.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }, [])

  const errors = parseResult.errors.filter((e) => e.severity === 'error')
  const warnings = parseResult.errors.filter((e) => e.severity === 'warning')
  const hasNodes = parseResult.nodes.length > 0

  return (
    <div
      className={className}
      data-theme={theme}
      style={{
        ...themeVars,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'var(--canvas-bg)',
        color: 'var(--text-primary)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      } as React.CSSProperties}
    >
      {/* Error banner */}
      {errors.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            background: '#fde8e1',
            color: '#8b2500',
            fontSize: 13,
            borderBottom: '1px solid #e76f51',
          }}
        >
          {errors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </div>
      )}

      {/* Warning banner */}
      {warnings.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            background: '#fff3cd',
            color: '#856404',
            fontSize: 13,
            borderBottom: '1px solid #e9c46a',
          }}
        >
          {warnings.map((w, i) => (
            <div key={i}>{w.message}</div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      {interactive && (
        <Toolbar
          direction={direction}
          theme={theme}
          allCollapsed={allCollapsed}
          minimapVisible={minimapVisible}
          searchQuery={searchQuery}
          onDirectionChange={setDirection}
          onThemeChange={setTheme}
          onFitView={() => graphRef.current?.fitView()}
          onZoomIn={() => graphRef.current?.zoomIn()}
          onZoomOut={() => graphRef.current?.zoomOut()}
          onToggleCollapseAll={() => setAllCollapsed((c) => !c)}
          onToggleMinimap={() => setMinimapVisible((v) => !v)}
          onSearchChange={setSearchQuery}
          onExport={handleExport}
        />
      )}

      {/* Graph area */}
      {hasNodes ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <WorkflowGraph
            ref={graphRef}
            nodes={parseResult.nodes}
            edges={parseResult.edges}
            direction={direction}
            searchQuery={searchQuery}
            minimapVisible={minimapVisible}
            onNodeSelect={handleNodeSelect}
          />
          {selectedNode && (
            <DetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #888)',
            fontSize: 14,
          }}
        >
          {yaml?.trim()
            ? 'No tasks found in workflow'
            : 'Paste an OrchStep YAML to visualize'}
        </div>
      )}
    </div>
  )
}
