<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import OddsRow from '../components/OddsRow.vue'
import GroupStandings from '../components/GroupStandings.vue'
import Bracket from '../components/Bracket.vue'

const store = useDataStore()
const { t } = useI18n()
const tab = ref('group') // 'group' | 'knockout'
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
      <GroupStandings v-if="!query" :group="activeGroup" />
      <div>
        <div class="section-title" style="margin-top:0">{{ query ? `“${query}”` : activeGroup + ' ' + t('common.group') }} · {{ t('schedule.oddsTitle') }}</div>
        <div class="grid matches">
          <OddsRow v-for="m in groupMatchList" :key="m.id" :match="m" />
          <div v-if="!groupMatchList.length" class="empty muted">{{ t('common.noResult') }}</div>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="section-title">{{ t('schedule.bracketTitle') }}</div>
    <Bracket />
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
</style>
