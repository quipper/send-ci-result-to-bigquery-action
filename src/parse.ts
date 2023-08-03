import { XMLParser } from 'fast-xml-parser'
import assert from 'assert'

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  parseTagValue: true,
  parseAttributeValue: true,
})

export const parseJUnitXML = (s: string): JUnitXML => {
  const xml: unknown = parser.parse(s)
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
    assertJUnitXMLTestcase(testcase)
  }
}

function assertJUnitXMLTestcase(x: unknown): asserts x is JUnitXML['testsuite']['testcase'] {
  assert(typeof x === 'object')
  assert(x != null)
  assert('@_classname' in x)
  assert(typeof x['@_classname'] === 'string')
  assert('@_name' in x)
  assert('@_file' in x)
  assert('@_time' in x)

  if ('failure' in x) {
    assert(typeof x.failure === 'object')
    assert(x.failure != null)
    assert('#text' in x.failure)
    assert(typeof x.failure['#text'] === 'string')
  }
}
