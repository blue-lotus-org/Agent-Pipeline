import PipelineBuilder from "@/components/pipeline-builder"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <PipelineBuilder />
      <Toaster />
    </main>
  )
}

