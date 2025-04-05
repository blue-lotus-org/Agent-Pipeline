"use client"

import { useEffect, useRef } from "react"
import { useFlow } from "@/contexts/flow-context"
import { Edit, Trash, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import NodeEditDialog from "./node-edit-dialog"
import { useState } from "react"

interface NodeContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  nodeId: string | null
  onClose: () => void
}

export default function NodeContextMenu({ isOpen, position, nodeId, onClose }: NodeContextMenuProps) {
  const { nodes, setNodes, edges, setEdges } = useFlow()
  const { toast } = useToast()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Find the selected node
  const selectedNode = nodeId ? nodes.find((node) => node.id === nodeId) : null

  if (!isOpen || !selectedNode) return null

  const handleEditNode = () => {
    setIsEditDialogOpen(true)
    onClose()
  }

  const handleDeleteNode = () => {
    // Remove the node
    const updatedNodes = nodes.filter((node) => node.id !== nodeId)

    // Remove edges connected to this node
    const updatedEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)

    setNodes(updatedNodes)
    setEdges(updatedEdges)

    toast({
      title: "Node Deleted",
      description: `${selectedNode.data.label} node has been removed from the pipeline.`,
    })

    onClose()
  }

  const handleDuplicateNode = () => {
    // Create a copy of the node with a new ID
    const newNode = {
      ...selectedNode,
      id: `${selectedNode.type}-${Date.now()}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      },
    }

    setNodes([...nodes, newNode])

    toast({
      title: "Node Duplicated",
      description: `${selectedNode.data.label} node has been duplicated.`,
    })

    onClose()
  }

  return (
    <>
      <div
        ref={menuRef}
        className="absolute z-50 bg-background border rounded-md shadow-md py-1 min-w-[160px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="px-2 py-1 text-sm font-medium border-b mb-1">{selectedNode.data.label}</div>

        <button
          className="flex items-center w-full px-3 py-1.5 text-sm hover:bg-muted text-left"
          onClick={handleEditNode}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </button>

        <button
          className="flex items-center w-full px-3 py-1.5 text-sm hover:bg-muted text-left"
          onClick={handleDuplicateNode}
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </button>

        <button
          className="flex items-center w-full px-3 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground text-left"
          onClick={handleDeleteNode}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </button>
      </div>

      <NodeEditDialog isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} nodeId={nodeId} />
    </>
  )
}

