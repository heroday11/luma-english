// One bounded SDK transaction. stdout is JSON only; credentials stay in env.
import {spawn} from 'node:child_process'
import {readFile, mkdir} from 'node:fs/promises'
import {resolve, dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {JsonRpcLineTransport} from '@deepseek-ai/dsh-sdk-protocol'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const input = JSON.parse(await readFile(process.argv[2], 'utf8'))
const home = resolve(process.env.WORDTRAIL_DSH_HOME || join(root, '.dsh-runtime/home'))
await mkdir(home, {recursive:true})
const env = {...process.env, DSH_HOME: home, WORDTRAIL_ROOT: root,
  WORDTRAIL_SKILLS: join(root,'.dsh/skills'), WORDTRAIL_CONTEXT: resolve(process.argv[2])}
const child = spawn(process.execPath, [join(root,'node_modules/@deepseek-ai/dsh/lib/bin.js'),
  '--profile','sdk-minimal','--patch',join(root,'integrations/dsh/education.patch.yml')],
  {cwd:root, env, windowsHide:true, stdio:['pipe','pipe','pipe']})
const rpc = new JsonRpcLineTransport(child.stdout, child.stdin)
let diagnostic = '', finalResponse = '', finishReason = null, toolCalls = []
child.stderr.on('data', data => {diagnostic = (diagnostic + data.toString()).slice(-8000)})
child.on('error', () => rpc.close())
rpc.onNotification((method, params) => {
  if (method !== 'session.event' || params.sessionId !== input.runtimeSessionId) return
  const event = params.event
  if (event.type === 'assistant/message') {
    const text = event.data.message.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
    if (text.trim()) finalResponse = text
  }
  if (event.type === 'turn/end') finishReason = event.data.reason.kind
  if (event.type === 'tool/call') toolCalls.push(event.data.call?.name || event.data.name || 'tool')
})
rpc.start()
const timeout = AbortSignal.timeout(110000)
let result
try {
  const ready = await rpc.request('initialize',{cwd:root, provider:'deepseek-official', model:input.model || 'deepseek-flash', maxTokens:4096}, AbortSignal.timeout(30000))
  if (ready.serverInfo?.name !== 'deepseek-harness-sdk-runtime') throw new Error('Invalid DSH handshake')
  if (input.doctor) result = {ok:true, runtime:ready.serverInfo, version:'0.2.1-alpha.2'}
  else {
    await rpc.request('session/prompt',{sessionId:input.runtimeSessionId, contentBlocks:[{type:'text',text:input.prompt}]}, timeout)
    await rpc.request('session/wait',{sessionId:input.runtimeSessionId}, timeout)
    if (finishReason !== 'completed' || !finalResponse.trim()) throw new Error('Incomplete model turn')
    result = {ok:true, text:finalResponse, finishReason, toolCalls}
  }
} catch (error) {
  // Do not forward upstream diagnostics or provider response bodies to the browser.
  const detail = `${error.message} ${diagnostic}`
  const code = /401|unauthorized|invalid.api.key|authentication/i.test(detail) ? 'MODEL_AUTH_FAILED' :
    /429|quota|insufficient.balance/i.test(detail) ? 'MODEL_QUOTA' :
    /timeout|timed out|abort/i.test(detail) ? 'MODEL_TIMEOUT' : 'DSH_RUNTIME_ERROR'
  result = {ok:false, code}
  if (process.env.WORDTRAIL_TEST_DIAGNOSTICS === '1') process.stderr.write(detail)
} finally {
  try {await rpc.request('shutdown',{},AbortSignal.timeout(3000))} catch {}
  rpc.close()
  child.kill()
}
process.stdout.write(JSON.stringify(result))
process.exitCode = result.ok ? 0 : 1
