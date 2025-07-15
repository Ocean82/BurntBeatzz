import { MelodyBrowser } from "@/components/melody-browser"

export default function MelodiesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Melody Collection</h1>
          <p className="text-muted-foreground">Browse and manage your melody files including melody1 and melody2</p>
        </div>
        <MelodyBrowser />
      </div>
    </div>
  )
}
