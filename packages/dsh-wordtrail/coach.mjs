import {readFile} from 'node:fs/promises'
import {defineTool} from '@deepseek-ai/dsh-tools'

export const name = 'wordtrail-coach'
export const inject = ['tools']
const output = {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: value}]}

export function planLearning(evidence, minutes = 20) {
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 60) throw new Error('minutes must be an integer from 5 to 60')
  const due = Math.max(0, Number(evidence.dueCount) || 0)
  const reviewMinutes = Math.min(Math.floor(minutes * .4), Math.ceil(due * .5))
  const work = minutes - reviewMinutes
  return {minutes, dueCount: due, reviewMinutes, reviewLimit: Math.min(due, reviewMinutes * 2),
    inputMinutes: Math.floor(work * .4), practiceMinutes: Math.floor(work * .3),
    transferMinutes: work - Math.floor(work * .4) - Math.floor(work * .3),
    newWordLimit: due > minutes * 2 ? 0 : Math.min(5, Math.floor(work / 3)),
    rationale: due > minutes * 2 ? 'Review backlog: pause new words; keep a short meaningful task.' : 'Reserve time for independent use and a different-context check.',
    assessment: 'A time-budget heuristic, not a validated proficiency estimate.'}
}

export function apply(ctx) {
  const contextPath = process.env.WORDTRAIL_CONTEXT
  if (!contextPath) throw new Error('WORDTRAIL_CONTEXT is required')
  const context = async signal => JSON.parse(await readFile(contextPath, {encoding:'utf8', signal}))
  ctx.tools.register(defineTool({
    name: 'education_context', description: 'Read only this authenticated learner session: goal, current task, prior attempts and bounded review summary. No names, emails or credentials.',
    parameters: {}, output, async execute(_args, exec) {return JSON.stringify(await context(exec.signal))},
  }))
  ctx.tools.register(defineTool({
    name: 'education_plan', description: 'Allocate a 5–60 minute lesson with review, input, practice and transfer. Does not modify saved progress.',
    parameters: {minutes: {type:'number', required:true}}, output,
    async execute(args, exec) {return JSON.stringify(planLearning((await context(exec.signal)).evidence || {}, args.minutes))},
  }))
}
