import * as react_jsx_runtime from 'react/jsx-runtime';

type NodeType = 'task' | 'step' | 'condition' | 'loop' | 'module-call' | 'error-handler' | 'merge-dot';
type Direction = 'TB' | 'LR' | 'AUTO';
type Theme = 'light' | 'dark';
interface LoopInfo {
    items?: string;
    count?: number;
    range?: [number, number];
    as?: string;
    onError?: string;
    until?: string;
    delay?: string;
}
interface RetryInfo {
    maxAttempts: number;
    interval?: string;
    backoffRate?: number;
    maxDelay?: string;
    jitter?: number;
    when?: string;
}
interface NodeMetadata {
    func?: string;
    command?: string;
    description?: string;
    condition?: string;
    loopConfig?: LoopInfo;
    retry?: RetryInfo;
    timeout?: string;
    totalTimeout?: string;
    outputs?: Record<string, string>;
    variables?: Record<string, unknown>;
    env?: Record<string, unknown>;
    with?: Record<string, unknown>;
    catch?: boolean;
    finally?: boolean;
    moduleSource?: string;
    moduleName?: string;
    taskRef?: string;
    yamlSnippet?: string;
    stepCount?: number;
    onError?: string;
    elifBranches?: Array<{
        condition: string;
        taskOrSteps: string;
    }>;
}
type EdgeType = 'sequential' | 'conditional-true' | 'conditional-false' | 'conditional-elif' | 'error-path' | 'cleanup-path' | 'loop-body' | 'task-call' | 'module-call';
interface GraphNode {
    id: string;
    type: NodeType;
    label: string;
    parentId?: string;
    metadata: NodeMetadata;
}
interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: EdgeType;
    label?: string;
}
interface ParseResult {
    nodes: GraphNode[];
    edges: GraphEdge[];
    errors: ParseError[];
}
interface ParseError {
    message: string;
    line?: number;
    severity: 'error' | 'warning';
}
interface WorkflowViewerProps {
    yaml: string;
    direction?: Direction;
    theme?: Theme;
    onNodeClick?: (node: GraphNode) => void;
    collapsed?: boolean;
    interactive?: boolean;
    className?: string;
}

declare function WorkflowViewer({ yaml, direction: initialDirection, theme: initialTheme, onNodeClick, collapsed: initialCollapsed, interactive, className, }: WorkflowViewerProps): react_jsx_runtime.JSX.Element;

/**
 * Parse an OrchStep workflow YAML string into a graph data structure
 * suitable for React Flow rendering.
 */
declare function parseWorkflowYaml(yamlString: string): ParseResult;

export { type Direction, type EdgeType, type GraphEdge, type GraphNode, type LoopInfo, type NodeMetadata, type NodeType, type ParseError, type ParseResult, type RetryInfo, type Theme, WorkflowViewer, type WorkflowViewerProps, parseWorkflowYaml };
