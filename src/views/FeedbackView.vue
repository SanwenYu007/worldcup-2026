<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

// 意见反馈页：
// - 访客提交的意见保存到浏览器 localStorage（刷新保留）。
// - public/feedback.json 是维护者精选/官方意见，所有人可见、后续更新。
// - 页面同时展示「官方精选」与「本机提交」两部分。

const LS_KEY = 'wc2026-feedback'

const name = ref('')
const content = ref('')
const submitted = ref(false)
const localItems = ref([])
const seedItems = ref([])

function loadLocal() {
  try {
    localItems.value = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    localItems.value = []
  }
}

async function loadSeed() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}feedback.json`, { cache: 'no-cache' })
    if (res.ok) {
      const data = await res.json()
      seedItems.value = data.items || []
    }
  } catch {
    seedItems.value = []
  }
}

onMounted(() => { loadLocal(); loadSeed() })

function submit() {
  const text = content.value.trim()
  if (!text) return
  const item = { name: name.value.trim() || t('common.anon'), content: text, date: new Date().toISOString() }
  const next = [item, ...localItems.value]
  localItems.value = next
  localStorage.setItem(LS_KEY, JSON.stringify(next))
  content.value = ''
  submitted.value = true
  setTimeout(() => { submitted.value = false }, 2500)
}

function removeLocal(idx) {
  const next = localItems.value.filter((_, i) => i !== idx)
  localItems.value = next
  localStorage.setItem(LS_KEY, JSON.stringify(next))
}

const fmt = (d) => new Date(d).toLocaleString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
const allCount = computed(() => seedItems.value.length + localItems.value.length)
</script>

<template>
  <div class="view">
    <div class="head">
      <h2>{{ t('feedback.title') }}</h2>
      <span class="muted">{{ t('feedback.count', { n: allCount }) }}</span>
    </div>
    <p class="lead muted">{{ t('feedback.lead') }}</p>

    <!-- 提交表单 -->
    <div class="form card">
      <input class="name" v-model="name" maxlength="20" :placeholder="t('feedback.namePlaceholder')" />
      <textarea v-model="content" maxlength="500" rows="3" :placeholder="t('feedback.contentPlaceholder')" @keydown.ctrl.enter="submit" @keydown.meta.enter="submit"></textarea>
      <div class="form-foot">
        <span class="hint muted" :class="{ ok: submitted }">{{ submitted ? t('feedback.submitted') : `${content.length}/500 · Ctrl/⌘+Enter` }}</span>
        <button class="submit" :disabled="!content.trim()" @click="submit">{{ t('feedback.submit') }}</button>
      </div>
    </div>

    <!-- 官方精选 -->
    <div class="section-title">{{ t('feedback.official') }} <small class="muted">{{ t('feedback.officialNote') }}</small></div>
    <div class="list">
      <div v-for="(it, i) in seedItems" :key="'s' + i" class="fb card official">
        <div class="fb-head"><span class="who">{{ it.name }}</span><span class="badge">{{ t('feedback.officialTag') }}</span><span class="when muted">{{ fmt(it.date) }}</span></div>
        <p class="fb-body">{{ it.content }}</p>
      </div>
      <div v-if="!seedItems.length" class="empty muted">{{ t('feedback.noOfficial') }}</div>
    </div>

    <!-- 本机提交 -->
    <div class="section-title">{{ t('feedback.mine') }} <small class="muted">{{ t('feedback.mineNote') }}</small></div>
    <div class="list">
      <div v-for="(it, i) in localItems" :key="'l' + i" class="fb card">
        <div class="fb-head">
          <span class="who">{{ it.name }}</span>
          <span class="when muted">{{ fmt(it.date) }}</span>
          <button class="del" @click="removeLocal(i)">{{ t('feedback.delete') }}</button>
        </div>
        <p class="fb-body">{{ it.content }}</p>
      </div>
      <div v-if="!localItems.length" class="empty muted">{{ t('feedback.noMine') }}</div>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 24px 0 8px; }
.head h2 { font-size: 1.4rem; font-weight: 800; }
.lead { font-size: 0.86rem; margin-bottom: 16px; }

.form { padding: 16px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
.form .name { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 9px 12px; font-size: 0.9rem; max-width: 220px; }
.form textarea { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 10px 12px; font-size: 0.92rem; resize: vertical; font-family: inherit; line-height: 1.5; }
.form .name:focus, .form textarea:focus { outline: none; border-color: var(--primary-dim); }
.form-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.hint { font-size: 0.76rem; }
.hint.ok { color: var(--primary); font-weight: 600; }
.submit { background: var(--primary); color: #06231b; font-weight: 700; border: none; border-radius: 8px; padding: 8px 22px; font-size: 0.9rem; }
.submit:disabled { opacity: 0.45; cursor: not-allowed; }

.list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
.fb { padding: 14px 16px; }
.fb.official { border-color: rgba(255, 209, 102, 0.35); }
.fb-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.who { font-weight: 700; font-size: 0.9rem; }
.badge { font-size: 0.66rem; font-weight: 700; color: #2a1d00; background: var(--accent); padding: 1px 7px; border-radius: 999px; }
.when { font-size: 0.74rem; }
.del { margin-left: auto; font-size: 0.74rem; color: var(--text-mute); background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 2px 10px; }
.del:hover { color: var(--danger); border-color: var(--danger); }
.fb-body { font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.empty { padding: 18px; text-align: center; font-size: 0.85rem; }
.section-title small { font-weight: 400; font-size: 0.78rem; }
</style>
