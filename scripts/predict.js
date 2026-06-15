// AI 比分预测：用 ChatGPT(OpenAI) 分析未来 N 天的比赛，预测比分与胜负，写入 public/predictions.json。
//
// 用法：OPENAI_API_KEY=sk-... node scripts/predict.js
// 可选：OPENAI_MODEL 指定模型（默认 gpt-4o）。
// 依赖 public/live.json（真实赛程比分，由 scripts/fetch-data.js 生成）。
// 由 GitHub Actions 定时调用，实现「每天自动更新预测」。

import OpenAI from 'openai'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const LIVE = fileURLToPath(new URL('../public/live.json', import.meta.url))
const OUT = fileURLToPath(new URL('../public/predictions.json', import.meta.url))
const HORIZON_DAYS = 2
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o'

if (!process.env.OPENAI_API_KEY) {
  console.error('✗ 缺少 OPENAI_API_KEY，跳过 AI 预测（保留现有 predictions.json）。')
  process.exit(0)
}

// 支持第三方 OpenAI 兼容接口：设置 OPENAI_BASE_URL 即用自定义网关，缺省走官方
const client = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined
})

const data = JSON.parse(await readFile(LIVE, 'utf8'))
const teamById = Object.fromEntries((data.teams || []).map((t) => [t.id, t]))
const nameOf = (code) => teamById[code]?.name || code
const ratingOf = (code) => teamById[code]?.rating || 1550

// 未来 N 天内、尚未开赛的比赛
const now = new Date()
const end = new Date(now.getTime() + HORIZON_DAYS * 86400000)
const upcoming = (data.matches || [])
  .filter((m) => m.home && m.away && m.status !== 'finished')
  .filter((m) => {
    const d = new Date(m.date)
    return d >= now && d <= end
  })
  .sort((a, b) => new Date(a.date) - new Date(b.date))

if (!upcoming.length) {
  console.log(`ℹ 未来 ${HORIZON_DAYS} 天内没有待赛比赛，保留现有预测，未改动。`)
  process.exit(0)
}

// 每队近期战绩（最多 3 场已结束比赛），给模型作参考
function recentForm(code) {
  const games = (data.matches || [])
    .filter((m) => m.status === 'finished' && (m.home === code || m.away === code) && m.homeGoals != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)
  return games.map((m) => {
    const isHome = m.home === code
    const gf = isHome ? m.homeGoals : m.awayGoals
    const ga = isHome ? m.awayGoals : m.homeGoals
    const res = gf > ga ? '胜' : gf === ga ? '平' : '负'
    return `${res} ${gf}-${ga} vs ${nameOf(isHome ? m.away : m.home)}`
  })
}

const matchLines = upcoming.map((m) => {
  const odds = m.odds?.had ? `胜平负赔率 ${m.odds.had.h}/${m.odds.had.d}/${m.odds.had.a}` : '暂无赔率'
  return [
    `matchId=${m.id}`,
    `${nameOf(m.home)}(主, 实力${ratingOf(m.home)}, 近况: ${recentForm(m.home).join('；') || '无'})`,
    `vs ${nameOf(m.away)}(客, 实力${ratingOf(m.away)}, 近况: ${recentForm(m.away).join('；') || '无'})`,
    `${m.group ? m.group + '组' : m.stageName || ''}`,
    odds
  ].join(' | ')
}).join('\n')

// 用 json_object 模式（第三方 OpenAI 兼容网关支持更广），格式要求写在提示里
const system =
  '你是一位专业足球分析师。基于两队实力值、近期战绩与赔率，预测每场比赛的最终比分与胜负。' +
  '只输出一个 JSON 对象，不要 markdown 代码块、不要额外文字，格式如下：\n' +
  '{"predictions":[{"matchId":"<原样的matchId>","score":{"home":<整数>,"away":<整数>},' +
  '"outcome":"home|draw|away","confidence":<0到1的小数>,"reasoning":"<简体中文一两句依据>"}]}\n' +
  'outcome 须与预测比分一致（主队进球多=home，相等=draw，否则=away）。对每个给定 matchId 输出一条。'

const userPrompt = `请预测以下 ${upcoming.length} 场比赛（未来 ${HORIZON_DAYS} 天）：\n\n${matchLines}`

console.log(`→ 调用 ${MODEL} 预测 ${upcoming.length} 场比赛…`)
const res = await client.chat.completions.create({
  model: MODEL,
  max_completion_tokens: 4000, // GPT-5 系列要求用此参数（而非 max_tokens）
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: userPrompt }
  ]
})

const msg = res.choices[0]?.message
if (msg?.refusal) {
  console.error('✗ 模型拒绝回答，保留现有预测。')
  process.exit(1)
}
let content = (msg?.content || '').trim()
if (!content) throw new Error('响应中没有内容')
// 容错：去掉可能的 ```json ... ``` 代码块包裹
if (content.startsWith('```')) {
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}
const parsed = JSON.parse(content)
if (!Array.isArray(parsed.predictions)) throw new Error('返回结果缺少 predictions 数组')

// 用比赛信息补全队名/日期，组装最终结构
const byId = Object.fromEntries(upcoming.map((m) => [m.id, m]))
const predictions = parsed.predictions
  .filter((p) => byId[p.matchId])
  .map((p) => {
    const m = byId[p.matchId]
    return {
      matchId: p.matchId,
      home: m.home,
      away: m.away,
      homeName: nameOf(m.home),
      awayName: nameOf(m.away),
      date: m.date,
      score: p.score,
      outcome: p.outcome,
      confidence: Math.max(0, Math.min(1, p.confidence)),
      reasoning: p.reasoning
    }
  })

const payload = {
  model: MODEL,
  modelLabel: `ChatGPT (${MODEL})`,
  generatedAt: new Date().toISOString(),
  horizonDays: HORIZON_DAYS,
  predictions
}

await writeFile(OUT, JSON.stringify(payload, null, 2))
console.log(`✓ 已写入 ${predictions.length} 条 AI 预测 → public/predictions.json`)
if (res.usage) console.log(`  用量：输入 ${res.usage.prompt_tokens} / 输出 ${res.usage.completion_tokens} tokens`)
