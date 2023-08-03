import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  const GOOGLE_APPLICATION_CREDENTIALS_JSON = core.getInput('google-application-credentials-json')
  const GITHUB_CONTEXT_JSON = core.getInput('github-context-json', {
    required: true,
  })
  const GITHUB_MATRIX_CONTEXT_JSON = core.getInput('github-matrix-context-json', {
    required: true,
  })
  const BIGQUERY_DATASET_NAME = core.getInput('bigquery-dataset-name', {
    required: true,
  })
  const BIGQUERY_CI_RESULT_TABLE_NAME = core.getInput('bigquery-ci-result-table-name', { required: true })
  const BIGQUERY_CI_CONTEXT_TABLE_NAME = core.getInput('bigquery-ci-context-table-name', { required: true })
  const TEST_RESULT_XML_GLOB = core.getInput('test-result-xml-glob', {
    required: true,
  })
  await run({
    GOOGLE_APPLICATION_CREDENTIALS_JSON,
    GITHUB_CONTEXT_JSON,
    GITHUB_MATRIX_CONTEXT_JSON,
    BIGQUERY_DATASET_NAME,
    BIGQUERY_CI_RESULT_TABLE_NAME,
    BIGQUERY_CI_CONTEXT_TABLE_NAME,
    TEST_RESULT_XML_GLOB,
  })
}

main().catch((e) => core.setFailed(e instanceof Error ? e : String(e)))
