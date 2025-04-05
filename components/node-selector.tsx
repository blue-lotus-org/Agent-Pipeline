"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface NodeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: string) => void
}

const NODE_TYPES = [
  { id: "input", name: "Input", description: "Starting point for your pipeline" },
  { id: "process", name: "Process", description: "Transform or process data" },
  { id: "mistral", name: "Mistral AI", description: "Use Mistral AI to generate content" },
  { id: "output", name: "Output", description: "Final result of your pipeline" },
]

export default function NodeSelector({ isOpen, onClose, onSelect }: NodeSelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Node</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {NODE_TYPES.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => onSelect(type.id)}
            >
              <div className="text-left">
                <div className="font-medium">{type.name}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

