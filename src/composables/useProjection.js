// 赛事推演引擎（纯函数，浏览器内运行，无需后端/AI）：
//  1) qualificationOutlook —— 枚举小组剩余比赛的所有结果，算每队进入前二的「出线场景占比」。
//  2) simulateTitle —— 蒙特卡洛模拟剩余小组赛 + 淘汰赛，估算各队夺冠/晋级概率。
// 概率模型基于球队实力值(rating)，用 Elo 式胜率公式；可解释、确定性可复现（除随机模拟外）。

const HOME_ADV = 35 // 名义主队的小幅主场加成（小组赛）

// 单场「胜/平/负」概率（基于实力值差）。
export function matchProbs(rH, rA, homeAdv = HOME_ADV) {
  const eH = 1 / (1 + Math.pow(10, (rA - (rH + homeAdv)) / 400)) // 主队期望得分 0..1
  const draw = Math.max(0.08, 0.30 - 0.42 * Math.abs(eH - 0.5)) // 越势均力敌平局越多
  const pH = eH * (1 - draw)
  const pA = (1 - eH) * (1 - draw)
  const s = pH + pA + draw
  return { h: pH / s, d: draw / s, a: pA / s, eH }
}

// 淘汰赛胜者（无平局，加时点球按实力值加权解决）。
function knockoutWinner(a, b, rnd) {
  const eA = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400))
  return rnd() < eA ? a : b
}

function rankTable(rows) {
  return [...rows].sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || (x.team.name || '').localeCompare(y.team.name || ''))
}

// 从已结束比赛建立小组初始积分表。
function baseTable(groupTeams, matches, group) {
  const t = Object.fromEntries(groupTeams.map((tm) => [tm.code, { team: tm, pts: 0, gd: 0, gf: 0 }]))
  matches.forEach((m) => {
    if (m.stage !== 'group' || m.group !== group) return
    if (!(m.status === 'finished' || m.status === 'live') || m.homeGoals == null) return
    const h = t[m.home]; const a = t[m.away]
    if (!h || !a) return
    h.gf += m.homeGoals; h.gd += m.homeGoals - m.awayGoals
    a.gf += m.awayGoals; a.gd += m.awayGoals - m.homeGoals
    if (m.homeGoals > m.awayGoals) h.pts += 3
    else if (m.homeGoals < m.awayGoals) a.pts += 3
    else { h.pts++; a.pts++ }
  })
  return t
}

const remainingOf = (matches, group) =>
  matches.filter((m) => m.stage === 'group' && m.group === group && !((m.status === 'finished' || m.status === 'live') && m.homeGoals != null))

// 出线形势：枚举本组剩余比赛的全部 W/D/L 组合（3^剩余场数，封顶 729），
// 统计每队在前二的场景比例。GD 用 ±1 代理保证可排序。
export function qualificationOutlook(groupTeams, matches, group) {
  const base = baseTable(groupTeams, matches, group)
  const rem = remainingOf(matches, group)
  const codes = groupTeams.map((t) => t.code)
  const count = Object.fromEntries(codes.map((c) => [c, 0]))

  const total = Math.pow(3, rem.length)
  if (rem.length > 8) { // 理论上不会发生（每组最多6场），保险
    const rows = rankTable(Object.values(base))
    return groupTeams.map((tm, i) => ({ team: tm, ...statRow(base[tm.code]), rem: 0, qualifyPct: i < 2 ? 100 : 0, status: i < 2 ? 'clinched' : 'eliminated' }))
  }

  for (let mask = 0; mask < total; mask++) {
    const t = {}
    codes.forEach((c) => { t[c] = { ...base[c] } })
    let x = mask
    for (const m of rem) {
      const r = x % 3; x = (x - r) / 3
      const h = t[m.home]; const a = t[m.away]
      if (!h || !a) continue
      if (r === 0) { h.pts += 3; h.gd += 1; a.gd -= 1; h.gf += 1 } // 主胜
      else if (r === 1) { h.pts++; a.pts++ } // 平
      else { a.pts += 3; a.gd += 1; h.gd -= 1; a.gf += 1 } // 客胜
    }
    const ranked = rankTable(Object.values(t))
    count[ranked[0].team.code]++
    count[ranked[1].team.code]++
  }

  const remCount = Object.fromEntries(codes.map((c) => [c, 0]))
  rem.forEach((m) => { remCount[m.home]++; remCount[m.away]++ })

  return groupTeams.map((tm) => {
    const pct = total ? Math.round((count[tm.code] / total) * 100) : 0
    return {
      team: tm, ...statRow(base[tm.code]), rem: remCount[tm.code] || 0,
      qualifyPct: pct,
      status: pct >= 100 ? 'clinched' : pct <= 0 ? 'eliminated' : 'alive'
    }
  }).sort((a, b) => b.qualifyPct - a.qualifyPct || b.pts - a.pts || b.gd - a.gd)
}

function statRow(r) {
  return { pts: r.pts, gd: r.gd, gf: r.gf }
}

// 蒙特卡洛：模拟剩余小组赛 + 淘汰赛，估算各队夺冠/进决赛/进四强概率。
// 2026 赛制：12 组各 4 队，每组前 2 + 成绩最好的 8 个第三名 = 32 队进淘汰赛。
export function simulateTitle(teams, groups, matches, N = 2000) {
  const groupKeys = Object.keys(groups)
  const champ = {}; const finalReach = {}; const semiReach = {}
  teams.forEach((t) => { champ[t.code] = 0; finalReach[t.code] = 0; semiReach[t.code] = 0 })
  const rnd = Math.random

  // 预计算各组初始积分表与剩余赛程（跨模拟不变），并缓存每场剩余比赛的胜平负概率。
  const pre = groupKeys.map((g) => {
    const base = baseTable(groups[g], matches, g)
    const rem = remainingOf(matches, g).map((m) => ({
      home: m.home, away: m.away,
      p: matchProbs(base[m.home]?.team.rating || 1550, base[m.away]?.team.rating || 1550)
    })).filter((m) => base[m.home] && base[m.away])
    return { base, rem }
  })

  for (let n = 0; n < N; n++) {
    const thirds = []
    const qualifiers = []
    for (const { base, rem } of pre) {
      const t = {}
      for (const c in base) t[c] = { team: base[c].team, pts: base[c].pts, gd: base[c].gd, gf: base[c].gf }
      for (const m of rem) {
        const h = t[m.home]; const a = t[m.away]
        const r = rnd()
        if (r < m.p.h) { h.pts += 3; h.gd += 1; a.gd -= 1; h.gf += 1 }
        else if (r < m.p.h + m.p.d) { h.pts++; a.pts++ }
        else { a.pts += 3; a.gd += 1; h.gd -= 1; a.gf += 1 }
      }
      const ranked = rankTable(Object.values(t))
      qualifiers.push(ranked[0].team, ranked[1].team)
      if (ranked[2]) thirds.push({ team: ranked[2].team, pts: ranked[2].pts, gd: ranked[2].gd, gf: ranked[2].gf })
    }
    // 8 个最佳第三名
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    thirds.slice(0, 8).forEach((x) => qualifiers.push(x.team))

    // 按实力值标准种子排布 32 强单败淘汰
    let bracket = [...qualifiers].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    const size = 32
    bracket = bracket.slice(0, size)
    while (bracket.length < size) bracket.push({ code: '_bye', rating: 0, name: '' })
    // 标准种子配对：1-32, 16-17 ... 形成对阵序列
    let round = seedOrder(size).map((i) => bracket[i - 1])

    while (round.length > 1) {
      const next = []
      for (let i = 0; i < round.length; i += 2) {
        next.push(knockoutWinner(round[i], round[i + 1], rnd))
      }
      if (round.length === 8) next.forEach((w) => { if (w.code) semiReach[w.code]++ }) // 八强胜者=四强
      if (round.length === 4) next.forEach((w) => { if (w.code) finalReach[w.code]++ }) // 四强胜者=决赛
      round = next
    }
    if (round[0] && round[0].code) champ[round[0].code]++
  }

  return teams.map((t) => ({
    team: t,
    title: champ[t.code] / N,
    final: finalReach[t.code] / N,
    semi: semiReach[t.code] / N
  })).sort((a, b) => b.title - a.title)
}

// 标准淘汰赛种子顺序（递归生成）：返回长度 size 的种子位次数组。
function seedOrder(size) {
  let rounds = [1, 2]
  while (rounds.length < size) {
    const n = rounds.length * 2
    const next = []
    rounds.forEach((s) => { next.push(s, n + 1 - s) })
    rounds = next
  }
  return rounds
}
