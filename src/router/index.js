import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'overview', component: () => import('../views/OverviewView.vue'), meta: { title: '总览' } },
  { path: '/schedule', name: 'schedule', component: () => import('../views/ScheduleView.vue'), meta: { title: '赛程' } },
  { path: '/teams', name: 'teams', component: () => import('../views/TeamsView.vue'), meta: { title: '球队' } },
  { path: '/timeline', name: 'timeline', component: () => import('../views/TimelineView.vue'), meta: { title: '时间表' } },
  { path: '/odds', name: 'odds', component: () => import('../views/OddsLiveView.vue'), meta: { title: '实时赔率' } },
  { path: '/predictions', name: 'predictions', component: () => import('../views/PredictionsView.vue'), meta: { title: 'AI预测' } },
  { path: '/champion', name: 'champion', component: () => import('../views/ChampionView.vue'), meta: { title: '夺冠预测' } },
  { path: '/strategy', name: 'strategy', component: () => import('../views/StrategyView.vue'), meta: { title: '投注策略' } },
  { path: '/match/:id', name: 'match', component: () => import('../views/MatchDetailView.vue'), meta: { title: '比赛详情' } },
  { path: '/stats', name: 'stats', component: () => import('../views/StatsView.vue'), meta: { title: '数据' } },
  { path: '/feedback', name: 'feedback', component: () => import('../views/FeedbackView.vue'), meta: { title: '意见' } }
]

const router = createRouter({
  // 用 hash 模式：纯静态部署到任意平台都不用配服务端 rewrite
  history: createWebHashHistory(),
  routes,
  // 时间表页由组件自行定位到「今天」，不强制回到顶部；其余页面进入即回顶。
  scrollBehavior: (to) => (to.name === 'timeline' ? false : { top: 0 })
})

export default router
