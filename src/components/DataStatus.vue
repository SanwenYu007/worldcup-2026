<script setup>
// 数据可信度标识：展示赛程/赔率/AI预测各自的来源与更新时间，让用户清楚数据是否新鲜、是真实还是示例。
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const { t, locale } = useI18n()
const fmt = (d) => (d ? new Date(d).toLocaleString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')

const items = computed(() => [
  {
    label: t('dataStatus.schedule'), time: store.meta?.fetchedAt,
    tag: store.source === 'live' ? t('common.realData') : t('common.sample'), live: store.source === 'live'
  },
  {
    label: t('dataStatus.odds'), time: store.oddsFeed?.fetchedAt,
    tag: store.oddsSource === 'sporttery' ? t('dataStatus.sportteryLive') : t('dataStatus.modelOdds'), live: store.oddsSource === 'sporttery'
  },
  {
    label: t('dataStatus.predictions'), time: store.predictions?.generatedAt,
    tag: store.predictions?.modelLabel || '—',
    live: !!store.predictions?.generatedAt && store.predictions?.model !== 'seed'
  }
])
</script>

<template>
  <div class="datastatus card">
    <div v-for="it in items" :key="it.label" class="ds-item">
      <span class="ds-dot" :class="{ on: it.live }"></span>
      <div class="ds-text">
        <div class="ds-top"><b>{{ it.label }}</b><span class="ds-tag" :class="{ live: it.live }">{{ it.tag }}</span></div>
        <div class="ds-time">{{ t('common.updatedAt') }} {{ fmt(it.time) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.datastatus { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 14px 18px; margin-top: 16px; }
.ds-item { display: flex; align-items: flex-start; gap: 9px; padding: 0 6px; }
.ds-item + .ds-item { border-left: 1px solid var(--border); }
.ds-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-mute); margin-top: 5px; flex-shrink: 0; }
.ds-dot.on { background: var(--primary); box-shadow: 0 0 0 3px rgba(45, 212, 167, 0.2); }
.ds-top { display: flex; align-items: center; gap: 8px; }
.ds-top b { font-size: 0.9rem; }
.ds-tag { font-size: 0.68rem; padding: 1px 7px; border-radius: 999px; background: var(--bg-soft); color: var(--text-mute); border: 1px solid var(--border); }
.ds-tag.live { color: var(--primary); border-color: var(--primary-dim); }
.ds-time { font-size: 0.72rem; color: var(--text-mute); margin-top: 3px; }
@media (max-width: 640px) {
  .datastatus { grid-template-columns: 1fr; gap: 10px; }
  .ds-item + .ds-item { border-left: none; border-top: 1px solid var(--border); padding-top: 10px; }
}
</style>
