"use client"

import { useEffect, useRef } from "react"
import { useFlow } from "@/contexts/flow-context"
import { Edit, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import EdgeEditDialog from "./edge-edit-dialog"
import { useState } from "react"

interface EdgeContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  edgeId: string | null
  onClose: () => void
}

export default function EdgeContextMenu({ isOpen, position, edgeId, onClose }: EdgeContextMenuProps) {
  const { edges, setEdges } = useFlow()
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

  // Find the selected edge
  const selectedEdge = edgeId ? edges.find((edge) => edge.id === edgeId) : null

  if (!isOpen || !selectedEdge) return null

  const handleEditEdge = () => {
    setIsEditDialogOpen(true)
    onClose()
  }

  const handleDeleteEdge = () => {
    // Remove the edge
    const updatedEdges = edges.filter((edge) => edge.id !== edgeId)

    setEdges(updatedEdges)

    toast({
      title: "Connection Deleted",
      description: "The connection has been removed from the pipeline.",
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
        <div className="px-2 py-1 text-sm font-medium border-b mb-1">Connection</div>

        <button
          className="flex items-center w-full px-3 py-1.5 text-sm hover:bg-muted text-left"
          onClick={handleEditEdge}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Label
        </button>

        <button
          className="flex items-center w-full px-3 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground text-left"
          onClick={handleDeleteEdge}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </button>
      </div>

      <EdgeEditDialog isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} edgeId={edgeId} />
    </>
  )
}

