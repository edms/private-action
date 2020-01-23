import { safeLoad, LoadOptions } from 'js-yaml'
import { Action } from './action'

export function parse(text: string, opts?: LoadOptions): Action {
	try {
		return new Action(safeLoad(text, opts))
	} catch (err) {
		throw new Error(`Failed to parse yaml file: ${err.message}`)
	}
}
