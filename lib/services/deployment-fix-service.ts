export class DeploymentFixService {
  static async cleanDependencies() {
    const steps = [
      "Remove bun-types from package.json",
      "Delete package-lock.json",
      "Delete node_modules",
      "Run npm install with clean cache",
      "Verify no React version conflicts",
    ]

    return {
      steps,
      commands: [
        "rm -rf node_modules package-lock.json",
        "npm cache clean --force",
        "npm install",
        "npm ls @types/react",
      ],
    }
  }

  static checkForConflicts(packageJson: any) {
    const conflicts = []

    // Check for React version conflicts
    if (packageJson.devDependencies?.["bun-types"]) {
      conflicts.push("bun-types requires @types/react ^19 but project uses ^18")
    }

    if (packageJson.dependencies?.["react-native"]) {
      conflicts.push("react-native may conflict with Next.js React version")
    }

    return conflicts
  }
}
