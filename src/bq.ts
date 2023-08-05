import * as bigquery from '@google-cloud/bigquery'
import { TestResult, flattenTestCases } from './junit'

type CIResultContext = {
  timestamp: Date
  github_run_id: string
  github_matrix_context_json: string
}

export const parseTestResult = (xml: TestResult, context: CIResultContext) =>
  flattenTestCases(xml).map<CIResultRow>((testcase) => ({
    name: testcase['@_name'],
    classname: testcase['@_classname'],
    file: testcase['@_file'] ?? '',
    time: testcase['@_time'],
    failed: testcase.failure !== undefined,
    failure_message: testcase.failure?.['#text'],
    timestamp: context.timestamp,
    github_run_id: context.github_run_id,
    github_matrix_context_json: context.github_matrix_context_json,
  }))

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

export const insertRows = async <T>(table: bigquery.Table, rows: T[]) => table.insert(rows)

const findOrCreateTable = async (dataset: bigquery.Dataset, tableId: string, options: bigquery.TableMetadata) => {
  const table = dataset.table(tableId)
  const [exists] = await table.exists()
  if (!exists) {
    await dataset.createTable(tableId, options)
  }
  return table
}
