import { DeploymentReadinessChecker } from "@/components/deployment-readiness-checker"

export default function DeploymentCheckPage() {
  return (
    <div className="container mx-auto py-8">
      <DeploymentReadinessChecker />
    </div>
  )
}
