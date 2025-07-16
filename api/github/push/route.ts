import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { repository, branch = "main", commitSha } = body

    if (!repository || !commitSha) {
      return NextResponse.json({ error: "Repository and commit SHA are required" }, { status: 400 })
    }

    // Update the branch reference to point to the new commit
    const response = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: commitSha,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Failed to push: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Successfully pushed to GitHub",
      ref: data.ref,
      sha: data.object.sha,
    })
  } catch (error) {
    console.error("Error pushing to GitHub:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to push to GitHub",
      },
      { status: 500 },
    )
  }
}
