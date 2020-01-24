import { ECR } from 'aws-sdk'
import { info, debug } from '@actions/core'
import { exec } from '@actions/exec'
import { accountID, region } from './aws'

export async function login() {
	return region()
		.then(region => {
			const ecr = new ECR({ region })
			return ecr.getAuthorizationToken().promise()
		})
		.then(response => {
			if (!response || !Array.isArray(response.authorizationData) || !response.authorizationData.length) {
				throw new Error('Failed to retrieve an authorization token for Amazon ECR')
			}

			for (const authData of response.authorizationData) {
				if (
					typeof authData === 'undefined' ||
					typeof authData.authorizationToken === 'undefined' ||
					typeof authData.proxyEndpoint === 'undefined' ||
					!authData.authorizationToken.length
				) {
					throw new Error('Failed to retrieve an authorization token for Amazon ECR')
				}

				return Promise.resolve(authData)
			}

			throw new Error('Failed to retrieve an authorization token for Amazon ECR')
		})
		.then(async authData => {
			const [username, password] = Buffer.from(authData.authorizationToken!, 'base64')
				.toString()
				.split(':', 2)

			let stdout: Array<Buffer> = []
			let stderr: Array<Buffer> = []

			info('Logging into AWS ECR')
			return exec('docker', ['login', '-u', username, '-p', password, authData.proxyEndpoint!], {
				silent: true,
				listeners: {
					stdout: (data: Buffer) => stdout.push(data),
					stderr: (data: Buffer) => stderr.push(data),
				},
			}).catch(err => {
				debug(stdout.join(''))
				throw new Error(`Failed to login to docker: ${stderr.join('')}. ${err.message}`)
			})
		})
}

export async function registry(): Promise<string> {
	return Promise.all([accountID(), region()]).then(([accountID, region]) => {
		return `${accountID}.dkr.ecr.${region}.amazonaws.com`
	})
}

export async function logout(): Promise<number> {
	return registry().then(async registry => {
		let stdout: Array<Buffer> = []
		let stderr: Array<Buffer> = []

		info('Logging out of ECR')
		return exec('docker', ['logout', registry], {
			silent: true,
			listeners: {
				stdout: (data: Buffer) => stdout.push(data),
				stderr: (data: Buffer) => stderr.push(data),
			},
		}).catch(err => {
			debug(stdout.join(''))
			throw new Error(`Failed to login to docker: ${stderr.join('')}. ${err.message}`)
		})
	})
}
