import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {defineTool} from '@deepseek-ai/dsh-tools'

export const name = 'wordtrail-content'
export const inject = ['tools']
const output = {schema: {type: 'string'}, render: (_args, value) => [{type: 'text', text: value}]}

export async function lookupWord(root, query, signal) {
  const word = query.trim().toLowerCase()
  if (!/^[a-z][a-z' -]{0,79}$/.test(word)) throw new Error('Provide one English word or phrase, at most 80 characters.')
  const [content, vocab, corrections] = await Promise.all([
    readFile(join(root, 'learning-content.json'), {encoding: 'utf8', signal}).then(JSON.parse),
    readFile(join(root, 'exam_vocab.json'), {encoding: 'utf8', signal}).then(JSON.parse),
    readFile(join(root, 'recovered-content.json'), {encoding: 'utf8', signal}).then(JSON.parse),
  ])
  const fixes = new Map((corrections.corrections || []).filter(f => f.verified).map(f => [f.index,f]))
  const entries = vocab.map((row,index) => {
    const fix=fixes.get(index)
    if (!fix || fix.originalWord!==row.word || fix.originalYear!==row.year || fix.originalText!==row.text) return row
    return {...row,...Object.fromEntries(['word','meanings','pos','year','text'].filter(k=>fix[k]!==undefined).map(k=>[k,fix[k]]))}
  }).filter(row => row.word.toLowerCase() === word)
  return {word, found: Boolean(content[word] || entries.length), teaching: content[word] || null,
    sourceOccurrences: entries.slice(0,8).map(({year,text,meanings,pos}) => ({year,text,meanings,pos})),
    totalOccurrences: entries.length, provenance: 'Local WordTrail vocabulary and supplemental teaching examples. Occurrences are vocabulary-list references, not full exam passages.'}
}

export function apply(ctx) {
  const root = process.env.WORDTRAIL_ROOT
  if (!root) throw new Error('WORDTRAIL_ROOT is required')
  ctx.tools.register(defineTool({
    name: 'education_lookup_word', description: 'Look up one English word in the local course; return sourced senses and teaching examples. No network lookup.',
    parameters: {word: {type: 'string', required: true}}, output,
    async execute(args, exec) {return JSON.stringify(await lookupWord(root, args.word, exec.signal))},
  }))
}
