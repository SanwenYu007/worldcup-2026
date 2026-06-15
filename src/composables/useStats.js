// 纯函数聚合层：从 matches/teams 计算积分榜、射手榜、进球分布等。
// 不依赖 Vue 响应式，便于复用与测试。

// 计算某小组的积分榜。
export function groupStandings(groupCode, groupTeams, matches) {
  const table = Object.fromEntries(
    groupTeams.map((t) => [t.code, {
      team: t, played: 0, win: 0, draw: 0, loss: 0,
      gf: 0, ga: 0, gd: 0, points: 0
    }])
  )
  matches
    .filter((m) => m.stage === 'group' && m.group === groupCode && (m.status === 'finished' || m.status === 'live'))
    .forEach((m) => {
      const h = table[m.home]
      const a = table[m.away]
      if (!h || !a || m.homeGoals == null) return
      h.played++; a.played++
      h.gf += m.homeGoals; h.ga += m.awayGoals
      a.gf += m.awayGoals; a.ga += m.homeGoals
      if (m.homeGoals > m.awayGoals) { h.win++; a.loss++; h.points += 3 }
      else if (m.homeGoals < m.awayGoals) { a.win++; h.loss++; a.points += 3 }
      else { h.draw++; a.draw++; h.points++; a.points++ }
    })
  return Object.values(table)
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name))
}

// 球队进球榜（按球队累计进球数）。
// 直接用比分统计，不依赖进球事件——真实 API（无 events）与示例数据都适用。
export function topScorers(matches, getTeam, limit = 12) {
  const goals = {}
  matches.forEach((m) => {
    if (m.homeGoals == null) return
    goals[m.home] = (goals[m.home] || 0) + m.homeGoals
    goals[m.away] = (goals[m.away] || 0) + m.awayGoals
  })
  return Object.entries(goals)
    .map(([code, g]) => ({ team: getTeam(code), goals: g }))
    .filter((r) => r.team && r.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit)
}

// 进球/失球（每队），用于柱状图。
export function teamGoalStats(matches, teams) {
  const stat = Object.fromEntries(teams.map((t) => [t.code, { team: t, gf: 0, ga: 0 }]))
  matches.forEach((m) => {
    if (m.homeGoals == null) return
    if (stat[m.home]) { stat[m.home].gf += m.homeGoals; stat[m.home].ga += m.awayGoals }
    if (stat[m.away]) { stat[m.away].gf += m.awayGoals; stat[m.away].ga += m.homeGoals }
  })
  return Object.values(stat)
}

// 进球时段分布（0-90 分钟，按 15 分钟一档）——用于热力图/柱状。
export function goalTimeline(matches) {
  const buckets = [0, 0, 0, 0, 0, 0] // 0-15,16-30,...,76-90+
  matches.forEach((m) => {
    ;(m.events || []).forEach((e) => {
      const idx = Math.min(5, Math.floor((e.minute - 1) / 15))
      buckets[idx]++
    })
  })
  return buckets
}

// 关键数字看板。
export function keyNumbers(matches) {
  const played = matches.filter((m) => m.status === 'finished')
  const totalGoals = played.reduce((s, m) => s + (m.homeGoals || 0) + (m.awayGoals || 0), 0)
  const draws = played.filter((m) => m.homeGoals === m.awayGoals).length
  const biggest = [...played].sort(
    (a, b) => Math.abs(b.homeGoals - b.awayGoals) - Math.abs(a.homeGoals - a.awayGoals)
  )[0]
  return {
    playedCount: played.length,
    totalGoals,
    avgGoals: played.length ? (totalGoals / played.length).toFixed(2) : '0.00',
    draws,
    biggest
  }
}

// 小组「死亡之组」难度：组内平均 rating 越高越难。
export function groupStrength(groups) {
  return Object.entries(groups).map(([g, teams]) => {
    const avg = teams.reduce((s, t) => s + t.rating, 0) / teams.length
    const top = Math.max(...teams.map((t) => t.rating))
    return { group: g, avgRating: Math.round(avg), topRating: top, teams }
  }).sort((a, b) => b.avgRating - a.avgRating)
}
