"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useState } from "react"
import SettingsModal from "./settings-modal"

export default function ApiKeyWarning() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Mistral API Key Required</h2>
        <p className="mb-6 text-muted-foreground">
          To use the Mistral AI Pipeline Builder, you need to provide your Mistral API key. Your key is stored locally
          in your browser and never sent to our servers.
        </p>
        <Button onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configure API Key
        </Button>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

