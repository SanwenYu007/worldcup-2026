import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TEAMS, MATCHES, GROUPS, META, NOW, teamOf } from '../data/worldcup'

// 数据 store：默认用种子数据（src/data/worldcup.js）。
// 若部署时 scripts/fetch-data.js 已生成 public/live.json，则运行时优先采用真实数据。
export const useDataStore = defineStore('data', () => {
  const teams = ref(TEAMS)
  const matches = ref(MATCHES)
  const groups = ref(GROUPS)
  const meta = ref(META)
  const now = ref(NOW)
  const source = ref('sample') // 'sample' | 'live'
  const loading = ref(false)
  const predictions = ref(null) // AI 预测（来自 public/predictions.json）

  async function tryLoadLive() {
    loading.value = true
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}live.json`, { cache: 'no-cache' })
      if (!res.ok) throw new Error('no live data')
      const data = await res.json()
      if (data?.matches?.length) {
        teams.value = data.teams || TEAMS
        matches.value = data.matches
        // 合并默认 meta：live.json 只含 title/source，host/队数/场次仍用默认值兜底
        meta.value = { ...META, ...data.meta }
        // 从真实球队的小组归属重建 groups（供积分榜用），否则积分榜仍是示例队伍
        const g = {}
        teams.value.forEach((t) => { if (t.group) (g[t.group] ||= []).push(t) })
        if (Object.keys(g).length) groups.value = g
        source.value = 'live'
      }
    } catch {
      // 兜底：保持示例数据，演示不白屏
      source.value = 'sample'
    } finally {
      loading.value = false
    }
    // 叠加真实赔率（来自 scripts/fetch-odds.js）
    await tryOverlayOdds()
    // 加载 AI 预测（来自 public/predictions.json）
    await tryLoadPredictions()
    // 加载球队资料与名单（来自 public/teams.json）
    await tryLoadTeams()
    // 加载首发阵容预测（来自 public/lineups.json）
    await tryLoadLineups()
  }

  // 加载首发阵容预测。
  const lineups = ref(null)
  async function tryLoadLineups() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}lineups.json`, { cache: 'no-cache' })
      if (res.ok) lineups.value = await res.json()
    } catch {
      lineups.value = null
    }
  }
  // 按 matchId 或队名匹配首发阵容。
  const lineupMap = computed(() => {
    const map = new Map()
    if (!lineups.value?.lineups) return map
    const norm = (s) => (s || '').replace(/\s/g, '')
    lineups.value.lineups.forEach((l) => {
      if (l.matchId) map.set(`id:${l.matchId}`, l)
      map.set(`nm:${norm(l.homeName)}__${norm(l.awayName)}`, l)
    })
    return map
  })
  function getLineup(match) {
    const map = lineupMap.value
    if (map.has(`id:${match.id}`)) return map.get(`id:${match.id}`)
    const norm = (s) => (s || '').replace(/\s/g, '')
    return map.get(`nm:${norm(getTeam(match.home)?.name)}__${norm(getTeam(match.away)?.name)}`) || null
  }

  // 加载球队资料 + 大名单。
  const teamsFull = ref(null)
  async function tryLoadTeams() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}teams.json`, { cache: 'no-cache' })
      if (res.ok) teamsFull.value = await res.json()
    } catch {
      teamsFull.value = null
    }
  }

  // 加载每日 AI 预测。
  async function tryLoadPredictions() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}predictions.json`, { cache: 'no-cache' })
      if (!res.ok) return
      predictions.value = await res.json()
    } catch {
      predictions.value = null
    }
  }

  // 按 matchId 或队名匹配预测。
  const predictionMap = computed(() => {
    const map = new Map()
    if (!predictions.value?.predictions) return map
    const norm = (s) => (s || '').replace(/\s/g, '')
    predictions.value.predictions.forEach((p) => {
      if (p.matchId) map.set(`id:${p.matchId}`, p)
      map.set(`nm:${norm(p.homeName)}__${norm(p.awayName)}`, p)
    })
    return map
  })

  function getPrediction(match) {
    const map = predictionMap.value
    if (map.has(`id:${match.id}`)) return map.get(`id:${match.id}`)
    const norm = (s) => (s || '').replace(/\s/g, '')
    return map.get(`nm:${norm(getTeam(match.home)?.name)}__${norm(getTeam(match.away)?.name)}`) || null
  }

  // 赔率展示窗口（需求1）：未开赛的比赛显示赔率；结束后 1 天内继续显示；超过 1 天不再显示。
  const ODDS_KEEP_MS = 24 * 3600 * 1000 // 完赛后保留 1 天
  const MATCH_DURATION_MS = 2 * 3600 * 1000 // 约一场比赛时长
  function shouldShowOdds(match) {
    if (!match.odds) return false
    if (match.status === 'scheduled' || match.status === 'live') return true
    if (match.status === 'finished') {
      const ended = new Date(match.date).getTime() + MATCH_DURATION_MS
      return now.value.getTime() - ended < ODDS_KEEP_MS
    }
    return false
  }

  const oddsSource = ref('model') // 'model' | 'sporttery'
  const oddsFeed = ref(null) // 体彩竞彩原始赔率列表（用于「体彩实时赔率」页）

  // 用 public/odds.json 的真实赔率，按队名覆盖到对应比赛的 had/hhad 上。
  async function tryOverlayOdds() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}odds.json`, { cache: 'no-cache' })
      if (!res.ok) return
      const data = await res.json()
      if (!data?.matches?.length) return
      oddsFeed.value = data // 保存原始体彩赔率列表
      const norm = (s) => (s || '').replace(/\s/g, '')
      const map = new Map(data.matches.map((o) => [`${norm(o.homeName)}__${norm(o.awayName)}`, o]))
      let hit = 0
      matches.value.forEach((m) => {
        const h = norm(getTeam(m.home)?.name)
        const a = norm(getTeam(m.away)?.name)
        const real = map.get(`${h}__${a}`)
        if (real && m.odds) {
          const ok = (o) => o && Number.isFinite(o.h) && Number.isFinite(o.d) && Number.isFinite(o.a)
          if (ok(real.had)) m.odds.had = real.had
          if (ok(real.hhad)) m.odds.hhad = { ...m.odds.hhad, ...real.hhad }
          m.odds.real = true
          hit++
        }
      })
      if (hit) oddsSource.value = 'sporttery'
    } catch {
      // 无真实赔率：保持模型赔率
    }
  }

  const finishedMatches = computed(() => matches.value.filter((m) => m.status === 'finished'))
  const liveMatches = computed(() => matches.value.filter((m) => m.status === 'live'))
  const groupMatches = computed(() => matches.value.filter((m) => m.stage === 'group'))
  const knockoutMatches = computed(() => matches.value.filter((m) => m.stage !== 'group'))

  function getTeam(code) {
    return teams.value.find((t) => t.id === code) || teamOf(code)
  }

  return {
    teams, matches, groups, meta, now, source, loading, oddsSource, oddsFeed,
    predictions, teamsFull, lineups, finishedMatches, liveMatches, groupMatches, knockoutMatches,
    getTeam, tryLoadLive, getPrediction, getLineup, shouldShowOdds
  }
})
