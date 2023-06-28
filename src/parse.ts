/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { XMLParser } from "fast-xml-parser"
import { readFileSync } from "fs"
import { chunk, flatten } from "lodash"

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  parseTagValue: true,
  parseAttributeValue: true,
})

export const parseJUnitXMLFile = (filePath: string) => {
  const xml = parser.parse(readFileSync(filePath, 'utf-8'))
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
  )
}
