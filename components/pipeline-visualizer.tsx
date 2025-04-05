"use client"

import type { Pipeline, PipelineStep } from "@/types/pipeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface PipelineVisualizerProps {
  pipeline: Pipeline
}

export default function PipelineVisualizer({ pipeline }: PipelineVisualizerProps) {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{pipeline.name}</h2>
        <p className="text-muted-foreground">{pipeline.description}</p>
      </div>

      <div className="space-y-4">
        {pipeline.steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {index < pipeline.steps.length - 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full h-4 w-0.5 bg-border z-10"></div>
            )}

            <StepCard step={step} />
          </div>
        ))}
      </div>
    </div>
  )
}

function StepCard({ step }: { step: PipelineStep }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant={getStepVariant(step.type)} className="mb-2">
              {step.type}
            </Badge>
            <CardTitle className="text-base">{step.name}</CardTitle>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>

        {step.config && Object.keys(step.config).length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="config">
              <AccordionTrigger className="text-xs py-1">Configuration</AccordionTrigger>
              <AccordionContent className="pt-1">
                <div className="text-xs space-y-1">
                  {Object.entries(step.config).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2">
                      <span className="font-medium">{key}:</span>
                      <span className="col-span-2 break-words">
                        {typeof value === "string" ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

function getStepVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "input":
      return "default"
    case "mistral":
      return "secondary"
    case "output":
      return "outline"
    default:
      return "default"
  }
}

