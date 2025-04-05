"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface ApiKeyContextType {
  apiKey: string | null
  setApiKey: (key: string) => void
  model: string | null
  setModel: (model: string) => void
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [model, setModelState] = useState<string | null>("mistral-small-latest")

  useEffect(() => {
    // Load from localStorage on mount
    const storedApiKey = localStorage.getItem("mistralApiKey")
    const storedModel = localStorage.getItem("mistralModel")

    if (storedApiKey) setApiKeyState(storedApiKey)
    if (storedModel) setModelState(storedModel)
  }, [])

  const setApiKey = (key: string) => {
    setApiKeyState(key)
    localStorage.setItem("mistralApiKey", key)
  }

  const setModel = (newModel: string) => {
    setModelState(newModel)
    localStorage.setItem("mistralModel", newModel)
  }

  return <ApiKeyContext.Provider value={{ apiKey, setApiKey, model, setModel }}>{children}</ApiKeyContext.Provider>
}

export function useApiKey() {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider")
  }
  return context
}

