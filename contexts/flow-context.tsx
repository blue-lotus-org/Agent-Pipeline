"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Node, Edge } from "reactflow"

interface FlowContextType {
  nodes: Node[]
  edges: Edge[]
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  generatedCode: string | null
  setGeneratedCode: (code: string | null) => void
  resetFlow: () => void
}

const FlowContext = createContext<FlowContextType | undefined>(undefined)

export function FlowProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const resetFlow = () => {
    setNodes([])
    setEdges([])
    setGeneratedCode(null)
  }

  return (
    <FlowContext.Provider
      value={{
        nodes,
        edges,
        setNodes,
        setEdges,
        generatedCode,
        setGeneratedCode,
        resetFlow,
      }}
    >
      {children}
    </FlowContext.Provider>
  )
}

export function useFlow() {
  const context = useContext(FlowContext)
  if (context === undefined) {
    throw new Error("useFlow must be used within a FlowProvider")
  }
  return context
}

