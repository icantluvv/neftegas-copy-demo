import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

const group = { type: 'tag' } as const
const unknownType = 'unknown'
const paramsType = 'object'
const pathParamsType = 'object'
const parser = 'zod'
// Из base/codegen/clients/<Tag>/<operation>.ts до base/client.ts — три уровня вверх.
const clientImportPath = '../../../client'

export default defineConfig({
	input: { path: '../api-contract/dist/openapi.yaml' },
	output: {
		path: './base/codegen',
		clean: true,
		extension: { '.ts': '' },
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
		pluginZod({
			output: { path: 'zod', barrelType: 'propagate' },
			group,
			unknownType,
			version: '4',
			mini: true,
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
