<script setup>
defineProps({
  label: String,
  value: [String, Number],
  sub: String,
  icon: String,
  accent: { type: String, default: 'var(--primary)' }
})
</script>

<template>
  <div class="stat card">
    <div class="icon" :style="{ color: accent }">{{ icon }}</div>
    <div class="body">
      <div class="value mono" :style="{ color: accent }">{{ value }}</div>
      <div class="label">{{ label }}</div>
      <div class="sub muted" v-if="sub">{{ sub }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat { padding: 18px; display: flex; gap: 14px; align-items: center; }
.icon { font-size: 1.8rem; line-height: 1; }
.value { font-size: 1.9rem; font-weight: 800; line-height: 1.1; }
.label { font-size: 0.82rem; color: var(--text-dim); margin-top: 2px; }
.sub { font-size: 0.72rem; margin-top: 3px; }
</style>
