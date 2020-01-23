import { readFile as readFileCallback } from 'fs'
import { promisify } from 'util'
import { join, resolve } from 'path'
import { getInput, getState, saveState, setSecret } from '@actions/core'
import { exec } from '@actions/exec'
import { rmRF } from '@actions/io'
import { target, ContainerRuns, NodeRuns, NodeURL } from './action'
import { login, logout } from './ecr'
import { clone } from './git'
import { getParameter } from './ssm'
import { parse } from './yaml'

const isPost = getState('isPost') === 'true'

if (!isPost) {
  target().then(target => {
    // Run Container Directly
    if (!target.clone) return runDocker(target.dockerImage())

    return token().then(GITHUB_TOKEN => {
      const repo = `https://${GITHUB_TOKEN}@github.com/${(target.url as NodeURL).action}.git`

      return clone(repo).then(dir => {
        const readFile = promisify(readFileCallback)

        return readFile(join(dir, 'action.yml'))
          .then(text => parse(text.toString()))
          .then(action => {
            if (action.isNode()) {
              return exec('node', [resolve(dir, (action.runs as NodeRuns).main)], {
                cwd: dir,
                env: action.env(),
              })
            }

            // Container Action
            return runDocker(action.dockerImage(), action.runs as ContainerRuns)
          })
          .finally(() => rmRF(dir))
      })
    })
  })

  saveState('isPost', 'true')
}

function runDocker(image: string, runs?: ContainerRuns) {
  let args = ['--rm']
  if (runs && runs.args) args.push(...runs.args)
  if (runs && runs.entrypoint) args.push('--entrypoint', runs.entrypoint)
  if (runs && runs.env) Object.keys(runs.env).forEach(key => args.push('-e', `${key}=${runs.env![key]}`))
  args.push('run', image)

  if (/^[^\.]+\.dkr\.ecr\.[^\.]+\.amazonaws\.com/.exec(image) !== null) {
    return login()
      .then(_ => exec('docker', args))
      .finally(logout)
  }

  return exec('docker', args)
}

function hideSecret(secret: string): string {
  setSecret(secret)
  return secret
}

function token(): Promise<string> {
  const secret = getInput('target-token', { required: true })

  if (secret.startsWith('ssm://')) return getParameter(secret.substr(6)).then(hideSecret)

  return Promise.resolve(hideSecret(secret))
}