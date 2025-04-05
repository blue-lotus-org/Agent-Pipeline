"use client"

import type { ReactNode } from "react"
import { ApiKeyProvider } from "@/hooks/use-api-key"
import { FlowProvider } from "@/contexts/flow-context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApiKeyProvider>
      <FlowProvider>{children}</FlowProvider>
    </ApiKeyProvider>
  )
}

