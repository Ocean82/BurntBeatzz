import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repos = await response.json()

    const formattedRepos = repos.map((repo: any) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      updatedAt: repo.updated_at,
    }))

    return NextResponse.json({
      success: true,
      repositories: formattedRepos,
    })
  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch repositories",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { name, description, private: isPrivate = true } = body

    if (!name) {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    const response = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `GitHub API error: ${response.status}`)
    }

    const repo = await response.json()

    return NextResponse.json({
      success: true,
      repository: {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        defaultBranch: repo.default_branch,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        updatedAt: repo.updated_at,
      },
    })
  } catch (error) {
    console.error("Error creating repository:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository",
      },
      { status: 500 },
    )
  }
}
