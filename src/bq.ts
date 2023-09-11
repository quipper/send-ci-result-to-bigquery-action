import * as bigquery from '@google-cloud/bigquery'
import * as core from '@actions/core'
import { TestCase } from './junit'

type CIResultContext = {
  timestamp: Date
  github_run_id: string
  github_matrix_context_json: string
}

export const parseTestResult = (testCases: TestCase[], context: CIResultContext) =>
  testCases.map<CIResultRow>((testCase) => ({
    timestamp: context.timestamp,
    name: testCase['@_name'],
    classname: testCase['@_classname'],
    file: testCase['@_file'] ?? '',
    time: truncateTimeToMillis(testCase['@_time']),
    failed: testCase.failure !== undefined,
    failure_message: testCase.failure?.['#text'],
    github_run_id: context.github_run_id,
    github_matrix_context_json: context.github_matrix_context_json,
  }))

// To avoid "Invalid NUMERIC value" error, truncate the precision of float
const truncateTimeToMillis = (x: number) => Math.ceil(x * 1000) / 1000

export type CIResultRow = CIResultContext & {
  name: string
  classname: string
  file: string
  time: number
  failed: boolean
  failure_message: string | undefined
}

export const findOrCreateCiResultTable = async (dataset: bigquery.Dataset, tableId: string) =>
  await findOrCreateTable(dataset, tableId, {
    schema: [
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
    timePartitioning: { type: 'DAY', field: 'timestamp' },
  })

export type CIContextRow = {
  timestamp: Date
  failed: boolean
  github_context_json: string
  github_matrix_context_json: string
}

export const findOrCreateCiContextTable = async (dataset: bigquery.Dataset, tableId: string) =>
  await findOrCreateTable(dataset, tableId, {
    schema: [
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
    timePartitioning: { type: 'DAY', field: 'timestamp' },
  })

export const insertRowsParallel = async <T>(table: bigquery.Table, rows: T[], batchSize: number) => {
  const promises = []
  for (let head = 0; head < rows.length; head += batchSize) {
    const chunk = rows.slice(head, head + batchSize)
    promises.push(insertRows(table, chunk))
  }
  return await Promise.all(promises)
}

export const insertRows = async <T>(table: bigquery.Table, rows: T[]) => {
  if (core.isDebug()) {
    core.startGroup(`Insert into table ${table.projectId}/${table.id}`)
    core.debug(JSON.stringify(rows, undefined, 2))
    core.endGroup()
  }
  try {
    await table.insert(rows)
  } catch (error) {
    // https://github.com/googleapis/nodejs-bigquery/issues/612
    if (error instanceof Error && error.name === 'PartialFailureError') {
      core.startGroup(`PartialFailureError`)
      core.info(JSON.stringify(error, undefined, 2))
      core.endGroup()
    }
    throw error
  }
}

const findOrCreateTable = async (dataset: bigquery.Dataset, tableId: string, options: bigquery.TableMetadata) => {
  const table = dataset.table(tableId)
  const [exists] = await table.exists()
  if (!exists) {
    core.startGroup(`Create table ${tableId}`)
    core.info(JSON.stringify(options, undefined, 2))
    await dataset.createTable(tableId, options)
    core.endGroup()
  }
  return table
}
