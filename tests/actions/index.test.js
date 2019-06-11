const path = require('path')
const fs = require('fs')
const isPlainObject = require('lodash.isplainobject')

const actions = require('../../actions')

const actionsDir = path.join(__dirname, '..', '..', 'actions')

let actionNames =
  fs.readdirSync(actionsDir, { withFileTypes: true })
    .filter(ent => ent.isDirectory())
    .map(ent => ent.name)
    .sort()

describe('actions', () => {
  it('module has properties for all expected actions', async () => {
    const actionKeys = Object.keys(actions).sort()
    expect(actionKeys).toEqual(actionNames)
    expect(actionKeys).toMatchSnapshot()
  })

  it('README mentions all expected actions', async () => {
    const actionsReadme = fs.readFileSync(path.join(actionsDir, 'README.md'), { encoding: 'utf8' })
    const expectedContents = `## Available actions

<!-- START_ACTIONS_LIST -->
${actionNames.map(name => `- [${name}](./${name})`).join('\n')}

<!-- END_ACTIONS_LIST -->
`
    expect(actionsReadme).toContain(expectedContents)
  })

  describe.each(actionNames)('the action "%s"', (actionName) => {
    const action = actions[actionName]

    it('has the minimum set of required files', async () => {
      const actionDirFiles =
        fs.readdirSync(path.join(actionsDir, actionName), { withFileTypes: true })
          .filter(ent => ent.isFile())
          .map(ent => ent.name)

      expect(actionDirFiles).toContain('config.yml')
      expect(actionDirFiles).toContain('schema.js')
      expect(actionDirFiles).toContain('index.js')
      expect(actionDirFiles).toContain('index.test.js')
      expect(actionDirFiles).toContain('README.md')
    })

    it('is a function expecting 2-3 arguments', () => {
      expect(typeof action).toBe('function')
      expect(action.length).toBeGreaterThanOrEqual(2)
      expect(action.length).toBeLessThanOrEqual(3)
    })

    it('has a "schema" property', () => {
      expect(action).toHaveProperty('schema')
      expect(action.schema).toBeTruthy()
      expect(action.schema.isJoi).toBe(true)
    })

    describe('has a schema which', () => {
      // Get a plain object rendering of the schema to avoid relying on Joi internals
      const schema = action.schema.describe()

      it('has a description', () => {
        expect(typeof schema.description).toBe('string')
        expect(schema.description.length).toBeGreaterThan(0)
      })

      it('has at least one example', () => {
        expect(Array.isArray(schema.examples)).toBe(true)
        expect(schema.examples.length).toBeGreaterThan(0)
      })

      it('has examples which all include a context if there is more than one example', () => {
        const hasMoreThanOneExample = schema.examples.length > 1

        for (let example of schema.examples) {
          expect(isPlainObject(example)).toBe(true)
          expect(example).toHaveProperty('value')
          expect(isPlainObject(example.value)).toBe(true)

          if (hasMoreThanOneExample) {
            expect(example).toHaveProperty('options')
            expect(isPlainObject(example.options)).toBe(true)
            expect(example.options).toHaveProperty('context')
            expect(typeof example.options.context).toBe('string')
            expect(example.options.context.length).toBeGreaterThan(0)
          }
        }
      })
    })
  })
})
