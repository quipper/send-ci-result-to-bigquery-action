import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    testResultXMLGlob: core.getInput('test-result-xml-glob', { required: true }),
    bigqueryDatasetName: core.getInput('bigquery-dataset-name', { required: true }),
    bigqueryCIResultTableName: core.getInput('bigquery-ci-result-table-name', { required: true }),
    bigqueryCIContextTableName: core.getInput('bigquery-ci-context-table-name', { required: true }),
    githubContextJSON: core.getInput('github-context-json', { required: true }),
    githubMatrixContextJSON: core.getInput('github-matrix-context-json'),
    googleApplicationCredentialsJSON: core.getInput('google-application-credentials-json'),
  })
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
