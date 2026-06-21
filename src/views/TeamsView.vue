<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import PlayerAvatar from '../components/PlayerAvatar.vue'

const store = useDataStore()
const { t, locale } = useI18n()
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

// 关注球队：localStorage 持久化，关注的置顶
const FAV_KEY = 'wc2026-fav'
const favorites = ref(JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem(FAV_KEY)) || '[]'))
const isFav = (code) => favorites.value.includes(code)
function toggleFav(code) {
  const i = favorites.value.indexOf(code)
  if (i >= 0) favorites.value.splice(i, 1)
  else favorites.value.push(code)
  if (typeof localStorage !== 'undefined') localStorage.setItem(FAV_KEY, JSON.stringify(favorites.value))
}
// 列表：关注置顶
const sortedList = computed(() => [...filtered.value].sort((a, b) => (isFav(b.code) ? 1 : 0) - (isFav(a.code) ? 1 : 0)))

// 选中球队的名单按位置分组
const POS = ['GK', 'DEF', 'MID', 'FWD', 'OTH']
const squadByPos = computed(() => {
  if (!current.value) return []
  return POS.map((key) => ({ key, label: t(`teams.pos.${key}`), players: current.value.squad.filter((s) => s.posKey === key) }))
    .filter((g) => g.players.length)
})

// 球队简介（真实字段拼描述，双语）
const intro = computed(() => {
  const tm = current.value
  if (!tm) return ''
  const parts = []
  if (tm.country) parts.push(tm.country)
  if (tm.founded) parts.push(`${t('teams.founded')} ${tm.founded}${t('teams.foundedYear')}`)
  if (tm.venue) parts.push(`${t('teams.venue')} ${tm.venue}`)
  if (tm.coach) parts.push(`${t('teams.coach')} ${tm.coach}`)
  if (tm.clubColors) parts.push(`${t('teams.colors')} ${tm.clubColors}`)
  return parts.join(' · ')
})
// 球队显示名：英文界面优先英文名
const dName = (tm) => (locale.value === 'en' ? tm.name : tm.cnName)
const fmtUpdated = computed(() => data.value?.fetchedAt ? new Date(data.value.fetchedAt).toLocaleString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '')
</script>

<template>
  <div class="view">
    <!-- 球队详情 -->
    <template v-if="current">
      <button class="back" @click="selected = null">{{ t('teams.backToAll') }}</button>
      <div class="team-head card">
        <img v-if="current.crest" class="crest-lg" :src="current.crest" :alt="current.cnName" />
        <div class="th-text">
          <h2>{{ dName(current) }} <small>{{ locale === 'en' ? current.cnName : current.name }}</small></h2>
          <div class="th-tags">
            <span v-if="current.group" class="badge">{{ current.group }} {{ t('common.group') }}</span>
            <span class="badge">{{ current.squad.length }}{{ t('teams.roster') }}</span>
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
              <div class="p-meta muted">{{ g.label }}<template v-if="p.age"> · {{ p.age }}{{ t('teams.age') }}</template></div>
              <div class="p-nat muted">{{ p.nationality }}</div>
              <div v-if="p.bio && (p.bio[locale] || p.bio.zh)" class="p-bio"><span class="bio-tag">{{ t('teams.aiBio') }}</span>{{ p.bio[locale] || p.bio.zh || p.bio.en }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 球队列表 -->
    <template v-else>
      <div class="head">
        <h2>{{ t('teams.title') }}</h2>
        <span class="muted gen" v-if="fmtUpdated">{{ t('teams.updatedAt') }} {{ fmtUpdated }}</span>
      </div>
      <p class="lead muted">{{ t('teams.lead') }}</p>

      <input class="search" v-model="query" :placeholder="t('teams.searchPlaceholder')" />

      <div v-if="!teams.length" class="empty card muted">{{ t('teams.loading') }}</div>

      <div class="grid team-grid">
        <div v-for="tm in sortedList" :key="tm.code" class="team-card card" :class="{ fav: isFav(tm.code) }" role="button" tabindex="0" @click="selected = tm.code" @keydown.enter="selected = tm.code">
          <span class="fav-star" :class="{ on: isFav(tm.code) }" role="button" :aria-label="isFav(tm.code) ? '取消关注' : '关注'" @click.stop="toggleFav(tm.code)" @keydown.enter.stop="toggleFav(tm.code)" tabindex="0">{{ isFav(tm.code) ? '★' : '☆' }}</span>
          <img v-if="tm.crest" class="crest" :src="tm.crest" :alt="tm.cnName" />
          <div class="tc-name">{{ dName(tm) }}</div>
          <div class="tc-sub muted">{{ tm.group ? tm.group + ' ' + t('common.group') : '' }} · {{ tm.squad.length }}</div>
        </div>
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
.team-card { position: relative; padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.15s, border-color 0.15s; background: var(--card); }
.team-card:hover { transform: translateY(-3px); border-color: var(--primary-dim); }
.team-card.fav { border-color: rgba(255,209,102,0.5); }
.fav-star { position: absolute; top: 6px; right: 8px; font-size: 1rem; line-height: 1; color: var(--text-mute); opacity: 0.5; transition: opacity 0.15s, color 0.15s; }
.fav-star:hover { opacity: 1; }
.fav-star.on { color: var(--accent); opacity: 1; }
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
.p-bio { font-size: 0.72rem; color: var(--text-dim); margin-top: 5px; line-height: 1.45; }
.bio-tag { display: inline-block; font-size: 0.6rem; color: #5b8def; border: 1px solid rgba(91,141,239,0.4); border-radius: 4px; padding: 0 4px; margin-right: 5px; }

@media (max-width: 900px) { .team-grid { grid-template-columns: repeat(4, 1fr); } .players { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .team-grid { grid-template-columns: repeat(3, 1fr); } .players { grid-template-columns: 1fr; } .team-head { flex-direction: column; text-align: center; } }
</style>
