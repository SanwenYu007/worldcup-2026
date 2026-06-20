// 球员简介增强：用 ChatGPT 为 public/teams.json 中每名球员补充中英双语一句话简介(bio:{zh,en})。
//
// 用法：OPENAI_API_KEY=sk-... node scripts/enrich-players.js [--force]
// 可选：OPENAI_MODEL（默认 gpt-5.5）、OPENAI_EFFORT（默认 low）。
// 幂等：默认只为缺少 bio 的球员请求；加 --force 重新生成全部。按队批量调用（每队一次）。
// 由 update.sh 调用：首次跑满 48 队，之后基本是空操作（除非有新球员）。

import OpenAI from 'openai'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const TEAMS = fileURLToPath(new URL('../public/teams.json', import.meta.url))
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const EFFORT = process.env.OPENAI_EFFORT || 'low'
const FORCE = process.argv.includes('--force')

if (!process.env.OPENAI_API_KEY) {
  console.error('✗ 缺少 OPENAI_API_KEY，跳过球员简介（保留现有 teams.json）。')
  process.exit(0)
}

// 覆盖 User-Agent：部分网关 WAF 拦截官方 SDK 的 "OpenAI/JS" UA。
const client = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  defaultHeaders: { 'User-Agent': 'Mozilla/5.0' }
})

const data = JSON.parse(await readFile(TEAMS, 'utf8'))
const teams = data.teams || []

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase()

function parseJSON(text) {
  let c = (text || '').trim()
  if (c.startsWith('```')) c = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  if (!c.startsWith('{') && !c.startsWith('[')) {
    const m = c.match(/\{[\s\S]*\}/)
    if (m) c = m[0]
  }
  return JSON.parse(c)
}

const system =
  '你是一位足球资料编辑。根据球队与球员名单，为每名球员写一句简短中立的中文简介和一句英文简介，' +
  '内容涵盖位置/风格/在队中的角色（如不确定可写「司职X的球员」这类通用描述，不要编造具体数据或转会传闻）。' +
  '只输出 JSON，不要 markdown 代码块，格式：{"players":[{"name":"<与输入一致的英文名>","zh":"<中文一句话>","en":"<English one sentence>"}]}。' +
  '对每名输入球员输出一条。'

let totalUpdated = 0
let calls = 0

for (const team of teams) {
  const squad = team.squad || []
  const targets = FORCE ? squad : squad.filter((p) => !p.bio || !p.bio.zh)
  if (!targets.length) continue

  const lines = targets.map((p) => `${p.name}（${p.posLabel || p.position || ''}${p.age ? ', ' + p.age + '岁' : ''}, ${p.nationality || team.country || ''}）`).join('\n')
  const userPrompt = `球队：${team.cnName || team.name}（${team.country || ''}）\n主教练：${team.coach || '未知'}\n请为以下 ${targets.length} 名球员各写一句中英简介：\n\n${lines}`

  try {
    const res = await client.responses.create({
      model: MODEL,
      instructions: system,
      input: userPrompt,
      reasoning: { effort: EFFORT },
      max_output_tokens: 8000
    })
    calls++
    if (res.status && res.status !== 'completed') {
      console.error(`[warn] ${team.cnName || team.name}: status=${res.status}，跳过`)
      continue
    }
    const parsed = parseJSON(res.output_text || '')
    const arr = Array.isArray(parsed) ? parsed : parsed.players
    if (!Array.isArray(arr)) { console.error(`[warn] ${team.cnName}: 返回无 players 数组`); continue }
    const byName = new Map(arr.map((x) => [norm(x.name), x]))
    let n = 0
    for (const p of targets) {
      const got = byName.get(norm(p.name))
      if (got && (got.zh || got.en)) { p.bio = { zh: got.zh || '', en: got.en || '' }; n++; totalUpdated++ }
    }
    console.log(`✓ ${team.cnName || team.name}: ${n}/${targets.length} 名球员已补简介`)
    // 每队写一次盘，断点续传（中途失败也保留已完成的）
    await writeFile(TEAMS, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error(`[warn] ${team.cnName || team.name}: ${e.message}`)
  }
}

console.log(`完成：${calls} 次调用，共补充 ${totalUpdated} 名球员简介 → public/teams.json`)
