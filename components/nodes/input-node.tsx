"use client"

import type React from "react"
import { useState } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function InputNode({ data, isConnectable }: NodeProps) {
  const [content, setContent] = useState(data.content || "")

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Update node data
    data.content = e.target.value
  }

  return (
    <Card className="w-64 shadow-md">
      <CardHeader className="py-3 px-4 bg-primary/10">
        <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Textarea
          placeholder="Enter input text..."
          className="min-h-[80px] text-sm"
          value={content}
          onChange={handleChange}
        />
      </CardContent>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </Card>
  )
}

