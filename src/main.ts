import * as core from '@actions/core'
import * as github from '@actions/github'
import * as lark from './lark'
import {exec} from './exec'

async function run(): Promise<void> {
  try {
    const title = core.getInput('title'),
      cmd = core.getInput('command'),
      webhook = core.getInput('larkBotWebhook'),
      ctx = github.context,
      ownerRepo = `${ctx.repo.owner}/${ctx.repo.repo}`,
      repoURL = `https://github.com/${ownerRepo}`,
      actionURL = `${repoURL}/actions`,
      commitURL = `${repoURL}/commit/${ctx.sha}`

    // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true
    core.debug(`Got command: ${cmd}`)

    const ciInfo = new lark.Markdown(
      `[CI](${actionURL}) of ${ownerRepo}/${ctx.ref}, see [commit](${commitURL}).`
    )
    let cmdInfo: lark.Text, tpl: lark.CardTemplate
    try {
      const {stdout, stderr} = await exec(cmd)
      if (stderr === '') {
        tpl = lark.CardTemplate.Turquoise
        cmdInfo = new lark.Text(stdout)
      } else {
        tpl = lark.CardTemplate.Violet
        let text = ''
        if (stdout !== '') {
          text = text.concat(`STDOUT:\n${stdout}\n\n`)
        }
        cmdInfo = new lark.Text(text.concat(`STDERR:\n${stderr}`))
      }
    } catch (err) {
      tpl = lark.CardTemplate.Carmine
      cmdInfo = new lark.Text(`ERROR:\n${err}`)
    }
    await lark.send(
      webhook,
      new lark.Card(tpl, title).addElements(ciInfo, cmdInfo).toMessage()
    )
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
