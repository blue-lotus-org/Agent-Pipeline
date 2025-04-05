export const PIPELINE_TYPES = [
  {
    id: "summarization",
    name: "Text Summarization",
    description: "Summarize articles or long text into concise points",
    prompt:
      "You are an AI assistant that summarizes text. Provide a concise summary of the following text in 3-5 sentences:",
    temperature: 0.7,
  },
  {
    id: "sentiment",
    name: "Sentiment Analysis",
    description: "Analyze the sentiment of text (positive, negative, neutral)",
    prompt:
      "Analyze the sentiment of the following text. Classify it as positive, negative, or neutral, and explain your reasoning:",
    temperature: 0.3,
  },
  {
    id: "translation",
    name: "Text Translation",
    description: "Translate text between languages",
    prompt: "Translate the following text to French:",
    temperature: 0.3,
  },
  {
    id: "qa",
    name: "Question Answering",
    description: "Answer questions based on provided context",
    prompt: "Answer the following question concisely and accurately based on the provided context:",
    temperature: 0.5,
  },
  {
    id: "extraction",
    name: "Information Extraction",
    description: "Extract specific information from text",
    prompt:
      "Extract the following information from the text: names, dates, locations, and key facts. Format the output as a structured JSON object.",
    temperature: 0.2,
  },
  {
    id: "classification",
    name: "Text Classification",
    description: "Classify text into predefined categories",
    prompt:
      "Classify the following text into one of these categories: Business, Technology, Health, Entertainment, Sports, Politics, Education, Science. Explain your reasoning.",
    temperature: 0.3,
  },
  {
    id: "generation",
    name: "Content Generation",
    description: "Generate creative content based on prompts",
    prompt: "Generate creative content based on the following input. Be imaginative and engaging:",
    temperature: 0.9,
  },
  {
    id: "rewriting",
    name: "Text Rewriting",
    description: "Rewrite text to improve clarity or style",
    prompt: "Rewrite the following text to improve clarity, grammar, and style while preserving the original meaning:",
    temperature: 0.6,
  },
  {
    id: "coding",
    name: "Code Generation",
    description: "Generate code based on requirements",
    prompt: "Generate code based on the following requirements. Include comments to explain your implementation:",
    temperature: 0.4,
  },
  {
    id: "analysis",
    name: "Text Analysis",
    description: "Analyze text for themes, tone, and structure",
    prompt: "Analyze the following text for key themes, tone, style, and structure. Provide a detailed breakdown:",
    temperature: 0.5,
  },
]

