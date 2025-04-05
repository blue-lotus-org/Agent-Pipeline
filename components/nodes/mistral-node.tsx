"use client"

import type React from "react"
import { useState } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useApiKey } from "@/hooks/use-api-key"

export default function MistralNode({ data, isConnectable }: NodeProps) {
  const { model } = useApiKey()
  const [prompt, setPrompt] = useState(data.prompt || "")
  const [temperature, setTemperature] = useState(data.temperature || 0.7)
  const [maxTokens, setMaxTokens] = useState(data.maxTokens || 500)

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    // Update node data
    data.prompt = e.target.value
  }

  const handleTemperatureChange = (value: number[]) => {
    setTemperature(value[0])
    // Update node data
    data.temperature = value[0]
  }

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value)) {
      setMaxTokens(value)
      // Update node data
      data.maxTokens = value
    }
  }

  return (
    <Card className="w-72 shadow-md">
      <CardHeader className="py-3 px-4 bg-primary/20">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {data.label}
          <span className="text-xs font-normal text-muted-foreground">
            {data.model || model?.split("-")[0] || "mistral"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div>
          <Label htmlFor="prompt" className="text-xs mb-1 block">
            System Prompt
          </Label>
          <Textarea
            id="prompt"
            placeholder="Enter prompt..."
            className="min-h-[80px] text-sm"
            value={prompt}
            onChange={handlePromptChange}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="temperature" className="text-xs">
              Temperature: {temperature.toFixed(1)}
            </Label>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={1}
            step={0.1}
            value={[temperature]}
            onValueChange={handleTemperatureChange}
          />
        </div>

        <div>
          <Label htmlFor="max-tokens" className="text-xs mb-1 block">
            Max Tokens
          </Label>
          <Input
            id="max-tokens"
            type="number"
            min={1}
            max={4000}
            value={maxTokens}
            onChange={handleMaxTokensChange}
            className="text-sm"
          />
        </div>
      </CardContent>

      {data.response && (
        <CardFooter className="p-3 pt-0">
          <div className="w-full bg-muted p-2 rounded-md text-xs">
            <p className="font-medium text-xs mb-1">Response Preview:</p>
            <p className="text-muted-foreground line-clamp-3">{data.response}</p>
          </div>
        </CardFooter>
      )}

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </Card>
  )
}

