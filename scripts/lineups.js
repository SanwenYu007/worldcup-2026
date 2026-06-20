// 首发阵容预测：用 ChatGPT 为未来 N 天的比赛预测两队可能的首发11人 + 阵型，写入 public/lineups.json。
//
// 用法：OPENAI_API_KEY=sk-... node scripts/lineups.js
// 可选：OPENAI_MODEL（默认 gpt-5.5）、OPENAI_EFFORT（默认 low）、HORIZON_DAYS（默认 3）。
// 依赖 public/live.json（赛程）+ public/teams.json（各队名单）。由 update.sh 调用。

import OpenAI from 'openai'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const LIVE = fileURLToPath(new URL('../public/live.json', import.meta.url))
const TEAMS = fileURLToPath(new URL('../public/teams.json', import.meta.url))
const OUT = fileURLToPath(new URL('../public/lineups.json', import.meta.url))
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'
const EFFORT = process.env.OPENAI_EFFORT || 'low'
const HORIZON_DAYS = Number(process.env.HORIZON_DAYS || 3)

if (!process.env.OPENAI_API_KEY) {
  console.error('✗ 缺少 OPENAI_API_KEY，跳过首发阵容（保留现有 lineups.json）。')
  process.exit(0)
}

const client = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  defaultHeaders: { 'User-Agent': 'Mozilla/5.0' }
})

const live = JSON.parse(await readFile(LIVE, 'utf8'))
const teamsData = JSON.parse(await readFile(TEAMS, 'utf8'))
const teamById = Object.fromEntries((live.teams || []).map((t) => [t.id, t]))
const nameOf = (code) => teamById[code]?.name || code

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase()
// live.json 队名是中文，teams.json 同时含英文 name 与中文 cnName，两者都建索引。
const squadByName = new Map()
for (const t of teamsData.teams || []) {
  if (t.name) squadByName.set(norm(t.name), t.squad || [])
  if (t.cnName) squadByName.set(norm(t.cnName), t.squad || [])
  if (t.code) squadByName.set(norm(t.code), t.squad || [])
}
function squadOf(code) {
  const tm = teamById[code]
  return squadByName.get(norm(tm?.name)) || squadByName.get(norm(tm?.cnName)) || squadByName.get(norm(code)) || []
}

const now = new Date()
const end = new Date(now.getTime() + HORIZON_DAYS * 86400000)
const upcoming = (live.matches || [])
  .filter((m) => m.home && m.away && m.status !== 'finished')
  .filter((m) => { const d = new Date(m.date); return d >= now && d <= end })
  .sort((a, b) => new Date(a.date) - new Date(b.date))

if (!upcoming.length) {
  console.log(`ℹ 未来 ${HORIZON_DAYS} 天内没有待赛比赛，保留现有阵容，未改动。`)
  process.exit(0)
}

function parseJSON(text) {
  let c = (text || '').trim()
  if (c.startsWith('```')) c = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  if (!c.startsWith('{')) { const m = c.match(/\{[\s\S]*\}/); if (m) c = m[0] }
  return JSON.parse(c)
}

const system =
  '你是一位足球战术分析师。根据两队的可用名单，预测各自最可能的首发11人与阵型。' +
  '球员名必须从给定名单中选取（用英文名，与名单一致）。只输出 JSON，不要 markdown：' +
  '{"homeFormation":"4-3-3","homeXI":["<11个英文名>"],"awayFormation":"...","awayXI":["...11..."],' +
  '"zh":"<中文一句战术点评>","en":"<one English tactical note>"}'

const lineups = []
let calls = 0

for (const m of upcoming) {
  const hs = squadOf(m.home), as = squadOf(m.away)
  if (hs.length < 11 || as.length < 11) {
    console.log(`[skip] ${nameOf(m.home)} vs ${nameOf(m.away)}：名单不足`)
    continue
  }
  const fmt = (sq) => sq.map((p) => `${p.name}(${p.posKey || p.position || ''})`).join(', ')
  const userPrompt =
    `比赛：${nameOf(m.home)}(主) vs ${nameOf(m.away)}(客)\n` +
    `${nameOf(m.home)} 名单：${fmt(hs)}\n${nameOf(m.away)} 名单：${fmt(as)}\n` +
    `请预测两队首发11人与阵型。`
  try {
    const res = await client.responses.create({
      model: MODEL, instructions: system, input: userPrompt,
      reasoning: { effort: EFFORT }, max_output_tokens: 6000
    })
    calls++
    if (res.status && res.status !== 'completed') { console.error(`[warn] ${nameOf(m.home)} vs ${nameOf(m.away)}: status=${res.status}`); continue }
    const p = parseJSON(res.output_text || '')
    if (!Array.isArray(p.homeXI) || !Array.isArray(p.awayXI)) { console.error(`[warn] ${nameOf(m.home)} vs ${nameOf(m.away)}: XI 缺失`); continue }
    lineups.push({
      matchId: m.id, home: m.home, away: m.away,
      homeName: nameOf(m.home), awayName: nameOf(m.away), date: m.date,
      homeFormation: p.homeFormation || '', awayFormation: p.awayFormation || '',
      homeXI: p.homeXI.slice(0, 11), awayXI: p.awayXI.slice(0, 11),
      note: { zh: p.zh || '', en: p.en || '' }
    })
    console.log(`✓ ${nameOf(m.home)} vs ${nameOf(m.away)}：${p.homeFormation} / ${p.awayFormation}`)
  } catch (e) {
    console.error(`[warn] ${nameOf(m.home)} vs ${nameOf(m.away)}: ${e.message}`)
  }
}

const payload = { model: MODEL, generatedAt: new Date().toISOString(), horizonDays: HORIZON_DAYS, lineups }
await writeFile(OUT, JSON.stringify(payload, null, 2))
console.log(`✓ ${calls} 次调用，已写入 ${lineups.length} 场首发阵容 → public/lineups.json`)
