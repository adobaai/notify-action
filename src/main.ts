import * as core from '@actions/core'
import * as github from '@actions/github'
import * as lark from './lark'
import {exec} from './exec'

async function run(): Promise<void> {
  try {
    const dryRun = core.getInput('dryRun'),
      title = core.getInput('title'),
      content = core.getInput('content'),
      cmd = core.getInput('command'),
      webhook = core.getInput('larkBotWebhook'),
      ctx = github.context,
      ownerRepo = `${ctx.repo.owner}/${ctx.repo.repo}`,
      repoURL = `https://github.com/${ownerRepo}`,
      actionURL = `${repoURL}/actions`

    // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true
    core.debug(`Got command: ${cmd}`)

    let commitURL = `${repoURL}/commit/${ctx.sha}`,
      refType: 'branch' | 'tag' | 'pull' | undefined,
      pullURL: string | undefined
    if (ctx.ref.startsWith('refs/heads/')) {
      refType = 'branch'
    } else if (ctx.ref.startsWith('refs/tags/')) {
      refType = 'tag'
    } else if (ctx.ref.startsWith('refs/pull')) {
      refType = 'pull'
      const regex = new RegExp(`^refs/pull/(.+)/merge$`)
      const matches = 'refs/pull/11/merge'.match(regex)
      pullURL = `${repoURL}/pull/${matches?.at(1)}`
      commitURL = `${commitURL}/commits/${ctx.sha}`
    }

    let ciInfo = `[CI](${actionURL}) of ${ownerRepo}/${ctx.ref}, see`
    if (refType === 'pull') {
      ciInfo = ciInfo.concat(` [PR](${pullURL}),`)
    }
    ciInfo = ciInfo.concat(` [commit](${commitURL}).`)

    let cmdInfo = '',
      tpl = lark.CardTemplate.Turquoise
    if (cmd) {
      try {
        const {stdout, stderr} = await exec(cmd)
        if (stderr === '') {
          cmdInfo = stdout
        } else {
          tpl = lark.CardTemplate.Violet
          let text = ''
          if (stdout !== '') {
            text = text.concat(`STDOUT:\n${stdout}\n\n`)
          }
          cmdInfo = text.concat(`STDERR:\n${stderr}`)
        }
      } catch (err) {
        tpl = lark.CardTemplate.Carmine
        cmdInfo = `ERROR:\n${err}`
      }
    }
    if (dryRun) {
      core.info(`CI info: ${ciInfo}`)
      if (content) core.info(`Content: ${content}`)
      if (cmd) core.info(`Command: ${cmdInfo}`)
      return
    }

    const elems: lark.Element[] = [new lark.Markdown(ciInfo)]
    if (content) elems.push(new lark.Markdown(content))
    if (cmd) elems.push(new lark.Text(cmdInfo))
    await lark.send(
      webhook,
      new lark.Card(tpl, title).addElements(...elems).toMessage()
    )
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
