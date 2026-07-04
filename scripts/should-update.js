// 更新网关：判断当前是否处于「某场比赛开赛满约 2 小时」的更新窗口。
//
// 背景：世界杯各场开赛时间分散（UTC 16:00–次日 04:00，含整点与半点），固定每 N 小时
// 更新既浪费又不贴合赛况。改为：cron 只在「各开赛时刻 + 2 小时」唤醒，再由本脚本读取
// 真实赛程(public/live.json) 确认确有比赛已开赛满 2 小时，才真正抓取/提交数据。
//
// 判定：存在某场比赛，其开赛至今的时长 since 满足 2h <= since < 2h + 容差，则需要更新。
// 容差略大于最密 cron 间隔，确保每场赛后恰好命中一次而不漏。
//
// 输出：向 stdout 打印 `do=true` 或 `do=false`（工作流将其重定向到 $GITHUB_OUTPUT）。

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const TWO_H = 2 * 60 * 60 * 1000
const TOL = 75 * 60 * 1000 // 75 分钟容差
const SCHEDULE = fileURLToPath(new URL('../public/live.json', import.meta.url))

const now = Date.now()

let matches = []
try {
  const data = JSON.parse(await readFile(SCHEDULE, 'utf8'))
  matches = data.matches || []
} catch {
  // 没有赛程缓存时保守允许更新，避免首次运行被卡住。
  console.log('do=true')
  process.exit(0)
}

const hit = matches.some((m) => {
  if (!m.date) return false
  const since = now - new Date(m.date).getTime()
  return since >= TWO_H && since < TWO_H + TOL
})

console.log(`do=${hit}`)
