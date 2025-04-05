"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFlow } from "@/contexts/flow-context"
import { useToast } from "@/components/ui/use-toast"

interface NodeEditDialogProps {
  isOpen: boolean
  onClose: () => void
  nodeId: string | null
}

const MISTRAL_MODELS = [
  { id: "mistral-small-latest", name: "Mistral Small (Latest)" },
  { id: "mistral-medium-latest", name: "Mistral Medium (Latest)" },
  { id: "mistral-large-latest", name: "Mistral Large (Latest)" },
  { id: "pixtral-12b-2409", name: "Pixtral 12B" },
  { id: "open-codestral-mamba", name: "Open Codestral Mamba" },
  { id: "open-mistral-nemo", name: "Open Mistral Nemo" },
  { id: "open-mixtral-8x7b", name: "Open Mixtral 8x7B" },
]

const PROCESS_OPERATIONS = [
  { id: "extract", name: "Extract Information" },
  { id: "summarize", name: "Summarize" },
  { id: "transform", name: "Transform Format" },
  { id: "filter", name: "Filter Content" },
  { id: "preprocess", name: "Text Preprocessing" },
  { id: "postprocess", name: "Output Formatting" },
  { id: "translate", name: "Language Translation" },
  { id: "analyze", name: "Content Analysis" },
  { id: "classify", name: "Text Classification" },
  { id: "clean", name: "Data Cleaning" },
]

export default function NodeEditDialog({ isOpen, onClose, nodeId }: NodeEditDialogProps) {
  const { nodes, setNodes } = useFlow()
  const { toast } = useToast()
  const [nodeData, setNodeData] = useState<any>(null)

  // Find the selected node
  useEffect(() => {
    if (isOpen && nodeId) {
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        setNodeData({ ...node.data })
      }
    }
  }, [isOpen, nodeId, nodes])

  const handleSave = () => {
    if (!nodeId || !nodeData) return

    // Update the node
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: nodeData,
        }
      }
      return node
    })

    setNodes(updatedNodes)

    toast({
      title: "Node Updated",
      description: `${nodeData.label} node has been updated.`,
    })

    onClose()
  }

  if (!nodeData) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {nodeData.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Common fields for all node types */}
          <div className="space-y-2">
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={nodeData.label || ""}
              onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
            />
          </div>

          {/* Input node fields */}
          {nodeData.nodeType === "input" && (
            <div className="space-y-2">
              <Label htmlFor="input-content">Content</Label>
              <Textarea
                id="input-content"
                value={nodeData.content || ""}
                onChange={(e) => setNodeData({ ...nodeData, content: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Process node fields */}
          {nodeData.nodeType === "process" && (
            <div className="space-y-2">
              <Label htmlFor="process-operation">Operation</Label>
              <Select
                value={nodeData.operation || "extract"}
                onValueChange={(value) => setNodeData({ ...nodeData, operation: value })}
              >
                <SelectTrigger id="process-operation">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESS_OPERATIONS.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mistral node fields */}
          {nodeData.nodeType === "mistral" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mistral-prompt">System Prompt</Label>
                <Textarea
                  id="mistral-prompt"
                  value={nodeData.prompt || ""}
                  onChange={(e) => setNodeData({ ...nodeData, prompt: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mistral-prompt-template">Common Prompt Templates</Label>
                <Select
                  onValueChange={(value) => {
                    if (value) {
                      setNodeData({ ...nodeData, prompt: value })
                    }
                  }}
                >
                  <SelectTrigger id="mistral-prompt-template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="You are an AI assistant that summarizes text. Provide a concise summary of the following text in 3-5 sentences:">
                      Summarization
                    </SelectItem>
                    <SelectItem value="Analyze the sentiment of the following text. Classify it as positive, negative, or neutral, and explain your reasoning:">
                      Sentiment Analysis
                    </SelectItem>
                    <SelectItem value="Translate the following text to French:">Translation (French)</SelectItem>
                    <SelectItem value="Translate the following text to Spanish:">Translation (Spanish)</SelectItem>
                    <SelectItem value="Answer the following question concisely and accurately:">
                      Question Answering
                    </SelectItem>
                    <SelectItem value="Extract key information from the following text and format it as a structured JSON object:">
                      Information Extraction
                    </SelectItem>
                    <SelectItem value="Rewrite the following text to improve clarity and readability while preserving the original meaning:">
                      Text Rewriting
                    </SelectItem>
                    <SelectItem value="Generate code based on the following requirements:">Code Generation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mistral-model">Model</Label>
                <Select
                  value={nodeData.model || "mistral-small-latest"}
                  onValueChange={(value) => setNodeData({ ...nodeData, model: value })}
                >
                  <SelectTrigger id="mistral-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MISTRAL_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="mistral-temperature">Temperature: {nodeData.temperature?.toFixed(1) || "0.7"}</Label>
                </div>
                <Slider
                  id="mistral-temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[nodeData.temperature || 0.7]}
                  onValueChange={(value) => setNodeData({ ...nodeData, temperature: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values produce more focused outputs, higher values produce more creative outputs.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mistral-max-tokens">Max Tokens</Label>
                <Input
                  id="mistral-max-tokens"
                  type="number"
                  min={1}
                  max={4000}
                  value={nodeData.maxTokens || 500}
                  onChange={(e) => setNodeData({ ...nodeData, maxTokens: Number.parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Maximum number of tokens to generate in the response.</p>
              </div>
            </>
          )}

          {/* Output node fields */}
          {nodeData.nodeType === "output" && (
            <div className="space-y-2">
              <Label htmlFor="output-content">Content</Label>
              <Textarea
                id="output-content"
                value={nodeData.content || ""}
                onChange={(e) => setNodeData({ ...nodeData, content: e.target.value })}
                className="min-h-[100px]"
                placeholder="Output will appear here when you run the pipeline"
                readOnly
              />
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

