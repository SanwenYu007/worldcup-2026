import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TEAMS, MATCHES, GROUPS, META, NOW, teamOf } from '../data/worldcup'
import { i18n } from '../i18n'

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
  const lastUpdated = ref(null) // 最近一次成功拉取真实数据的时间
  const predictions = ref(null) // AI 预测（来自 public/predictions.json）

  // 阶段键规范化：football-data 的 LAST_32/QUARTER_FINALS 等 → 前端统一的 r32/qf 等
  const STAGE_KEY = { last32: 'r32', last16: 'r16', quarterfinals: 'qf', semifinals: 'sf', thirdplace: 'third' }
  function normalizeStages(list) {
    list.forEach((m) => { if (STAGE_KEY[m.stage]) m.stage = STAGE_KEY[m.stage] })
    return list
  }

  async function tryLoadLive() {
    loading.value = true
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}live.json`, { cache: 'no-cache' })
      if (!res.ok) throw new Error('no live data')
      const data = await res.json()
      if (data?.matches?.length) {
        teams.value = data.teams || TEAMS
        matches.value = normalizeStages(data.matches)
        // 合并默认 meta：live.json 只含 title/source，host/队数/场次仍用默认值兜底
        meta.value = { ...META, ...data.meta }
        // 从真实球队的小组归属重建 groups（供积分榜用），否则积分榜仍是示例队伍
        const g = {}
        teams.value.forEach((t) => { if (t.group) (g[t.group] ||= []).push(t) })
        if (Object.keys(g).length) groups.value = g
        source.value = 'live'
        lastUpdated.value = new Date()
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

  // 比赛日实时自动刷新：只重拉 live.json + 赔率 + AI 预测（不重拉 375KB 的 teams.json）。
  // 有进行中的比赛时 60s 一次，否则 5 分钟一次；页面隐藏时跳过。
  let refreshTimer = null
  async function refreshLive() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}live.json`, { cache: 'no-cache' })
      if (!res.ok) return
      const data = await res.json()
      if (!data?.matches?.length) return
      // 原地更新比分/状态，保留已合并的真实赔率结构由 overlay 重新覆盖
      matches.value = normalizeStages(data.matches)
      teams.value = data.teams || teams.value
      source.value = 'live'
      lastUpdated.value = new Date()
      await tryOverlayOdds()
      await tryLoadPredictions()
    } catch { /* 忽略单次刷新失败 */ }
  }
  function scheduleRefresh() {
    clearTimeout(refreshTimer)
    const delay = liveMatches.value.length ? 60000 : 300000
    refreshTimer = setTimeout(async () => {
      if (typeof document === 'undefined' || !document.hidden) await refreshLive()
      scheduleRefresh()
    }, delay)
  }
  function startAutoRefresh() { if (!refreshTimer) scheduleRefresh() }
  function stopAutoRefresh() { clearTimeout(refreshTimer); refreshTimer = null }

  const finishedMatches = computed(() => matches.value.filter((m) => m.status === 'finished'))
  const liveMatches = computed(() => matches.value.filter((m) => m.status === 'live'))
  const groupMatches = computed(() => matches.value.filter((m) => m.stage === 'group'))
  const knockoutMatches = computed(() => matches.value.filter((m) => m.stage !== 'group'))

  function getTeam(code) {
    return teams.value.find((t) => t.id === code) || teamOf(code)
  }

  // 按当前语言返回队名：live 数据只有中文名，英文名取自 teams.json 的 name 字段。
  const enNames = computed(() => {
    const m = {}
    ;(teamsFull.value?.teams || []).forEach((t) => { if (t.code) m[t.code] = t.name })
    return m
  })
  function dispName(code) {
    if (!code) return ''
    const tm = getTeam(code)
    if (!tm) return code
    return i18n.global.locale.value === 'en' ? (enNames.value[code] || tm.name) : tm.name
  }
  // 体彩盘口只有中文队名：中文名 → code → 英文名（映射不到则原样返回）
  const cnToCode = computed(() => {
    const m = {}
    ;(teamsFull.value?.teams || []).forEach((t) => { if (t.cnName) m[t.cnName.replace(/\s+/g, '')] = t.code })
    return m
  })
  function dispNameCn(cn) {
    if (!cn || i18n.global.locale.value !== 'en') return cn || ''
    const code = cnToCode.value[cn.replace(/\s+/g, '')]
    return (code && enNames.value[code]) || cn
  }

  return {
    teams, matches, groups, meta, now, source, loading, oddsSource, oddsFeed,
    predictions, teamsFull, lineups, lastUpdated, finishedMatches, liveMatches, groupMatches, knockoutMatches,
    getTeam, dispName, dispNameCn, tryLoadLive, getPrediction, getLineup, shouldShowOdds,
    refreshLive, startAutoRefresh, stopAutoRefresh
  }
})
