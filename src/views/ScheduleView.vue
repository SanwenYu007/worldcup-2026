<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/data'
import OddsRow from '../components/OddsRow.vue'
import GroupStandings from '../components/GroupStandings.vue'
import GroupQualify from '../components/GroupQualify.vue'
import Bracket from '../components/Bracket.vue'
import { WC_HONORS, TIER_STYLE } from '../data/history'

const store = useDataStore()
const { t, locale } = useI18n()
const router = useRouter()
const tab = ref('group') // 'group' | 'knockout' | 'history'

// 世界杯历史 16 强：点击行展开夺冠年份。
const openCode = ref(null)
const toggleHonor = (code) => { openCode.value = openCode.value === code ? null : code }
const honorName = (h) => (locale.value === 'en' ? h.en : h.cn)
const tierStyle = (tier) => TIER_STYLE[tier] || TIER_STYLE.GS
// 点击「查看球队」跳转球队页并预选该队。
const gotoTeam = (code) => router.push({ name: 'teams', query: { team: code } })
const activeGroup = ref('ALL') // 'ALL' = 全部小组一览 | 'A'..'L' = 单组详情
const groupKeys = 'ABCDEFGHIJKL'.split('')
const query = ref('') // 球队搜索
const filterMode = ref('all') // all | upcoming | today

const isToday = (d) => new Date(d).toDateString() === store.now.toDateString()

const groupMatchList = computed(() => {
  const q = query.value.trim()
  let list = store.matches.filter((m) => m.stage === 'group')
  // 有搜索词时跨组搜索；否则只看当前小组
  if (q) {
    list = list.filter((m) =>
      [store.getTeam(m.home)?.name, store.getTeam(m.away)?.name].some((n) => (n || '').includes(q))
    )
  } else {
    list = list.filter((m) => m.group === activeGroup.value)
  }
  if (filterMode.value === 'upcoming') list = list.filter((m) => m.status !== 'finished')
  else if (filterMode.value === 'today') list = list.filter((m) => isToday(m.date))
  return list.sort((a, b) => new Date(a.date) - new Date(b.date))
})
</script>

<template>
  <div class="view">
  <h2 class="page-title">{{ t('schedule.title') }}</h2>
  <div class="tabs">
    <button :class="{ on: tab === 'group' }" @click="tab = 'group'">{{ t('schedule.groupTab') }}</button>
    <button :class="{ on: tab === 'knockout' }" @click="tab = 'knockout'">{{ t('schedule.knockoutTab') }}</button>
    <button :class="{ on: tab === 'history' }" @click="tab = 'history'">{{ t('schedule.historyTab') }}</button>
  </div>

  <template v-if="tab === 'group'">
    <div class="group-pills" v-show="!query">
      <button class="all-pill" :class="{ on: activeGroup === 'ALL' }" @click="activeGroup = 'ALL'">{{ t('schedule.allGroups') }}</button>
      <button v-for="g in groupKeys" :key="g" :class="{ on: activeGroup === g }" @click="activeGroup = g">{{ g }}</button>
      <span class="odds-src" :class="store.oddsSource">
        {{ store.oddsSource === 'sporttery' ? t('schedule.sportteryOdds') : t('schedule.modelOdds') }}
      </span>
    </div>

    <div class="filters">
      <input class="search" v-model="query" :placeholder="t('schedule.searchTeam')" />
      <template v-if="!(activeGroup === 'ALL' && !query)">
        <button :class="{ on: filterMode === 'all' }" @click="filterMode = 'all'">{{ t('common.all') }}</button>
        <button :class="{ on: filterMode === 'upcoming' }" @click="filterMode = 'upcoming'">{{ t('common.upcoming') }}</button>
        <button :class="{ on: filterMode === 'today' }" @click="filterMode = 'today'">{{ t('common.today') }}</button>
      </template>
    </div>

    <!-- 全部小组一览：12 个小组积分榜同屏 -->
    <template v-if="activeGroup === 'ALL' && !query">
      <p class="all-hint muted">{{ t('schedule.allGroupsHint') }}</p>
      <div class="grid all-groups">
        <GroupStandings v-for="g in groupKeys" :key="g" :group="g" class="ag-card" @click="activeGroup = g" />
      </div>
    </template>

    <!-- 单组详情 / 搜索结果：积分榜 + 赔率赛程 -->
    <div v-else class="grid layout" :class="{ single: query }">
      <div v-if="!query">
        <GroupStandings :group="activeGroup" />
        <GroupQualify :group="activeGroup" />
      </div>
      <div>
        <div class="section-title" style="margin-top:0">{{ query ? `“${query}”` : activeGroup + ' ' + t('common.group') }} · {{ t('schedule.oddsTitle') }}</div>
        <div class="grid matches">
          <OddsRow v-for="m in groupMatchList" :key="m.id" :match="m" />
          <div v-if="!groupMatchList.length" class="empty muted">{{ t('common.noResult') }}</div>
        </div>
      </div>
    </div>
  </template>

  <template v-else-if="tab === 'knockout'">
    <div class="section-title">{{ t('schedule.bracketTitle') }}</div>
    <Bracket />
  </template>

  <!-- 世界杯历史 16 强 -->
  <template v-else>
    <div class="section-title" style="margin-top:0">{{ t('history.title') }}</div>
    <p class="all-hint muted">{{ t('history.lead') }}</p>
    <div class="hist-list">
      <div v-for="(h, i) in WC_HONORS" :key="h.code" class="hist card" :class="{ open: openCode === h.code }">
        <div class="hist-row" role="button" tabindex="0" @click="toggleHonor(h.code)" @keydown.enter="toggleHonor(h.code)">
          <span class="rk muted">{{ i + 1 }}</span>
          <span class="fl">{{ h.flag }}</span>
          <span class="nm">{{ honorName(h) }}</span>
          <span class="ti" :class="{ none: !h.titles }">
            <template v-if="h.titles">🏆 {{ h.titles }} {{ t('history.titlesUnit') }}</template>
            <template v-else>{{ t('history.noTitle') }}</template>
          </span>
          <span class="recent">
            <span v-for="[yr, tier] in h.recent" :key="yr" class="chip" :title="yr"
              :style="{ color: tierStyle(tier).color, background: tierStyle(tier).bg }">
              <small class="yr">{{ String(yr).slice(2) }}</small>{{ t('history.tier.' + tier) }}
            </span>
          </span>
          <span class="exp" :class="{ on: openCode === h.code }">▾</span>
        </div>
        <div v-if="openCode === h.code" class="hist-detail">
          <div class="years">
            <strong>{{ t('history.titleYears') }}：</strong>
            <template v-if="h.titleYears.length">
              <span v-for="y in h.titleYears" :key="y" class="ybadge">{{ y }}</span>
            </template>
            <span v-else class="muted">{{ t('history.noTitle') }}</span>
          </div>
          <button class="to-team" @click.stop="gotoTeam(h.code)">{{ t('history.toTeam') }}</button>
        </div>
      </div>
    </div>
  </template>
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin: 24px 0 18px; }
.tabs button {
  padding: 9px 22px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--card); color: var(--text-dim); font-weight: 600; transition: all 0.15s;
}
.tabs button.on { background: var(--primary); color: #06231b; border-color: transparent; }
.group-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
.group-pills button {
  width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--card); color: var(--text-dim); font-weight: 700; transition: all 0.15s;
}
.group-pills button.on { background: var(--accent); color: #2a1d00; border-color: transparent; }
.group-pills .all-pill { width: auto; padding: 0 14px; font-size: 0.84rem; }
.all-hint { font-size: 0.82rem; margin: -6px 0 14px; }
.all-groups { grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: start; }
.all-groups .ag-card { cursor: pointer; transition: border-color 0.15s, transform 0.1s; }
.all-groups .ag-card:hover { border-color: var(--primary-dim); transform: translateY(-2px); }
@media (max-width: 900px) { .all-groups { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .all-groups { grid-template-columns: 1fr; } }
.odds-src { margin-left: auto; align-self: center; font-size: 0.72rem; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); color: var(--text-mute); }
.odds-src.sporttery { color: var(--primary); border-color: var(--primary-dim); }
.page-title { font-size: 1.4rem; font-weight: 800; margin: 24px 0 14px; }
.tabs { margin-top: 0 !important; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; align-items: center; }
.filters .search {
  flex: 1; min-width: 180px; max-width: 320px;
  background: var(--card); border: 1px solid var(--border); border-radius: 999px;
  color: var(--text); padding: 8px 14px; font-size: 0.86rem;
}
.filters .search:focus { outline: none; border-color: var(--primary-dim); }
.filters button {
  padding: 7px 16px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--card); color: var(--text-dim); font-weight: 600; font-size: 0.82rem;
}
.filters button.on { background: var(--primary); color: #06231b; border-color: transparent; }
.empty { padding: 24px; text-align: center; font-size: 0.88rem; }
.layout { grid-template-columns: 340px 1fr; align-items: start; }
.layout.single { grid-template-columns: 1fr; }
.matches { grid-template-columns: 1fr; }
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
}

/* 世界杯历史 16 强 */
.hist-list { display: flex; flex-direction: column; gap: 8px; }
.hist { padding: 0; overflow: hidden; }
.hist-row { display: grid; grid-template-columns: 28px 30px 1fr auto auto 20px; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; transition: background 0.15s; }
.hist-row:hover { background: var(--bg-soft); }
.hist .rk { font-weight: 700; font-size: 0.82rem; text-align: center; }
.hist .fl { font-size: 1.4rem; }
.hist .nm { font-weight: 700; font-size: 0.95rem; }
.hist .ti { font-weight: 700; font-size: 0.82rem; color: var(--accent); white-space: nowrap; }
.hist .ti.none { color: var(--text-mute); font-weight: 500; }
.hist .recent { display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
.hist .chip { display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--border); white-space: nowrap; }
.hist .chip .yr { font-size: 0.6rem; opacity: 0.8; font-weight: 600; }
.hist .exp { color: var(--text-mute); transition: transform 0.18s; font-size: 0.8rem; }
.hist .exp.on { transform: rotate(180deg); }
.hist-detail { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 0 16px 14px 16px; border-top: 1px solid var(--border); padding-top: 12px; }
.hist-detail .years { font-size: 0.84rem; }
.ybadge { display: inline-block; font-weight: 700; font-size: 0.78rem; color: #06231b; background: var(--accent); padding: 1px 8px; border-radius: 6px; margin: 0 3px; }
.to-team { background: var(--primary); color: #06231b; font-weight: 700; border: none; border-radius: 8px; padding: 6px 14px; font-size: 0.8rem; }
@media (max-width: 680px) {
  .hist-row { grid-template-columns: 22px 26px 1fr 20px; row-gap: 6px; }
  .hist .ti { grid-column: 2 / 5; }
  .hist .recent { grid-column: 1 / 5; justify-content: flex-start; }
}
</style>
