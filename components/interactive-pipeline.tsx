"use client"

import type React from "react"

import { useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  Background,
  Controls,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  addEdge,
  type Connection,
  useNodesState,
  useEdgesState,
  type Edge,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useFlow } from "@/contexts/flow-context"
import InputNode from "./nodes/input-node"
import ProcessNode from "./nodes/process-node"
import MistralNode from "./nodes/mistral-node"
import OutputNode from "./nodes/output-node"

const nodeTypes = {
  input: InputNode,
  process: ProcessNode,
  mistral: MistralNode,
  output: OutputNode,
}

interface InteractivePipelineProps {
  onNodeContextMenu: (event: React.MouseEvent, nodeId: string) => void
  onEdgeContextMenu: (event: React.MouseEvent, edgeId: string) => void
}

function InteractivePipelineContent({ onNodeContextMenu, onEdgeContextMenu }: InteractivePipelineProps) {
  const { nodes, edges, setNodes, setEdges } = useFlow()
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes)
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  // Sync nodes and edges with context
  const syncWithContext = useCallback(() => {
    setNodes(reactFlowNodes)
    setEdges(reactFlowEdges)
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges])

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)
      // Use setTimeout to ensure the state is updated before syncing
      setTimeout(syncWithContext, 0)
    },
    [onNodesChange, syncWithContext],
  )

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes)
      // Use setTimeout to ensure the state is updated before syncing
      setTimeout(syncWithContext, 0)
    },
    [onEdgesChange, syncWithContext],
  )

  // Handle connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: "Connection",
      }

      const newEdges = addEdge(newEdge, reactFlowEdges)
      setReactFlowEdges(newEdges)
      setEdges(newEdges)
    },
    [reactFlowEdges, setReactFlowEdges, setEdges],
  )

  // Add a new node
  const addNode = useCallback(
    (type: string) => {
      const position = reactFlowInstance.project({
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      })

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          nodeType: type,
          ...(type === "mistral"
            ? {
                prompt: "Process the following input:",
                temperature: 0.7,
                maxTokens: 500,
              }
            : {}),
          ...(type === "input" ? { content: "Enter your input here..." } : {}),
          ...(type === "process" ? { operation: "extract" } : {}),
          ...(type === "output" ? { content: "" } : {}),
        },
      }

      setReactFlowNodes((nds) => [...nds, newNode])
      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance, setReactFlowNodes, setNodes],
  )

  // Update local state when the global state changes
  useEffect(() => {
    // This will ensure the ReactFlow component updates when nodes/edges change in the context
    setReactFlowNodes(nodes)
    setReactFlowEdges(edges)
  }, [nodes, edges, setReactFlowNodes, setReactFlowEdges])

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeContextMenu={(event, node) => onNodeContextMenu(event, node.id)}
        onEdgeContextMenu={(event, edge) => onEdgeContextMenu(event, edge.id)}
        fitView
        defaultEdgeOptions={{
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="flex gap-2">
          <Button size="sm" onClick={() => addNode("input")}>
            <Plus className="h-4 w-4 mr-2" />
            Input
          </Button>
          <Button size="sm" onClick={() => addNode("process")}>
            <Plus className="h-4 w-4 mr-2" />
            Process
          </Button>
          <Button size="sm" onClick={() => addNode("mistral")}>
            <Plus className="h-4 w-4 mr-2" />
            Mistral AI
          </Button>
          <Button size="sm" onClick={() => addNode("output")}>
            <Plus className="h-4 w-4 mr-2" />
            Output
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default function InteractivePipeline(props: InteractivePipelineProps) {
  return (
    <ReactFlowProvider>
      <InteractivePipelineContent {...props} />
    </ReactFlowProvider>
  )
}

