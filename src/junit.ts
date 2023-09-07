import { XMLParser } from 'fast-xml-parser'
import assert from 'assert'

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  parseTagValue: true,
  parseAttributeValue: true,
  isArray: (_: string, jPath: string) =>
    [
      // <testsuites> has 0 or more <testsuite>
      'testsuites.testsuite',
      // <testsuite> has 0 or more <testcase>
      'testsuites.testsuite.testcase',
      'testsuite.testcase',
    ].includes(jPath),
})

export const parseXML = (s: string): TestResult => {
  const xml: unknown = parser.parse(s)
  assertTestResult(xml)
  return xml
}

export const flattenTestCases = (xml: TestResult): TestCase[] => {
  if (xml.testsuites) {
    return xml.testsuites.testsuite.flatMap((testSuite) => testSuite.testcase)
  }
  if (xml.testsuite) {
    return xml.testsuite.testcase
  }
  return []
}

export type TestResult = {
  testsuite?: TestSuite
  testsuites?: TestSuites
}

function assertTestResult(x: unknown): asserts x is TestResult {
  assert(typeof x === 'object')
  assert(x != null)

  if ('testsuite' in x) {
    assertTestSuite(x.testsuite)
  }
  if ('testsuites' in x) {
    assertTestSuites(x.testsuites)
  }
}

type TestSuites = {
  testsuite: TestSuite[]
}

function assertTestSuites(x: unknown): asserts x is TestSuites {
  assert(typeof x === 'object')
  assert(x != null)
  assert('testsuite' in x)
  assert(Array.isArray(x.testsuite))
  for (const testsuite of x.testsuite) {
    assertTestSuite(testsuite)
  }
}

type TestSuite = {
  testcase: TestCase[]
}

function assertTestSuite(x: unknown): asserts x is TestSuite {
  assert(typeof x === 'object')
  assert(x != null)
  assert('testcase' in x)
  assert(Array.isArray(x.testcase))
  for (const testcase of x.testcase) {
    assertTestCase(testcase)
  }
}

export type TestCase = {
  '@_classname': string
  '@_name': string
  '@_time': number
  '@_file'?: string
  failure?: {
    '#text': string
  }
}

export function assertTestCase(x: unknown): asserts x is TestCase {
  assert(typeof x === 'object')
  assert(x != null)
  assert('@_classname' in x)
  assert(typeof x['@_classname'] === 'string')
  assert('@_name' in x)
  assert(typeof x['@_name'] === 'string')
  assert('@_time' in x)
  assert(typeof x['@_time'] === 'number')

  if ('@_file' in x) {
    assert(typeof x['@_file'] === 'string')
  }

  if ('failure' in x) {
    assert(typeof x.failure === 'object')
    assert(x.failure != null)
    assert('#text' in x.failure)
    assert(typeof x.failure['#text'] === 'string')
  }
}
