// 从中国体彩竞彩足球接口抓取真实「胜平负 / 让球胜平负」赔率，写入 public/odds.json。
// 前端运行时按队名把真实赔率覆盖到对应比赛上（拿不到则用模型生成的赔率）。
//
// 用法：node scripts/fetch-odds.js
// 数据来源页：https://m.sporttery.cn/mjc/jsq/zqhhgg/
// 注意：竞彩只售当前开售场次，世界杯比赛未必全部在售——命中的覆盖，未命中的用模型赔率兜底。

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=hhad,had,ttg,crs,hafu&channel=c'
const OUT = fileURLToPath(new URL('../public/odds.json', import.meta.url))

// 体彩接口按 Referer / UA 过滤，需带上浏览器头。
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  Referer: 'https://m.sporttery.cn/',
  Accept: 'application/json'
}

// 递归在任意层级里找出「带 had/hhad 且有主客队名」的比赛对象，避免依赖精确嵌套结构。
function collectMatches(node, out) {
  if (!node || typeof node !== 'object') return
  const homeName = node.homeTeamAllName || node.homeTeamAbbName
  const awayName = node.awayTeamAllName || node.awayTeamAbbName
  // 仅当三项赔率都是有效数字时才采用该玩法（竞彩部分场次只售让球，胜平负为空）
  const triple = (o) => {
    if (!o) return null
    const h = +o.h, d = +o.d, a = +o.a
    return [h, d, a].every(Number.isFinite) ? { h, d, a } : null
  }
  // 总进球（s0..s7 → 0..7+）
  const parseTtg = (o) => {
    if (!o) return null
    const out = []
    for (let i = 0; i <= 7; i++) {
      const v = +o['s' + i]
      if (Number.isFinite(v) && v > 0) out.push({ goals: i === 7 ? '7+' : String(i), odds: v })
    }
    return out.length ? out : null
  }
  // 比分（sHHsAA → H:A，含 胜/平/负 其他）
  const parseCrs = (o) => {
    if (!o) return null
    const out = []
    for (const [k, val] of Object.entries(o)) {
      const mm = k.match(/^s(\d\d)s(\d\d)$/)
      const v = +val
      if (mm && Number.isFinite(v) && v > 0) out.push({ score: `${+mm[1]}:${+mm[2]}`, odds: v })
    }
    const other = { s1sh: '胜其他', s1sd: '平其他', s1sa: '负其他' }
    for (const [k, lbl] of Object.entries(other)) {
      const v = +o[k]
      if (Number.isFinite(v) && v > 0) out.push({ score: lbl, odds: v })
    }
    out.sort((a, b) => a.odds - b.odds)
    return out.length ? out : null
  }
  // 半全场（半场/全场：h胜 d平 a负）
  const HAFU = { hh: '胜/胜', hd: '胜/平', ha: '胜/负', dh: '平/胜', dd: '平/平', da: '平/负', ah: '负/胜', ad: '负/平', aa: '负/负' }
  const parseHafu = (o) => {
    if (!o) return null
    const out = []
    for (const [k, lbl] of Object.entries(HAFU)) {
      const v = +o[k]
      if (Number.isFinite(v) && v > 0) out.push({ combo: lbl, odds: v })
    }
    return out.length ? out : null
  }
  if (homeName && awayName && (node.had || node.hhad)) {
    const had = triple(node.had)
    const hhad = triple(node.hhad)
    if (had || hhad) {
      // 组合可排序的开赛时间（北京时间，原样保留不做时区转换）
      const matchTime = (node.matchTime || '').slice(0, 5)
      const dateTime = node.matchDate ? `${node.matchDate}T${node.matchTime || '00:00:00'}` : null
      out.push({
        matchNum: node.matchNumStr || node.matchNum || null,
        league: node.leagueAbbName || node.leagueAllName || '',
        homeName, awayName,
        homeRank: node.homeRank || '', awayRank: node.awayRank || '',
        matchDate: node.matchDate || '', matchTime, dateTime,
        had,
        hhad: hhad ? { ...hhad, goalLine: +(node.hhad.goalLine ?? 0) || 0 } : null,
        ttg: parseTtg(node.ttg),
        crs: parseCrs(node.crs),
        hafu: parseHafu(node.hafu)
      })
    }
  }
  for (const v of Object.values(node)) {
    if (Array.isArray(v)) v.forEach((x) => collectMatches(x, out))
    else if (v && typeof v === 'object') collectMatches(v, out)
  }
}

async function main() {
  console.log('→ 拉取竞彩足球赔率…')
  const res = await fetch(API, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}（接口可能限区域/限频，建议在中国大陆网络运行）`)
  const json = await res.json()

  const matches = []
  collectMatches(json.value ?? json, matches)
  if (!matches.length) throw new Error('未解析到比赛赔率（接口结构可能调整）')

  // 按开赛时间排序
  matches.sort((a, b) => (a.dateTime || '').localeCompare(b.dateTime || ''))

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'sporttery.cn', matches }, null, 2))
  console.log(`✓ 已写入 ${matches.length} 场真实赔率 → public/odds.json`)
}

main().catch((e) => {
  console.error('✗ 赔率抓取失败：', e.message)
  console.error('  前端将继续使用模型生成的赔率（不影响演示）。')
  process.exit(1)
})
