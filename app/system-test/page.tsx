import { SystemTestRunner } from "@/components/system-test-runner"

export default function SystemTestPage() {
  return (
    <div className="container mx-auto py-8">
      <SystemTestRunner />
    </div>
  )
}

export const metadata = {
  title: "System Test Runner | Burnt Beats",
  description: "Comprehensive system testing for Burnt Beats application",
}
