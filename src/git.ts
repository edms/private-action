import { join } from 'path'
import { error } from '@actions/core'
import { exec } from '@actions/exec'
import { mkdirP } from '@actions/io'

function tmpDirectory() {
  return Math.random().toString(36).substring(2, 6)
}

export function clone(url: string, ref: string = 'HEAD'): Promise<string> {
  const dir = tmpDirectory()

  const opts = {
    cwd: join('target', dir),
  }

  return mkdirP(opts.cwd)
    .then(_ => exec('git', ['init'], opts))
    .then(_ => exec('git', ['remote', 'add', 'origin', url], opts))
    .then(_ => exec('git', ['fetch', '--depth=1', 'origin', ref], opts))
    .then(_ => exec('git', ['reset', '--hard', 'FETCH_HEAD'], opts))
    .then(_ => opts.cwd)
    .catch(function (e) {
      const err = e as Error
      error(err.message)
      throw new Error(`Failed to clone ${url}}: ${err.message}`)
    })
}