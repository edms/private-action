import { SSM } from 'aws-sdk'
import { region } from './aws'

const ssm = region().then(region => new SSM({ region }))

export function getParameter(name: string): Promise<string> {
	return ssm
		.then(ssm =>
			ssm
				.getParameter({
					Name: name,
					WithDecryption: true,
				})
				.promise()
		)
		.then(data => data.Parameter!.Value!)
}

export function getParameters(names: Array<string>): Promise<Map<string, string>> {
	return ssm
		.then(ssm =>
			ssm
				.getParameters({
					Names: names,
					WithDecryption: true,
				})
				.promise()
		)
		.then(data => {
			let params: Map<string, string> = new Map()
			data.Parameters!.forEach(parameter => params.set(parameter.Name!, parameter.Value!))
			return params
		})
}

export function getParametersByPath(path: string): Promise<Map<string, string>> {
	return ssm.then(ssm => {
		let params: Map<string, string> = new Map()

		let get: (token?: string) => Promise<Map<string, string>>

		get = token => {
			return ssm
				.getParametersByPath({
					Path: path,
					Recursive: true,
					NextToken: token,
				})
				.promise()
				.then(data => {
					data.Parameters!.forEach(parameter => params.set(parameter.Name!, parameter.Value!))

					if (data.NextToken && data.NextToken.length > 0) return get(data.NextToken)
					else return params
				})
		}

		return get()
	})
}
