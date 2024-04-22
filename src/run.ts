import { BigQuery } from '@google-cloud/bigquery'
import { parseGitHubContext } from './github.js'
import * as core from '@actions/core'
import * as bq from './bq.js'
import * as fs from 'fs/promises'
import * as glob from '@actions/glob'
import * as junit from './junit.js'

const BIGQUERY_INSERT_BATCH_SIZE = 100

type Inputs = {
  testResultXMLGlob: string
  bigqueryDatasetName: string
  bigqueryCIResultTableName: string
  bigqueryCIContextTableName: string
  githubContextJSON: string
  githubMatrixContextJSON: string
  googleApplicationCredentialsJSON: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  const timestamp = new Date()
  const githubContext = parseGitHubContext(inputs.githubContextJSON)
  githubContext.token = '***'
  const githubMatrixContext = inputs.githubMatrixContextJSON

  const client = new BigQuery()
  if (inputs.googleApplicationCredentialsJSON) {
    // TODO: should use https://github.com/google-github-actions/auth
    const GOOGLE_APPLICATION_CREDENTIALS_PATH = '/tmp/google_application_credentials.json'
    await fs.writeFile(GOOGLE_APPLICATION_CREDENTIALS_PATH, inputs.googleApplicationCredentialsJSON)
    process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS_PATH
  }

  core.info(`Creating tables if not exist into dataset ${inputs.bigqueryDatasetName}`)
  const dataset = client.dataset(inputs.bigqueryDatasetName)
  const ciContextTable = await bq.findOrCreateCiContextTable(dataset, inputs.bigqueryCIContextTableName)
  const ciResultTable = await bq.findOrCreateCiResultTable(dataset, inputs.bigqueryCIResultTableName)

  let anyFailed = false
  const xmlGlob = await glob.create(inputs.testResultXMLGlob)
  for await (const xmlPath of xmlGlob.globGenerator()) {
    core.info(`Parsing test result of ${xmlPath}`)
    const xmlContent = await fs.readFile(xmlPath, 'utf-8')
    const testResult = junit.parseXML(xmlContent)
    const testCases = junit.flattenTestCases(testResult)
    const ciResultRows = bq.parseTestResult(testCases, {
      timestamp,
      github_matrix_context_json: githubMatrixContext,
      github_run_id: githubContext.run_id,
    })

    core.info(`Inserting test result of ${xmlPath}`)
    await bq.insertRowsParallel(ciResultTable, ciResultRows, BIGQUERY_INSERT_BATCH_SIZE)
    core.info(`Inserted ${ciResultRows.length} rows`)

    anyFailed = anyFailed || ciResultRows.some((row) => row.failed)
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
