import { Ocean82MidiSync } from "@/components/ocean82-midi-sync"

export default function Ocean82SyncPage() {
  return (
    <div className="container mx-auto p-6">
      <Ocean82MidiSync />
    </div>
  )
}

export const metadata = {
  title: "Ocean82 MIDI Sync | Burnt Beats",
  description: "Sync MIDI files from Ocean82/midi_land repository",
}
