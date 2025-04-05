export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface Pipeline {
  id: string
  name: string
  description: string
  type: string
  steps: PipelineStep[]
}

export interface PipelineStep {
  id: string
  type: string
  name: string
  description: string
  config: Record<string, any>
}

