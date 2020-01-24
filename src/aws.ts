import { request } from 'http'
import { error, getInput } from '@actions/core'

interface InstanceIdentity {
	accountId: string
	region: string
}

let instanceIdentityPromise: Promise<InstanceIdentity> | null

function instanceIdentity(): Promise<InstanceIdentity> {
	if (typeof instanceIdentityPromise === 'undefined') {
		const opts = {
			host: '169.254.169.254',
			path: '/latest/dynamic/instance-identity/document',
		}

		instanceIdentityPromise = new Promise((resolve, reject) => {
			return request(opts, res => {
				let chunks: Array<Buffer> = []

				res.on('data', chunk => chunks.push(chunk))
				res.on('end', () => {
					const response = chunks.join('')

					try {
						return resolve(JSON.parse(response))
					} catch (err) {
						error(
							`Failed to parse response from metadata service. Response: ${response}. Error: ${err.message}`
						)
						return reject(err)
					}
				})
			})
				.on('error', err => {
					error(`Failed to retrieve document from metadata service: ${err.message}`)
					return reject(err)
				})
				.end()
		})
	}

	return instanceIdentityPromise!
}

export async function accountID(): Promise<string> {
	let id = getInput('aws_account_id')
	if (id.length > 0) return Promise.resolve(id)

	return instanceIdentity().then(identity => identity.accountId)
}

export async function region(): Promise<string> {
	let r = getInput('aws_region')
	if (r.length > 0) {
		return Promise.resolve(r)
	}

	return instanceIdentity().then(identity => identity.region)
}
