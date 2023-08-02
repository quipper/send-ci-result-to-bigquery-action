/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { XMLParser } from 'fast-xml-parser'
import assert from 'assert'

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  parseTagValue: true,
  parseAttributeValue: true,
})

export const parseJUnitXML = (s: string): JUnitXML => {
  const xml = parser.parse(s)
  assertJUnitXML(xml)
  return xml
}

type JUnitXML = {
  testsuite: {
    testcase: {
      '@_classname': string
      '@_name': string
      '@_file': string
      '@_time': number
      failure?: {
        '#text': string
      }
    }[]
  }
}

function assertJUnitXML(x: unknown): asserts x is JUnitXML {
  assert(typeof x === 'object')
  assert(x != null)

  assert('testsuite' in x)
  assert(typeof x.testsuite === 'object')
  assert(x.testsuite != null)

  assert('testcase' in x.testsuite)
  assert(Array.isArray(x.testsuite.testcase))
  for (const testcase of x.testsuite.testcase) {
    assert(typeof testcase === 'object')
    assert(testcase != null)
    assert('@_classname' in testcase)
    assert('@_name' in testcase)
    assert('@_file' in testcase)
    assert('@_time' in testcase)

    if ('failure' in testcase) {
      assert(typeof testcase.failure === 'object')
      assert(testcase.failure != null)
      assert('#text' in testcase.failure)
      assert(typeof testcase.failure['#text'] === 'string')
    }
  }
}
