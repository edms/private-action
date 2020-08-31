import { join } from 'path'
import { error, debug } from '@actions/core'
import { exec } from '@actions/exec'
import { mkdirP } from '@actions/io'

function tmpDirectory() {
	return Math.random().toString(36).substring(2, 6)
}

export async function clone(url: string, ref: string = 'HEAD'): Promise<string> {
	const dir = tmpDirectory()

	let stdout: Array<Buffer> = []
	let stderr: Array<Buffer> = []

	const opts = {
		cwd: join('target', dir),
		silent: true,
		listeners: {
			stdout: (data: Buffer) => stdout.push(data),
			stderr: (data: Buffer) => stderr.push(data),
		},
	}

	return mkdirP(opts.cwd)
		.then((_) => exec('git', ['init'], opts))
		.then((_) => exec('git', ['remote', 'add', 'origin', url], opts))
		.then((_) => exec('git', ['fetch', '--depth=1', 'origin', ref], opts))
		.then((_) => exec('git', ['reset', '--hard', 'FETCH_HEAD'], opts))
		.then((_) => opts.cwd)
		.catch(function (err: Error) {
			debug(stdout.join(''))
			error(`Failed to git clone ${url}: ${err.message}`)
			error(stderr.join(''))
			throw new Error(`Failed to clone ${url}}: ${err.message}`)
		})
}
