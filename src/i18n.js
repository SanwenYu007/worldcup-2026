import { createI18n } from 'vue-i18n'

// 中英双语词条。t('key') 取当前语言文案。
const messages = {
  zh: {
    nav: { overview: '总览', schedule: '赛程', teams: '球队', timeline: '时间表', odds: '实时赔率', predictions: 'AI预测', champion: '夺冠预测', strategy: '投注策略', stats: '数据', feedback: '意见' },
    common: {
      live: '实时数据', sample: '示例数据', realData: '真实数据', updatedAt: '更新于', source: '数据来源',
      win: '胜', draw: '平', loss: '负', vs: 'VS', finished: '完场', inplay: '进行中', upcoming: '未开赛',
      group: '组', all: '全部', today: '今日', search: '搜索', noResult: '没有符合条件的比赛',
      players: '人名单', back: '返回', confidence: '置信度', minutes: '分钟', goals: '进球', tbd: '待定'
    },
    result: { home: '主胜', draw: '平局', away: '客胜' },
    overview: {
      groupStage: '小组赛进行中', host: '美国 · 加拿大 · 墨西哥', teamsCount: '支球队', matchesCount: '场比赛',
      totalGoals: '总进球数', avgGoals: '场均进球', draws: '平局场次', biggestWin: '最大分差', played: '已赛',
      spotlight: '焦点比赛', allSchedule: '全部赛程 →', strengthDist: '球队实力分布', goalTiming: '进球时段分布', latest: '最新战报', detail: '详情 →',
      stages: { group: '小组赛', r32: '32 强', r16: '16 强', qf: '1/4', sf: '半决赛', final: '决赛' }
    },
    dataStatus: { schedule: '赛程比分', odds: '体彩赔率', predictions: 'AI 预测', sportteryLive: '体彩实时', modelOdds: '模型赔率' },
    schedule: { title: '完整赛程 · 胜平负赔率与积分榜', groupTab: '小组赛', knockoutTab: '淘汰赛', searchTeam: '搜索球队（跨小组）…', oddsTitle: '胜平负赔率', bracketTitle: '淘汰赛对阵树', sportteryOdds: '体彩实时赔率', modelOdds: '模型赔率', oddsClosed: '赛后赔率已截止', allGroups: '全部小组', allGroupsHint: '一览 12 个小组积分与得分（点小组查看赛程赔率）' },
    teamTip: { groupGames: '小组赛战绩', tbd: '待赛', record: '战绩' },
    standings: { rank: '#', team: '球队', played: '赛', win: '胜', draw: '平', loss: '负', gd: '净', pts: '分' },
    teams: {
      title: '参赛球队 · 阵容名单', lead: '48 支参赛队的徽标、26 人大名单与球员信息。点击球队查看详情。', updatedAt: '资料更新于',
      searchPlaceholder: '🔍 搜索球队 / 国家…', loading: '球队资料加载中或暂不可用。', backToAll: '← 返回全部球队', roster: '人名单',
      founded: '成立于', foundedYear: '年', venue: '主场', coach: '主帅', colors: '队服',
      pos: { GK: '门将', DEF: '后卫', MID: '中场', FWD: '前锋', OTH: '其他' },
      age: '岁', aiBio: 'AI 简介', lineupTitle: '本场首发（AI 预测）', starters: '首发', startersOf: '首发'
    },
    timeline: { title: '赛程时间表', all: '全部', upcoming: '未赛', finished: '已赛' },
    odds: { title: '体彩竞彩 · 实时赔率', lead: '数据来源 中国体育彩票（竞彩足球 胜平负 / 让球胜平负），按开赛时间排序。点击赔率加入下方足球计算器。', empty: '暂无体彩实时赔率。', moreplay: '更多玩法', score: '比分', totalGoals: '总进球数', halffull: '半全场', handicap: '让球', calc: '足球计算器', selected: '已选', odds: '赔率', stake: '投入', maxWin: '最高可中', multiplier: '倍数', clear: '清空', noOpen: '暂未开盘' },
    predictions: { title: 'AI 比分预测', leadPrefix: '由', leadSuffix: '综合两队实力值与近期战绩，预测未来 {n} 天比赛的比分与胜负；每条预测附判断依据与置信度。', verified: '已验证', outcomeHit: '胜负命中', scoreHit: '比分命中', miss: '未命中', pending: '待赛', predicted: '预测', actual: '实际', empty: '暂无预测数据。', reason: '依据' },
    stats: { strengthTitle: '球队实力分布', strengthLead: '气泡按大洲着色，纵轴为实力值（近似 FIFA 积分），横轴为小组。气泡越高、越大代表实力越强。', radarTitle: '小组实力雷达（死亡之组）', deathTitle: '最难小组 Top 3', avgStrength: '平均实力', goalBar: '得分榜（进球 / 失球）', goalTiming: '进球时段分布', scorers: '球队进球榜', noTiming: '实时数据源未提供进球时间，暂无时段分布' },
    feedback: { title: '意见反馈', count: '共 {n} 条', lead: '欢迎提交对本站的建议。提交内容会保存在你的浏览器并展示在下方；被采纳的意见会更新到「官方精选」，所有访客可见。', namePlaceholder: '昵称（选填）', contentPlaceholder: '写下你的意见或建议…（最多 500 字）', submit: '提交意见', submitted: '✓ 已提交，感谢反馈！', official: '官方精选', officialNote: '（所有人可见）', mine: '我提交的', mineNote: '（保存在本浏览器）', noOfficial: '暂无官方意见。', noMine: '你还没有提交意见。', delete: '删除', officialTag: '官方' },
    strategy: {
      title: 'AI 投注策略', lead: '根据实时赔率反推各结果的隐含概率，给出更容易命中的下注建议与稳健串关组合。',
      disclaimer: '⚠️ 以上由赔率计算得出，仅供娱乐参考，不构成投注建议，请理性对待。',
      singleTitle: '单场推荐（按隐含胜率排序）', recommend: '推荐', winProb: '隐含胜率', odd: '赔率',
      safeTitle: '稳健串关方案', combinedOdds: '综合赔率', hitRate: '全中概率', return1x: '1 倍投入回报', legs: '场', noData: '暂无可分析的实时赔率，请稍后再看。',
      pick: '推荐', expReturn: '期望回报',
      safeSub: '隐含胜率高、爆冷概率低', upsetTitle: '冷门预警', upsetSub: '爆冷概率高的场次，串关建议规避、可小注博冷门',
      upsetProb: '爆冷概率', upsetSide: '冷门方向', payout: '博冷回报', riskTag: '冷门风险', valueTitle: '以小博大（高赔潜力）', valueSub: '隐含概率不低但赔率偏高，性价比之选'
    },
    champion: {
      title: 'AI 夺冠推演', lead: '基于球队实力值，蒙特卡洛模拟剩余小组赛与淘汰赛 {n} 次，估算各队夺冠与晋级概率。',
      computing: '正在模拟 {n} 次赛事进程…', titleProb: '夺冠概率', reachFinal: '进决赛', reachSemi: '进四强',
      model: '⚠️ 纯模型推演（实力值 + Elo 胜率 + 标准种子淘汰赛），仅供参考，不代表真实结果。', rank: '排名'
    },
    qualify: {
      title: '出线形势', lead: '枚举本组剩余比赛的全部结果组合，统计每队进入前二的场景占比。',
      clinched: '已出线', eliminated: '已出局', alive: '出线中', chance: '出线场景', rem: '剩余', empty: '本组比赛尚未开始或暂无数据。'
    },
    match: {
      back: '← 返回', prediction: 'AI 预测', lineup: '预测首发', odds: '胜平负赔率', form: '近期战绩', noForm: '暂无近期战绩', noLineup: '暂无首发预测', noOdds: '暂无赔率', vsRecord: '交锋/近况', notFound: '未找到该比赛。', kickoff: '开赛' },
    footer: { subtitle: '作品集演示 · Vue 3 + ECharts' }
  },
  en: {
    nav: { overview: 'Overview', schedule: 'Schedule', teams: 'Teams', timeline: 'Timeline', odds: 'Live Odds', predictions: 'AI Picks', champion: 'Title Odds', strategy: 'Strategy', stats: 'Stats', feedback: 'Feedback' },
    common: {
      live: 'Live data', sample: 'Sample data', realData: 'Real data', updatedAt: 'Updated', source: 'Source',
      win: 'W', draw: 'D', loss: 'L', vs: 'VS', finished: 'FT', inplay: 'Live', upcoming: 'Upcoming',
      group: 'Group', all: 'All', today: 'Today', search: 'Search', noResult: 'No matches found',
      players: ' players', back: 'Back', confidence: 'Confidence', minutes: 'min', goals: 'Goals', tbd: 'TBD'
    },
    result: { home: 'Home', draw: 'Draw', away: 'Away' },
    overview: {
      groupStage: 'Group stage in progress', host: 'USA · Canada · Mexico', teamsCount: ' teams', matchesCount: ' matches',
      totalGoals: 'Total goals', avgGoals: 'Goals/match', draws: 'Draws', biggestWin: 'Biggest win', played: 'Played',
      spotlight: 'Featured matches', allSchedule: 'Full schedule →', strengthDist: 'Team strength', goalTiming: 'Goal timing', latest: 'Latest results', detail: 'Details →',
      stages: { group: 'Groups', r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', final: 'Final' }
    },
    dataStatus: { schedule: 'Schedule & scores', odds: 'Lottery odds', predictions: 'AI predictions', sportteryLive: 'Sporttery live', modelOdds: 'Model odds' },
    schedule: { title: 'Full Schedule · Odds & Standings', groupTab: 'Groups', knockoutTab: 'Knockout', searchTeam: 'Search team (all groups)…', oddsTitle: 'Match Odds', bracketTitle: 'Knockout Bracket', sportteryOdds: 'Sporttery live odds', modelOdds: 'Model odds', oddsClosed: 'Odds closed', allGroups: 'All groups', allGroupsHint: 'All 12 groups at a glance (click a group for fixtures & odds)' },
    teamTip: { groupGames: 'Group record', tbd: 'Upcoming', record: 'Record' },
    standings: { rank: '#', team: 'Team', played: 'P', win: 'W', draw: 'D', loss: 'L', gd: 'GD', pts: 'Pts' },
    teams: {
      title: 'Teams · Squads', lead: 'Crests, 26-man squads and player info for all 48 teams. Tap a team for details.', updatedAt: 'Updated',
      searchPlaceholder: '🔍 Search team / country…', loading: 'Team data loading or unavailable.', backToAll: '← All teams', roster: ' players',
      founded: 'Founded', foundedYear: '', venue: 'Venue', coach: 'Coach', colors: 'Colors',
      pos: { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards', OTH: 'Others' },
      age: ' yrs', aiBio: 'AI bio', lineupTitle: 'Starting XI (AI predicted)', starters: 'Starters', startersOf: 'XI' },
    timeline: { title: 'Match Calendar', all: 'All', upcoming: 'Upcoming', finished: 'Finished' },
    odds: { title: 'Sports Lottery · Live Odds', lead: 'Source: China Sports Lottery (1X2 / handicap). Sorted by kickoff. Tap an odd to add to the calculator below.', empty: 'No live odds yet.', moreplay: 'More markets', score: 'Correct score', totalGoals: 'Total goals', halffull: 'HT/FT', handicap: 'Handicap', calc: 'Bet calculator', selected: 'Selected', odds: 'Odds', stake: 'Stake', maxWin: 'Max payout', multiplier: 'Multiplier', clear: 'Clear', noOpen: 'Not open' },
    predictions: { title: 'AI Score Predictions', leadPrefix: 'By', leadSuffix: ' — combining team strength and recent form to predict scores and outcomes for the next {n} days; each with rationale and confidence.', verified: 'Verified', outcomeHit: 'Outcome hit', scoreHit: 'Exact hit', miss: 'Miss', pending: 'Upcoming', predicted: 'Predicted', actual: 'Actual', empty: 'No predictions yet.', reason: 'Rationale' },
    stats: { strengthTitle: 'Team Strength Distribution', strengthLead: 'Bubbles colored by confederation; Y = strength (≈ FIFA points), X = group. Higher/bigger = stronger.', radarTitle: 'Group Strength Radar (Group of Death)', deathTitle: 'Toughest Groups Top 3', avgStrength: 'Avg strength', goalBar: 'Goals For / Against', goalTiming: 'Goal Timing', scorers: 'Team Goals', noTiming: 'Live source has no goal-minute data' },
    feedback: { title: 'Feedback', count: '{n} total', lead: 'Share your suggestions. Submissions are saved in your browser and shown below; adopted ones go to "Curated" visible to everyone.', namePlaceholder: 'Nickname (optional)', contentPlaceholder: 'Write your feedback… (max 500 chars)', submit: 'Submit', submitted: '✓ Submitted, thanks!', official: 'Curated', officialNote: '(visible to all)', mine: 'My submissions', mineNote: '(saved in this browser)', noOfficial: 'No curated feedback yet.', noMine: 'You have not submitted feedback yet.', delete: 'Delete', officialTag: 'Official' },
    strategy: {
      title: 'AI Betting Strategy', lead: 'Implied probabilities derived from live odds, with higher-hit-rate picks and safe parlay combos.',
      disclaimer: '⚠️ Derived from odds, for entertainment only — not betting advice. Please be responsible.',
      singleTitle: 'Single picks (by implied win rate)', recommend: 'Pick', winProb: 'Implied win', odd: 'Odd',
      safeTitle: 'Safe parlay combos', combinedOdds: 'Combined odds', hitRate: 'Hit rate', return1x: 'Return per 1 stake', legs: 'legs', noData: 'No live odds to analyze yet, check back later.',
      pick: 'Pick', expReturn: 'Expected return',
      safeSub: 'High implied win rate, low upset risk', upsetTitle: 'Upset alerts', upsetSub: 'High surprise risk — avoid in parlays, or stake small on the underdog',
      upsetProb: 'Upset chance', upsetSide: 'Upset side', payout: 'Upset payout', riskTag: 'Upset risk', valueTitle: 'Value longshots', valueSub: 'Decent implied odds but high payout — best value'
    },
    champion: {
      title: 'AI Title Projection', lead: 'Monte-Carlo simulation of remaining group & knockout games ({n} runs) from team ratings, estimating title and advancement odds.',
      computing: 'Simulating {n} tournament runs…', titleProb: 'Title odds', reachFinal: 'Final', reachSemi: 'Semis',
      model: '⚠️ Pure model projection (ratings + Elo win prob + standard seeded bracket), for reference only — not a real forecast.', rank: 'Rank'
    },
    qualify: {
      title: 'Qualification outlook', lead: 'Enumerating every outcome of the remaining group games, counting the share of scenarios each team finishes top two.',
      clinched: 'Through', eliminated: 'Out', alive: 'In contention', chance: 'Scenarios', rem: 'Left', empty: 'Group not started or no data yet.'
    },
    match: {
      back: '← Back', prediction: 'AI prediction', lineup: 'Predicted XI', odds: '1X2 odds', form: 'Recent form', noForm: 'No recent results', noLineup: 'No lineup prediction', noOdds: 'No odds', vsRecord: 'Form / H2H', notFound: 'Match not found.', kickoff: 'Kickoff' },
    footer: { subtitle: 'Portfolio demo · Vue 3 + ECharts' }
  }
}

const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('wc2026-lang')) || 'zh'

export const i18n = createI18n({
  legacy: false,
  locale: saved,
  fallbackLocale: 'zh',
  messages
})

export function setLocale(l) {
  i18n.global.locale.value = l
  try { localStorage.setItem('wc2026-lang', l) } catch { /* ignore */ }
  document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN'
}
