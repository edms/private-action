import { safeLoad, LoadOptions } from 'js-yaml'
import { Action } from './action'

<<<<<<< HEAD
export function parse(text: string, opts?: LoadOptions): Action {
	try {
		return new Action(safeLoad(text, opts))
	} catch (err) {
		throw new Error(`Failed to parse yaml file: ${err.message}`)
	}
}
=======
export function parse(text: string, opts?: LoadOptions): Promise<Action> {
  try {
    return Promise.resolve(new Action(safeLoad(text, opts)))
  } catch (err) {
    return Promise.reject(new Error(`Failed to parse yaml: ${err.message}`))
  }
}
>>>>>>> f74605a92b6132a9c92a6daa5907f37b409da974
