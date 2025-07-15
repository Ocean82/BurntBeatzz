import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Extract owner and repo from GitHub URL - handle multiple formats
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL format" }, { status: 400 })
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, "").replace(/\/$/, "")

    // Check if repository exists using GitHub API
    const githubToken = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Burnt-Beats-App",
      "Cache-Control": "no-cache", // Prevent caching for recently public repos
    }

    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`
    }

    console.log(`Checking repository: ${owner}/${cleanRepo}`)

    const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
      headers,
    })

    console.log(`GitHub API response status: ${response.status}`)

    if (response.status === 200) {
      const repoData = await response.json()
      return NextResponse.json({
        accessible: true,
        exists: true,
        private: repoData.private,
        owner: repoData.owner.login,
        name: repoData.name,
        fullName: repoData.full_name,
        defaultBranch: repoData.default_branch,
        cloneUrl: repoData.clone_url,
        sshUrl: repoData.ssh_url,
        description: repoData.description,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
      })
    } else if (response.status === 404) {
      // Try alternative spellings/formats
      const alternatives = [
        `${owner}/BurntBeats`,
        `${owner}/Burnt-Beats`,
        `${owner}/burntbeatzz`,
        `${owner}/burnt-beats`,
      ]

      for (const altRepo of alternatives) {
        if (altRepo !== `${owner}/${cleanRepo}`) {
          console.log(`Trying alternative: ${altRepo}`)
          const altResponse = await fetch(`https://api.github.com/repos/${altRepo}`, {
            headers,
          })

          if (altResponse.status === 200) {
            const repoData = await altResponse.json()
            return NextResponse.json({
              accessible: true,
              exists: true,
              private: repoData.private,
              owner: repoData.owner.login,
              name: repoData.name,
              fullName: repoData.full_name,
              defaultBranch: repoData.default_branch,
              cloneUrl: repoData.clone_url,
              sshUrl: repoData.ssh_url,
              description: repoData.description,
              alternativeFound: true,
              originalUrl: `${owner}/${cleanRepo}`,
            })
          }
        }
      }

      return NextResponse.json({
        accessible: false,
        exists: false,
        private: false,
        error: "Repository not found - may not exist or recently made public (try again in a few minutes)",
        suggestions: alternatives.map((alt) => `https://github.com/${alt}`),
      })
    } else if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        accessible: false,
        exists: true,
        private: true,
        error: errorData.message || "Repository is private or rate limit exceeded",
        rateLimited: errorData.message?.includes("rate limit"),
      })
    } else {
      return NextResponse.json({
        accessible: false,
        exists: false,
        private: false,
        error: `GitHub API returned status ${response.status}`,
      })
    }
  } catch (error) {
    console.error("Error validating repository:", error)
    return NextResponse.json(
      {
        accessible: false,
        exists: false,
        private: false,
        error: "Failed to validate repository",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
