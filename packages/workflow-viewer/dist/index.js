"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  WorkflowViewer: () => WorkflowViewer,
  parseWorkflowYaml: () => parseWorkflowYaml
});
module.exports = __toCommonJS(index_exports);

// src/WorkflowViewer.tsx
var import_react9 = require("react");
var import_html_to_image = require("html-to-image");

// src/parser/yaml-to-graph.ts
var import_yaml2 = require("yaml");

// src/parser/parse-steps.ts
var import_yaml = require("yaml");
function parseSteps(taskName, steps, modules) {
  const nodes = [];
  const edges = [];
  let prevNodeId = null;
  for (const rawStep of steps) {
    const step = rawStep;
    const stepName = step.name;
    if (!stepName) continue;
    const result = parseSingleStep(taskName, step, modules);
    nodes.push(...result.nodes);
    edges.push(...result.edges);
    const mainNodeId = result.mainNodeId;
    if (prevNodeId && mainNodeId) {
      edges.push({
        id: `edge:${prevNodeId}->${mainNodeId}`,
        source: prevNodeId,
        target: mainNodeId,
        type: "sequential"
      });
    }
    prevNodeId = result.lastNodeId ?? mainNodeId;
  }
  return { nodes, edges };
}
function parseSingleStep(taskName, step, modules) {
  const stepName = step.name;
  const nodes = [];
  const edges = [];
  if (step.if != null) {
    return parseConditionalStep(taskName, step, modules);
  }
  if (step.loop != null) {
    return parseLoopStep(taskName, step);
  }
  if (step.module != null) {
    return parseModuleStep(taskName, step, modules);
  }
  if (step.task != null && step.if == null) {
    return parseTaskRefStep(taskName, step);
  }
  const nodeId = `step:${taskName}.${stepName}`;
  const metadata = extractMetadata(step);
  const node = {
    id: nodeId,
    type: "step",
    label: stepName,
    parentId: `task:${taskName}`,
    metadata
  };
  nodes.push(node);
  const errorResult = parseStepErrorHandling(taskName, stepName, nodeId, step);
  nodes.push(...errorResult.nodes);
  edges.push(...errorResult.edges);
  return {
    nodes,
    edges,
    mainNodeId: nodeId,
    lastNodeId: errorResult.lastNodeId
  };
}
function parseConditionalStep(taskName, step, _modules) {
  const stepName = step.name;
  const conditionNodeId = `condition:${taskName}.${stepName}`;
  const mergeNodeId = `merge:${taskName}.${stepName}`;
  const nodes = [];
  const edges = [];
  const elifBranches = [];
  if (Array.isArray(step.elif)) {
    for (const branch of step.elif) {
      elifBranches.push({
        condition: String(branch.if ?? ""),
        taskOrSteps: String(branch.task ?? "")
      });
    }
  }
  const metadata = {
    condition: String(step.if),
    taskRef: step.task,
    yamlSnippet: generateSnippet(step),
    elifBranches: elifBranches.length > 0 ? elifBranches : void 0
  };
  nodes.push({
    id: conditionNodeId,
    type: "condition",
    label: stepName,
    parentId: `task:${taskName}`,
    metadata
  });
  let allBranchesExternal = true;
  if (step.task) {
    const targetTaskId = `task:${step.task}`;
    edges.push({
      id: `edge:${conditionNodeId}->${targetTaskId}:true`,
      source: conditionNodeId,
      target: targetTaskId,
      type: "conditional-true",
      label: "true"
    });
  } else if (step.then) {
    allBranchesExternal = false;
  }
  if (step.else && typeof step.else === "string") {
    const elseTaskId = `task:${step.else}`;
    edges.push({
      id: `edge:${conditionNodeId}->${elseTaskId}:false`,
      source: conditionNodeId,
      target: elseTaskId,
      type: "conditional-false",
      label: "false"
    });
  } else if (step.else) {
    allBranchesExternal = false;
  }
  if (Array.isArray(step.elif)) {
    for (const branch of step.elif) {
      if (branch.task) {
        const elifTaskId = `task:${branch.task}`;
        edges.push({
          id: `edge:${conditionNodeId}->${elifTaskId}:elif`,
          source: conditionNodeId,
          target: elifTaskId,
          type: "conditional-elif",
          label: String(branch.if ?? "elif")
        });
      } else {
        allBranchesExternal = false;
      }
    }
  }
  if (!allBranchesExternal) {
    nodes.push({
      id: mergeNodeId,
      type: "merge-dot",
      label: "",
      parentId: `task:${taskName}`,
      metadata: {}
    });
  }
  return {
    nodes,
    edges,
    mainNodeId: conditionNodeId,
    lastNodeId: allBranchesExternal ? conditionNodeId : mergeNodeId
  };
}
function parseLoopStep(taskName, step) {
  const stepName = step.name;
  const nodeId = `loop:${taskName}.${stepName}`;
  const nodes = [];
  const edges = [];
  const loopConfig = extractLoopConfig(step.loop);
  const metadata = extractMetadata(step);
  metadata.loopConfig = loopConfig;
  nodes.push({
    id: nodeId,
    type: "loop",
    label: stepName,
    parentId: `task:${taskName}`,
    metadata
  });
  edges.push({
    id: `edge:${nodeId}->${nodeId}:loop`,
    source: nodeId,
    target: nodeId,
    type: "loop-body",
    label: "loop"
  });
  return { nodes, edges, mainNodeId: nodeId };
}
function parseModuleStep(taskName, step, modules) {
  const stepName = step.name;
  const nodeId = `step:${taskName}.${stepName}`;
  const moduleName = step.module;
  const moduleInfo = modules.get(moduleName);
  const nodes = [];
  const edges = [];
  const metadata = {
    moduleName,
    moduleSource: moduleInfo?.source,
    taskRef: step.task,
    with: step.with,
    yamlSnippet: generateSnippet(step)
  };
  nodes.push({
    id: nodeId,
    type: "module-call",
    label: stepName,
    parentId: `task:${taskName}`,
    metadata
  });
  const moduleTargetId = `module:${moduleName}`;
  edges.push({
    id: `edge:${nodeId}->${moduleTargetId}`,
    source: nodeId,
    target: moduleTargetId,
    type: "module-call"
  });
  return { nodes, edges, mainNodeId: nodeId };
}
function parseTaskRefStep(taskName, step) {
  const stepName = step.name;
  const nodeId = `step:${taskName}.${stepName}`;
  const nodes = [];
  const edges = [];
  const metadata = {
    taskRef: step.task,
    yamlSnippet: generateSnippet(step)
  };
  nodes.push({
    id: nodeId,
    type: "step",
    label: stepName,
    parentId: `task:${taskName}`,
    metadata
  });
  const targetTaskId = `task:${step.task}`;
  edges.push({
    id: `edge:${nodeId}->${targetTaskId}`,
    source: nodeId,
    target: targetTaskId,
    type: "task-call"
  });
  return { nodes, edges, mainNodeId: nodeId };
}
function parseStepErrorHandling(taskName, stepName, stepNodeId, step) {
  const nodes = [];
  const edges = [];
  let lastNodeId;
  if (Array.isArray(step.catch)) {
    const catchId = `error-handler:${taskName}.${stepName}_catch`;
    nodes.push({
      id: catchId,
      type: "error-handler",
      label: `${stepName} catch`,
      parentId: `task:${taskName}`,
      metadata: { catch: true, stepCount: step.catch.length }
    });
    edges.push({
      id: `edge:${stepNodeId}->${catchId}`,
      source: stepNodeId,
      target: catchId,
      type: "error-path"
    });
  }
  if (Array.isArray(step.finally)) {
    const finallyId = `error-handler:${taskName}.${stepName}_finally`;
    nodes.push({
      id: finallyId,
      type: "error-handler",
      label: `${stepName} finally`,
      parentId: `task:${taskName}`,
      metadata: {
        finally: true,
        stepCount: step.finally.length
      }
    });
    edges.push({
      id: `edge:${stepNodeId}->${finallyId}`,
      source: stepNodeId,
      target: finallyId,
      type: "cleanup-path"
    });
    lastNodeId = finallyId;
  }
  return { nodes, edges, lastNodeId };
}
function extractMetadata(step) {
  const metadata = {};
  if (step.func) metadata.func = step.func;
  if (step.do) metadata.command = step.do;
  if (step.desc) metadata.description = step.desc;
  if (step.timeout) metadata.timeout = step.timeout;
  if (step.outputs)
    metadata.outputs = step.outputs;
  if (step.vars || step.variables)
    metadata.variables = step.vars ?? step.variables;
  if (step.env) metadata.env = step.env;
  if (step.with) metadata.with = step.with;
  if (step.on_error) metadata.onError = step.on_error;
  if (step.total_timeout)
    metadata.totalTimeout = step.total_timeout;
  if (step.retry) {
    metadata.retry = extractRetryInfo(step.retry);
  }
  metadata.yamlSnippet = generateSnippet(step);
  return metadata;
}
function extractRetryInfo(retry) {
  return {
    maxAttempts: retry.max_attempts ?? 1,
    interval: retry.interval,
    backoffRate: retry.backoff_rate,
    maxDelay: retry.max_delay,
    jitter: retry.jitter,
    when: retry.when
  };
}
function extractLoopConfig(loop) {
  if (typeof loop === "string") {
    return { items: loop };
  }
  if (typeof loop === "number") {
    return { count: loop };
  }
  if (typeof loop === "object" && loop !== null) {
    const l = loop;
    return {
      items: l.items,
      count: l.count,
      range: l.range,
      as: l.as,
      onError: l.on_error,
      until: l.until,
      delay: l.delay
    };
  }
  return {};
}
function generateSnippet(step) {
  try {
    return (0, import_yaml.stringify)(step).trim();
  } catch {
    return "";
  }
}

// src/parser/cycle-detector.ts
function detectCycles(edges) {
  const taskCallEdges = edges.filter(
    (e) => e.type === "task-call" || (e.type === "conditional-true" || e.type === "conditional-false" || e.type === "conditional-elif") && e.target.startsWith("task:")
  );
  if (taskCallEdges.length === 0) return [];
  const adj = /* @__PURE__ */ new Map();
  for (const edge of taskCallEdges) {
    const sourceMatch = edge.source.match(/^step:([^.]+)\./);
    if (!sourceMatch) continue;
    const sourceTask = sourceMatch[1];
    const targetTask = edge.target.replace(/^task:/, "");
    if (!adj.has(sourceTask)) adj.set(sourceTask, /* @__PURE__ */ new Set());
    adj.get(sourceTask).add(targetTask);
  }
  const warnings = [];
  const visited = /* @__PURE__ */ new Set();
  const inStack = /* @__PURE__ */ new Set();
  function dfs(node, path) {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = [...path.slice(cycleStart), node];
      warnings.push({
        message: `Circular task reference detected: ${cycle.join(" -> ")}`,
        severity: "warning"
      });
      return true;
    }
    if (visited.has(node)) return false;
    visited.add(node);
    inStack.add(node);
    path.push(node);
    const neighbors = adj.get(node);
    if (neighbors) {
      for (const next of neighbors) {
        dfs(next, path);
      }
    }
    path.pop();
    inStack.delete(node);
    return false;
  }
  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }
  return warnings;
}

// src/parser/yaml-to-graph.ts
function parseWorkflowYaml(yamlString) {
  const nodes = [];
  const edges = [];
  const errors = [];
  if (!yamlString || yamlString.trim() === "") {
    return { nodes, edges, errors };
  }
  let doc;
  try {
    doc = (0, import_yaml2.parse)(yamlString);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse YAML";
    errors.push({ message, severity: "error" });
    return { nodes, edges, errors };
  }
  if (!doc || typeof doc !== "object") {
    return { nodes, edges, errors };
  }
  const modules = /* @__PURE__ */ new Map();
  if (Array.isArray(doc.modules)) {
    for (const mod of doc.modules) {
      if (mod.name && mod.source) {
        modules.set(mod.name, { source: mod.source });
      }
    }
  }
  const tasks = doc.tasks;
  if (!tasks || typeof tasks !== "object") {
    return { nodes, edges, errors };
  }
  for (const [taskName, taskDef] of Object.entries(tasks)) {
    const taskNodeId = `task:${taskName}`;
    const taskNode = {
      id: taskNodeId,
      type: "task",
      label: taskName,
      metadata: {
        description: taskDef.desc,
        variables: taskDef.vars,
        stepCount: Array.isArray(taskDef.steps) ? taskDef.steps.length : 0
      }
    };
    nodes.push(taskNode);
    if (Array.isArray(taskDef.steps)) {
      const stepResult = parseSteps(taskName, taskDef.steps, modules);
      nodes.push(...stepResult.nodes);
      edges.push(...stepResult.edges);
    }
    if (Array.isArray(taskDef.catch)) {
      const catchSteps = taskDef.catch;
      for (let i = 0; i < catchSteps.length; i++) {
        const catchStep = catchSteps[i];
        const catchNodeId = `error-handler:${taskName}.catch_${i}`;
        nodes.push({
          id: catchNodeId,
          type: "error-handler",
          label: catchStep.name ?? `catch_${i}`,
          parentId: taskNodeId,
          metadata: {
            catch: true,
            func: catchStep.func,
            command: catchStep.do
          }
        });
        edges.push({
          id: `edge:${taskNodeId}->${catchNodeId}`,
          source: taskNodeId,
          target: catchNodeId,
          type: "error-path"
        });
      }
    }
    if (Array.isArray(taskDef.finally)) {
      const finallySteps = taskDef.finally;
      for (let i = 0; i < finallySteps.length; i++) {
        const finallyStep = finallySteps[i];
        const finallyNodeId = `error-handler:${taskName}.finally_${i}`;
        nodes.push({
          id: finallyNodeId,
          type: "error-handler",
          label: finallyStep.name ?? `finally_${i}`,
          parentId: taskNodeId,
          metadata: {
            finally: true,
            func: finallyStep.func,
            command: finallyStep.do
          }
        });
        edges.push({
          id: `edge:${taskNodeId}->${finallyNodeId}`,
          source: taskNodeId,
          target: finallyNodeId,
          type: "cleanup-path"
        });
      }
    }
  }
  const cycleWarnings = detectCycles(edges);
  errors.push(...cycleWarnings);
  return { nodes, edges, errors };
}

// src/controls/Toolbar.tsx
var import_react = require("react");
var import_lucide_react = require("lucide-react");
var import_jsx_runtime = require("react/jsx-runtime");
var btnStyle = {
  background: "none",
  border: "1px solid var(--panel-border, #e0e0e0)",
  borderRadius: 4,
  padding: "4px 8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: "var(--text-primary, #111)",
  fontSize: 12
};
function Toolbar({
  direction,
  theme,
  minimapVisible,
  searchQuery,
  allCollapsed,
  onDirectionChange,
  onThemeChange,
  onFitView,
  onZoomIn,
  onZoomOut,
  onToggleMinimap,
  onSearchChange,
  onExport,
  onCopy,
  onCollapseAll,
  onExpandAll
}) {
  const [searchOpen, setSearchOpen] = (0, import_react.useState)(false);
  const inputRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);
  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      onSearchChange("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        padding: "6px 12px",
        gap: 6,
        borderBottom: "1px solid var(--panel-border, #e0e0e0)",
        background: "var(--panel-bg, white)",
        flexShrink: 0
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 4 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: btnStyle, onClick: onZoomIn, title: "Zoom In", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ZoomIn, { size: 14 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: btnStyle, onClick: onZoomOut, title: "Zoom Out", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ZoomOut, { size: 14 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: btnStyle, onClick: onFitView, title: "Fit View", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Maximize2, { size: 14 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              style: btnStyle,
              onClick: () => {
                const next = direction === "AUTO" ? "TB" : direction === "TB" ? "LR" : "AUTO";
                onDirectionChange(next);
              },
              title: direction === "AUTO" ? "Smart Layout" : direction === "TB" ? "Vertical" : "Horizontal",
              children: [
                direction === "AUTO" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Sparkles, { size: 14 }) : direction === "TB" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowDown, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowRight, { size: 14 }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11 }, children: direction === "AUTO" ? "Smart" : direction === "TB" ? "Vertical" : "Horizontal" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              style: btnStyle,
              onClick: allCollapsed ? onExpandAll : onCollapseAll,
              title: allCollapsed ? "Expand All Tasks" : "Collapse All Tasks",
              children: allCollapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ChevronsUpDown, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ChevronsDownUp, { size: 14 })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, display: "flex", justifyContent: "center" }, children: searchOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            ref: inputRef,
            type: "text",
            value: searchQuery,
            onChange: (e) => onSearchChange(e.target.value),
            onKeyDown: handleSearchKeyDown,
            placeholder: "Search nodes...",
            style: {
              padding: "4px 8px",
              border: "1px solid var(--panel-border, #e0e0e0)",
              borderRadius: 4,
              fontSize: 12,
              width: 200,
              background: "var(--node-bg, white)",
              color: "var(--text-primary, #111)",
              outline: "none"
            }
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { style: btnStyle, onClick: () => setSearchOpen(true), title: "Search", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { size: 14 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Search" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 4 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              style: { ...btnStyle, ...minimapVisible ? { background: "var(--canvas-bg, #fafafa)" } : {} },
              onClick: onToggleMinimap,
              title: "Toggle Minimap",
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Map, { size: 14 })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              style: btnStyle,
              onClick: () => onThemeChange(theme === "light" ? "dark" : "light"),
              title: theme === "light" ? "Dark Mode" : "Light Mode",
              children: theme === "light" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Moon, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Sun, { size: 14 })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: btnStyle, onClick: onExport, title: "Export PNG", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Download, { size: 14 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: btnStyle, onClick: onCopy, title: "Copy to Clipboard", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Copy, { size: 14 }) })
        ] })
      ]
    }
  );
}

// src/panel/DetailPanel.tsx
var import_react2 = require("react");
var import_lucide_react3 = require("lucide-react");

// src/theme.ts
var import_lucide_react2 = require("lucide-react");
var NODE_COLORS = {
  shell: "#2d6a4f",
  http: "#4a90d9",
  assert: "#e76f51",
  git: "#6c757d",
  transform: "#555555",
  render: "#555555",
  wait: "#555555",
  default: "#555555",
  task: "#333333",
  condition: "#e9c46a",
  loop: "#9b59b6",
  "module-call": "#4a90d9",
  catch: "#e76f51",
  finally: "#6c757d"
};
var NODE_ICONS = {
  shell: import_lucide_react2.Terminal,
  http: import_lucide_react2.Globe,
  assert: import_lucide_react2.CheckCircle,
  git: import_lucide_react2.GitBranch,
  transform: import_lucide_react2.Shuffle,
  render: import_lucide_react2.FileText,
  wait: import_lucide_react2.Clock,
  default: import_lucide_react2.HelpCircle,
  task: import_lucide_react2.FolderOpen,
  condition: import_lucide_react2.GitFork,
  loop: import_lucide_react2.RefreshCw,
  "module-call": import_lucide_react2.Package,
  catch: import_lucide_react2.AlertTriangle,
  finally: import_lucide_react2.Shield
};
function getNodeColor(nodeType, func) {
  if (nodeType === "step" && func) {
    return NODE_COLORS[func] || NODE_COLORS.default;
  }
  return NODE_COLORS[nodeType] || NODE_COLORS.default;
}
function getNodeIcon(nodeType, func) {
  if (nodeType === "step" && func) {
    return NODE_ICONS[func] || NODE_ICONS.default;
  }
  return NODE_ICONS[nodeType] || NODE_ICONS.default;
}
var EDGE_COLORS = {
  sequential: "#999999",
  "conditional-true": "#2d6a4f",
  "conditional-false": "#e76f51",
  "conditional-elif": "#e9c46a",
  "error-path": "#e76f51",
  "cleanup-path": "#6c757d",
  "task-call": "#333333",
  "module-call": "#4a90d9",
  "loop-body": "#9b59b6"
};
var EDGE_STYLES = {
  sequential: "solid",
  "conditional-true": "solid",
  "conditional-false": "solid",
  "conditional-elif": "solid",
  "error-path": "dashed",
  "cleanup-path": "dashed",
  "task-call": "dotted",
  "module-call": "dotted",
  "loop-body": "solid"
};
var LIGHT_THEME = {
  "--canvas-bg": "#fafafa",
  "--node-bg": "white",
  "--text-primary": "#111111",
  "--text-secondary": "#888888",
  "--edge-color": "#999999",
  "--panel-bg": "white",
  "--panel-border": "#e0e0e0",
  "--shadow": "0 1px 3px rgba(0,0,0,0.06)",
  "--task-header-bg": "#f0f0f0",
  "--task-border": "#333333"
};
var DARK_THEME = {
  "--canvas-bg": "#1a1a2e",
  "--node-bg": "#242438",
  "--text-primary": "#e0e0e0",
  "--text-secondary": "#888888",
  "--edge-color": "#aaaaaa",
  "--panel-bg": "#1e1e30",
  "--panel-border": "#333355",
  "--shadow": "0 1px 3px rgba(0,0,0,0.3)",
  "--task-header-bg": "#2a2a40",
  "--task-border": "#888888"
};
var DARK_EDGE_COLORS = {
  sequential: "#e0e0e0",
  "conditional-true": "#5dd88a",
  "conditional-false": "#f09070",
  "conditional-elif": "#f0d060",
  "error-path": "#f09070",
  "cleanup-path": "#cccccc",
  "task-call": "#7ec8e3",
  "module-call": "#7ec8e3",
  "loop-body": "#cc90f0"
};

// src/panel/DetailPanel.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Section({
  title,
  collapsible,
  defaultCollapsed,
  children
}) {
  const [collapsed, setCollapsed] = (0, import_react2.useState)(defaultCollapsed ?? false);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { borderBottom: "1px solid var(--panel-border, #e0e0e0)", padding: "10px 16px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: collapsible ? "pointer" : "default",
          userSelect: "none"
        },
        onClick: collapsible ? () => setCollapsed(!collapsed) : void 0,
        children: [
          collapsible && (collapsed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react3.ChevronRight, { size: 14, color: "var(--text-secondary, #888)" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react3.ChevronDown, { size: 14, color: "var(--text-secondary, #888)" })),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary, #888)", letterSpacing: "0.05em" }, children: title })
        ]
      }
    ),
    !collapsed && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { marginTop: 6 }, children })
  ] });
}
function KV({ label, value }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 8, marginBottom: 4, fontSize: 13 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--text-secondary, #888)", minWidth: 80, flexShrink: 0 }, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--text-primary, #111)", wordBreak: "break-word" }, children: String(value) })
  ] });
}
function KeyValueList({ record }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: Object.entries(record).map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: k, value: JSON.stringify(v) }, k)) });
}
function PanelContent({ node }) {
  const m = node.metadata;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    m.description && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Description", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 13, color: "var(--text-primary, #111)" }, children: m.description }) }),
    m.command && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Command", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { style: { fontSize: 12, fontFamily: "monospace", background: "var(--canvas-bg, #fafafa)", padding: 8, borderRadius: 4, overflow: "auto", margin: 0, color: "var(--text-primary, #111)" }, children: m.command }) }),
    m.condition && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Condition", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { style: { fontSize: 12, color: "var(--text-primary, #111)" }, children: m.condition }) }),
    m.variables && Object.keys(m.variables).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Variables", collapsible: true, defaultCollapsed: false, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KeyValueList, { record: m.variables }) }),
    m.with && Object.keys(m.with).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Parameters", collapsible: true, defaultCollapsed: false, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KeyValueList, { record: m.with }) }),
    m.outputs && Object.keys(m.outputs).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Outputs", collapsible: true, defaultCollapsed: false, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KeyValueList, { record: m.outputs }) }),
    (m.timeout || m.retry) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Section, { title: "Resilience", children: [
      m.timeout && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Timeout", value: m.timeout }),
      m.totalTimeout && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Total Timeout", value: m.totalTimeout }),
      m.retry && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Max Attempts", value: m.retry.maxAttempts }),
        m.retry.interval && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Interval", value: m.retry.interval }),
        m.retry.backoffRate && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Backoff Rate", value: m.retry.backoffRate }),
        m.retry.maxDelay && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Max Delay", value: m.retry.maxDelay }),
        m.retry.jitter != null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Jitter", value: m.retry.jitter }),
        m.retry.when && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "When", value: m.retry.when })
      ] })
    ] }),
    m.loopConfig && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Section, { title: "Loop Config", children: [
      m.loopConfig.items && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Items", value: m.loopConfig.items }),
      m.loopConfig.count != null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Count", value: m.loopConfig.count }),
      m.loopConfig.range && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Range", value: `${m.loopConfig.range[0]}..${m.loopConfig.range[1]}` }),
      m.loopConfig.as && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "As", value: m.loopConfig.as }),
      m.loopConfig.until && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Until", value: m.loopConfig.until }),
      m.loopConfig.delay && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Delay", value: m.loopConfig.delay }),
      m.loopConfig.onError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "On Error", value: m.loopConfig.onError })
    ] }),
    (m.catch || m.finally || m.onError) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Section, { title: "Error Handling", children: [
      m.onError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "On Error", value: m.onError }),
      m.catch && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Has Catch", value: "yes" }),
      m.finally && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Has Finally", value: "yes" })
    ] }),
    (m.moduleName || m.moduleSource) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Section, { title: "Module", children: [
      m.moduleName && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Name", value: m.moduleName }),
      m.moduleSource && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Source", value: m.moduleSource })
    ] }),
    m.taskRef && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Task Reference", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KV, { label: "Task", value: m.taskRef }) }),
    m.yamlSnippet && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: "Raw YAML", collapsible: true, defaultCollapsed: true, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { style: { fontSize: 11, fontFamily: "monospace", background: "var(--canvas-bg, #fafafa)", padding: 8, borderRadius: 4, overflow: "auto", margin: 0, maxHeight: 200, color: "var(--text-primary, #111)" }, children: m.yamlSnippet }) })
  ] });
}
function PanelHeader({ node, onClose, onToggleMode, mode }) {
  const color = getNodeColor(node.type, node.metadata.func);
  const Icon = getNodeIcon(node.type, node.metadata.func);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid var(--panel-border, #e0e0e0)",
    background: "var(--panel-bg, white)",
    borderRadius: mode === "float" ? "8px 8px 0 0" : void 0
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { size: 18, color }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-primary, #111)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }, children: node.label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        onClick: onToggleMode,
        style: { background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-secondary, #888)" },
        title: mode === "sidebar" ? "Switch to floating window" : "Switch to sidebar",
        children: mode === "sidebar" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react3.MessageSquare, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react3.PanelRightClose, { size: 14 })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        onClick: onClose,
        style: { background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-secondary, #888)" },
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react3.X, { size: 16 })
      }
    )
  ] });
}
function DetailPanel({ node, mode, onClose, onToggleMode, clickPosition }) {
  if (mode === "sidebar") {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 320,
      height: "100%",
      background: "var(--panel-bg, white)",
      borderLeft: "1px solid var(--panel-border, #e0e0e0)",
      boxShadow: "-2px 0 8px rgba(0,0,0,0.06)",
      overflowY: "auto",
      zIndex: 10
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelHeader, { node, onClose, onToggleMode, mode }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelContent, { node })
    ] });
  }
  const panelWidth = 320;
  const panelHeight = 450;
  const offset = 260;
  let floatX;
  let floatY;
  if (clickPosition) {
    const rightX = clickPosition.x + offset;
    if (rightX + panelWidth > window.innerWidth - 20) {
      floatX = clickPosition.x - offset - panelWidth;
    } else {
      floatX = rightX;
    }
    floatY = clickPosition.y - 60;
  } else {
    floatX = 100;
    floatY = 100;
  }
  floatX = Math.max(10, Math.min(floatX, window.innerWidth - panelWidth - 10));
  floatY = Math.max(10, Math.min(floatY, window.innerHeight - panelHeight - 10));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      style: {
        position: "fixed",
        left: floatX,
        top: floatY,
        width: 320,
        maxHeight: 450,
        background: "var(--panel-bg, white)",
        border: "1px solid var(--panel-border, #e0e0e0)",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        overflowY: "auto",
        zIndex: 20
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelHeader, { node, onClose, onToggleMode, mode }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelContent, { node })
      ]
    }
  );
}

// src/graph/WorkflowGraph.tsx
var import_react7 = require("react");
var import_react8 = require("@xyflow/react");
var import_style = require("@xyflow/react/dist/style.css");

// src/graph/nodes/NodeHandles.tsx
var import_react3 = require("@xyflow/react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var handleStyle = {
  width: 6,
  height: 6,
  background: "transparent",
  border: "none"
};
function NodeHandles() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "target", position: import_react3.Position.Top, id: "top", style: handleStyle }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "target", position: import_react3.Position.Right, id: "right-target", style: handleStyle }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "target", position: import_react3.Position.Bottom, id: "bottom-target", style: handleStyle }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "target", position: import_react3.Position.Left, id: "left-target", style: handleStyle }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "source", position: import_react3.Position.Top, id: "top-source", style: handleStyle }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "source", position: import_react3.Position.Right, id: "right", style: handleStyle }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "source", position: import_react3.Position.Bottom, id: "bottom", style: handleStyle }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react3.Handle, { type: "source", position: import_react3.Position.Left, id: "left", style: handleStyle })
  ] });
}

// src/graph/nodes/StepNode.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function StepNode({ data, selected }) {
  const color = getNodeColor(data.type, data.metadata.func);
  const Icon = getNodeIcon(data.type, data.metadata.func);
  const typeLabel = data.metadata.func ?? "step";
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "div",
    {
      style: {
        background: "var(--node-bg, white)",
        border: `1.5px solid ${color}`,
        borderRadius: 6,
        padding: "8px 12px",
        minWidth: 180,
        boxShadow: selected ? `var(--shadow), 0 0 0 3px ${color}33` : "var(--shadow)",
        cursor: "pointer"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(NodeHandles, {}),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { size: 16, color }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "div",
              {
                style: {
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color,
                  letterSpacing: "0.05em"
                },
                children: typeLabel
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { fontSize: 13, color: "var(--text-primary, #111)" }, children: data.label })
          ] })
        ] })
      ]
    }
  );
}

// src/graph/nodes/TaskGroupNode.tsx
var import_react4 = require("react");
var import_lucide_react4 = require("lucide-react");
var import_react5 = require("@xyflow/react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var RESIZE_HANDLE_SIZE = 12;
var PADDING = 30;
var HEADER_HEIGHT = 50;
var MAX_EXTRA_PADDING = 60;
function TaskGroupNode({ id, data }) {
  const collapsed = data.collapsed;
  const onToggleCollapse = data.onToggleCollapse;
  const stepCount = data.metadata.stepCount ?? 0;
  const { setNodes, getNodes } = (0, import_react5.useReactFlow)();
  const resizing = (0, import_react4.useRef)(null);
  const onResizeStart = (0, import_react4.useCallback)((e) => {
    e.stopPropagation();
    e.preventDefault();
    const nodeEl = document.querySelector(`[data-id="${id}"]`);
    if (!nodeEl) return;
    const rect = nodeEl.getBoundingClientRect();
    const zoom = rect.width / (parseFloat(nodeEl.style.width) || rect.width);
    const allNodes = getNodes();
    const children = allNodes.filter((n) => n.parentId === id);
    let minW = 200;
    let minH = HEADER_HEIGHT + PADDING * 2;
    if (children.length > 0) {
      const maxChildRight = Math.max(...children.map((c) => {
        const w = c.measured?.width ?? c.style?.width ?? 240;
        return c.position.x + w;
      }));
      const maxChildBottom = Math.max(...children.map((c) => {
        const h = c.measured?.height ?? c.style?.height ?? 60;
        return c.position.y + h;
      }));
      minW = Math.max(minW, maxChildRight + PADDING);
      minH = Math.max(minH, maxChildBottom + PADDING);
    }
    const maxW = minW + MAX_EXTRA_PADDING;
    const maxH = minH + MAX_EXTRA_PADDING;
    resizing.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: parseFloat(nodeEl.style.width) || rect.width / zoom,
      startH: parseFloat(nodeEl.style.height) || rect.height / zoom,
      minW,
      minH,
      maxW,
      maxH
    };
    const onMouseMove = (ev) => {
      if (!resizing.current) return;
      const dx = (ev.clientX - resizing.current.startX) / zoom;
      const dy = (ev.clientY - resizing.current.startY) / zoom;
      const newW = Math.min(resizing.current.maxW, Math.max(resizing.current.minW, resizing.current.startW + dx));
      const newH = Math.min(resizing.current.maxH, Math.max(resizing.current.minH, resizing.current.startH + dy));
      setNodes((nodes) => nodes.map(
        (n) => n.id === id ? { ...n, style: { ...n.style, width: newW, height: newH } } : n
      ));
    };
    const onMouseUp = () => {
      resizing.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [id, setNodes, getNodes]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "div",
    {
      style: {
        border: "2px solid var(--task-border, #333)",
        borderRadius: 8,
        background: "var(--node-bg, white)",
        width: "100%",
        height: "100%",
        boxShadow: "var(--shadow)",
        position: "relative"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(NodeHandles, {}),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              background: "var(--task-header-bg, #f0f0f0)",
              borderBottom: "1px solid var(--panel-border, #ddd)",
              borderRadius: "6px 6px 0 0",
              cursor: "pointer"
            },
            onClick: onToggleCollapse,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.FolderOpen, { size: 14, color: "#333" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary, #666)" }, children: "Task" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--text-primary, #111)", flex: 1 }, children: data.label }),
              onToggleCollapse && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 12, color: "#999" }, children: collapsed ? "\u25B8" : "\u25BE" })
            ]
          }
        ),
        collapsed && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { padding: "8px 10px", fontSize: 12, color: "var(--text-secondary, #888)" }, children: [
          stepCount,
          " steps (collapsed)"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "div",
          {
            className: "nodrag",
            onMouseDown: onResizeStart,
            style: {
              position: "absolute",
              bottom: 0,
              right: 0,
              width: RESIZE_HANDLE_SIZE,
              height: RESIZE_HANDLE_SIZE,
              cursor: "nwse-resize",
              borderRight: "2px solid #999",
              borderBottom: "2px solid #999",
              borderRadius: "0 0 6px 0",
              opacity: 0.4
            },
            title: "Drag to resize"
          }
        )
      ]
    }
  );
}

// src/graph/nodes/ConditionNode.tsx
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function ConditionNode({ data, selected }) {
  const color = "#e9c46a";
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      style: {
        position: "relative",
        background: "var(--node-bg, white)",
        border: `1.5px solid ${color}`,
        borderRadius: 6,
        padding: "12px 12px 8px",
        minWidth: 180,
        boxShadow: selected ? `var(--shadow), 0 0 0 3px ${color}33` : "var(--shadow)"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(NodeHandles, {}),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "div",
          {
            style: {
              position: "absolute",
              top: -8,
              left: 8,
              background: color,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: 3
            },
            children: "IF"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.GitFork, { size: 16, color }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 13, color: "var(--text-primary, #111)" }, children: data.label }),
            data.metadata.condition && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "div",
              {
                style: {
                  fontSize: 11,
                  color: "var(--text-secondary, #888)",
                  marginTop: 2,
                  fontFamily: "monospace"
                },
                children: data.metadata.condition
              }
            )
          ] })
        ] })
      ]
    }
  );
}

// src/graph/nodes/LoopNode.tsx
var import_lucide_react6 = require("lucide-react");
var import_jsx_runtime7 = require("react/jsx-runtime");
function LoopNode({ data, selected }) {
  const color = "#9b59b6";
  const loop = data.metadata.loopConfig;
  let loopInfo = "";
  if (loop) {
    if (loop.items) loopInfo = `items: ${loop.items}`;
    else if (loop.count != null) loopInfo = `count: ${loop.count}`;
    else if (loop.range) loopInfo = `range: ${loop.range[0]}..${loop.range[1]}`;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    "div",
    {
      style: {
        background: "var(--node-bg, white)",
        border: `1.5px dashed ${color}`,
        borderRadius: 6,
        padding: "8px 12px",
        minWidth: 180,
        boxShadow: selected ? `var(--shadow), 0 0 0 3px ${color}33` : "var(--shadow)"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(NodeHandles, {}),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.RefreshCw, { size: 16, color }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: 13, color: "var(--text-primary, #111)" }, children: data.label }),
            loopInfo && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "div",
              {
                style: {
                  fontSize: 11,
                  color: "var(--text-secondary, #888)",
                  marginTop: 2,
                  fontFamily: "monospace"
                },
                children: loopInfo
              }
            )
          ] })
        ] })
      ]
    }
  );
}

// src/graph/nodes/ModuleCallNode.tsx
var import_lucide_react7 = require("lucide-react");
var import_jsx_runtime8 = require("react/jsx-runtime");
function ModuleCallNode({ data, selected }) {
  const color = "#4a90d9";
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    "div",
    {
      style: {
        background: "var(--node-bg, white)",
        border: `1.5px dotted ${color}`,
        borderRadius: 6,
        padding: "8px 12px",
        minWidth: 180,
        boxShadow: selected ? `var(--shadow), 0 0 0 3px ${color}33` : "var(--shadow)"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(NodeHandles, {}),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.Package, { size: 16, color }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 13, color: "var(--text-primary, #111)" }, children: data.label }),
            data.metadata.moduleName && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "div",
              {
                style: {
                  fontSize: 11,
                  color: "var(--text-secondary, #888)",
                  marginTop: 2
                },
                children: data.metadata.moduleName
              }
            )
          ] })
        ] })
      ]
    }
  );
}

// src/graph/nodes/ErrorHandlerNode.tsx
var import_lucide_react8 = require("lucide-react");
var import_jsx_runtime9 = require("react/jsx-runtime");
function ErrorHandlerNode({ data, selected }) {
  const isCatch = data.id.includes(".catch_");
  const color = isCatch ? "#e76f51" : "#6c757d";
  const Icon = isCatch ? import_lucide_react8.AlertTriangle : import_lucide_react8.Shield;
  const typeLabel = isCatch ? "CATCH" : "FINALLY";
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    "div",
    {
      style: {
        background: "var(--node-bg, white)",
        border: `1.5px dashed ${color}`,
        borderRadius: 6,
        padding: "8px 12px",
        minWidth: 180,
        boxShadow: selected ? `var(--shadow), 0 0 0 3px ${color}33` : "var(--shadow)"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(NodeHandles, {}),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { size: 16, color }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "div",
              {
                style: {
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color,
                  letterSpacing: "0.05em"
                },
                children: typeLabel
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { fontSize: 13, color: "var(--text-primary, #111)" }, children: data.label })
          ] })
        ] })
      ]
    }
  );
}

// src/graph/nodes/MergeDotNode.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
function MergeDotNode() {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    "div",
    {
      style: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--edge-color, #999)"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(NodeHandles, {})
    }
  );
}

// src/graph/edges/CustomEdge.tsx
var import_react6 = require("@xyflow/react");
var import_jsx_runtime11 = require("react/jsx-runtime");
var LABEL_COLORS = {
  "conditional-true": { bg: "#d4edda", fg: "#155724" },
  "conditional-false": { bg: "#fde8e1", fg: "#8b2500" },
  "conditional-elif": { bg: "#fff3cd", fg: "#856404" },
  "error-path": { bg: "#fde8e1", fg: "#8b2500" },
  "cleanup-path": { bg: "#e9ecef", fg: "#495057" },
  "loop-body": { bg: "#f3e5f5", fg: "#6a1b9a" },
  "task-call": { bg: "#e9ecef", fg: "#333" },
  "module-call": { bg: "#d6eaf8", fg: "#1a5276" }
};
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) {
  const edgeType = data?.edgeType ?? "sequential";
  const color = data?.color ?? EDGE_COLORS[edgeType] ?? "#999";
  const styleType = EDGE_STYLES[edgeType] ?? "solid";
  let strokeDasharray;
  if (styleType === "dashed") strokeDasharray = "6 3";
  else if (styleType === "dotted") strokeDasharray = "2 3";
  const [edgePath, labelX, labelY] = (0, import_react6.getBezierPath)({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  });
  const label = data?.label;
  const labelStyle = LABEL_COLORS[edgeType];
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      import_react6.BaseEdge,
      {
        id,
        path: edgePath,
        markerEnd,
        style: { stroke: color, strokeWidth: 2, strokeDasharray }
      }
    ),
    label && labelStyle && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_react6.EdgeLabelRenderer, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      "div",
      {
        style: {
          position: "absolute",
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          pointerEvents: "all",
          fontSize: 10,
          fontWeight: 600,
          background: labelStyle.bg,
          color: labelStyle.fg,
          padding: "1px 6px",
          borderRadius: 8,
          whiteSpace: "nowrap"
        },
        className: "nodrag nopan",
        children: label
      }
    ) })
  ] });
}

// src/graph/layout/auto-layout.ts
var import_dagre = __toESM(require("@dagrejs/dagre"));
var NODE_WIDTH = 240;
var NODE_HEIGHT = 60;
var TASK_PADDING = 30;
var TASK_HEADER = 50;
var TASK_GAP = 40;
function computeLayout(nodes, edges, direction) {
  if (nodes.length === 0) return [];
  const dagreDir = direction === "AUTO" ? "TB" : direction;
  const g = new import_dagre.default.graphlib.Graph();
  g.setGraph({
    rankdir: dagreDir,
    nodesep: 40,
    ranksep: 60,
    marginx: 20,
    marginy: 20
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const node of nodes) {
    if (node.type === "task") continue;
    const height = node.type === "merge-dot" ? 10 : NODE_HEIGHT;
    let width = NODE_WIDTH;
    if (node.type === "condition" && node.metadata.condition) {
      width = Math.max(NODE_WIDTH, Math.min(400, node.metadata.condition.length * 7 + 80));
    }
    g.setNode(node.id, { width, height, label: node.label });
  }
  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }
  import_dagre.default.layout(g);
  const absPositions = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    if (node.type === "task") continue;
    const dn = g.node(node.id);
    if (!dn) continue;
    absPositions.set(node.id, {
      x: dn.x - (dn.width || NODE_WIDTH) / 2,
      y: dn.y - (dn.height || NODE_HEIGHT) / 2,
      w: dn.width || NODE_WIDTH,
      h: dn.height || NODE_HEIGHT
    });
  }
  const taskBounds = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    if (node.type !== "task") continue;
    const children = nodes.filter((n) => n.parentId === node.id);
    const childBounds = children.map((c) => absPositions.get(c.id)).filter((p) => p != null);
    if (childBounds.length === 0) {
      taskBounds.set(node.id, { x: 0, y: 0, w: NODE_WIDTH + TASK_PADDING * 2, h: 80 });
      continue;
    }
    const minX = Math.min(...childBounds.map((p) => p.x)) - TASK_PADDING;
    const minY = Math.min(...childBounds.map((p) => p.y)) - TASK_PADDING - TASK_HEADER;
    const maxX = Math.max(...childBounds.map((p) => p.x + p.w)) + TASK_PADDING;
    const maxY = Math.max(...childBounds.map((p) => p.y + p.h)) + TASK_PADDING;
    taskBounds.set(node.id, { x: minX, y: minY, w: maxX - minX, h: maxY - minY });
  }
  const originalTaskBounds = /* @__PURE__ */ new Map();
  for (const [id, bounds] of taskBounds) {
    originalTaskBounds.set(id, { ...bounds });
  }
  if (direction === "AUTO") {
    repositionTasksAuto(nodes, edges, taskBounds, absPositions);
    for (const [id, bounds] of taskBounds) {
      originalTaskBounds.set(id, { ...bounds });
    }
  }
  spreadTasks(taskBounds, TASK_GAP);
  const positioned = [];
  for (const node of nodes) {
    if (node.type !== "task") continue;
    const bounds = taskBounds.get(node.id);
    positioned.push({
      id: node.id,
      position: { x: bounds.x, y: bounds.y },
      data: node,
      type: "task",
      draggable: true,
      style: { width: bounds.w, height: bounds.h, zIndex: -1 }
    });
  }
  for (const node of nodes) {
    if (node.type === "task") continue;
    const abs = absPositions.get(node.id);
    if (!abs) continue;
    const origParentBounds = node.parentId ? originalTaskBounds.get(node.parentId) : null;
    if (origParentBounds) {
      positioned.push({
        id: node.id,
        position: { x: abs.x - origParentBounds.x, y: abs.y - origParentBounds.y },
        data: node,
        type: node.type === "merge-dot" ? "mergeDot" : node.type,
        parentId: node.parentId,
        extent: "parent",
        draggable: true
      });
    } else {
      positioned.push({
        id: node.id,
        position: { x: abs.x, y: abs.y },
        data: node,
        type: node.type === "merge-dot" ? "mergeDot" : node.type,
        draggable: true
      });
    }
  }
  return positioned;
}
function repositionTasksAuto(nodes, edges, taskBounds, absPositions) {
  const taskNodes = nodes.filter((n) => n.type === "task");
  if (taskNodes.length <= 1) return;
  const tg = new import_dagre.default.graphlib.Graph();
  tg.setGraph({
    rankdir: "TB",
    nodesep: TASK_GAP * 2,
    ranksep: TASK_GAP * 2,
    marginx: 20,
    marginy: 20
  });
  tg.setDefaultEdgeLabel(() => ({}));
  for (const task of taskNodes) {
    const bounds = taskBounds.get(task.id);
    tg.setNode(task.id, { width: bounds.w, height: bounds.h });
  }
  for (const edge of edges) {
    const sourceTask = findParentTask(edge.source, nodes);
    const targetTask = findParentTask(edge.target, nodes);
    if (sourceTask && targetTask && sourceTask !== targetTask) {
      if (tg.hasNode(sourceTask) && tg.hasNode(targetTask)) {
        tg.setEdge(sourceTask, targetTask);
      }
    }
  }
  import_dagre.default.layout(tg);
  for (const task of taskNodes) {
    const dt = tg.node(task.id);
    if (!dt) continue;
    const oldBounds = taskBounds.get(task.id);
    const newX = dt.x - dt.width / 2;
    const newY = dt.y - dt.height / 2;
    const dx = newX - oldBounds.x;
    const dy = newY - oldBounds.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      for (const node of nodes) {
        if (node.parentId !== task.id) continue;
        const abs = absPositions.get(node.id);
        if (abs) {
          abs.x += dx;
          abs.y += dy;
        }
      }
      taskBounds.set(task.id, { x: newX, y: newY, w: oldBounds.w, h: oldBounds.h });
    }
  }
}
function findParentTask(nodeId, nodes) {
  if (nodeId.startsWith("task:")) return nodeId;
  const node = nodes.find((n) => n.id === nodeId);
  return node?.parentId;
}
function spreadTasks(taskBounds, gap) {
  const tasks = Array.from(taskBounds.entries());
  if (tasks.length <= 1) return;
  for (let round = 0; round < 20; round++) {
    let moved = false;
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const a = tasks[i][1];
        const b = tasks[j][1];
        const noOverlapX = a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x;
        const noOverlapY = a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y;
        if (noOverlapX || noOverlapY) continue;
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + gap;
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + gap;
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (overlapX < overlapY) {
          const push = overlapX / 2;
          if (a.x <= b.x) {
            a.x -= push;
            b.x += push;
          } else {
            a.x += push;
            b.x -= push;
          }
        } else {
          const push = overlapY / 2;
          if (a.y <= b.y) {
            a.y -= push;
            b.y += push;
          } else {
            a.y += push;
            b.y -= push;
          }
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  for (const [id, bounds] of tasks) {
    taskBounds.set(id, bounds);
  }
}

// src/graph/edge-routing.ts
function getNodeCenter(rect) {
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2
  };
}
function sideToTargetHandle(side) {
  if (side === "top") return "top";
  return `${side}-target`;
}
function getBestHandles(source, target) {
  const s = getNodeCenter(source);
  const t = getNodeCenter(target);
  const dx = t.cx - s.cx;
  const dy = t.cy - s.cy;
  const overlapX = !(source.x + source.width < target.x || target.x + target.width < source.x);
  const overlapY = !(source.y + source.height < target.y || target.y + target.height < source.y);
  let sourceSide;
  let targetSide;
  if (overlapX && overlapY) {
    if (Math.abs(dx) > Math.abs(dy)) {
      sourceSide = dx > 0 ? "right" : "left";
      targetSide = dx > 0 ? "left" : "right";
    } else {
      sourceSide = dy > 0 ? "bottom" : "top";
      targetSide = dy > 0 ? "top" : "bottom";
    }
  } else if (overlapX) {
    sourceSide = dy > 0 ? "bottom" : "top";
    targetSide = dy > 0 ? "top" : "bottom";
  } else if (overlapY) {
    sourceSide = dx > 0 ? "right" : "left";
    targetSide = dx > 0 ? "left" : "right";
  } else {
    if (Math.abs(dx) > Math.abs(dy)) {
      sourceSide = dx > 0 ? "right" : "left";
      targetSide = dx > 0 ? "left" : "right";
    } else {
      sourceSide = dy > 0 ? "bottom" : "top";
      targetSide = dy > 0 ? "top" : "bottom";
    }
  }
  return {
    sourceHandle: sourceSide === "top" ? "top-source" : sourceSide,
    targetHandle: sideToTargetHandle(targetSide)
  };
}
function getAbsolutePosition(nodeId, nodes) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { x: 0, y: 0, width: 240, height: 60 };
  let x = node.position.x;
  let y = node.position.y;
  if (node.parentId) {
    const parent = nodes.find((n) => n.id === node.parentId);
    if (parent) {
      x += parent.position.x;
      y += parent.position.y;
    }
  }
  const width = node.style?.width ?? 240;
  const height = node.style?.height ?? 60;
  return { x, y, width, height };
}

// src/graph/collision.ts
var MIN_GAP = 20;
function getNodeRect(node) {
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.style?.width ?? 280,
    height: node.style?.height ?? 100
  };
}
function rectsOverlap(a, b, gap) {
  return !(a.x + a.width + gap <= b.x || b.x + b.width + gap <= a.x || a.y + a.height + gap <= b.y || b.y + b.height + gap <= a.y);
}
function resolveTaskCollision(draggedId, nodes) {
  const dragged = nodes.find((n) => n.id === draggedId);
  if (!dragged || dragged.type !== "task") return null;
  const otherTasks = nodes.filter((n) => n.id !== draggedId && n.type === "task");
  const draggedRect = getNodeRect(dragged);
  const overlapping = otherTasks.filter(
    (other) => rectsOverlap(draggedRect, getNodeRect(other), MIN_GAP)
  );
  if (overlapping.length === 0) return null;
  const pos = { x: dragged.position.x, y: dragged.position.y };
  for (let round = 0; round < 10; round++) {
    const currentRect = { ...draggedRect, x: pos.x, y: pos.y };
    let worstOverlap = null;
    let worstArea = 0;
    for (const other of otherTasks) {
      const otherRect = getNodeRect(other);
      if (!rectsOverlap(currentRect, otherRect, MIN_GAP)) continue;
      const overlapX = Math.min(currentRect.x + currentRect.width, otherRect.x + otherRect.width) - Math.max(currentRect.x, otherRect.x) + MIN_GAP;
      const overlapY = Math.min(currentRect.y + currentRect.height, otherRect.y + otherRect.height) - Math.max(currentRect.y, otherRect.y) + MIN_GAP;
      const area = overlapX * overlapY;
      if (area > worstArea) {
        worstArea = area;
        const pushRight = otherRect.x + otherRect.width + MIN_GAP - currentRect.x;
        const pushLeft = -(currentRect.x + currentRect.width + MIN_GAP - otherRect.x);
        const pushDown = otherRect.y + otherRect.height + MIN_GAP - currentRect.y;
        const pushUp = -(currentRect.y + currentRect.height + MIN_GAP - otherRect.y);
        const candidates = [
          { pushX: pushRight, pushY: 0 },
          { pushX: pushLeft, pushY: 0 },
          { pushX: 0, pushY: pushDown },
          { pushX: 0, pushY: pushUp }
        ];
        const best = candidates.reduce(
          (a, b) => Math.abs(a.pushX) + Math.abs(a.pushY) < Math.abs(b.pushX) + Math.abs(b.pushY) ? a : b
        );
        worstOverlap = { other: otherRect, ...best };
      }
    }
    if (!worstOverlap) break;
    pos.x += worstOverlap.pushX;
    pos.y += worstOverlap.pushY;
  }
  if (pos.x === dragged.position.x && pos.y === dragged.position.y) return null;
  return pos;
}

// src/graph/task-bounds.ts
var PADDING2 = 30;
var HEADER_HEIGHT2 = 50;
var DEFAULT_CHILD_WIDTH = 240;
var DEFAULT_CHILD_HEIGHT = 60;
function recalcTaskBounds(nodes) {
  const taskNodes = nodes.filter((n) => n.type === "task");
  if (taskNodes.length === 0) return null;
  let changed = false;
  let updated = [...nodes];
  for (const task of taskNodes) {
    const children = updated.filter((n) => n.parentId === task.id);
    if (children.length === 0) continue;
    const childRects = children.map((c) => ({
      x: c.position.x,
      y: c.position.y,
      w: getWidth(c),
      h: getHeight(c)
    }));
    const minX = Math.min(...childRects.map((r) => r.x));
    const minY = Math.min(...childRects.map((r) => r.y));
    const maxX = Math.max(...childRects.map((r) => r.x + r.w));
    const maxY = Math.max(...childRects.map((r) => r.y + r.h));
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const desiredWidth = contentWidth + PADDING2 * 2;
    const desiredHeight = contentHeight + PADDING2 * 2 + HEADER_HEIGHT2;
    const idealMinX = PADDING2;
    const idealMinY = PADDING2 + HEADER_HEIGHT2;
    const shiftX = idealMinX - minX;
    const shiftY = idealMinY - minY;
    const currentWidth = task.style?.width ?? task.measured?.width ?? desiredWidth;
    const currentHeight = task.style?.height ?? task.measured?.height ?? desiredHeight;
    const sizeDiff = Math.abs(desiredWidth - currentWidth) > 2 || Math.abs(desiredHeight - currentHeight) > 2;
    const positionDiff = Math.abs(shiftX) > 1 || Math.abs(shiftY) > 1;
    if (sizeDiff || positionDiff) {
      updated = updated.map((n) => {
        if (n.id === task.id) {
          return {
            ...n,
            position: positionDiff ? {
              x: n.position.x - shiftX,
              y: n.position.y - shiftY
            } : n.position,
            style: {
              ...n.style,
              width: desiredWidth,
              height: desiredHeight
            }
          };
        }
        if (n.parentId === task.id && positionDiff) {
          return {
            ...n,
            position: {
              x: n.position.x + shiftX,
              y: n.position.y + shiftY
            }
          };
        }
        return n;
      });
      changed = true;
    }
  }
  return changed ? updated : null;
}
function getWidth(node) {
  return node.measured?.width ?? node.style?.width ?? DEFAULT_CHILD_WIDTH;
}
function getHeight(node) {
  if (node.type === "mergeDot") return 10;
  return node.measured?.height ?? node.style?.height ?? DEFAULT_CHILD_HEIGHT;
}

// src/graph/WorkflowGraph.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var nodeTypes = {
  step: StepNode,
  task: TaskGroupNode,
  condition: ConditionNode,
  loop: LoopNode,
  "module-call": ModuleCallNode,
  "error-handler": ErrorHandlerNode,
  mergeDot: MergeDotNode
};
var edgeTypes = {
  custom: CustomEdge
};
var FlowControls = (0, import_react7.forwardRef)(
  function FlowControls2({ direction }, ref) {
    const { fitView, zoomIn, zoomOut } = (0, import_react8.useReactFlow)();
    (0, import_react7.useImperativeHandle)(ref, () => ({
      fitView: () => fitView({ padding: 0.1 }),
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut()
    }), [fitView, zoomIn, zoomOut]);
    (0, import_react7.useEffect)(() => {
      const t = setTimeout(() => fitView({ padding: 0.1 }), 50);
      return () => clearTimeout(t);
    }, [direction, fitView]);
    return null;
  }
);
function computeSmartEdges(graphEdges, flowNodes, theme = "light") {
  const colors = theme === "dark" ? DARK_EDGE_COLORS : EDGE_COLORS;
  return graphEdges.map((e) => {
    const sourceRect = getAbsolutePosition(e.source, flowNodes);
    const targetRect = getAbsolutePosition(e.target, flowNodes);
    const { sourceHandle, targetHandle } = getBestHandles(sourceRect, targetRect);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      type: "custom",
      data: { edgeType: e.type, label: e.label, color: colors[e.type] ?? "#999" },
      markerEnd: {
        type: import_react8.MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: colors[e.type] ?? "#999"
      }
    };
  });
}
var GraphInner = (0, import_react7.forwardRef)(function GraphInner2({
  nodes,
  edges,
  direction,
  theme,
  searchQuery,
  minimapVisible,
  collapsedTasks,
  onNodeSelect,
  onToggleTask
}, ref) {
  const positioned = (0, import_react7.useMemo)(
    () => computeLayout(nodes, edges, direction),
    [nodes, edges, direction]
  );
  const initialFlowNodes = (0, import_react7.useMemo)(() => {
    const query = searchQuery.toLowerCase().trim();
    const collapsed = collapsedTasks ?? /* @__PURE__ */ new Set();
    return positioned.filter((n) => {
      if (n.parentId && collapsed.has(n.parentId)) return false;
      return true;
    }).map((n) => {
      const matches = !query || n.data.label.toLowerCase().includes(query) || (n.data.metadata.func ?? "").toLowerCase().includes(query);
      const isTask = n.data.type === "task";
      const isCollapsed = isTask && collapsed.has(n.id);
      return {
        ...n,
        data: isTask ? {
          ...n.data,
          collapsed: isCollapsed,
          onToggleCollapse: onToggleTask ? () => onToggleTask(n.id) : void 0
        } : n.data,
        style: {
          ...n.style,
          // Collapsed tasks become compact
          ...isCollapsed ? { height: 44, width: n.style?.width } : {},
          opacity: query && !matches ? 0.2 : 1,
          transition: "opacity 0.2s"
        }
      };
    });
  }, [positioned, searchQuery, collapsedTasks, onToggleTask]);
  const remapEdges = (0, import_react7.useCallback)((flowNodesList) => {
    const visibleIds = new Set(flowNodesList.map((n) => n.id));
    const collapsed = collapsedTasks ?? /* @__PURE__ */ new Set();
    const remappedEdges = edges.map((e) => {
      let source = e.source;
      let target = e.target;
      if (!visibleIds.has(source)) {
        const sourceNode = nodes.find((n) => n.id === source);
        if (sourceNode?.parentId && collapsed.has(sourceNode.parentId)) {
          source = sourceNode.parentId;
        }
      }
      if (!visibleIds.has(target)) {
        const targetNode = nodes.find((n) => n.id === target);
        if (targetNode?.parentId && collapsed.has(targetNode.parentId)) {
          target = targetNode.parentId;
        }
      }
      if (!visibleIds.has(source) || !visibleIds.has(target)) return null;
      if (source === target) return null;
      return { ...e, id: `${e.id}:remapped`, source, target };
    }).filter((e) => e !== null);
    const seen = /* @__PURE__ */ new Set();
    return remappedEdges.filter((e) => {
      const key = `${e.source}->${e.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [edges, nodes, collapsedTasks]);
  const initialFlowEdges = (0, import_react7.useMemo)(() => {
    const remapped = remapEdges(initialFlowNodes);
    return computeSmartEdges(remapped, initialFlowNodes, theme);
  }, [initialFlowNodes, theme, remapEdges]);
  const [flowNodes, setFlowNodes, onNodesChange] = (0, import_react8.useNodesState)(initialFlowNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = (0, import_react8.useEdgesState)(initialFlowEdges);
  (0, import_react7.useEffect)(() => {
    setFlowNodes(initialFlowNodes);
  }, [initialFlowNodes, setFlowNodes]);
  (0, import_react7.useEffect)(() => {
    setFlowEdges(initialFlowEdges);
  }, [initialFlowEdges, setFlowEdges]);
  const handleNodesChange = (0, import_react7.useCallback)((changes) => {
    onNodesChange(changes);
    const isDragging = changes.some((c) => c.type === "position" && c.dragging === true);
    const dragEnded = changes.some((c) => c.type === "position" && c.dragging === false);
    if (isDragging || dragEnded) {
      setTimeout(() => {
        setFlowNodes((currentNodes) => {
          const remapped = remapEdges(currentNodes);
          const smartEdges = computeSmartEdges(remapped, currentNodes, theme);
          setFlowEdges(smartEdges);
          return currentNodes;
        });
      }, 0);
    }
    if (dragEnded) {
      setTimeout(() => {
        setFlowNodes((currentNodes) => {
          let updated = [...currentNodes];
          let changed = false;
          const boundsResult = recalcTaskBounds(updated);
          if (boundsResult) {
            updated = boundsResult;
            changed = true;
          }
          for (const change of changes) {
            if (change.type === "position" && !change.dragging && change.id) {
              const adjusted = resolveTaskCollision(change.id, updated);
              if (adjusted) {
                updated = updated.map(
                  (n) => n.id === change.id ? { ...n, position: adjusted } : n
                );
                changed = true;
              }
            }
          }
          if (changed) {
            const boundsResult2 = recalcTaskBounds(updated);
            if (boundsResult2) updated = boundsResult2;
            const remapped = remapEdges(updated);
            const smartEdges = computeSmartEdges(remapped, updated, theme);
            setFlowEdges(smartEdges);
          }
          return changed ? updated : currentNodes;
        });
      }, 50);
    }
  }, [onNodesChange, edges, theme, remapEdges, setFlowNodes, setFlowEdges]);
  const onNodeClick = (0, import_react7.useCallback)(
    (event, node) => {
      const graphNode = node.data;
      onNodeSelect(graphNode, { x: event.clientX, y: event.clientY });
    },
    [onNodeSelect]
  );
  const onPaneClick = (0, import_react7.useCallback)(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
    import_react8.ReactFlow,
    {
      nodes: flowNodes,
      edges: flowEdges,
      onNodesChange: handleNodesChange,
      onEdgesChange,
      nodeTypes,
      edgeTypes,
      onNodeClick,
      onPaneClick,
      fitView: true,
      minZoom: 0.1,
      maxZoom: 2,
      nodesDraggable: true,
      proOptions: { hideAttribution: true },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(FlowControls, { ref, direction }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_react8.Background, { gap: 16, size: 1 }),
        minimapVisible && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          import_react8.MiniMap,
          {
            nodeStrokeWidth: 3,
            style: { background: "var(--canvas-bg, #fafafa)" }
          }
        )
      ]
    }
  );
});
var WorkflowGraph = (0, import_react7.forwardRef)(
  function WorkflowGraph2(props, ref) {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_react8.ReactFlowProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(GraphInner, { ref, ...props }) });
  }
);

// src/WorkflowViewer.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
function WorkflowViewer({
  yaml,
  direction: initialDirection = "AUTO",
  theme: initialTheme = "light",
  onNodeClick,
  collapsed: initialCollapsed = false,
  interactive = true,
  className
}) {
  const [direction, setDirection] = (0, import_react9.useState)(initialDirection);
  const [theme, setTheme] = (0, import_react9.useState)(initialTheme);
  const [selectedNode, setSelectedNode] = (0, import_react9.useState)(null);
  const [searchQuery, setSearchQuery] = (0, import_react9.useState)("");
  const [minimapVisible, setMinimapVisible] = (0, import_react9.useState)(false);
  const [collapsedTasks, setCollapsedTasks] = (0, import_react9.useState)(/* @__PURE__ */ new Set());
  const [toast, setToast] = (0, import_react9.useState)(null);
  const [panelMode, setPanelMode] = (0, import_react9.useState)("float");
  const [clickPosition, setClickPosition] = (0, import_react9.useState)({ x: 0, y: 0 });
  const graphRef = (0, import_react9.useRef)(null);
  const parseResult = (0, import_react9.useMemo)(() => parseWorkflowYaml(yaml), [yaml]);
  const themeVars = theme === "dark" ? DARK_THEME : LIGHT_THEME;
  (0, import_react9.useEffect)(() => {
    if (initialCollapsed) {
      const taskIds = parseResult.nodes.filter((n) => n.type === "task").map((n) => n.id);
      setCollapsedTasks(new Set(taskIds));
    }
  }, [initialCollapsed, parseResult.nodes]);
  const handleNodeSelect = (0, import_react9.useCallback)(
    (node, clickPos) => {
      setSelectedNode(node);
      if (clickPos) setClickPosition(clickPos);
      if (node && onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );
  const showToast = (0, import_react9.useCallback)((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2e3);
  }, []);
  const handleExport = (0, import_react9.useCallback)(async () => {
    const el = document.querySelector(".react-flow");
    if (!el) return;
    try {
      const dataUrl = await (0, import_html_to_image.toPng)(el, {
        backgroundColor: theme === "dark" ? "#1a1a2e" : "#fafafa"
      });
      const a = document.createElement("a");
      a.download = "workflow.png";
      a.href = dataUrl;
      a.click();
      showToast("Exported!");
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [theme, showToast]);
  const handleCopy = (0, import_react9.useCallback)(async () => {
    const el = document.querySelector(".react-flow");
    if (!el) return;
    try {
      const blob = await (0, import_html_to_image.toBlob)(el, {
        backgroundColor: theme === "dark" ? "#1a1a2e" : "#fafafa"
      });
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Copied!");
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [theme, showToast]);
  const handleToggleTask = (0, import_react9.useCallback)((taskId) => {
    setCollapsedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);
  const handleCollapseAll = (0, import_react9.useCallback)(() => {
    const taskIds = parseResult.nodes.filter((n) => n.type === "task").map((n) => n.id);
    setCollapsedTasks(new Set(taskIds));
  }, [parseResult.nodes]);
  const handleExpandAll = (0, import_react9.useCallback)(() => {
    setCollapsedTasks(/* @__PURE__ */ new Set());
  }, []);
  const allCollapsed = (0, import_react9.useMemo)(() => {
    const taskIds = parseResult.nodes.filter((n) => n.type === "task").map((n) => n.id);
    return taskIds.length > 0 && taskIds.every((id) => collapsedTasks.has(id));
  }, [parseResult.nodes, collapsedTasks]);
  const errors = parseResult.errors.filter((e) => e.severity === "error");
  const warnings = parseResult.errors.filter((e) => e.severity === "warning");
  const hasNodes = parseResult.nodes.length > 0;
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
    "div",
    {
      className,
      "data-theme": theme,
      style: {
        ...themeVars,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "var(--canvas-bg)",
        color: "var(--text-primary)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative"
      },
      children: [
        toast && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          "div",
          {
            style: {
              position: "absolute",
              top: 60,
              left: "50%",
              transform: "translateX(-50%)",
              background: theme === "dark" ? "#444" : "#333",
              color: "white",
              padding: "6px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              zIndex: 100,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              animation: "fadeIn 0.2s ease"
            },
            children: toast
          }
        ),
        errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          "div",
          {
            style: {
              padding: "8px 16px",
              background: "#fde8e1",
              color: "#8b2500",
              fontSize: 13,
              borderBottom: "1px solid #e76f51"
            },
            children: errors.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { children: e.message }, i))
          }
        ),
        warnings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          "div",
          {
            style: {
              padding: "8px 16px",
              background: "#fff3cd",
              color: "#856404",
              fontSize: 13,
              borderBottom: "1px solid #e9c46a"
            },
            children: warnings.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { children: w.message }, i))
          }
        ),
        interactive && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          Toolbar,
          {
            direction,
            theme,
            minimapVisible,
            searchQuery,
            allCollapsed,
            onDirectionChange: setDirection,
            onThemeChange: setTheme,
            onFitView: () => graphRef.current?.fitView(),
            onZoomIn: () => graphRef.current?.zoomIn(),
            onZoomOut: () => graphRef.current?.zoomOut(),
            onToggleMinimap: () => setMinimapVisible((v) => !v),
            onSearchChange: setSearchQuery,
            onExport: handleExport,
            onCopy: handleCopy,
            onCollapseAll: handleCollapseAll,
            onExpandAll: handleExpandAll
          }
        ),
        hasNodes ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { style: { flex: 1, position: "relative" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            WorkflowGraph,
            {
              ref: graphRef,
              nodes: parseResult.nodes,
              edges: parseResult.edges,
              direction,
              theme,
              searchQuery,
              minimapVisible,
              collapsedTasks,
              onNodeSelect: handleNodeSelect,
              onToggleTask: handleToggleTask
            }
          ),
          selectedNode && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            DetailPanel,
            {
              node: selectedNode,
              mode: panelMode,
              onClose: () => setSelectedNode(null),
              onToggleMode: () => setPanelMode((m) => m === "sidebar" ? "float" : "sidebar"),
              clickPosition
            }
          )
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary, #888)",
              fontSize: 14
            },
            children: yaml?.trim() ? "No tasks found in workflow" : "Paste an OrchStep YAML to visualize"
          }
        )
      ]
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WorkflowViewer,
  parseWorkflowYaml
});
//# sourceMappingURL=index.js.map