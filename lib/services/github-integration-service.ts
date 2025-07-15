import { Octokit } from "@octokit/rest"

interface GitHubRepo {
  owner: string
  repo: string
  branch?: string
}

interface CommitData {
  message: string
  files: Array<{
    path: string
    content: string
    encoding?: "utf-8" | "base64"
  }>
}

interface PullRequestData {
  title: string
  body: string
  head: string
  base: string
}

export class GitHubIntegrationService {
  private octokit: Octokit
  private token: string

  constructor() {
    this.token =
      process.env.GITHUB_TOKEN ||
      "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"
    this.octokit = new Octokit({
      auth: this.token,
      userAgent: "Burnt-Beats-Music-Generator/1.0",
    })
  }

  // Get authenticated user info
  async getAuthenticatedUser() {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated()
      return {
        success: true,
        user: data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get user info",
      }
    }
  }

  // List user repositories
  async listRepositories(type: "all" | "owner" | "public" | "private" = "all") {
    try {
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        type,
        sort: "updated",
        per_page: 100,
      })

      return {
        success: true,
        repositories: data.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          private: repo.private,
          htmlUrl: repo.html_url,
          cloneUrl: repo.clone_url,
          defaultBranch: repo.default_branch,
          updatedAt: repo.updated_at,
          language: repo.language,
          size: repo.size,
        })),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list repositories",
      }
    }
  }

  // Create a new repository
  async createRepository(name: string, description?: string, isPrivate = false) {
    try {
      const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true,
        gitignore_template: "Node",
      })

      return {
        success: true,
        repository: {
          id: data.id,
          name: data.name,
          fullName: data.full_name,
          htmlUrl: data.html_url,
          cloneUrl: data.clone_url,
          defaultBranch: data.default_branch,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository",
      }
    }
  }

  // Get repository contents
  async getRepositoryContents(repo: GitHubRepo, path = "") {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.repo,
        path,
        ref: repo.branch,
      })

      return {
        success: true,
        contents: Array.isArray(data) ? data : [data],
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get repository contents",
      }
    }
  }

  // Get file content
  async getFileContent(repo: GitHubRepo, filePath: string) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.repo,
        path: filePath,
        ref: repo.branch,
      })

      if (Array.isArray(data) || data.type !== "file") {
        throw new Error("Path is not a file")
      }

      const content = data.encoding === "base64" ? atob(data.content) : data.content

      return {
        success: true,
        file: {
          name: data.name,
          path: data.path,
          content,
          sha: data.sha,
          size: data.size,
          encoding: data.encoding,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get file content",
      }
    }
  }

  // Create or update file
  async createOrUpdateFile(
    repo: GitHubRepo,
    filePath: string,
    content: string,
    message: string,
    sha?: string,
    encoding: "utf-8" | "base64" = "utf-8",
  ) {
    try {
      const contentToUpload = encoding === "base64" ? content : btoa(content)

      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: repo.owner,
        repo: repo.repo,
        path: filePath,
        message,
        content: contentToUpload,
        sha,
        branch: repo.branch,
      })

      return {
        success: true,
        commit: {
          sha: data.commit.sha,
          htmlUrl: data.commit.html_url,
        },
        content: data.content,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create/update file",
      }
    }
  }

  // Delete file
  async deleteFile(repo: GitHubRepo, filePath: string, message: string, sha: string) {
    try {
      const { data } = await this.octokit.rest.repos.deleteFile({
        owner: repo.owner,
        repo: repo.repo,
        path: filePath,
        message,
        sha,
        branch: repo.branch,
      })

      return {
        success: true,
        commit: {
          sha: data.commit.sha,
          htmlUrl: data.commit.html_url,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      }
    }
  }

  // Create branch
  async createBranch(repo: GitHubRepo, newBranchName: string, fromBranch = "main") {
    try {
      // Get the SHA of the source branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: `heads/${fromBranch}`,
      })

      // Create new branch
      const { data } = await this.octokit.rest.git.createRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: `refs/heads/${newBranchName}`,
        sha: refData.object.sha,
      })

      return {
        success: true,
        branch: {
          name: newBranchName,
          sha: data.object.sha,
          ref: data.ref,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create branch",
      }
    }
  }

  // Create pull request
  async createPullRequest(repo: GitHubRepo, pullRequestData: PullRequestData) {
    try {
      const { data } = await this.octokit.rest.pulls.create({
        owner: repo.owner,
        repo: repo.repo,
        title: pullRequestData.title,
        body: pullRequestData.body,
        head: pullRequestData.head,
        base: pullRequestData.base,
      })

      return {
        success: true,
        pullRequest: {
          id: data.id,
          number: data.number,
          title: data.title,
          htmlUrl: data.html_url,
          state: data.state,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create pull request",
      }
    }
  }

  // Commit multiple files
  async commitMultipleFiles(repo: GitHubRepo, commitData: CommitData) {
    try {
      // Get the latest commit SHA
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: `heads/${repo.branch || "main"}`,
      })

      const latestCommitSha = refData.object.sha

      // Get the tree SHA from the latest commit
      const { data: commitData } = await this.octokit.rest.git.getCommit({
        owner: repo.owner,
        repo: repo.repo,
        commit_sha: latestCommitSha,
      })

      // Create blobs for each file
      const blobs = await Promise.all(
        commitData.files.map(async (file) => {
          const { data: blobData } = await this.octokit.rest.git.createBlob({
            owner: repo.owner,
            repo: repo.repo,
            content: file.encoding === "base64" ? file.content : btoa(file.content),
            encoding: "base64",
          })

          return {
            path: file.path,
            mode: "100644" as const,
            type: "blob" as const,
            sha: blobData.sha,
          }
        }),
      )

      // Create new tree
      const { data: treeData } = await this.octokit.rest.git.createTree({
        owner: repo.owner,
        repo: repo.repo,
        base_tree: commitData.tree.sha,
        tree: blobs,
      })

      // Create commit
      const { data: newCommitData } = await this.octokit.rest.git.createCommit({
        owner: repo.owner,
        repo: repo.repo,
        message: commitData.message,
        tree: treeData.sha,
        parents: [latestCommitSha],
      })

      // Update reference
      await this.octokit.rest.git.updateRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: `heads/${repo.branch || "main"}`,
        sha: newCommitData.sha,
      })

      return {
        success: true,
        commit: {
          sha: newCommitData.sha,
          message: newCommitData.message,
          htmlUrl: newCommitData.html_url,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to commit files",
      }
    }
  }

  // Fork repository
  async forkRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.rest.repos.createFork({
        owner,
        repo,
      })

      return {
        success: true,
        fork: {
          id: data.id,
          name: data.name,
          fullName: data.full_name,
          htmlUrl: data.html_url,
          cloneUrl: data.clone_url,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fork repository",
      }
    }
  }

  // Get repository branches
  async getBranches(repo: GitHubRepo) {
    try {
      const { data } = await this.octokit.rest.repos.listBranches({
        owner: repo.owner,
        repo: repo.repo,
      })

      return {
        success: true,
        branches: data.map((branch) => ({
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected,
        })),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get branches",
      }
    }
  }

  // Get commit history
  async getCommitHistory(repo: GitHubRepo, limit = 10) {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner: repo.owner,
        repo: repo.repo,
        sha: repo.branch,
        per_page: limit,
      })

      return {
        success: true,
        commits: data.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author,
          date: commit.commit.author?.date,
          htmlUrl: commit.html_url,
        })),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get commit history",
      }
    }
  }
}

export const githubService = new GitHubIntegrationService()
