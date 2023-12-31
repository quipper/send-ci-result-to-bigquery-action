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
  if (xml.testsuites && xml.testsuites.testsuite) {
    return xml.testsuites.testsuite.flatMap((testSuite) => testSuite.testcase ?? [])
  }
  if (xml.testsuite) {
    return xml.testsuite.testcase ?? []
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
  // <testsuites> has 0 or more <testsuite>.
  // https://llg.cubic.org/docs/junit/
  testsuite?: TestSuite[]
}

function assertTestSuites(x: unknown): asserts x is TestSuites {
  assert(typeof x === 'object')
  assert(x != null)
  if ('testsuite' in x) {
    assert(Array.isArray(x.testsuite))
    for (const testsuite of x.testsuite) {
      assertTestSuite(testsuite)
    }
  }
}

type TestSuite = {
  // <testsuite> has 0 or more <testcase>.
  // https://llg.cubic.org/docs/junit/
  testcase?: TestCase[]
}

function assertTestSuite(x: unknown): asserts x is TestSuite {
  assert(typeof x === 'object')
  assert(x != null)
  if ('testcase' in x) {
    assert(typeof x.testcase === 'undefined' || Array.isArray(x.testcase))
    for (const testcase of x.testcase ?? []) {
      assertTestCase(testcase)
    }
  }
}

export type TestCase = {
  '@_classname': string
  '@_name': string
  '@_time': number
  '@_file'?: string
  failure?: {
    '#text'?: string
    '@_message'?: string
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

    // <failure> element may have a text node or message attribute.
    // https://github.com/quipper/send-ci-result-to-bigquery-action/issues/100
    if ('#text' in x.failure) {
      assert(typeof x.failure['#text'] === 'string')
    }
    if ('@_message' in x.failure) {
      assert(typeof x.failure['@_message'] === 'string')
    }
  }
}
