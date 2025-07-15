interface RepositoryValidation {
  isValid: boolean
  correctedUrl?: string
  error?: string
  suggestions?: string[]
}

export class RepositoryValidator {
  static validateGitHubUrl(url: string): RepositoryValidation {
    // Remove common typos and fix URL format
    let cleanUrl = url.trim()

    // Fix common typos
    if (cleanUrl.endsWith(".gitmore")) {
      cleanUrl = cleanUrl.replace(".gitmore", "")
    }
    if (cleanUrl.endsWith(".git")) {
      cleanUrl = cleanUrl.replace(".git", "")
    }

    // Ensure proper GitHub URL format
    if (!cleanUrl.startsWith("https://github.com/")) {
      if (cleanUrl.includes("github.com/")) {
        cleanUrl = "https://" + cleanUrl.substring(cleanUrl.indexOf("github.com/"))
      } else if (cleanUrl.includes("/")) {
        cleanUrl = "https://github.com/" + cleanUrl
      } else {
        return {
          isValid: false,
          error: "Invalid repository format",
          suggestions: ["Format should be: owner/repository or https://github.com/owner/repository"],
        }
      }
    }

    // Extract owner and repo
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return {
        isValid: false,
        error: "Could not parse repository owner and name",
        suggestions: ["Format should be: https://github.com/owner/repository"],
      }
    }

    const [, owner, repo] = match

    // Validate owner and repo names
    if (!owner || !repo) {
      return {
        isValid: false,
        error: "Missing repository owner or name",
        suggestions: ["Both owner and repository name are required"],
      }
    }

    // Check for valid GitHub username/repo patterns
    const validPattern = /^[a-zA-Z0-9._-]+$/
    if (!validPattern.test(owner) || !validPattern.test(repo)) {
      return {
        isValid: false,
        error: "Invalid characters in repository name",
        suggestions: ["Repository names can only contain letters, numbers, dots, hyphens, and underscores"],
      }
    }

    return {
      isValid: true,
      correctedUrl: `https://github.com/${owner}/${repo}`,
    }
  }

  static async checkRepositoryExists(
    owner: string,
    repo: string,
  ): Promise<{
    exists: boolean
    isPublic?: boolean
    hasContent?: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          "User-Agent": "Burnt-Beats-MIDI-Sync",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      })

      if (response.status === 404) {
        return { exists: false, error: "Repository not found" }
      }

      if (!response.ok) {
        return { exists: false, error: `GitHub API error: ${response.status}` }
      }

      const repoData = await response.json()

      return {
        exists: true,
        isPublic: !repoData.private,
        hasContent: repoData.size > 0,
      }
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
