export const parseGitHubContext = (contextJson: string): GitHubContext => {
  const context = JSON.parse(contextJson) as unknown
  if (!isGitHubContext(context)) {
    throw new Error(`invalid context JSON: ${contextJson}`)
  }
  return context
}

type GitHubContext = {
  token: string
}

const isGitHubContext = (x: unknown): x is GitHubContext =>
  typeof x === 'object' && x != null && ('token' in x) && typeof x['token'] === 'string'
