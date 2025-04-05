"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Download, Copy, Play, Trash } from "lucide-react"
import { useApiKey } from "@/hooks/use-api-key"
import { useToast } from "@/components/ui/use-toast"
import SettingsModal from "./settings-modal"
import PipelineVisualizer from "./pipeline-visualizer"
import type { Message, Pipeline, PipelineStep } from "@/types/pipeline"

export default function ChatInterface() {
  const { apiKey, model } = useApiKey()
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
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
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
      setMessages((prev) => [...prev, { role: "assistant", content: response.message }])

      // Update pipeline if the response includes one
      if (response.pipeline) {
        setPipeline(response.pipeline)
        // Generate code based on the pipeline
        const code = generateCodeFromPipeline(response.pipeline, model || "mistral-small-latest")
        setGeneratedCode(code)
      }
    } catch (error) {
      console.error("Error processing message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // This would normally call the Mistral API, but we'll simulate it for now
  const processUserMessage = async (userMessage: Message, messageHistory: Message[], modelName: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const userContent = userMessage.content.toLowerCase()

    // Check if the message is about creating a pipeline
    if (userContent.includes("build") || userContent.includes("create") || userContent.includes("make")) {
      // Determine the type of pipeline based on user input
      let pipelineType = "general"
      let pipelineDescription = "Process text input and generate a response"

      if (userContent.includes("summarize") || userContent.includes("summary")) {
        pipelineType = "summarization"
        pipelineDescription = "Summarize articles or long text into concise points"
      } else if (userContent.includes("sentiment") || userContent.includes("emotion")) {
        pipelineType = "sentiment"
        pipelineDescription = "Analyze the sentiment of text (positive, negative, neutral)"
      } else if (userContent.includes("translate") || userContent.includes("translation")) {
        pipelineType = "translation"
        pipelineDescription = "Translate text between languages"
      } else if (userContent.includes("qa") || userContent.includes("question") || userContent.includes("answer")) {
        pipelineType = "qa"
        pipelineDescription = "Answer questions based on provided context"
      }

      // Create a pipeline based on the type
      const newPipeline = createPipeline(pipelineType, pipelineDescription)

      return {
        message: `I've created a ${pipelineType} pipeline for you! This pipeline will ${pipelineDescription.toLowerCase()}. You can see the pipeline visualization below. Would you like to modify any part of it or run it with some test input?`,
        pipeline: newPipeline,
      }
    }

    // Check if the message is about modifying the pipeline
    else if (
      pipeline &&
      (userContent.includes("add") ||
        userContent.includes("remove") ||
        userContent.includes("change") ||
        userContent.includes("modify"))
    ) {
      const updatedPipeline = { ...pipeline }

      // Handle adding a step
      if (userContent.includes("add")) {
        if (userContent.includes("preprocessing") || userContent.includes("preprocess")) {
          updatedPipeline.steps = [
            {
              id: `preprocess-${Date.now()}`,
              type: "preprocess",
              name: "Text Preprocessing",
              description: "Clean and prepare text for processing",
              config: { operations: ["trim", "lowercase"] },
            },
            ...updatedPipeline.steps,
          ]
          return {
            message:
              "I've added a preprocessing step to your pipeline. This will clean and prepare the text before it's processed further.",
            pipeline: updatedPipeline,
          }
        }

        if (userContent.includes("postprocessing") || userContent.includes("postprocess")) {
          updatedPipeline.steps.push({
            id: `postprocess-${Date.now()}`,
            type: "postprocess",
            name: "Output Formatting",
            description: "Format the output for better readability",
            config: { format: "markdown" },
          })
          return {
            message:
              "I've added a postprocessing step to your pipeline. This will format the output in Markdown for better readability.",
            pipeline: updatedPipeline,
          }
        }
      }

      // Handle removing a step
      else if (userContent.includes("remove")) {
        if (userContent.includes("preprocessing") || userContent.includes("preprocess")) {
          updatedPipeline.steps = updatedPipeline.steps.filter((step) => step.type !== "preprocess")
          return {
            message: "I've removed the preprocessing step from your pipeline.",
            pipeline: updatedPipeline,
          }
        }

        if (userContent.includes("postprocessing") || userContent.includes("postprocess")) {
          updatedPipeline.steps = updatedPipeline.steps.filter((step) => step.type !== "postprocess")
          return {
            message: "I've removed the postprocessing step from your pipeline.",
            pipeline: updatedPipeline,
          }
        }
      }

      // Handle changing the model or parameters
      else if (userContent.includes("change") || userContent.includes("modify")) {
        if (userContent.includes("model")) {
          // Find the Mistral step
          const mistralStepIndex = updatedPipeline.steps.findIndex((step) => step.type === "mistral")
          if (mistralStepIndex !== -1) {
            let newModel = model

            if (userContent.includes("small")) newModel = "mistral-small-latest"
            else if (userContent.includes("pixtral")) newModel = "pixtral-12b-2409"
            else if (userContent.includes("codestral")) newModel = "open-codestral-mamba"
            else if (userContent.includes("nemo")) newModel = "open-mistral-nemo"

            updatedPipeline.steps[mistralStepIndex].config = {
              ...updatedPipeline.steps[mistralStepIndex].config,
              model: newModel,
            }

            return {
              message: `I've updated the model to ${newModel}.`,
              pipeline: updatedPipeline,
            }
          }
        }

        if (userContent.includes("temperature")) {
          // Find the Mistral step
          const mistralStepIndex = updatedPipeline.steps.findIndex((step) => step.type === "mistral")
          if (mistralStepIndex !== -1) {
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

            updatedPipeline.steps[mistralStepIndex].config = {
              ...updatedPipeline.steps[mistralStepIndex].config,
              temperature,
            }

            return {
              message: `I've updated the temperature to ${temperature}.`,
              pipeline: updatedPipeline,
            }
          }
        }

        if (userContent.includes("prompt") || userContent.includes("instruction")) {
          // Find the Mistral step
          const mistralStepIndex = updatedPipeline.steps.findIndex((step) => step.type === "mistral")
          if (mistralStepIndex !== -1) {
            // Extract the new prompt
            const promptMatch = userContent.match(/prompt\s+(?:to\s+)?"([^"]+)"/i)
            let prompt = updatedPipeline.steps[mistralStepIndex].config?.prompt || ""

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
              updatedPipeline.steps[mistralStepIndex].config = {
                ...updatedPipeline.steps[mistralStepIndex].config,
                prompt,
              }

              return {
                message: `I've updated the prompt to: "${prompt}"`,
                pipeline: updatedPipeline,
              }
            }
          }
        }
      }

      return {
        message:
          "I'm not sure how to modify the pipeline based on your request. Could you be more specific? For example, you can ask me to add preprocessing, change the model, or modify the temperature.",
        pipeline: updatedPipeline,
      }
    }

    // Check if the message is about running the pipeline
    else if (pipeline && (userContent.includes("run") || userContent.includes("test") || userContent.includes("try"))) {
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
        // Use a default input based on pipeline type
        if (pipeline.type === "summarization") {
          inputText =
            "Artificial Intelligence (AI) has made significant strides in recent years, transforming various industries and aspects of daily life. From healthcare to finance, AI-powered solutions are enhancing efficiency, accuracy, and decision-making processes. However, the rapid advancement of AI also raises ethical concerns and questions about its impact on employment and privacy."
        } else if (pipeline.type === "sentiment") {
          inputText =
            "I absolutely loved the new restaurant! The food was delicious and the service was excellent. I'll definitely be going back soon."
        } else if (pipeline.type === "translation") {
          inputText = "Hello, how are you today? I hope you're having a great day."
        } else if (pipeline.type === "qa") {
          inputText = "What are the benefits of exercise?"
        } else {
          inputText = "This is a test input for the general pipeline."
        }
      }

      // Simulate running the pipeline
      const result = await simulateRunPipeline(pipeline, inputText)

      return {
        message: `I've run your pipeline with the input: "${inputText}"\n\nResult: ${result}`,
        pipeline,
      }
    }

    // Default response
    return {
      message:
        "I'm here to help you build AI pipelines. You can ask me to create a new pipeline, modify an existing one, or run a pipeline with test input. What would you like to do?",
      pipeline,
    }
  }

  const createPipeline = (type: string, description: string): Pipeline => {
    const steps: PipelineStep[] = []

    // Add input step
    steps.push({
      id: `input-${Date.now()}`,
      type: "input",
      name: "User Input",
      description: "The text input provided by the user",
      config: {},
    })

    // Add Mistral step with appropriate prompt based on type
    let prompt = "Process the following input:"

    if (type === "summarization") {
      prompt =
        "You are an AI assistant that summarizes text. Provide a concise summary of the following text in 3-5 sentences:"
    } else if (type === "sentiment") {
      prompt =
        "Analyze the sentiment of the following text. Classify it as positive, negative, or neutral, and explain your reasoning:"
    } else if (type === "translation") {
      prompt = "Translate the following text to French:"
    } else if (type === "qa") {
      prompt = "Answer the following question concisely and accurately:"
    }

    steps.push({
      id: `mistral-${Date.now()}`,
      type: "mistral",
      name: "Mistral AI",
      description: "Process text using Mistral AI",
      config: {
        model: model || "mistral-small-latest",
        prompt,
        temperature: 0.7,
        maxTokens: 500,
      },
    })

    // Add output step
    steps.push({
      id: `output-${Date.now()}`,
      type: "output",
      name: "Output",
      description: "The generated output",
      config: {},
    })

    return {
      id: `pipeline-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Pipeline`,
      description,
      type,
      steps,
    }
  }

  const simulateRunPipeline = async (pipeline: Pipeline, input: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Find the Mistral step
    const mistralStep = pipeline.steps.find((step) => step.type === "mistral")
    if (!mistralStep || !mistralStep.config) {
      return "Error: Pipeline is missing Mistral configuration"
    }

    const prompt = mistralStep.config.prompt || "Process the following input:"

    // Generate a response based on the pipeline type
    if (pipeline.type === "summarization") {
      return "Summary: Artificial Intelligence has significantly advanced recently, transforming industries from healthcare to finance by improving efficiency and decision-making. Despite these benefits, AI's rapid growth raises ethical concerns about its impact on employment and privacy issues."
    } else if (pipeline.type === "sentiment") {
      return "Sentiment: Positive\n\nThe text expresses strong positive sentiment with phrases like 'absolutely loved', 'delicious', 'excellent', and 'definitely be going back'. The author is clearly satisfied with their experience at the restaurant."
    } else if (pipeline.type === "translation") {
      return "Translation: Bonjour, comment allez-vous aujourd'hui ? J'espère que vous passez une excellente journée."
    } else if (pipeline.type === "qa") {
      return "Regular exercise provides numerous benefits including improved cardiovascular health, stronger muscles and bones, better weight management, enhanced mental health, reduced risk of chronic diseases, improved sleep quality, and increased energy levels."
    } else {
      return `Processed input using ${mistralStep.config.model || "Mistral AI"} with temperature ${mistralStep.config.temperature || 0.7}.\n\nThe model generated this response based on your input and the system prompt: "${prompt}"`
    }
  }

  const generateCodeFromPipeline = (pipeline: Pipeline, modelName: string) => {
    // Find the Mistral step
    const mistralStep = pipeline.steps.find((step) => step.type === "mistral")
    if (!mistralStep || !mistralStep.config) {
      return "// Error: Pipeline is missing Mistral configuration"
    }

    const prompt = mistralStep.config.prompt || "Process the following input:"
    const temperature = mistralStep.config.temperature || 0.7
    const maxTokens = mistralStep.config.maxTokens || 500
    const model = mistralStep.config.model || modelName

    // Check for preprocessing step
    const hasPreprocessing = pipeline.steps.some((step) => step.type === "preprocess")

    // Check for postprocessing step
    const hasPostprocessing = pipeline.steps.some((step) => step.type === "postprocess")

    return `
import { MistralClient } from '@mistralai/mistralai';

/**
 * ${pipeline.name}
 * ${pipeline.description}
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
    .replace(/^([^\\n]+)$/gm, '## $1') // Add heading to single lines
    .replace(/(\\d+\\.)\\s+([^\\n]+)/g, '$1 **$2**'); // Bold numbered list items
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
    if (!pipeline) return

    setIsLoading(true)

    try {
      // Simulate running the pipeline with a default input
      let defaultInput = "This is a test input for the pipeline."

      if (pipeline.type === "summarization") {
        defaultInput =
          "Artificial Intelligence (AI) has made significant strides in recent years, transforming various industries and aspects of daily life. From healthcare to finance, AI-powered solutions are enhancing efficiency, accuracy, and decision-making processes. However, the rapid advancement of AI also raises ethical concerns and questions about its impact on employment and privacy."
      }

      const result = await simulateRunPipeline(pipeline, defaultInput)

      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Run the pipeline with test input: "${defaultInput}"` },
        { role: "assistant", content: `I've run your pipeline with the test input.\n\nResult: ${result}` },
      ])
    } catch (error) {
      console.error("Error running pipeline:", error)
      toast({
        title: "Pipeline Error",
        description: "An error occurred while running the pipeline",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPipeline = () => {
    setPipeline(null)
    setGeneratedCode(null)
    setMessages([
      {
        role: "assistant",
        content: "I've reset everything. Let's start fresh! What kind of AI agent would you like to build?",
      },
    ])
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
            {pipeline && (
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
        {/* Chat section */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
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

        {/* Pipeline visualization */}
        {pipeline && (
          <div className="w-1/3 border-l overflow-auto">
            <PipelineVisualizer pipeline={pipeline} />
          </div>
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

