// 2026 FIFA 世界杯 数据种子（示例 / 兜底数据）。
// 真实 API 数据由 scripts/fetch-data.js 抓取后写入 public/live.json，
// store 会在运行时优先用 live.json，拿不到时回退到这里——保证演示永不白屏。
//
// 所有比分由确定性伪随机生成（按 fixtureId 播种），刷新页面结果稳定。

// 赛事「现在」时间——与今天对齐，使部分小组赛已结束、部分进行中、其余待开赛。
export const NOW = new Date('2026-06-14T18:00:00Z')

// 12 个小组 × 4 队 = 48 队。rating 近似 FIFA 积分，用于实力分布与比分模型。
// conf: 大洲；seed: 分档（1 最强）。
const T = (name, code, flag, conf, rating, seed) => ({ name, code, flag, conf, rating, seed })

export const GROUPS = {
  A: [T('墨西哥', 'MEX', '🇲🇽', 'CONCACAF', 1830, 2), T('波兰', 'POL', '🇵🇱', 'UEFA', 1560, 3), T('挪威', 'NOR', '🇳🇴', 'UEFA', 1700, 2), T('沙特', 'KSA', '🇸🇦', 'AFC', 1470, 4)],
  B: [T('加拿大', 'CAN', '🇨🇦', 'CONCACAF', 1740, 2), T('克罗地亚', 'CRO', '🇭🇷', 'UEFA', 1900, 1), T('喀麦隆', 'CMR', '🇨🇲', 'CAF', 1490, 4), T('厄瓜多尔', 'ECU', '🇪🇨', 'CONMEBOL', 1640, 3)],
  C: [T('美国', 'USA', '🇺🇸', 'CONCACAF', 1790, 2), T('荷兰', 'NED', '🇳🇱', 'UEFA', 2020, 1), T('日本', 'JPN', '🇯🇵', 'AFC', 1830, 2), T('加纳', 'GHA', '🇬🇭', 'CAF', 1470, 4)],
  D: [T('阿根廷', 'ARG', '🇦🇷', 'CONMEBOL', 2110, 1), T('塞内加尔', 'SEN', '🇸🇳', 'CAF', 1700, 2), T('韩国', 'KOR', '🇰🇷', 'AFC', 1620, 3), T('波黑', 'BIH', '🇧🇦', 'UEFA', 1530, 4)],
  E: [T('法国', 'FRA', '🇫🇷', 'UEFA', 2080, 1), T('澳大利亚', 'AUS', '🇦🇺', 'AFC', 1560, 3), T('哥斯达黎加', 'CRC', '🇨🇷', 'CONCACAF', 1490, 4), T('丹麦', 'DEN', '🇩🇰', 'UEFA', 1740, 2)],
  F: [T('巴西', 'BRA', '🇧🇷', 'CONMEBOL', 2090, 1), T('瑞士', 'SUI', '🇨🇭', 'UEFA', 1720, 2), T('尼日利亚', 'NGA', '🇳🇬', 'CAF', 1620, 3), T('伊朗', 'IRN', '🇮🇷', 'AFC', 1560, 4)],
  G: [T('西班牙', 'ESP', '🇪🇸', 'UEFA', 2050, 1), T('乌拉圭', 'URU', '🇺🇾', 'CONMEBOL', 1820, 2), T('埃及', 'EGY', '🇪🇬', 'CAF', 1520, 3), T('卡塔尔', 'QAT', '🇶🇦', 'AFC', 1450, 4)],
  H: [T('英格兰', 'ENG', '🏴', 'UEFA', 2030, 1), T('美墨加附加', 'PAN', '🇵🇦', 'CONCACAF', 1450, 4), T('摩洛哥', 'MAR', '🇲🇦', 'CAF', 1740, 2), T('哥伦比亚', 'COL', '🇨🇴', 'CONMEBOL', 1700, 3)],
  I: [T('葡萄牙', 'POR', '🇵🇹', 'UEFA', 2010, 1), T('土耳其', 'TUR', '🇹🇷', 'UEFA', 1620, 3), T('突尼斯', 'TUN', '🇹🇳', 'CAF', 1490, 4), T('巴拉圭', 'PAR', '🇵🇾', 'CONMEBOL', 1560, 2)],
  J: [T('比利时', 'BEL', '🇧🇪', 'UEFA', 1950, 1), T('科特迪瓦', 'CIV', '🇨🇮', 'CAF', 1540, 3), T('新西兰', 'NZL', '🇳🇿', 'OFC', 1380, 4), T('秘鲁', 'PER', '🇵🇪', 'CONMEBOL', 1600, 2)],
  K: [T('德国', 'GER', '🇩🇪', 'UEFA', 1990, 1), T('奥地利', 'AUT', '🇦🇹', 'UEFA', 1660, 2), T('阿尔及利亚', 'ALG', '🇩🇿', 'CAF', 1530, 3), T('约旦', 'JOR', '🇯🇴', 'AFC', 1390, 4)],
  L: [T('意大利', 'ITA', '🇮🇹', 'UEFA', 1940, 1), T('塞尔维亚', 'SRB', '🇷🇸', 'UEFA', 1620, 3), T('南非', 'RSA', '🇿🇦', 'CAF', 1470, 4), T('智利', 'CHI', '🇨🇱', 'CONMEBOL', 1640, 2)]
}

// 扁平化所有球队，附带组别。
export const TEAMS = Object.entries(GROUPS).flatMap(([g, teams]) =>
  teams.map((t) => ({ ...t, group: g, id: t.code }))
)

const teamByCode = Object.fromEntries(TEAMS.map((t) => [t.code, t]))

// ---- 确定性伪随机 ----
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashId(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 根据两队 rating 用泊松近似生成一场比赛的进球数与时间。
function simulate(fixtureId, home, away) {
  const rnd = mulberry32(hashId(fixtureId))
  const diff = (home.rating - away.rating) / 400
  const homeXg = Math.max(0.3, 1.45 + diff * 0.8 + 0.25) // 含主场/先手微弱加成
  const awayXg = Math.max(0.3, 1.35 - diff * 0.8)
  const poisson = (lambda) => {
    const L = Math.exp(-lambda)
    let k = 0
    let p = 1
    do {
      k++
      p *= rnd()
    } while (p > L)
    return Math.min(k - 1, 6)
  }
  const hg = poisson(homeXg)
  const ag = poisson(awayXg)
  const events = []
  const addGoals = (code, n) => {
    for (let i = 0; i < n; i++) {
      events.push({ team: code, minute: 1 + Math.floor(rnd() * 90) })
    }
  }
  addGoals(home.code, hg)
  addGoals(away.code, ag)
  events.sort((a, b) => a.minute - b.minute)
  return { hg, ag, events }
}

// ---- 竞彩赔率引擎 ----
// 用泊松分布从两队实力值算出各结果概率，再按博彩返还率转成赔率。
// 玩法：胜平负(had)、让球胜平负(hhad)、总进球(ttg)、比分(crs)。
const PAYOUT = 0.9 // 返还率（赔率含约 11% 抽水，贴近竞彩实际）
const factorial = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f }
const pois = (lambda, k) => (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k)
// 概率 → 赔率，保留两位、最低 1.01
const toOdds = (p) => (p <= 0 ? 99.0 : Math.max(1.01, Math.round((PAYOUT / p) * 100) / 100))

export function computeOdds(home, away) {
  const diff = (home.rating - away.rating) / 400
  const homeXg = Math.max(0.25, 1.45 + diff * 0.8 + 0.25)
  const awayXg = Math.max(0.25, 1.35 - diff * 0.8)
  const MAX = 8
  const hp = Array.from({ length: MAX + 1 }, (_, k) => pois(homeXg, k))
  const ap = Array.from({ length: MAX + 1 }, (_, k) => pois(awayXg, k))

  // 让球数：按实力差决定（负数=主队让球）
  let line = 0
  if (diff > 1.0) line = -2
  else if (diff > 0.45) line = -1
  else if (diff < -1.0) line = 2
  else if (diff < -0.45) line = 1

  let pW = 0, pD = 0, pL = 0
  let hW = 0, hD = 0, hL = 0
  const ttg = new Array(8).fill(0) // 0..6, 索引7=7+
  const scores = []
  for (let i = 0; i <= MAX; i++) {
    for (let j = 0; j <= MAX; j++) {
      const p = hp[i] * ap[j]
      if (i > j) pW += p; else if (i === j) pD += p; else pL += p
      const eff = i + line
      if (eff > j) hW += p; else if (eff === j) hD += p; else hL += p
      ttg[Math.min(7, i + j)] += p
      scores.push({ s: `${i}:${j}`, p })
    }
  }
  return {
    had: { h: toOdds(pW), d: toOdds(pD), a: toOdds(pL) },
    hhad: { goalLine: line, h: toOdds(hW), d: toOdds(hD), a: toOdds(hL) },
    ttg: ttg.map((p, k) => ({ goals: k === 7 ? '7+' : String(k), odds: toOdds(p) })),
    crs: scores.sort((a, b) => b.p - a.p).slice(0, 8).map((x) => ({ score: x.s, odds: toOdds(x.p) }))
  }
}

// ---- 小组赛赛程 ----
// 4 队循环：(0-3,1-2) / (0-2,3-1) / (0-1,2-3)，对应 3 个比赛日。
const RR = [
  [[0, 3], [1, 2]],
  [[0, 2], [3, 1]],
  [[0, 1], [2, 3]]
]
// 比赛日日期窗口（UTC）。小组按字母错峰，制造「已赛/进行中/待赛」的混合状态。
const MD_DATES = ['2026-06-11', '2026-06-15', '2026-06-20']

function buildGroupStage() {
  const matches = []
  const groupKeys = Object.keys(GROUPS)
  groupKeys.forEach((g, gi) => {
    const teams = GROUPS[g]
    RR.forEach((pairings, md) => {
      pairings.forEach(([hi, ai], slot) => {
        const home = teams[hi]
        const away = teams[ai]
        const fixtureId = `GS-${g}-${md}-${slot}`
        // 在该比赛日窗口内按小组错开 0~4 天
        const base = new Date(MD_DATES[md] + 'T00:00:00Z')
        const dayOffset = (gi + slot) % 5
        const hour = 13 + ((gi + slot) % 4) * 3
        const date = new Date(base.getTime() + dayOffset * 86400000 + hour * 3600000)
        const m = {
          id: fixtureId,
          stage: 'group',
          group: g,
          matchday: md + 1,
          date: date.toISOString(),
          home: home.code,
          away: away.code,
          venue: VENUES[(gi + md + slot) % VENUES.length],
          odds: computeOdds(home, away)
        }
        if (date < NOW) {
          const { hg, ag, events } = simulate(fixtureId, home, away)
          Object.assign(m, { status: 'finished', homeGoals: hg, awayGoals: ag, events })
        } else if (date.getTime() - NOW.getTime() < 2 * 3600000 && date < new Date(NOW.getTime() + 2 * 3600000)) {
          // 接近现在的比赛标记为进行中
          const { hg, ag, events } = simulate(fixtureId, home, away)
          const liveMin = 60
          Object.assign(m, {
            status: 'live',
            minute: liveMin,
            homeGoals: events.filter((e) => e.team === home.code && e.minute <= liveMin).length,
            awayGoals: events.filter((e) => e.team === away.code && e.minute <= liveMin).length,
            events: events.filter((e) => e.minute <= liveMin)
          })
        } else {
          Object.assign(m, { status: 'scheduled', homeGoals: null, awayGoals: null, events: [] })
        }
        matches.push(m)
      })
    })
  })
  return matches
}

export const VENUES = [
  '纽约/新泽西', '洛杉矶', '达拉斯', '亚特兰大', '迈阿密', '西雅图',
  '旧金山湾区', '费城', '休斯顿', '堪萨斯城', '波士顿',
  '墨西哥城', '瓜达拉哈拉', '蒙特雷', '多伦多', '温哥华'
]

// ---- 淘汰赛对阵树（占位：32 强起）----
// 小组赛未全部结束，淘汰赛对阵用占位名，演示 bracket 结构。
const KO_ROUNDS = [
  { key: 'r32', name: '32 强', count: 16, date: '2026-06-28' },
  { key: 'r16', name: '16 强', count: 8, date: '2026-07-04' },
  { key: 'qf', name: '1/4 决赛', count: 4, date: '2026-07-09' },
  { key: 'sf', name: '半决赛', count: 2, date: '2026-07-14' },
  { key: 'third', name: '三四名', count: 1, date: '2026-07-18' },
  { key: 'final', name: '决赛', count: 1, date: '2026-07-19' }
]

function buildKnockout() {
  const matches = []
  KO_ROUNDS.forEach((r) => {
    for (let i = 0; i < r.count; i++) {
      matches.push({
        id: `${r.key}-${i + 1}`,
        stage: r.key,
        stageName: r.name,
        slot: i + 1,
        date: new Date(r.date + 'T19:00:00Z').toISOString(),
        home: null,
        away: null,
        homeLabel: r.key === 'r32' ? `${'ABCDEFGHIJKL'[i % 12]} 组名次` : '胜者',
        awayLabel: r.key === 'r32' ? `${'ABCDEFGHIJKL'[(i + 6) % 12]} 组名次` : '胜者',
        status: 'scheduled',
        homeGoals: null,
        awayGoals: null
      })
    }
  })
  return matches
}

// 生成竞彩式「场次编号」：按开赛日期分组，周X + 当日序号（如 周六001）。
function assignMatchNum(matches) {
  const sorted = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date))
  const dayCount = {}
  const WD = '日一二三四五六'
  sorted.forEach((m) => {
    const d = new Date(m.date)
    const key = d.toISOString().slice(0, 10)
    dayCount[key] = (dayCount[key] || 0) + 1
    m.matchNum = `周${WD[d.getUTCDay()]}${String(dayCount[key]).padStart(3, '0')}`
  })
  return sorted
}

export const MATCHES = assignMatchNum([...buildGroupStage(), ...buildKnockout()])

export function teamOf(code) {
  return teamByCode[code] || null
}

export const META = {
  title: '2026 FIFA 世界杯',
  host: '美国 · 加拿大 · 墨西哥',
  teamCount: 48,
  groupCount: 12,
  totalMatches: 104,
  start: '2026-06-11',
  end: '2026-07-19'
}
