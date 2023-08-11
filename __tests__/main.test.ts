import {exec} from '../src/exec'
import * as lark from '../src/lark'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'
import {log} from 'console'

test('exec echo', async () => {
  const {stdout, stderr} = await exec('echo hello world')
  expect(stdout).toEqual('hello world\n')
  expect(stderr).toEqual('')
})

test('exec echo stderr', async () => {
  const {stdout, stderr} = await exec('>&2 echo "so bad"')
  expect(stdout).toEqual('')
  expect(stderr).toEqual('so bad\n')
})

test('exec cat not found file', async () => {
  try {
    await exec('cat hello')
  } catch (err) {
    log('got err:', err)
  }
})

test('new url', async () => {
  const url = new URL('https://open.feishu.cn/open-apis/bot/v2/hook/xxxx')
  expect(url.protocol).toEqual('https:')
  expect(url.host).toEqual('open.feishu.cn')
  expect(url.pathname).toEqual('/open-apis/bot/v2/hook/xxxx')
})

test.skip('lark', async () => {
  const card = new lark.Card(lark.CardTemplate.Violet, 'HELLO')
  card.addElements(new lark.Markdown('**some**thing'))
  card.addElements(new lark.Text('text block here'))
  lark.send(
    'https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx',
    card.toMessage()
  )
})

// shows how the runner will run a javascript action with env / stdout protocol
test.skip('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = '500'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
