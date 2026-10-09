// A teaching-only host for the official DSH plugins, not a second agent loop.
import {boot, installFailLoud, loadOverlayPatches} from '@deepseek-ai/dsh-app-boot'
import {fileURLToPath} from 'node:url'

installFailLoud('wordtrail-dsh')
const config = fileURLToPath(new URL('./runtime.yml', import.meta.url))
const overlay = fileURLToPath(new URL('./education.patch.yml', import.meta.url))
const ctx = await boot('wordtrail-dsh', config, loadOverlayPatches('wordtrail-dsh', overlay))
let closing = false
async function close() {
  if (closing) return
  closing = true
  const deadline = setTimeout(() => process.exit(1), 3000)
  deadline.unref()
  await ctx.fiber.dispose()
  process.exit(0)
}
process.stdin.on('end', close)
process.on('SIGTERM', close)
process.on('SIGINT', close)
if (process.stdin.readableEnded) await close()
