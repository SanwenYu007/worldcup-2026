<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'

const store = useDataStore()

const rounds = [
  { key: 'r16', name: '16 强' },
  { key: 'qf', name: '1/4 决赛' },
  { key: 'sf', name: '半决赛' },
  { key: 'final', name: '决赛' }
]

const columns = computed(() =>
  rounds.map((r) => ({
    ...r,
    matches: store.knockoutMatches.filter((m) => m.stage === r.key)
  }))
)
</script>

<template>
  <div class="bracket card">
    <div class="bracket-scroll">
      <div v-for="col in columns" :key="col.key" class="col">
        <div class="col-head">{{ col.name }}</div>
        <div class="col-matches" :class="col.key">
          <div v-for="m in col.matches" :key="m.id" class="ko-match">
            <div class="ko-team">
              <span>{{ store.getTeam(m.home)?.name || m.homeLabel || '待定' }}</span>
              <span class="mono">{{ m.homeGoals ?? '-' }}</span>
            </div>
            <div class="ko-team">
              <span>{{ store.getTeam(m.away)?.name || m.awayLabel || '待定' }}</span>
              <span class="mono">{{ m.awayGoals ?? '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p class="hint muted">淘汰赛对阵将在小组赛结束后确定（当前为占位结构）。</p>
  </div>
</template>

<style scoped>
.bracket { padding: 18px; }
.bracket-scroll { display: flex; gap: 28px; overflow-x: auto; padding-bottom: 8px; }
.col { display: flex; flex-direction: column; min-width: 180px; }
.col-head {
  text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--accent);
  margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.col-matches { display: flex; flex-direction: column; justify-content: space-around; flex: 1; gap: 12px; }
.ko-match {
  background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px;
  overflow: hidden;
}
.ko-team {
  display: flex; justify-content: space-between; padding: 8px 12px; font-size: 0.84rem;
}
.ko-team:first-child { border-bottom: 1px solid var(--border); }
.ko-team .mono { color: var(--text-mute); }
.hint { font-size: 0.74rem; margin-top: 14px; text-align: center; }
</style>
