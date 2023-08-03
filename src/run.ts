import { BigQuery } from '@google-cloud/bigquery'
import { parseGitHubContext } from './github'
import * as core from '@actions/core'
import * as bq from './bq'
import * as fs from 'fs/promises'
import * as glob from '@actions/glob'
import * as junit from './junit'

const BIGQUERY_INSERT_BATCH_SIZE = 100

type Inputs = {
  GOOGLE_APPLICATION_CREDENTIALS_JSON: string
  GITHUB_CONTEXT_JSON: string
  GITHUB_MATRIX_CONTEXT_JSON: string
  BIGQUERY_DATASET_NAME: string
  BIGQUERY_CI_RESULT_TABLE_NAME: string
  BIGQUERY_CI_CONTEXT_TABLE_NAME: string
  TEST_RESULT_XML_GLOB: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  const timestamp = new Date()
  const githubContext = parseGitHubContext(inputs.GITHUB_CONTEXT_JSON)
  githubContext.token = '***'
  const githubMatrixContext = inputs.GITHUB_MATRIX_CONTEXT_JSON

  // TODO: support workload identity
  const client = new BigQuery()
  const GOOGLE_APPLICATION_CREDENTIALS_PATH = '/tmp/google_application_credentials.json'
  await fs.writeFile(GOOGLE_APPLICATION_CREDENTIALS_PATH, inputs.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS_PATH

  core.info(`Creating tables if not exist into dataset ${inputs.BIGQUERY_DATASET_NAME}`)
  const dataset = client.dataset(inputs.BIGQUERY_DATASET_NAME)
  const ciContextTable = await bq.findOrCreateCiContextTable(dataset, inputs.BIGQUERY_CI_CONTEXT_TABLE_NAME)
  const ciResultTable = await bq.findOrCreateCiResultTable(dataset, inputs.BIGQUERY_CI_RESULT_TABLE_NAME)

  let anyFailed = false
  const xmlGlob = await glob.create(inputs.TEST_RESULT_XML_GLOB)
  for await (const xmlPath of xmlGlob.globGenerator()) {
    core.info(`Parsing test result of ${xmlPath}`)
    const xmlContent = await fs.readFile(xmlPath, 'utf-8')
    const testResult = junit.parseXML(xmlContent)
    const ciResultRows = bq.parseTestResult(testResult, {
      timestamp,
      github_matrix_context_json: githubMatrixContext,
      github_run_id: githubContext.run_id,
    })
    anyFailed = anyFailed || ciResultRows.some((row) => row.failed)

    core.info(`Inserting test result of ${xmlPath}`)
    await bq.insertRowsParallel(ciResultTable, ciResultRows, BIGQUERY_INSERT_BATCH_SIZE)
  }

  core.info(`Inserting test context`)
  await bq.insertRows<bq.CIContextRow>(ciContextTable, [
    {
      timestamp,
      github_context_json: JSON.stringify(githubContext),
      github_matrix_context_json: githubMatrixContext,
      failed: anyFailed,
    },
  ])
}
