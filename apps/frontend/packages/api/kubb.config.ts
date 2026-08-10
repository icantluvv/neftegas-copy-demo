import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginOas, schemaKeywords } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

import { pluginMockClientRoutes } from './plugins/mock-client-routes'

const group = { type: 'tag' } as const
const unknownType = 'unknown'
const paramsType = 'object'
const pathParamsType = 'object'
const parser = 'zod'
const clientImportPath = '../../../client'

export default defineConfig({
	input: { path: '../../../../api/src/openapi.yaml' },
	output: {
		path: './base/codegen',
		clean: true,
		extension: { '.ts': '' },
		format: 'oxfmt',
	},
	plugins: [
		pluginOas({
			output: { path: 'schemas', barrelType: 'propagate' },
			group,
			collisionDetection: true,
		}),
		pluginClient({
			output: { path: 'clients', barrelType: 'propagate' },
			group,
			paramsType,
			pathParamsType,
			parser,
			importPath: clientImportPath,
		}),
		pluginTs({
			output: { path: 'types', barrelType: 'propagate' },
			group,
			enumType: 'inlineLiteral',
			integerType: 'number',
			syntaxType: 'interface',
			unknownType,
		}),
		pluginFaker({
			output: { path: 'mocks', barrelType: false },
			group,
			unknownType,
			emptySchemaType: 'void',
			transformers: {
				schema({ name, schema }, defaultSchemas) {
					if (name === 'unsubscribeEmailQueryResponse') {
						return [{ keyword: schemaKeywords.void }]
					}

					if (
						name === 'email' &&
						schema?.description?.startsWith('Exact ECMAScript regexp v43')
					) {
						return [
							...defaultSchemas.filter(
								({ keyword }) => keyword !== schemaKeywords.matches,
							),
							{ keyword: schemaKeywords.email },
						]
					}

					return defaultSchemas
				},
			},
		}),
		pluginMockClientRoutes(),
		pluginZod({
			output: { path: 'zod', barrelType: 'propagate' },
			group,
			unknownType,
			version: '4',
			mini: true,
			override: [
				{
					type: 'schemaName',
					pattern: 'ExpertTaskEvaluationSubmit',
					options: { mini: false, importPath: 'zod' },
				},
			],
		}),
		pluginReactQuery({
			output: { path: 'hooks', barrelType: 'propagate' },
			group,
			client: { importPath: clientImportPath },
			paramsType,
			pathParamsType,
			parser,
		}),
	],
})
