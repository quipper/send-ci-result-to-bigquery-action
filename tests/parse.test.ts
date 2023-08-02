import * as fs from 'fs/promises'
import { parseJUnitXML } from '../src/parse'
import { join } from 'path'

test('parse junit XML', async () => {
  const xml = parseJUnitXML(await fs.readFile(join(__dirname, 'rspec.xml'), 'utf-8'))
  expect(xml).toBeTruthy()

  expect(xml.testsuite.testcase[0]['@_classname']).toBe('spec.features.foo_spec')
  expect(xml.testsuite.testcase[0].failure).toBeUndefined()

  expect(xml.testsuite.testcase[2].failure?.['#text']).toBe('expected baz')
})
