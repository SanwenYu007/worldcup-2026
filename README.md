# 2026 世界杯 · 赛程总览 ⚽

基于 **Vue 3 + Vite + ECharts** 的 2026 FIFA 世界杯数据可视化作品集。
包含赛程比分、得分信息图、球队实力分布与总体预览。

## 功能

- **总览** — 赛事进度条、关键数字看板（总进球/场均/最大分差）、焦点比赛、最新战报
- **赛程** — 竞彩「胜平负」风格赔率列表：每场显示场次编号 + 胜平负 / 让球胜平负 / 总进球 / 比分赔率，完场高亮命中项；含 12 组积分榜与淘汰赛对阵树。赔率仅对**未开赛**比赛显示，完赛后保留 1 天再关闭
- **时间表** — 全部比赛按日期分组、按开赛时间排序，可筛选「未赛/已赛」
- **实时赔率** — 镜像中国体彩竞彩页面：场次编号 + 联赛 + 开赛时间 + 胜平负 / 让球胜平负，「更多玩法」展开 **比分 / 总进球 / 半全场**；按比赛时间排序（数据来自 sporttery）。内置 **足球计算器**：点击赔率即可选入，自动计算混合过关（N串1）总赔率「倍收益」与投入/最高奖金
- **AI 预测** — 由 ChatGPT 预测未来 2 天比赛的比分与胜负，含置信度与分析；完赛后标注命中情况并统计准确率
- **意见** — 访客提交建议，保存在浏览器 localStorage（刷新保留）；`public/feedback.json` 为维护者精选意见，所有人可见、可后续更新
- **数据** — 球队实力分布气泡图、小组实力雷达（死亡之组）、得分榜、进球时段分布、射手榜

## 数据策略

默认使用 `src/data/worldcup.js` 的**示例/兜底数据**（确定性生成，刷新结果稳定），
开箱即跑、永不白屏。接入真实数据：

```bash
# 1. 申请免费 token：https://www.football-data.org/client/register
# 2. 抓取真实赛程写入 public/live.json
FOOTBALL_DATA_TOKEN=你的key npm run fetch-data
```

前端运行时会优先读取 `public/live.json`，拿不到则回退示例数据。

### 胜平负赔率

赔率默认由**实力模型**（泊松分布）算出，覆盖全部 104 场，含胜平负 / 让球胜平负 / 总进球 / 比分。
可叠加**体彩竞彩真实赔率**（命中的场次自动覆盖）：

```bash
npm run fetch-odds   # 抓取 sporttery 竞彩赔率 → public/odds.json
```

前端按队名把真实赔率覆盖到对应比赛（如「荷兰 vs 日本」），未在售的场次保留模型赔率。
来源：<https://m.sporttery.cn/mjc/jsq/zqhhgg/>

### AI 预测（每日更新接口）

预测数据存放于 **`public/predictions.json`**，这就是每日更新的「接口」。
每天由 ChatGPT 重新分析未来 2 天比赛、覆盖此文件即可，前端自动展示。

JSON 结构（schema）：

```jsonc
{
  "model": "gpt-4o",
  "modelLabel": "ChatGPT (gpt-4o)",
  "generatedAt": "2026-06-14T18:30:00Z",  // 生成时间
  "horizonDays": 2,                        // 预测未来天数
  "predictions": [
    {
      "matchId": "537357",                 // 对应 live.json 的比赛 id（也可按队名匹配）
      "home": "NED", "away": "JPN",
      "homeName": "荷兰", "awayName": "日本",
      "date": "2026-06-14T20:00:00Z",
      "score": { "home": 2, "away": 1 },   // 预测比分
      "outcome": "home",                    // 预测胜负：home | draw | away
      "confidence": 0.55,                   // 置信度 0~1
      "reasoning": "……"                     // 分析理由
    }
  ]
}
```

前端按 `matchId`（或队名）把预测匹配到比赛：赛程页每行显示「AI 预测」一行，AI 预测页集中展示并在完赛后统计**胜负命中率 / 比分命中率**。

预测可由脚本自动生成（需 `OPENAI_API_KEY`）：

```bash
OPENAI_API_KEY=sk-... npm run predict          # 调用 ChatGPT 预测未来 2 天比赛
# 可选 OPENAI_MODEL 指定模型（默认 gpt-4o）：OPENAI_MODEL=gpt-4o OPENAI_API_KEY=... npm run predict
```

## 自动更新（GitHub Actions 定时任务）

`.github/workflows/update-and-deploy.yml` 让 GitHub 服务器**定时自动更新数据并部署**——
默认每 6 小时：拉取真实赛程比分 + 体彩赔率 + 重新生成 AI 预测 → 提交回仓库 → 构建 → 部署到 GitHub Pages。

**一次性配置（在 GitHub 仓库里）：**

1. **Settings → Secrets and variables → Actions** 添加两个密钥：
   - `FOOTBALL_DATA_TOKEN`：football-data.org 的 API key（赛程比分）
   - `OPENAI_API_KEY`：OpenAI(ChatGPT) API key（AI 预测，缺省则跳过预测）
   - （可选）仓库变量 `OPENAI_MODEL` 指定模型，默认 `gpt-4o`
2. **Settings → Pages → Source** 选 **GitHub Actions**（启用 Pages 部署）

之后无需任何操作：到点自动更新并发布。也可在 **Actions** 页点 **Run workflow** 手动触发。
改更新频率：修改 workflow 里的 `cron`（如 `0 */3 * * *` 改为每 3 小时）。

> 注：体彩赔率接口（sporttery）可能对海外服务器限流/限区，GitHub 海外 runner 上可能抓不到——
> 此步失败不阻断流程，会保留上一次的赔率快照。赛程比分与 AI 预测不受影响。

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产出 dist/，可部署到任意静态托管
npm run preview
```

## 技术要点

- ECharts 按需引入（`src/components/charts/echarts.js`）减小包体
- 聚合逻辑为纯函数（`src/composables/useStats.js`），与 UI 解耦、易测试
- hash 路由，纯静态部署无需服务端 rewrite
- 深色主题 + 响应式（移动端自适应）
