"use client"

import { useState } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const OPERATIONS = [
  { id: "extract", name: "Extract Information" },
  { id: "summarize", name: "Summarize" },
  { id: "transform", name: "Transform Format" },
  { id: "filter", name: "Filter Content" },
  { id: "preprocess", name: "Text Preprocessing" },
  { id: "postprocess", name: "Output Formatting" },
]

export default function ProcessNode({ data, isConnectable }: NodeProps) {
  const [operation, setOperation] = useState(data.operation || "extract")

  const handleChange = (value: string) => {
    setOperation(value)
    // Update node data
    data.operation = value
  }

  return (
    <Card className="w-64 shadow-md">
      <CardHeader className="py-3 px-4 bg-secondary/80">
        <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Select value={operation} onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            {OPERATIONS.map((op) => (
              <SelectItem key={op.id} value={op.id}>
                {op.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </Card>
  )
}

