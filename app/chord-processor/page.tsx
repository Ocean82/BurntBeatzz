import { ChordProcessorDashboard } from "@/components/chord-processor-dashboard"

export default function ChordProcessorPage() {
  return (
    <div className="container mx-auto p-6">
      <ChordProcessorDashboard />
    </div>
  )
}

export const metadata = {
  title: "Chord Processor | Burnt Beats",
  description: "Process chord sets and generate MIDI files with advanced chord analysis",
}
