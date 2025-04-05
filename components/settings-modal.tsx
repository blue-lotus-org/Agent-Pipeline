"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApiKey } from "@/hooks/use-api-key"
import { useToast } from "@/components/ui/use-toast"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const MISTRAL_MODELS = [
  { id: "mistral-small-latest", name: "Mistral Small (Latest)" },
  { id: "mistral-medium-latest", name: "Mistral Medium (Latest)" },
  { id: "mistral-large-latest", name: "Mistral Large (Latest)" },
  { id: "pixtral-12b-2409", name: "Pixtral 12B" },
  { id: "open-codestral-mamba", name: "Open Codestral Mamba" },
  { id: "open-mistral-nemo", name: "Open Mistral Nemo" },
  { id: "open-mixtral-8x7b", name: "Open Mixtral 8x7B" },
]

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, setApiKey, model, setModel } = useApiKey()
  const [tempApiKey, setTempApiKey] = useState(apiKey || "")
  const [tempModel, setTempModel] = useState(model || MISTRAL_MODELS[0].id)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setTempApiKey(apiKey || "")
      setTempModel(model || MISTRAL_MODELS[0].id)
    }
  }, [isOpen, apiKey, model])

  const handleSave = () => {
    if (!tempApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Mistral AI API key to continue.",
        variant: "destructive",
      })
      return
    }

    setApiKey(tempApiKey)
    setModel(tempModel)
    toast({
      title: "Settings Saved",
      description: "Your API key and model preferences have been saved.",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your Mistral AI API key and model preferences.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Mistral AI API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Mistral AI API key"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and never sent to our servers. You can get an API key from{" "}
              <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="underline">
                Mistral AI
              </a>
              .
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Default Model</Label>
            <Select value={tempModel} onValueChange={setTempModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {MISTRAL_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This model will be used by default when creating new pipelines.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

