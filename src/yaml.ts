import { safeLoad, LoadOptions } from 'js-yaml'
import { Action } from './action'

export async function parse(text: string, opts?: LoadOptions): Promise<Action> {
	try {
		return Promise.resolve(new Action(safeLoad(text, opts)))
	} catch (err) {
		return Promise.reject(new Error(`Failed to parse yaml file: ${err.message}`))
	}
}
