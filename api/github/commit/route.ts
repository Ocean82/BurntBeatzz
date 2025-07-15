import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { repository, branch = "main", message, files = [] } = body

    if (!repository || !message) {
      return NextResponse.json({ error: "Repository and commit message are required" }, { status: 400 })
    }

    // Step 1: Get the current commit SHA
    const branchResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${branch}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!branchResponse.ok) {
      throw new Error(`Failed to get branch info: ${branchResponse.status}`)
    }

    const branchData = await branchResponse.json()
    const currentCommitSha = branchData.object.sha

    // Step 2: Get the current tree
    const commitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${currentCommitSha}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!commitResponse.ok) {
      throw new Error(`Failed to get commit info: ${commitResponse.status}`)
    }

    const commitData = await commitResponse.json()
    const currentTreeSha = commitData.tree.sha

    // Step 3: Create blobs for modified files
    const treeItems = []

    for (const file of files) {
      if (file.content) {
        // Create blob for file content
        const blobResponse = await fetch(`https://api.github.com/repos/${repository}/git/blobs`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "Burnt-Beats-Music-Generator",
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: Buffer.from(file.content).toString("base64"),
            encoding: "base64",
          }),
        })

        if (!blobResponse.ok) {
          throw new Error(`Failed to create blob for ${file.path}: ${blobResponse.status}`)
        }

        const blobData = await blobResponse.json()

        treeItems.push({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        })
      }
    }

    // Step 4: Create new tree
    const treeResponse = await fetch(`https://api.github.com/repos/${repository}/git/trees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: currentTreeSha,
        tree: treeItems,
      }),
    })

    if (!treeResponse.ok) {
      throw new Error(`Failed to create tree: ${treeResponse.status}`)
    }

    const treeData = await treeResponse.json()

    // Step 5: Create new commit
    const newCommitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "Burnt-Beats-Music-Generator",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [currentCommitSha],
      }),
    })

    if (!newCommitResponse.ok) {
      throw new Error(`Failed to create commit: ${newCommitResponse.status}`)
    }

    const newCommitData = await newCommitResponse.json()

    return NextResponse.json({
      success: true,
      commitSha: newCommitData.sha,
      message: "Commit created successfully",
      filesCommitted: files.length,
    })
  } catch (error) {
    console.error("Error creating commit:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create commit",
      },
      { status: 500 },
    )
  }
}
