<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'
import PlayerAvatar from '../components/PlayerAvatar.vue'

const store = useDataStore()
const selected = ref(null) // 选中的球队 code
const query = ref('')

const data = computed(() => store.teamsFull)
const teams = computed(() => data.value?.teams || [])

// 列表：按搜索过滤，按小组分组
const filtered = computed(() => {
  const q = query.value.trim()
  if (!q) return teams.value
  return teams.value.filter((t) => (t.cnName + t.name + (t.country || '')).toLowerCase().includes(q.toLowerCase()))
})

const current = computed(() => teams.value.find((t) => t.code === selected.value) || null)

// 选中球队的名单按位置分组
const POS = [
  { key: 'GK', label: '门将' }, { key: 'DEF', label: '后卫' },
  { key: 'MID', label: '中场' }, { key: 'FWD', label: '前锋' }, { key: 'OTH', label: '其他' }
]
const squadByPos = computed(() => {
  if (!current.value) return []
  return POS.map((p) => ({ ...p, players: current.value.squad.filter((s) => s.posKey === p.key) }))
    .filter((g) => g.players.length)
})

// 球队简介（真实字段拼描述）
const intro = computed(() => {
  const t = current.value
  if (!t) return ''
  const parts = []
  if (t.country) parts.push(t.country)
  if (t.founded) parts.push(`成立于 ${t.founded} 年`)
  if (t.venue) parts.push(`主场 ${t.venue}`)
  if (t.coach) parts.push(`主帅 ${t.coach}`)
  if (t.clubColors) parts.push(`队服 ${t.clubColors}`)
  return parts.join(' · ')
})

const fmtUpdated = computed(() => data.value?.fetchedAt ? new Date(data.value.fetchedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '')
</script>

<template>
  <div class="view">
    <!-- 球队详情 -->
    <template v-if="current">
      <button class="back" @click="selected = null">← 返回全部球队</button>
      <div class="team-head card">
        <img v-if="current.crest" class="crest-lg" :src="current.crest" :alt="current.cnName" />
        <div class="th-text">
          <h2>{{ current.cnName }} <small>{{ current.name }}</small></h2>
          <div class="th-tags">
            <span v-if="current.group" class="badge">{{ current.group }} 组</span>
            <span class="badge">{{ current.squad.length }} 人名单</span>
          </div>
          <p class="intro">{{ intro }}</p>
        </div>
      </div>

      <div v-for="g in squadByPos" :key="g.key" class="pos-block">
        <div class="section-title">{{ g.label }}<small class="muted">（{{ g.players.length }}）</small></div>
        <div class="grid players">
          <div v-for="(p, i) in g.players" :key="p.name + i" class="player card">
            <PlayerAvatar :name="p.name" :photo="p.photo" :size="48" />
            <div class="p-info">
              <div class="p-name">{{ p.name }}</div>
              <div class="p-meta muted">{{ p.position }}<template v-if="p.age"> · {{ p.age }} 岁</template></div>
              <div class="p-nat muted">{{ p.nationality }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 球队列表 -->
    <template v-else>
      <div class="head">
        <h2>参赛球队 · 阵容名单</h2>
        <span class="muted gen" v-if="fmtUpdated">资料更新于 {{ fmtUpdated }}</span>
      </div>
      <p class="lead muted">48 支参赛队的徽标、26 人大名单与球员信息（数据来自 football-data.org）。点击球队查看详情。</p>

      <input class="search" v-model="query" placeholder="🔍 搜索球队 / 国家…" />

      <div v-if="!teams.length" class="empty card muted">球队资料加载中或暂不可用（public/teams.json）。</div>

      <div class="grid team-grid">
        <button v-for="t in filtered" :key="t.code" class="team-card card" @click="selected = t.code">
          <img v-if="t.crest" class="crest" :src="t.crest" :alt="t.cnName" />
          <div class="tc-name">{{ t.cnName }}</div>
          <div class="tc-sub muted">{{ t.group ? t.group + ' 组' : '' }} · {{ t.squad.length }}人</div>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 24px 0 6px; }
.head h2 { font-size: 1.4rem; font-weight: 800; }
.gen { font-size: 0.74rem; }
.lead { font-size: 0.86rem; margin-bottom: 14px; }
.search { width: 100%; max-width: 360px; background: var(--card); border: 1px solid var(--border); border-radius: 999px; color: var(--text); padding: 9px 16px; font-size: 0.9rem; margin-bottom: 18px; }
.search:focus { outline: none; border-color: var(--primary-dim); }
.empty { padding: 28px; text-align: center; }

.team-grid { grid-template-columns: repeat(6, 1fr); gap: 12px; }
.team-card { padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.15s, border-color 0.15s; background: var(--card); }
.team-card:hover { transform: translateY(-3px); border-color: var(--primary-dim); }
.crest { width: 52px; height: 52px; object-fit: contain; }
.tc-name { font-weight: 700; font-size: 0.9rem; text-align: center; }
.tc-sub { font-size: 0.7rem; }

.back { margin: 24px 0 14px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text-dim); padding: 6px 14px; font-size: 0.84rem; }
.back:hover { color: var(--text); border-color: var(--primary-dim); }
.team-head { display: flex; align-items: center; gap: 20px; padding: 20px 24px; margin-bottom: 8px; }
.crest-lg { width: 84px; height: 84px; object-fit: contain; flex-shrink: 0; }
.th-text h2 { font-size: 1.5rem; font-weight: 800; }
.th-text h2 small { font-size: 0.9rem; color: var(--text-mute); font-weight: 500; }
.th-tags { display: flex; gap: 8px; margin: 8px 0; }
.intro { font-size: 0.86rem; color: var(--text-dim); line-height: 1.6; }
.pos-block { margin-top: 4px; }
.players { grid-template-columns: repeat(4, 1fr); }
.player { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
.p-info { min-width: 0; }
.p-name { font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-meta { font-size: 0.74rem; margin-top: 2px; }
.p-nat { font-size: 0.7rem; margin-top: 1px; }

@media (max-width: 900px) { .team-grid { grid-template-columns: repeat(4, 1fr); } .players { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .team-grid { grid-template-columns: repeat(3, 1fr); } .players { grid-template-columns: 1fr; } .team-head { flex-direction: column; text-align: center; } }
</style>
