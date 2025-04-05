"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFlow } from "@/contexts/flow-context"
import { useToast } from "@/components/ui/use-toast"

interface EdgeEditDialogProps {
  isOpen: boolean
  onClose: () => void
  edgeId: string | null
}

export default function EdgeEditDialog({ isOpen, onClose, edgeId }: EdgeEditDialogProps) {
  const { edges, setEdges } = useFlow()
  const { toast } = useToast()
  const [label, setLabel] = useState("")

  // Find the selected edge
  useEffect(() => {
    if (isOpen && edgeId) {
      const edge = edges.find((e) => e.id === edgeId)
      if (edge) {
        setLabel(edge.label || "")
      }
    }
  }, [isOpen, edgeId, edges])

  const handleSave = () => {
    if (!edgeId) return

    // Update the edge
    const updatedEdges = edges.map((edge) => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          label,
        }
      }
      return edge
    })

    setEdges(updatedEdges)

    toast({
      title: "Connection Updated",
      description: "The connection label has been updated.",
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Connection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edge-label">Label</Label>
            <Input
              id="edge-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a label for this connection"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

