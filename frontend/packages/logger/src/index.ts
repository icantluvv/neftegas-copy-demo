export interface JsonLogOptionalFields {
	err?: unknown
	req?: unknown
	res?: unknown
	[key: string]: unknown
}

type Level = 'debug' | 'info' | 'warn' | 'error'

function write(level: Level, namespace: string[], msg: string, fields?: Record<string, unknown>) {
	const line = {
		time: new Date().toISOString(),
		level,
		ns: namespace.join(':'),
		msg,
		...fields,
	}
	const method = level === 'debug' ? 'log' : level
	// eslint-disable-next-line no-console
	console[method](JSON.stringify(line))
}

class BoundLogger {
	constructor(
		private namespace: string[],
		private fields: Record<string, unknown>,
	) {}

	debug(msg: string) {
		write('debug', this.namespace, msg, this.fields)
	}

	info(msg: string) {
		write('info', this.namespace, msg, this.fields)
	}

	warn(msg: string) {
		write('warn', this.namespace, msg, this.fields)
	}

	error(msg: unknown) {
		write('error', this.namespace, msg instanceof Error ? msg.message : String(msg), this.fields)
	}
}

class Logger {
	constructor(private namespace: string[] = []) {}

	ns(name: string): Logger {
		return new Logger([...this.namespace, name])
	}

	/** No-op marker kept for parity with the reference client-architecture (finalizes the namespace chain). */
	seal(): Logger {
		return this
	}

	meta<T extends Record<string, unknown>>(fields: T): BoundLogger {
		return new BoundLogger(this.namespace, fields)
	}

	debug(msg: string) {
		write('debug', this.namespace, msg)
	}

	info(msg: string) {
		write('info', this.namespace, msg)
	}

	warn(msg: string) {
		write('warn', this.namespace, msg)
	}

	error(msg: unknown) {
		write('error', this.namespace, msg instanceof Error ? msg.message : String(msg))
	}
}

export function serializeError(error: Error) {
	return { name: error.name, message: error.message, stack: error.stack }
}

export function serializeRequest(input: { headers: Headers; method: string; url: string }) {
	return {
		method: input.method,
		url: input.url,
		headers: Object.fromEntries(input.headers.entries()),
	}
}

export function serializeResponse(response: Response) {
	return {
		status: response.status,
		statusText: response.statusText,
		headers: Object.fromEntries(response.headers.entries()),
	}
}

const _logger = new Logger()

export default _logger
