import { BigQuery, Dataset } from '@google-cloud/bigquery'
import chunk from 'lodash/chunk'
import flatten from 'lodash/flatten'
import { readFileSync, writeFileSync } from 'fs'
import { XMLParser } from 'fast-xml-parser'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import { parseGitHubContext } from './github'

type Inputs = {
  GOOGLE_APPLICATION_CREDENTIALS_JSON: string
  GITHUB_CONTEXT_JSON: string
  GITHUB_MATRIX_CONTEXT_JSON: string
  BIGQUERY_DATASET_NAME: string
  BIGQUERY_CI_RESULT_TABLE_NAME: string
  BIGQUERY_CI_CONTEXT_TABLE_NAME: string
  TEST_RESULT_XML_GLOB: string
}

const findOrCreateTable = async (
  dataset: Dataset,
  tableId: string,
  schema: Array<{
    name: string
    type: 'timestamp' | 'numeric' | 'string' | 'boolean'
    mode: 'NULLABLE' | 'REQUIRED'
  }>,
  timePartitioning: { type: 'DAY'; field: string }
) => {
  const table = dataset.table(tableId)

  const [exists] = await table.exists()
  if (!exists) {
    await dataset.createTable(tableId, { schema, timePartitioning })
  }

  return Promise.resolve(table)
}

export const run = async (inputs: Inputs): Promise<void> => {
  const timestamp = new Date()

  const client = new BigQuery()

  const GOOGLE_APPLICATION_CREDENTIALS_PATH = '/tmp/google_application_credentials.json'

  writeFileSync(GOOGLE_APPLICATION_CREDENTIALS_PATH, inputs.GOOGLE_APPLICATION_CREDENTIALS_JSON)

  process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS_PATH

  const dataset = client.dataset(inputs.BIGQUERY_DATASET_NAME)

  const githubContext = parseGitHubContext(inputs.GITHUB_CONTEXT_JSON)
  githubContext['token'] = '***'

  const githubMatrixContext = inputs.GITHUB_MATRIX_CONTEXT_JSON

  const ciContextTable = await findOrCreateTable(
    dataset,
    inputs.BIGQUERY_CI_CONTEXT_TABLE_NAME,
    [
      {
        name: 'timestamp',
        type: 'timestamp',
        mode: 'REQUIRED',
      },
      {
        name: 'failed',
        type: 'boolean',
        mode: 'REQUIRED',
      },
      {
        name: 'github_context_json',
        type: 'string',
        mode: 'REQUIRED',
      },
      {
        name: 'github_matrix_context_json',
        type: 'string',
        mode: 'REQUIRED',
      },
    ],
    { type: 'DAY', field: 'timestamp' }
  )

  const ciResultTable = await findOrCreateTable(
    dataset,
    inputs.BIGQUERY_CI_RESULT_TABLE_NAME,
    [
      {
        name: 'timestamp',
        type: 'timestamp',
        mode: 'REQUIRED',
      },
      {
        name: 'name',
        type: 'string',
        mode: 'REQUIRED',
      },
      {
        name: 'classname',
        type: 'string',
        mode: 'REQUIRED',
      },
      {
        name: 'file',
        type: 'string',
        mode: 'REQUIRED',
      },
      {
        name: 'time',
        type: 'numeric',
        mode: 'REQUIRED',
      },
      {
        name: 'failed',
        type: 'boolean',
        mode: 'REQUIRED',
      },
      {
        name: 'failure_message',
        type: 'string',
        mode: 'NULLABLE',
      },
      {
        name: 'github_run_id',
        type: 'string',
        mode: 'REQUIRED',
      },
      {
        name: 'github_matrix_context_json',
        type: 'string',
        mode: 'REQUIRED',
      },
    ],
    { type: 'DAY', field: 'timestamp' }
  )

  const INSERT_BATCH_SIZE = 100

  let failed = false
  const xmlFilePaths = await (await glob.create(inputs.TEST_RESULT_XML_GLOB)).glob()
  await Promise.all(
    xmlFilePaths.map((filePath) => {
      const xml = parser.parse(readFileSync(filePath, 'utf-8'))
      return Promise.all(
        chunk(
          flatten([xml?.testsuite?.testcase ?? []]).map((testcase: any) => {
            if (!failed && testcase.failure) {
              failed = true
            }
            return {
              classname: testcase['@_classname'],
              name: testcase['@_name'],
              file: testcase['@_file'],
              time: testcase['@_time'],
              timestamp,
              failed: !!testcase.failure,
              failure_message: testcase.failure?.['#text'],
              github_run_id: githubContext['run_id'],
              github_matrix_context_json: githubMatrixContext,
            }
          }),
          INSERT_BATCH_SIZE
        ).map((rows: unknown[]) => {
          return ciResultTable.insert(rows)
        })
      )
    })
  )

  await ciContextTable.insert([
    {
      timestamp,
      failed,
      github_context_json: JSON.stringify(githubContext),
      github_matrix_context_json: JSON.stringify(githubMatrixContext),
    },
  ])
}

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  parseTagValue: true,
  parseAttributeValue: true,
})
