<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'
import OddsRow from '../components/OddsRow.vue'
import GroupStandings from '../components/GroupStandings.vue'
import Bracket from '../components/Bracket.vue'

const store = useDataStore()
const tab = ref('group') // 'group' | 'knockout'
const activeGroup = ref('A')
const groupKeys = 'ABCDEFGHIJKL'.split('')

const groupMatchList = computed(() =>
  store.matches
    .filter((m) => m.stage === 'group' && m.group === activeGroup.value)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
)
</script>

<template>
  <div class="view">
  <div class="tabs">
    <button :class="{ on: tab === 'group' }" @click="tab = 'group'">小组赛</button>
    <button :class="{ on: tab === 'knockout' }" @click="tab = 'knockout'">淘汰赛</button>
  </div>

  <template v-if="tab === 'group'">
    <div class="group-pills">
      <button v-for="g in groupKeys" :key="g" :class="{ on: activeGroup === g }" @click="activeGroup = g">{{ g }}</button>
      <span class="odds-src" :class="store.oddsSource">
        {{ store.oddsSource === 'sporttery' ? '体彩实时赔率' : '模型赔率' }}
      </span>
    </div>

    <div class="grid layout">
      <GroupStandings :group="activeGroup" />
      <div>
        <div class="section-title" style="margin-top:0">{{ activeGroup }} 组 · 胜平负赔率</div>
        <div class="grid matches">
          <OddsRow v-for="m in groupMatchList" :key="m.id" :match="m" />
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="section-title">淘汰赛对阵树</div>
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
.odds-src { margin-left: auto; align-self: center; font-size: 0.72rem; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); color: var(--text-mute); }
.odds-src.sporttery { color: var(--primary); border-color: var(--primary-dim); }
.layout { grid-template-columns: 340px 1fr; align-items: start; }
.matches { grid-template-columns: 1fr; }
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
