import fs from 'fs'
import { join, resolve } from 'path'
import { getInput, getState, saveState, setSecret, group, setFailed } from '@actions/core'
import { exec } from '@actions/exec'
import { rmRF } from '@actions/io'
import { target, ContainerRuns, NodeRuns, NodeURL } from './action'
import { login, logout } from './ecr'
import { clone } from './git'
import { getParameter } from './ssm'
import { parse } from './yaml'

const ecrDockerUrl = new RegExp(/^[^\.]+\.dkr\.ecr\.[^\.]+\.amazonaws\.com/)
const isPost = getState('isPost') === 'true'

if (!isPost) {
	target()
		.then(async (target) => {
			// Run Container Directly
			if (!target.clone) {
				return target.dockerImage().then(runDocker)
			}

			const dir = await token()
				.then((githubToken) => `https://${githubToken}@github.com/${(target.url as NodeURL).action}.git`)
				.then((repo) => group('Cloning Target Action', () => clone(repo)))

			return fs.promises
				.readFile(join(dir, 'action.yml'))
				.then((text) => parse(text.toString()))
				.then(async (action) => {
					if (action.isNode()) {
						return group('Running Node Action', () => {
							return exec('node', [resolve(dir, (action.runs as NodeRuns).main)], {
								cwd: dir,
								env: action.env(),
							})
						})
					}

					// Container Action
					return action.dockerImage().then((image) => runDocker(image, action.runs as ContainerRuns))
				})
				.finally(() => rmRF(dir))
		})
		.catch((err) => setFailed(`Action Failed: ${err.message}`))

	saveState('isPost', 'true')
}

async function runDocker(image: string, runs?: ContainerRuns): Promise<number> {
	const args = ['run']
	if (runs?.args) {
		args.push(...runs.args)
	}
	if (runs?.entrypoint) {
		args.push('--entrypoint', runs.entrypoint)
	}
	if (runs?.env) {
		Object.keys(runs.env).forEach((key) => args.push('-e', `${key}=${runs.env![key]}`))
	}
	args.push(image)

	return group('Running Docker Action', () => {
		if (!ecrDockerUrl.test(image)) {
			return exec('docker', args)
		}

		return login()
			.then((_) => exec('docker', args))
			.finally(logout)
	})
}

function hideSecret(secret: string): string {
	setSecret(secret)
	return secret
}

async function token(): Promise<string> {
	const secret = getInput('target-token', { required: false })

	if (secret.startsWith('ssm://')) {
		return getParameter(secret.substr(6)).then(hideSecret)
	}

	return Promise.resolve(hideSecret(secret))
}
