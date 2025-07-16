import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repository = searchParams.get("repository")
    const branch = searchParams.get("branch") || "main"

    if (!repository) {
      return NextResponse.json({ error: "Repository parameter is required" }, { status: 400 })
    }

    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const response = await fetch(`https://api.github.com/repos/${repository}/commits?sha=${branch}&per_page=50`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const commits = await response.json()

    const formattedCommits = commits.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date,
      },
      url: commit.html_url,
    }))

    return NextResponse.json({
      success: true,
      commits: formattedCommits,
    })
  } catch (error) {
    console.error("Error fetching commits:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch commits",
      },
      { status: 500 },
    )
  }
}
