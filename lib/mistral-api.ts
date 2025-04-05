/**
 * Utility functions for interacting with the Mistral AI API
 */

export interface MistralChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface MistralChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Send a chat completion request to the Mistral AI API
 */
export async function chatCompletion(
  apiKey: string,
  model: string,
  messages: MistralChatMessage[],
  temperature = 0.7,
  maxTokens = 500,
): Promise<MistralChatResponse> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mistral API error (${response.status}): ${errorText}`)
  }

  return response.json()
}

/**
 * Process text through a pipeline using Mistral AI
 */
export async function processPipeline(
  apiKey: string,
  model: string,
  systemPrompt: string,
  input: string,
  temperature = 0.7,
  maxTokens = 500,
): Promise<string> {
  try {
    const messages: MistralChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: input },
    ]

    const response = await chatCompletion(apiKey, model, messages, temperature, maxTokens)
    return response.choices[0].message.content
  } catch (error) {
    console.error("Error processing pipeline:", error)
    throw error
  }
}

