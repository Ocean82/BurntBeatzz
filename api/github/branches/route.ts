import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repository = searchParams.get("repository")

    if (!repository) {
      return NextResponse.json({ error: "Repository parameter is required" }, { status: 400 })
    }

    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const response = await fetch(`https://api.github.com/repos/${repository}/branches`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const branches = await response.json()

    const formattedBranches = branches.map((branch: any) => ({
      name: branch.name,
      sha: branch.commit.sha,
      protected: branch.protected || false,
    }))

    return NextResponse.json({
      success: true,
      branches: formattedBranches,
    })
  } catch (error) {
    console.error("Error fetching branches:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch branches",
      },
      { status: 500 },
    )
  }
}
