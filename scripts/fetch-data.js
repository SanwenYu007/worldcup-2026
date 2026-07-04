// 构建期数据抓取：从 football-data.org 拉取 2026 世界杯赛程/比分，
// 归一化后写入 public/live.json。前端运行时优先读取它，失败则回退示例数据。
//
// 用法：
//   FOOTBALL_DATA_TOKEN=你的key  node scripts/fetch-data.js
//
// 申请免费 token：https://www.football-data.org/client/register
// 免费档包含世界杯（competition code: WC）。
//
// 注意：football-data.org 只给赛程/比分，不给实力值与赔率。
// 这里用 src/data/worldcup.js 的实力表给球队补 rating/旗帜/中文名/大洲，
// 并按同一套泊松模型算出胜平负/让球/总进球/比分赔率，使真实数据也能完整显示。

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TEAMS, computeOdds } from '../src/data/worldcup.js'

const TOKEN = process.env.FOOTBALL_DATA_TOKEN
const BASE = 'https://api.football-data.org/v4'
const OUT = fileURLToPath(new URL('../public/live.json', import.meta.url))

// 真实出线球队中，示例实力表(GROUPS)未覆盖的——按其 football-data TLA 补全。
// （示例表是赛前对阵容的猜测，真实参赛队以 API 为准，这里只借用实力值。）
const SUPPLEMENT = {
  URY: { name: '乌拉圭', flag: '🇺🇾', conf: 'CONMEBOL', rating: 1820 },
  SWE: { name: '瑞典', flag: '🇸🇪', conf: 'UEFA', rating: 1700 },
  SCO: { name: '苏格兰', flag: '🏴', conf: 'UEFA', rating: 1650 },
  CZE: { name: '捷克', flag: '🇨🇿', conf: 'UEFA', rating: 1670 },
  COD: { name: '刚果(金)', flag: '🇨🇩', conf: 'CAF', rating: 1530 },
  CPV: { name: '佛得角', flag: '🇨🇻', conf: 'CAF', rating: 1500 },
  IRQ: { name: '伊拉克', flag: '🇮🇶', conf: 'AFC', rating: 1500 },
  UZB: { name: '乌兹别克斯坦', flag: '🇺🇿', conf: 'AFC', rating: 1490 },
  HAI: { name: '海地', flag: '🇭🇹', conf: 'CONCACAF', rating: 1430 },
  CUW: { name: '库拉索', flag: '🇨🇼', conf: 'CONCACAF', rating: 1380 }
}

// 按球队代码（TLA）建立实力/旗帜/中文名/大洲的补全表。未命中的用中性默认值。
const ENRICH = { ...Object.fromEntries(TEAMS.map((t) => [t.code, t])), ...SUPPLEMENT }
const DEFAULT = { rating: 1550, flag: '🏳️', conf: 'INT' }
function enrich(tla, apiName) {
  const e = ENRICH[tla]
  return {
    id: tla, code: tla,
    name: e?.name || apiName || tla,
    flag: e?.flag || DEFAULT.flag,
    rating: e?.rating || DEFAULT.rating,
    conf: e?.conf || DEFAULT.conf
  }
}

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'X-Auth-Token': TOKEN } })
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  return res.json()
}

// 阶段键统一成前端使用的短键（对阵树/进度条/i18n 均按此）
const STAGE_KEY = { GROUP_STAGE: 'group', LAST_32: 'r32', LAST_16: 'r16', QUARTER_FINALS: 'qf', SEMI_FINALS: 'sf', THIRD_PLACE: 'third', FINAL: 'final' }

function normalizeMatch(m) {
  const statusMap = { FINISHED: 'finished', IN_PLAY: 'live', PAUSED: 'live', TIMED: 'scheduled', SCHEDULED: 'scheduled' }
  return {
    id: String(m.id),
    stage: STAGE_KEY[m.stage] || m.stage.toLowerCase().replace(/_/g, ''),
    stageName: m.stage === 'GROUP_STAGE' ? null : m.stage.replace(/_/g, ' '),
    group: m.group ? m.group.replace('GROUP_', '') : null,
    matchday: m.matchday,
    date: m.utcDate,
    home: m.homeTeam?.tla || null,
    away: m.awayTeam?.tla || null,
    homeName: m.homeTeam?.name,
    awayName: m.awayTeam?.name,
    status: statusMap[m.status] || 'scheduled',
    homeGoals: m.score?.fullTime?.home ?? null,
    awayGoals: m.score?.fullTime?.away ?? null,
    events: []
  }
}

// 竞彩式场次编号：周X + 当日序号。
function assignMatchNum(matches) {
  const WD = '日一二三四五六'
  const dayCount = {}
  ;[...matches].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((m) => {
    const d = new Date(m.date)
    const key = d.toISOString().slice(0, 10)
    dayCount[key] = (dayCount[key] || 0) + 1
    m.matchNum = `周${WD[d.getUTCDay()]}${String(dayCount[key]).padStart(3, '0')}`
  })
}

async function main() {
  if (!TOKEN) {
    console.error('✗ 缺少 FOOTBALL_DATA_TOKEN 环境变量。前端将使用示例数据。')
    process.exit(1)
  }
  console.log('→ 拉取 2026 世界杯赛程…')
  const data = await api('/competitions/WC/matches')
  const matches = (data.matches || []).map(normalizeMatch)

  // 球队表（补全实力/旗帜/中文名/大洲）+ 小组归属（取自比赛）。
  const teamMap = {}
  data.matches.forEach((m) => {
    ;[m.homeTeam, m.awayTeam].forEach((t) => {
      if (t?.tla && !teamMap[t.tla]) teamMap[t.tla] = enrich(t.tla, t.name)
    })
  })
  matches.forEach((m) => {
    if (m.group && teamMap[m.home]) teamMap[m.home].group = m.group
    if (m.group && teamMap[m.away]) teamMap[m.away].group = m.group
  })

  // 赔率：两队对阵确定即按实力算（含 had/hhad/ttg/crs）。
  matches.forEach((m) => {
    if (m.home && m.away && teamMap[m.home] && teamMap[m.away]) {
      m.odds = computeOdds(teamMap[m.home], teamMap[m.away])
    }
  })
  assignMatchNum(matches)

  const payload = {
    meta: { title: '2026 FIFA 世界杯', source: 'football-data.org', fetchedAt: new Date().toISOString() },
    teams: Object.values(teamMap),
    matches
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2))
  const enriched = Object.values(teamMap).filter((t) => t.rating !== DEFAULT.rating).length
  console.log(`✓ 已写入 ${matches.length} 场比赛 → public/live.json`)
  console.log(`  球队 ${Object.keys(teamMap).length} 支（实力表命中 ${enriched} 支，其余用默认值），已生成赔率。`)
}

main().catch((e) => {
  console.error('✗ 抓取失败：', e.message)
  console.error('  前端仍可用示例数据正常运行。')
  process.exit(1)
})
