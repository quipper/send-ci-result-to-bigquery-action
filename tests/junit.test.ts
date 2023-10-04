import * as fs from 'fs/promises'
import { assertTestCase, flattenTestCases, parseXML } from '../src/junit'
import { join } from 'path'

describe('empty-testsuite.xml', () => {
  const fixturePath = join(__dirname, 'empty-testsuite.xml')

  test('parseXML', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    expect(xml).toBeTruthy()
    expect(xml).toMatchSnapshot()
  })

  test('flattenTestCases', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    const testCases = flattenTestCases(xml)
    for (const testCase of testCases) {
      assertTestCase(testCase)
    }
    expect(testCases).toMatchSnapshot()
  })
})

describe('empty-testsuites.xml', () => {
  const fixturePath = join(__dirname, 'empty-testsuites.xml')

  test('parseXML', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    expect(xml).toBeTruthy()
    expect(xml).toMatchSnapshot()
  })

  test('flattenTestCases', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    const testCases = flattenTestCases(xml)
    for (const testCase of testCases) {
      assertTestCase(testCase)
    }
    expect(testCases).toMatchSnapshot()
  })
})

describe('rspec.xml', () => {
  const fixturePath = join(__dirname, 'rspec.xml')

  test('parseXML', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    expect(xml).toBeTruthy()
    expect(xml).toMatchSnapshot()
  })

  test('flattenTestCases', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    const testCases = flattenTestCases(xml)
    for (const testCase of testCases) {
      assertTestCase(testCase)
    }
    expect(testCases).toMatchSnapshot()
  })
})

describe('jest.xml', () => {
  const fixturePath = join(__dirname, 'jest.xml')

  test('parseXML', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    expect(xml).toBeTruthy()
    expect(xml).toMatchSnapshot()
  })

  test('flattenTestCases', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    const testCases = flattenTestCases(xml)
    for (const testCase of testCases) {
      assertTestCase(testCase)
    }
    expect(testCases).toMatchSnapshot()
  })
})

describe('ruby-minitest.xml', () => {
  const fixturePath = join(__dirname, 'ruby-minitest.xml')

  test('parseXML', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    expect(xml).toBeTruthy()
    expect(xml).toMatchSnapshot()
  })

  test('flattenTestCases', async () => {
    const xml = parseXML(await fs.readFile(fixturePath, 'utf-8'))
    const testCases = flattenTestCases(xml)
    for (const testCase of testCases) {
      assertTestCase(testCase)
    }
    expect(testCases).toMatchSnapshot()
  })
})
