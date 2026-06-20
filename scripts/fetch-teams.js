// 抓取 2026 世界杯各队资料与大名单，写入 public/teams.json。
// 数据源：football-data.org（提供球队徽标 crest、26人名单、主帅、主场、成立年份等真实字段）。
// 球员照片(photo)字段预留：football-data 不含球员照片，后续可由 scripts/fetch-photos.js（API-Football）填充。
//
// 用法：FOOTBALL_DATA_TOKEN=xxx node scripts/fetch-teams.js

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TEAMS } from '../src/data/worldcup.js'

const TOKEN = process.env.FOOTBALL_DATA_TOKEN
const BASE = 'https://api.football-data.org/v4'
const OUT = fileURLToPath(new URL('../public/teams.json', import.meta.url))
const LIVE = fileURLToPath(new URL('../public/live.json', import.meta.url))

// 中文名补全：示例表(按 TLA) + 真实出线队补充
const CN = { ...Object.fromEntries(TEAMS.map((t) => [t.code, t.name])) }
Object.assign(CN, {
  URY: '乌拉圭', SWE: '瑞典', SCO: '苏格兰', CZE: '捷克', COD: '刚果(金)',
  CPV: '佛得角', IRQ: '伊拉克', UZB: '乌兹别克斯坦', HAI: '海地', CUW: '库拉索'
})

// 位置归类（football-data 位置字符串 → 中文大类）
function posCategory(p) {
  const s = (p || '').toLowerCase()
  if (s.includes('keeper') || s === 'goalkeeper') return { key: 'GK', label: '门将', order: 0 }
  if (s.includes('back') || s.includes('defen')) return { key: 'DEF', label: '后卫', order: 1 }
  if (s.includes('midfield')) return { key: 'MID', label: '中场', order: 2 }
  if (s.includes('forward') || s.includes('offen') || s.includes('winger') || s.includes('striker')) return { key: 'FWD', label: '前锋', order: 3 }
  return { key: 'OTH', label: '球员', order: 4 }
}
const age = (dob) => {
  if (!dob) return null
  const d = new Date(dob)
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000))
}

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'X-Auth-Token': TOKEN } })
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  return res.json()
}

async function main() {
  if (!TOKEN) { console.error('✗ 缺少 FOOTBALL_DATA_TOKEN'); process.exit(1) }

  // 小组归属：优先用 live.json 的真实分组
  const groupByCode = {}
  try {
    const live = JSON.parse(await readFile(LIVE, 'utf8'))
    ;(live.matches || []).forEach((m) => {
      if (m.group && m.home) groupByCode[m.home] = m.group
      if (m.group && m.away) groupByCode[m.away] = m.group
    })
  } catch { /* 无 live.json 则不带分组 */ }

  // 读取旧 teams.json，保留已生成的球员简介(bio)/照片(photo)，避免每次重写后被 enrich-players 重复调用。
  const prevBio = new Map() // key: `${code}::${name}` → { bio, photo }
  try {
    const prev = JSON.parse(await readFile(OUT, 'utf8'))
    ;(prev.teams || []).forEach((tm) => {
      ;(tm.squad || []).forEach((p) => {
        if (p.bio || p.photo) prevBio.set(`${tm.code}::${p.name}`, { bio: p.bio, photo: p.photo })
      })
    })
  } catch { /* 无旧文件则跳过 */ }

  console.log('→ 拉取 2026 世界杯参赛队与名单…')
  const data = await api('/competitions/WC/teams')
  const teams = (data.teams || []).map((t) => {
    const code = t.tla
    const squad = (t.squad || []).map((p) => {
      const c = posCategory(p.position)
      const kept = prevBio.get(`${code}::${p.name}`)
      return {
        name: p.name,
        position: p.position || '',
        posKey: c.key, posLabel: c.label, posOrder: c.order,
        age: age(p.dateOfBirth),
        dob: p.dateOfBirth || null,
        nationality: p.nationality || '',
        photo: kept?.photo || null, // 预留：后续由照片 API 填充
        ...(kept?.bio ? { bio: kept.bio } : {}) // 保留已生成的 AI 简介
      }
    }).sort((a, b) => a.posOrder - b.posOrder)
    return {
      code,
      name: t.name,
      cnName: CN[code] || t.name,
      group: groupByCode[code] || null,
      crest: t.crest || null,
      country: t.area?.name || '',
      founded: t.founded || null,
      clubColors: t.clubColors || '',
      venue: t.venue || '',
      coach: t.coach?.name || '',
      squad
    }
  }).sort((a, b) => (a.group || 'Z').localeCompare(b.group || 'Z') || a.cnName.localeCompare(b.cnName))

  const payload = {
    source: 'football-data.org',
    fetchedAt: new Date().toISOString(),
    teamCount: teams.length,
    teams
  }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2))
  const players = teams.reduce((s, t) => s + t.squad.length, 0)
  console.log(`✓ 已写入 ${teams.length} 队 / ${players} 名球员 → public/teams.json`)
}

main().catch((e) => { console.error('✗ 抓取球队资料失败：', e.message); process.exit(1) })
