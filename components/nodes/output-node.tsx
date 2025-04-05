"use client"

import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function OutputNode({ data, isConnectable }: NodeProps) {
  const { toast } = useToast()

  const handleCopy = () => {
    if (data.content) {
      navigator.clipboard.writeText(data.content)
      toast({
        title: "Copied",
        description: "Output has been copied to clipboard",
      })
    }
  }

  return (
    <Card className="w-72 shadow-md">
      <CardHeader className="py-3 px-4 bg-accent/80 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
        {data.content && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-3">
        <div className="bg-muted p-3 rounded-md min-h-[120px] max-h-[200px] overflow-y-auto text-sm">
          {data.content ? (
            <p className="whitespace-pre-wrap">{data.content}</p>
          ) : (
            <p className="text-muted-foreground">Output will appear here when you run the pipeline</p>
          )}
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
    </Card>
  )
}

