"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useApiKey } from "@/hooks/use-api-key"
import { useToast } from "@/components/ui/use-toast"
import { Settings, Download, Copy, Play, Trash, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SettingsModal from "./settings-modal"
import ApiKeyWarning from "./api-key-warning"
import type { Message } from "@/types/pipeline"
import InteractivePipeline from "./interactive-pipeline"
import { useFlow } from "@/contexts/flow-context"
import NodeContextMenu from "./node-context-menu"
import EdgeContextMenu from "./edge-context-menu"
import { processPipeline } from "@/lib/mistral-api"
import { chatCompletion } from "@/lib/mistral-api"

// Import the pipeline types at the top of the file
import { PIPELINE_TYPES } from "@/components/pipeline-types"

export default function PipelineBuilder() {
  const { apiKey, model } = useApiKey()
  const { nodes, edges, setNodes, setEdges, generatedCode, setGeneratedCode, resetFlow } = useFlow()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Mistral AI pipeline assistant. Tell me what kind of AI agent you want to build, and I'll help you create it. For example, you could say 'I want to build an agent that summarizes articles' or 'Create a pipeline for sentiment analysis'.",
    },
  ])
  const [input, setInput] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nodeContextMenuPosition, setNodeContextMenuPosition] = useState({ x: 0, y: 0 })
  const [edgeContextMenuPosition, setEdgeContextMenuPosition] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [isNodeContextMenuOpen, setIsNodeContextMenuOpen] = useState(false)
  const [isEdgeContextMenuOpen, setIsEdgeContextMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Check if API key is set on load
  useEffect(() => {
    if (!apiKey) {
      setIsSettingsOpen(true)
    }
  }, [apiKey])

  const handleSendMessage = async () => {
    console.log("Processing user input:", input)
    if (!input.trim()) return
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Mistral API key in settings first.",
        variant: "destructive",
      })
      setIsSettingsOpen(true)
      return
    }

    const userMessage = { role: "user", content: input } as Message
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Process the user message and generate a response
      const response = await processUserMessage(userMessage, messages, model || "mistral-small-latest")

      // Add this code to ensure the pipeline is actually created when the AI says it has:
      if (response.nodes && response.edges) {
        // Immediately update the nodes and edges in the state
        setNodes(response.nodes)
        setEdges(response.edges)

        // Generate code based on the pipeline
        const code = generateCodeFromPipeline(response.nodes, response.edges, model || "mistral-small-latest")
        setGeneratedCode(code)
      }
      setMessages((prev) => [...prev, { role: "assistant", content: response.message }])
    } catch (error) {
      console.error("Error processing message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm sorry, I encountered an error: ${error.message || "Unknown error"}. Please check your API key and try again.`,
        },
      ])

      toast({
        title: "API Error",
        description: error.message || "Failed to connect to Mistral AI. Please check your API key.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the processUserMessage function to use real API calls

  const processUserMessage = useCallback(
    async (userMessage: Message, messageHistory: Message[], modelName: string) => {
      try {
        // First, let's handle pipeline creation requests using the AI
        const userContent = userMessage.content.toLowerCase()

        // If the user is asking to create a pipeline, we'll handle that directly
        if (userContent.includes("build") || userContent.includes("create") || userContent.includes("make")) {
          // Determine the type of pipeline based on user input
          let pipelineType = "general"

          // Check for specific pipeline types in the user's request
          if (userContent.includes("summarize") || userContent.includes("summary")) {
            pipelineType = "summarization"
          } else if (userContent.includes("sentiment") || userContent.includes("emotion")) {
            pipelineType = "sentiment"
          } else if (userContent.includes("translate") || userContent.includes("translation")) {
            pipelineType = "translation"
          } else if (userContent.includes("qa") || userContent.includes("question") || userContent.includes("answer")) {
            pipelineType = "qa"
          } else if (userContent.includes("extract") || userContent.includes("extraction")) {
            pipelineType = "extraction"
          } else if (userContent.includes("classify") || userContent.includes("classification")) {
            pipelineType = "classification"
          } else if (userContent.includes("generate") || userContent.includes("creation")) {
            pipelineType = "generation"
          } else if (userContent.includes("rewrite") || userContent.includes("paraphrase")) {
            pipelineType = "rewriting"
          } else if (userContent.includes("code") || userContent.includes("coding")) {
            pipelineType = "coding"
          } else if (userContent.includes("analyze") || userContent.includes("analysis")) {
            pipelineType = "analysis"
          }

          // Find the pipeline configuration or use a default
          const pipelineConfig = PIPELINE_TYPES.find((t) => t.id === pipelineType) || {
            id: "general",
            name: "General Processing",
            description: "Process text input and generate a response",
            prompt: "Process the following input:",
            temperature: 0.7,
          }

          console.log(`Creating pipeline of type: ${pipelineType}`)

          // Create a pipeline based on the type
          const newNodes = [
            {
              id: "input-1",
              type: "input",
              position: { x: 250, y: 100 },
              data: {
                label: "Input",
                content: `Enter text for ${pipelineConfig.name.toLowerCase()}...`,
                nodeType: "input",
              },
            },
            {
              id: "mistral-1",
              type: "mistral",
              position: { x: 250, y: 250 },
              data: {
                label: "Mistral AI",
                prompt: pipelineConfig.prompt,
                temperature: pipelineConfig.temperature,
                maxTokens: 500,
                model: modelName,
                nodeType: "mistral",
              },
            },
            {
              id: "output-1",
              type: "output",
              position: { x: 250, y: 400 },
              data: {
                label: "Output",
                content: "",
                nodeType: "output",
              },
            },
          ]

          // Add a preprocessing step for certain pipeline types
          if (["summarization", "extraction", "analysis"].includes(pipelineType)) {
            // Insert preprocessing node
            newNodes.splice(1, 0, {
              id: "process-1",
              type: "process",
              position: { x: 250, y: 175 },
              data: {
                label: "Text Preprocessing",
                operation: "preprocess",
                nodeType: "process",
              },
            })

            // Adjust positions
            newNodes[2].position.y = 300
            newNodes[3].position.y = 425
          }

          // Create edges to connect the nodes
          let newEdges = []

          // Connect nodes based on whether we have preprocessing
          if (["summarization", "extraction", "analysis"].includes(pipelineType)) {
            newEdges = [
              {
                id: "e1-2",
                source: "input-1",
                target: "process-1",
                animated: true,
                label: "Raw Text",
              },
              {
                id: "e2-3",
                source: "process-1",
                target: "mistral-1",
                animated: true,
                label: "Processed Text",
              },
              {
                id: "e3-4",
                source: "mistral-1",
                target: "output-1",
                animated: true,
                label: pipelineType === "summarization" ? "Summary" : "Result",
              },
            ]
          } else {
            newEdges = [
              {
                id: "e1-2",
                source: "input-1",
                target: "mistral-1",
                animated: true,
                label: "Text",
              },
              {
                id: "e2-3",
                source: "mistral-1",
                target: "output-1",
                animated: true,
                label:
                  pipelineType === "translation"
                    ? "Translation"
                    : pipelineType === "sentiment"
                      ? "Analysis"
                      : pipelineType === "qa"
                        ? "Answer"
                        : pipelineType === "coding"
                          ? "Code"
                          : pipelineType === "classification"
                            ? "Category"
                            : "Result",
              },
            ]
          }

          return {
            message: `I've created a ${pipelineConfig.name.toLowerCase()} pipeline for you! This pipeline will ${pipelineConfig.description.toLowerCase()}. You can interact with the pipeline on the right - try right-clicking on nodes or connections to edit them.`,
            nodes: newNodes,
            edges: newEdges,
          }
        }

        // For other types of requests, use the Mistral API to generate a response
        // Prepare the conversation history for the API
        const messages = [
          {
            role: "system",
            content: `You are an AI assistant helping users build AI pipelines with Mistral AI. 
        You can help users modify existing pipelines, run pipelines, and explain how pipelines work.
        Be concise and helpful. Only suggest actions that can be performed in the pipeline builder interface.`,
          },
          ...messageHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "user", content: userMessage.content },
        ]

        // Make the API call
        const response = await chatCompletion(apiKey, modelName, messages, 0.7, 1000)

        const aiResponse = response.choices[0].message.content

        // Handle pipeline modifications if needed
        if (
          nodes.length > 0 &&
          (userContent.includes("add") ||
            userContent.includes("remove") ||
            userContent.includes("change") ||
            userContent.includes("modify"))
        ) {
          // Handle the specific modification requests
          // This part remains the same as before since it's handling UI state changes

          // Handle adding a step
          if (userContent.includes("add")) {
            if (userContent.includes("preprocessing") || userContent.includes("preprocess")) {
              // Add a preprocessing node
              const inputNode = nodes.find((node) => node.type === "input")
              if (!inputNode) {
                return {
                  message: "I couldn't find an input node to connect the preprocessing step to.",
                  nodes,
                  edges,
                }
              }

              // Create a new preprocessing node
              const newNodeId = `process-${Date.now()}`
              const newNode = {
                id: newNodeId,
                type: "process",
                position: {
                  x: inputNode.position.x,
                  y: inputNode.position.y + 100,
                },
                data: {
                  label: "Text Preprocessing",
                  operation: "preprocess",
                  nodeType: "process",
                },
              }

              // Adjust positions of other nodes
              const updatedNodes = nodes.map((node) => {
                if (node.id !== inputNode.id && node.position.y > inputNode.position.y) {
                  return {
                    ...node,
                    position: {
                      ...node.position,
                      y: node.position.y + 100,
                    },
                  }
                }
                return node
              })

              // Add the new node
              updatedNodes.push(newNode)

              // Update edges
              const updatedEdges = [...edges]

              // Find edges from input node
              const inputEdges = edges.filter((edge) => edge.source === inputNode.id)

              // Remove direct connections from input
              const filteredEdges = updatedEdges.filter((edge) => edge.source !== inputNode.id)

              // Add edge from input to preprocess
              filteredEdges.push({
                id: `e-input-preprocess-${Date.now()}`,
                source: inputNode.id,
                target: newNodeId,
                animated: true,
                label: "Raw Text",
              })

              // Add edges from preprocess to original targets
              inputEdges.forEach((edge) => {
                filteredEdges.push({
                  id: `e-preprocess-${edge.target}-${Date.now()}`,
                  source: newNodeId,
                  target: edge.target,
                  animated: true,
                  label: "Processed Text",
                })
              })

              return {
                message:
                  "I've added a preprocessing step to your pipeline. This will clean and prepare the text before it's processed further.",
                nodes: updatedNodes,
                edges: filteredEdges,
              }
            }

            if (userContent.includes("postprocessing") || userContent.includes("postprocess")) {
              // Add a postprocessing node
              const outputNode = nodes.find((node) => node.type === "output")
              if (!outputNode) {
                return {
                  message: "I couldn't find an output node to connect the postprocessing step to.",
                  nodes,
                  edges,
                }
              }

              // Find nodes that connect to the output
              const sourcesToOutput = edges.filter((edge) => edge.target === outputNode.id).map((edge) => edge.source)

              if (sourcesToOutput.length === 0) {
                return {
                  message: "I couldn't find any nodes connected to the output node.",
                  nodes,
                  edges,
                }
              }

              // Create a new postprocessing node
              const newNodeId = `process-${Date.now()}`
              const newNode = {
                id: newNodeId,
                type: "process",
                position: {
                  x: outputNode.position.x,
                  y: outputNode.position.y - 100,
                },
                data: {
                  label: "Output Formatting",
                  operation: "postprocess",
                  nodeType: "process",
                },
              }

              // Move output node down
              const updatedNodes = nodes.map((node) => {
                if (node.id === outputNode.id) {
                  return {
                    ...node,
                    position: {
                      ...node.position,
                      y: node.position.y + 100,
                    },
                  }
                }
                return node
              })

              // Add the new node
              updatedNodes.push(newNode)

              // Update edges
              const updatedEdges = [...edges]

              // Remove connections to output
              const filteredEdges = updatedEdges.filter((edge) => edge.target !== outputNode.id)

              // Add edges from sources to postprocess
              sourcesToOutput.forEach((source) => {
                filteredEdges.push({
                  id: `e-${source}-postprocess-${Date.now()}`,
                  source: source,
                  target: newNodeId,
                  animated: true,
                  label: "Raw Output",
                })
              })

              // Add edge from postprocess to output
              filteredEdges.push({
                id: `e-postprocess-output-${Date.now()}`,
                source: newNodeId,
                target: outputNode.id,
                animated: true,
                label: "Formatted",
              })

              return {
                message:
                  "I've added a postprocessing step to your pipeline. This will format the output for better readability.",
                nodes: updatedNodes,
                edges: filteredEdges,
              }
            }
          }

          // Handle removing a step
          else if (userContent.includes("remove")) {
            if (userContent.includes("preprocessing") || userContent.includes("preprocess")) {
              // Find preprocessing nodes
              const preprocessNodes = nodes.filter(
                (node) =>
                  node.type === "process" &&
                  (node.data.operation === "preprocess" || node.data.label.toLowerCase().includes("preprocess")),
              )

              if (preprocessNodes.length === 0) {
                return {
                  message: "I couldn't find any preprocessing nodes to remove.",
                  nodes,
                  edges,
                }
              }

              // For each preprocess node, reconnect its inputs to its outputs
              let updatedEdges = [...edges]

              preprocessNodes.forEach((node) => {
                // Find edges where this node is the target
                const incomingEdges = edges.filter((edge) => edge.target === node.id)

                // Find edges where this node is the source
                const outgoingEdges = edges.filter((edge) => edge.source === node.id)

                // Remove edges connected to this node
                updatedEdges = updatedEdges.filter((edge) => edge.source !== node.id && edge.target !== node.id)

                // Connect incoming sources to outgoing targets
                incomingEdges.forEach((inEdge) => {
                  outgoingEdges.forEach((outEdge) => {
                    updatedEdges.push({
                      id: `e-${inEdge.source}-${outEdge.target}-${Date.now()}`,
                      source: inEdge.source,
                      target: outEdge.target,
                      animated: true,
                      label: "Text",
                    })
                  })
                })
              })

              // Remove the preprocess nodes
              const updatedNodes = nodes.filter(
                (node) =>
                  !(
                    node.type === "process" &&
                    (node.data.operation === "preprocess" || node.data.label.toLowerCase().includes("preprocess"))
                  ),
              )

              return {
                message: "I've removed the preprocessing step(s) from your pipeline.",
                nodes: updatedNodes,
                edges: updatedEdges,
              }
            }

            if (userContent.includes("postprocessing") || userContent.includes("postprocess")) {
              // Find postprocessing nodes
              const postprocessNodes = nodes.filter(
                (node) =>
                  node.type === "process" &&
                  (node.data.operation === "postprocess" || node.data.label.toLowerCase().includes("postprocess")),
              )

              if (postprocessNodes.length === 0) {
                return {
                  message: "I couldn't find any postprocessing nodes to remove.",
                  nodes,
                  edges,
                }
              }

              // For each postprocess node, reconnect its inputs to its outputs
              let updatedEdges = [...edges]

              postprocessNodes.forEach((node) => {
                // Find edges where this node is the target
                const incomingEdges = edges.filter((edge) => edge.target === node.id)

                // Find edges where this node is the source
                const outgoingEdges = edges.filter((edge) => edge.source === node.id)

                // Remove edges connected to this node
                updatedEdges = updatedEdges.filter((edge) => edge.source !== node.id && edge.target !== node.id)

                // Connect incoming sources to outgoing targets
                incomingEdges.forEach((inEdge) => {
                  outgoingEdges.forEach((outEdge) => {
                    updatedEdges.push({
                      id: `e-${inEdge.source}-${outEdge.target}-${Date.now()}`,
                      source: inEdge.source,
                      target: outEdge.target,
                      animated: true,
                      label: "Result",
                    })
                  })
                })
              })

              // Remove the postprocess nodes
              const updatedNodes = nodes.filter(
                (node) =>
                  !(
                    node.type === "process" &&
                    (node.data.operation === "postprocess" || node.data.label.toLowerCase().includes("postprocess"))
                  ),
              )

              return {
                message: "I've removed the postprocessing step(s) from your pipeline.",
                nodes: updatedNodes,
                edges: updatedEdges,
              }
            }
          }

          // Handle changing the model or parameters
          else if (userContent.includes("change") || userContent.includes("modify")) {
            if (userContent.includes("model")) {
              // Find Mistral nodes
              const mistralNodes = nodes.filter((node) => node.type === "mistral")

              if (mistralNodes.length === 0) {
                return {
                  message: "I couldn't find any Mistral AI nodes to modify.",
                  nodes,
                  edges,
                }
              }

              let newModel = model || "mistral-small-latest"

              if (userContent.includes("small")) newModel = "mistral-small-latest"
              else if (userContent.includes("pixtral")) newModel = "pixtral-12b-2409"
              else if (userContent.includes("codestral")) newModel = "open-codestral-mamba"
              else if (userContent.includes("nemo")) newModel = "open-mistral-nemo"

              // Update all Mistral nodes
              const updatedNodes = nodes.map((node) => {
                if (node.type === "mistral") {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      model: newModel,
                    },
                  }
                }
                return node
              })

              return {
                message: `I've updated all Mistral AI nodes to use the ${newModel} model.`,
                nodes: updatedNodes,
                edges,
              }
            }

            if (userContent.includes("temperature")) {
              // Find Mistral nodes
              const mistralNodes = nodes.filter((node) => node.type === "mistral")

              if (mistralNodes.length === 0) {
                return {
                  message: "I couldn't find any Mistral AI nodes to modify.",
                  nodes,
                  edges,
                }
              }

              // Extract temperature value from message
              const temperatureMatch = userContent.match(/temperature\s+(?:to\s+)?(\d+(?:\.\d+)?)/i)
              let temperature = 0.7

              if (temperatureMatch && temperatureMatch[1]) {
                temperature = Number.parseFloat(temperatureMatch[1])
                // Ensure temperature is between 0 and 1
                temperature = Math.min(Math.max(temperature, 0), 1)
              } else if (userContent.includes("higher")) {
                temperature = 0.9
              } else if (userContent.includes("lower")) {
                temperature = 0.3
              }

              // Update all Mistral nodes
              const updatedNodes = nodes.map((node) => {
                if (node.type === "mistral") {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      temperature,
                    },
                  }
                }
                return node
              })

              return {
                message: `I've updated the temperature to ${temperature} for all Mistral AI nodes.`,
                nodes: updatedNodes,
                edges,
              }
            }

            if (userContent.includes("prompt") || userContent.includes("instruction")) {
              // Find Mistral nodes
              const mistralNodes = nodes.filter((node) => node.type === "mistral")

              if (mistralNodes.length === 0) {
                return {
                  message: "I couldn't find any Mistral AI nodes to modify.",
                  nodes,
                  edges,
                }
              }

              // Extract the new prompt
              const promptMatch = userContent.match(/prompt\s+(?:to\s+)?"([^"]+)"/i)
              let prompt = mistralNodes[0].data.prompt || ""

              if (promptMatch && promptMatch[1]) {
                prompt = promptMatch[1]
              } else {
                // Try to extract the prompt based on context
                const parts = userContent.split(/prompt\s+(?:to\s+)?/i)
                if (parts.length > 1) {
                  prompt = parts[1].trim()
                }
              }

              if (prompt) {
                // Update all Mistral nodes
                const updatedNodes = nodes.map((node) => {
                  if (node.type === "mistral") {
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        prompt,
                      },
                    }
                  }
                  return node
                })

                return {
                  message: `I've updated the prompt to: "${prompt}" for all Mistral AI nodes.`,
                  nodes: updatedNodes,
                  edges,
                }
              }
            }
          }
        }

        // Handle running the pipeline
        if (
          nodes.length > 0 &&
          (userContent.includes("run") || userContent.includes("test") || userContent.includes("try"))
        ) {
          // Extract the input text
          let inputText = ""

          if (userContent.includes("with")) {
            const parts = userContent.split(/with\s+(?:input\s+)?/i)
            if (parts.length > 1) {
              inputText = parts[1].trim()
              // Remove quotes if present
              inputText = inputText.replace(/^["'](.+)["']$/, "$1")
            }
          }

          if (!inputText) {
            // Use a default input based on node types
            const mistralNodes = nodes.filter((node) => node.type === "mistral")

            if (mistralNodes.length > 0) {
              const prompt = mistralNodes[0].data.prompt || ""

              if (prompt.includes("summarize")) {
                inputText =
                  "Artificial Intelligence (AI) has made significant strides in recent years, transforming various industries and aspects of daily life. From healthcare to finance, AI-powered solutions are enhancing efficiency, accuracy, and decision-making processes. However, the rapid advancement of AI also raises ethical concerns and questions about its impact on employment and privacy."
              } else if (prompt.includes("sentiment")) {
                inputText =
                  "I absolutely loved the new restaurant! The food was delicious and the service was excellent. I'll definitely be going back soon."
              } else if (prompt.includes("translate")) {
                inputText = "Hello, how are you today? I hope you're having a great day."
              } else {
                inputText = "This is a test input for the pipeline."
              }
            } else {
              inputText = "This is a test input for the pipeline."
            }
          }

          // Update input nodes with the text
          const updatedNodes = nodes.map((node) => {
            if (node.type === "input") {
              return {
                ...node,
                data: {
                  ...node.data,
                  content: inputText,
                },
              }
            }
            return node
          })

          // Run the pipeline with real API call
          const result = await simulateRunPipeline(updatedNodes, edges, apiKey)

          // Update output nodes with the result
          const finalNodes = updatedNodes.map((node) => {
            if (node.type === "output") {
              return {
                ...node,
                data: {
                  ...node.data,
                  content: result,
                },
              }
            } else if (node.type === "mistral") {
              return {
                ...node,
                data: {
                  ...node.data,
                  response: result,
                },
              }
            }
            return node
          })

          return {
            message: `I've run your pipeline with the input: "${inputText}"\n\nResult: ${result}`,
            nodes: finalNodes,
            edges,
          }
        }

        // Default response - just return the AI's response
        return {
          message: aiResponse,
          nodes,
          edges,
        }
      } catch (error) {
        console.error("Error processing message:", error)
        return {
          message: `I encountered an error: ${error.message || "Unknown error"}. Please check your API key and try again.`,
          nodes,
          edges,
        }
      }
    },
    [apiKey, model, nodes, edges, setNodes, setEdges],
  )

  // Update the simulateRunPipeline function to use real API calls

  const simulateRunPipeline = async (pipelineNodes, pipelineEdges, apiKey) => {
    // Find input nodes
    const inputNodes = pipelineNodes.filter((node) => node.type === "input")
    if (inputNodes.length === 0) {
      return "Error: Pipeline is missing input nodes"
    }

    // Find Mistral nodes
    const mistralNodes = pipelineNodes.filter((node) => node.type === "mistral")
    if (mistralNodes.length === 0) {
      return "Error: Pipeline is missing Mistral AI nodes"
    }

    // Get input content
    const inputContent = inputNodes[0].data.content || "No input provided"

    // Get Mistral configuration
    const mistralNode = mistralNodes[0]
    const prompt = mistralNode.data.prompt || "Process the following input:"
    const model = mistralNode.data.model || "mistral-small-latest"
    const temperature = mistralNode.data.temperature || 0.7
    const maxTokens = mistralNode.data.maxTokens || 500

    try {
      // Check for preprocessing nodes
      const preprocessNodes = pipelineNodes.filter(
        (node) =>
          node.type === "process" &&
          (node.data.operation === "preprocess" || node.data.label?.toLowerCase().includes("preprocess")),
      )

      // Apply preprocessing if needed
      let processedInput = inputContent
      if (preprocessNodes.length > 0) {
        // Simple preprocessing - lowercase and trim
        processedInput = inputContent.toLowerCase().trim()
      }

      // Make the actual API call to Mistral
      const result = await processPipeline(apiKey, model, prompt, processedInput, temperature, maxTokens)

      // Check for postprocessing nodes
      const postprocessNodes = pipelineNodes.filter(
        (node) =>
          node.type === "process" &&
          (node.data.operation === "postprocess" || node.data.label?.toLowerCase().includes("postprocess")),
      )

      // Apply postprocessing if needed
      let processedOutput = result
      if (postprocessNodes.length > 0) {
        // Simple postprocessing - format as markdown
        processedOutput = formatMarkdown(result)
      }

      return processedOutput
    } catch (error) {
      console.error("Error running pipeline:", error)
      return `Error: ${error.message || "Failed to process with Mistral AI"}`
    }
  }

  // Helper function for postprocessing
  function formatMarkdown(text) {
    // Simple markdown formatting
    return text
      .replace(/^([^\n]+)$/gm, "## $1") // Add heading to single lines
      .replace(/(\d+\.)\s+([^\n]+)/g, "$1 **$2**") // Bold numbered list items
  }

  const generateCodeFromPipeline = (pipelineNodes, pipelineEdges, modelName) => {
    // Find Mistral nodes
    const mistralNodes = pipelineNodes.filter((node) => node.type === "mistral")
    if (mistralNodes.length === 0) {
      return "// Error: Pipeline is missing Mistral configuration"
    }

    // Get the first Mistral node for simplicity
    const mistralNode = mistralNodes[0]
    const prompt = mistralNode.data.prompt || "Process the following input:"
    const temperature = mistralNode.data.temperature || 0.7
    const maxTokens = mistralNode.data.maxTokens || 500
    const model = mistralNode.data.model || modelName

    // Check for preprocessing nodes
    const hasPreprocessing = pipelineNodes.some(
      (node) =>
        node.type === "process" &&
        (node.data.operation === "preprocess" || node.data.label?.toLowerCase().includes("preprocess")),
    )

    // Check for postprocessing nodes
    const hasPostprocessing = pipelineNodes.some(
      (node) =>
        node.type === "process" &&
        (node.data.operation === "postprocess" || node.data.label?.toLowerCase().includes("postprocess")),
    )

    return `
import { MistralClient } from '@mistralai/mistralai';

/**
 * Mistral AI Pipeline
 * Generated by Mistral Pipeline Builder
 */

// Initialize the client with your API key
const client = new MistralClient(process.env.MISTRAL_API_KEY || "your-api-key-here");

/**
 * Main pipeline function
 * @param {string} input - The input text to process
 * @returns {Promise<string>} - The processed output
 */
async function runPipeline(input) {
  try {
    // Step 1: Preprocess the input
    ${hasPreprocessing ? "const processedInput = preprocess(input);" : "const processedInput = input;"}
    
    // Step 2: Generate response with Mistral AI
    const response = await client.chat({
      model: "${model}",
      messages: [
        { role: "system", content: \`${prompt}\` },
        { role: "user", content: processedInput }
      ],
      temperature: ${temperature},
      max_tokens: ${maxTokens}
    });
    
    // Step 3: Extract and postprocess the response
    const result = response.choices[0].message.content;
    ${hasPostprocessing ? "return postprocess(result);" : "return result;"}
  } catch (error) {
    console.error("Pipeline execution error:", error);
    throw error;
  }
}

${
  hasPreprocessing
    ? `
/**
 * Preprocess the input before sending to Mistral AI
 * @param {string} input - Raw input
 * @returns {string} - Processed input
 */
function preprocess(input) {
  // Add your preprocessing logic here
  return input.trim().toLowerCase();
}
`
    : ""
}

${
  hasPostprocessing
    ? `
/**
 * Postprocess the output from Mistral AI
 * @param {string} output - Raw output from Mistral
 * @returns {string} - Processed output
 */
function postprocess(output) {
  // Add your postprocessing logic here
  return formatMarkdown(output);
}

/**
 * Format text as Markdown
 * @param {string} text - Text to format
 * @returns {string} - Formatted text
 */
function formatMarkdown(text) {
  // Simple markdown formatting
  return text
    .replace(/^([^\n]+)$/gm, '## $1') // Add heading to single lines
    .replace(/(\d+\.)\s+([^\n]+)/g, '$1 **$2**'); // Bold numbered list items
}
`
    : ""
}

// Export the pipeline function
export default runPipeline;
`.trim()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      toast({
        title: "Code Copied",
        description: "The generated code has been copied to your clipboard.",
      })
    }
  }

  const handleDownloadCode = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode], { type: "text/javascript" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "mistral-pipeline.js"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: "Code Downloaded",
        description: "The generated code has been downloaded as mistral-pipeline.js",
      })
    }
  }

  const handleRunPipeline = async () => {
    if (nodes.length === 0) return

    setIsLoading(true)

    try {
      // Find input nodes
      const inputNodes = nodes.filter((node) => node.type === "input")
      if (inputNodes.length === 0) {
        throw new Error("Pipeline is missing input nodes")
      }

      // Use the first input node's content or a default
      const inputText = inputNodes[0].data.content || "This is a test input for the pipeline."

      // Run the pipeline with real API call
      const result = await simulateRunPipeline(nodes, edges, apiKey)

      // Update nodes with results
      const updatedNodes = nodes.map((node) => {
        if (node.type === "output") {
          return {
            ...node,
            data: {
              ...node.data,
              content: result,
            },
          }
        } else if (node.type === "mistral") {
          return {
            ...node,
            data: {
              ...node.data,
              response: result,
            },
          }
        }
        return node
      })

      setNodes(updatedNodes)

      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Run the pipeline with input: "${inputText}"` },
        { role: "assistant", content: `I've run your pipeline with the input.\n\nResult: ${result}` },
      ])
    } catch (error) {
      console.error("Error running pipeline:", error)
      toast({
        title: "Pipeline Error",
        description: error instanceof Error ? error.message : "An error occurred while running the pipeline",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPipeline = () => {
    // Clear nodes and edges
    setNodes([])
    setEdges([])

    // Clear generated code
    setGeneratedCode(null)

    // Reset messages
    setMessages([
      {
        role: "assistant",
        content: "I've reset everything. Let's start fresh! What kind of AI agent would you like to build?",
      },
    ])
  }

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "I've cleared our conversation. How can I help you with your AI pipeline?",
      },
    ])
  }

  const handleNodeContextMenu = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault()
    setNodeContextMenuPosition({ x: event.clientX, y: event.clientY })
    setSelectedNodeId(nodeId)
    setIsNodeContextMenuOpen(true)
    setIsEdgeContextMenuOpen(false)
  }

  const handleEdgeContextMenu = (event: React.MouseEvent, edgeId: string) => {
    event.preventDefault()
    setEdgeContextMenuPosition({ x: event.clientX, y: event.clientY })
    setSelectedEdgeId(edgeId)
    setIsEdgeContextMenuOpen(true)
    setIsNodeContextMenuOpen(false)
  }

  if (!apiKey) {
    return <ApiKeyWarning />
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Mistral AI Pipeline Builder</h1>
          </div>

          <div className="flex items-center space-x-2">
            {nodes.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleRunPipeline} disabled={isLoading}>
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>

                <Button variant="outline" size="sm" onClick={handleCopyCode} disabled={!generatedCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>

                <Button variant="outline" size="sm" onClick={handleDownloadCode} disabled={!generatedCode}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                <Button variant="outline" size="sm" onClick={handleResetPipeline}>
                  <Trash className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}

            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat section - 1/3 of the view */}
        <div className="w-1/3 flex flex-col h-full overflow-hidden border-r">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2 mb-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleClearChat}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what kind of AI agent you want to build..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                {isLoading ? "Thinking..." : "Send"}
              </Button>
            </div>
          </div>
        </div>

        {/* Pipeline visualization - 2/3 of the view */}
        <div className="w-2/3 overflow-auto">
          <InteractivePipeline onNodeContextMenu={handleNodeContextMenu} onEdgeContextMenu={handleEdgeContextMenu} />
        </div>
      </div>

      {/* Context menu for nodes */}
      <NodeContextMenu
        isOpen={isNodeContextMenuOpen}
        position={nodeContextMenuPosition}
        nodeId={selectedNodeId}
        onClose={() => setIsNodeContextMenuOpen(false)}
      />

      {/* Context menu for edges */}
      <EdgeContextMenu
        isOpen={isEdgeContextMenuOpen}
        position={edgeContextMenuPosition}
        edgeId={selectedEdgeId}
        onClose={() => setIsEdgeContextMenuOpen(false)}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

