import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Extract owner and repo from GitHub URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL format" }, { status: 400 })
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, "")

    // Check if repository exists using GitHub API
    const githubToken = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Burnt-Beats-App",
    }

    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
      headers,
    })

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
      })
    } else if (response.status === 404) {
      return NextResponse.json({
        accessible: false,
        exists: false,
        private: false,
        error: "Repository not found or private",
      })
    } else if (response.status === 403) {
      return NextResponse.json({
        accessible: false,
        exists: true,
        private: true,
        error: "Repository is private or rate limit exceeded",
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
      },
      { status: 500 },
    )
  }
}
