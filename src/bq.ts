import * as bigquery from '@google-cloud/bigquery'

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

const findOrCreateTable = async (dataset: bigquery.Dataset, tableId: string, options: bigquery.TableMetadata) => {
  const table = dataset.table(tableId)
  const [exists] = await table.exists()
  if (!exists) {
    await dataset.createTable(tableId, options)
  }
  return table
}
