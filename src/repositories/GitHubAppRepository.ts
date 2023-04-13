import { Octokit } from '@octokit/core'
import { IGitHubRepository } from './IGitHubRepository'
import { gitHubApp } from 'auth'
import { setFailed } from '@actions/core'

export class GitHubAppRepository implements IGitHubRepository {
  private readonly repository: Octokit

  constructor() {
    this.repository = gitHubApp
  }

  async createCommentAtPR(
    message: string,
    pullRequestNumber: number,
    repoName: string,
    repoOwner: string,
  ): Promise<object> {
    const messagePr = await this.repository.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        owner: repoOwner,
        repo: repoName,
        issue_number: pullRequestNumber,
        body: message,
      },
    )

    if (messagePr.status !== 201) {
      setFailed(`Error creating comment on pull request ${pullRequestNumber}.`)
    }

    return messagePr.data
  }

  async getBranchBase(
    pullRequestNumber: number,
    repoName: string,
    repoOwner: string,
  ): Promise<string> {
    const baseBranch = await this.repository.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}',
      {
        owner: repoOwner,
        repo: repoName,
        pull_number: pullRequestNumber,
      },
    )

    return baseBranch.data.head.ref
  }

  async getLastCommitBranchBase(
    branchRef: string,
    directoryOrFile: string,
    repoName: string,
    repoOwner: string,
  ): Promise<Date> {
    const commits = await this.repository.request(
      'GET /repos/{owner}/{repo}/commits?path={directoryOrFile}&sha={branchRef}',
      {
        branchRef: branchRef,
        directoryOrFile: directoryOrFile,
        owner: repoOwner,
        repo: repoName,
      },
    )

    const lastCommit = commits?.data[0]

    if (!lastCommit) {
      setFailed('Failure at "getLastCommitBranchDefault".')
    }

    return lastCommit.commit.author.date
  }

  async getLastModifiedDate(
    directoryOrFile: string,
    repoName: string,
    repoOwner: string,
  ): Promise<Date> {
    const date = await this.repository.request(
      'GET /repos/{owner}/{repo}/commits?path={directoryOrFile}',
      {
        owner: repoOwner,
        repo: repoName,
        directoryOrFile: directoryOrFile,
      },
    )

    const modified = date?.data[0]

    if (!modified) {
      setFailed('Failure at "getLastModifiedDate".')
    }

    return modified.commit.author.date
  }
}