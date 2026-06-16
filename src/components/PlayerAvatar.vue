<script setup>
// 球员头像：有 photo 则显示真实照片，否则用姓名首字母生成的彩色头像（占位，合规）。
import { ref, computed, watch } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  photo: { type: String, default: null },
  size: { type: Number, default: 44 }
})

const failed = ref(false)
watch(() => props.photo, () => { failed.value = false })

const showImg = computed(() => props.photo && !failed.value)
const initials = computed(() =>
  (props.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?'
)
// 由姓名稳定生成一个柔和背景色
const bg = computed(() => {
  let h = 0
  for (const ch of props.name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `hsl(${h % 360}, 42%, 32%)`
})
</script>

<template>
  <span class="pa" :style="{ width: size + 'px', height: size + 'px', background: showImg ? '#0b1020' : bg }">
    <img v-if="showImg" :src="photo" :alt="name" loading="lazy" @error="failed = true" />
    <span v-else class="ini" :style="{ fontSize: size * 0.34 + 'px' }">{{ initials }}</span>
  </span>
</template>

<style scoped>
.pa { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border); }
.pa img { width: 100%; height: 100%; object-fit: cover; }
.ini { color: #fff; font-weight: 700; letter-spacing: 0.5px; }
</style>
