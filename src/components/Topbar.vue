<template>
  <header class="topbar">
    <div class="search-wrapper">
      <span class="search-icon">⌕</span>
      <input
        ref="searchInput"
        v-model="query"
        class="search-input"
        type="text"
        placeholder="搜索插件..."
        @focus="showResults = true"
        @blur="onBlur"
      />
      <span class="shortcut">Ctrl+K</span>
      <div v-if="showResults && query" class="search-results">
        <div v-if="filtered.length === 0" class="result-item empty">未找到匹配的插件</div>
        <div
          v-for="p in filtered"
          :key="p.id"
          class="result-item"
          @mousedown="goPlugin(p)"
        >
          <PluginIcon :type="p.icon" :size="18" />
          <span class="result-name" v-html="highlight(p.name)"></span>
          <span class="result-cat">{{ p.category }}</span>
        </div>
      </div>
    </div>
    <div class="spacer"></div>

    <div class="color-dot" :style="{ background: 'var(--accent)' }" @click="showPicker = !showPicker" title="主题色"></div>
    <div v-if="showPicker" class="picker-overlay" @click="showPicker = false"></div>
    <div v-if="showPicker" class="picker-popover">
      <div class="picker-label">主题色</div>
      <div class="presets">
        <div
          v-for="(p, i) in presets"
          :key="i"
          class="preset"
          :class="{ active: store.accent.name === p.name }"
          :style="{ background: `hsl(${p.h},${p.s},${p.l})` }"
          :title="p.name"
          @click="applyAccent(p)"
        ></div>
      </div>
    </div>

    <router-link to="/settings" class="topbar-action" title="设置">⚙</router-link>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import PluginIcon from './PluginIcon.vue'

const store = useAppStore()
const router = useRouter()
const query = ref('')
const showResults = ref(false)
const showPicker = ref(false)
const searchInput = ref(null)

const presets = [
  { name: '商务蓝', h: 221, s: '83%', l: '53%' },
  { name: '沉稳青', h: 192, s: '70%', l: '42%' },
  { name: '活力橙', h: 24, s: '90%', l: '50%' },
  { name: '雅致绿', h: 152, s: '60%', l: '40%' },
  { name: '深酒红', h: 348, s: '65%', l: '45%' },
  { name: '石墨灰', h: 215, s: '16%', l: '45%' },
  { name: '靛蓝紫', h: 258, s: '70%', l: '55%' },
  { name: '暖棕', h: 28, s: '45%', l: '42%' },
  { name: '天青', h: 205, s: '90%', l: '48%' },
  { name: '墨绿', h: 168, s: '55%', l: '36%' }
]

const filtered = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value
  return store.enabledPlugins.filter(p =>
    p.name.includes(q) || p.desc.includes(q) || p.category.includes(q)
  )
})

function highlight(name) {
  if (!query.value) return name
  return name.split(query.value).join(`<mark>${query.value}</mark>`)
}
function goPlugin(p) {
  store.recordOpen(p.id)
  router.push('/plugin/' + p.id)
  query.value = ''
  showResults.value = false
}
function onBlur() { setTimeout(() => { showResults.value = false }, 200) }
function applyAccent(p) { store.setAccent(p); showPicker.value = false }
function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
  if (e.key === 'Escape') { showResults.value = false; showPicker.value = false }
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.topbar {
  height: var(--topbar-h);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-light);
  display: flex; align-items: center;
  padding: 0 24px; gap: 14px;
  position: relative; z-index: 50;
}
.search-wrapper { flex: 1; max-width: 380px; position: relative; }
.search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 17px; pointer-events: none; }
.search-input {
  width: 100%; height: 38px;
  background: var(--bg-root);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 58px 0 38px;
  font-family: inherit; font-size: 14px;
  color: var(--text-primary); outline: none;
  transition: all var(--transition);
}
.search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1); background: var(--bg-surface); }
.search-input::placeholder { color: var(--text-muted); }
.shortcut {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-size: 10px; font-family: monospace;
  background: var(--bg-surface); color: var(--text-muted);
  padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border);
}
.spacer { flex: 1; }
.topbar-action {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-secondary); font-size: 17px;
  transition: all var(--transition);
}
.topbar-action:hover { background: var(--bg-hover); color: var(--text-primary); }
.color-dot {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px var(--border);
  cursor: pointer;
  transition: transform var(--transition);
}
.color-dot:hover { transform: scale(1.15); }
.picker-overlay { position: fixed; inset: 0; z-index: 90; }
.picker-popover {
  position: absolute; top: calc(var(--topbar-h) + 6px); right: 56px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px; box-shadow: var(--shadow-lg);
  z-index: 100; min-width: 240px;
}
.picker-label { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 12px; }
.presets { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.preset {
  width: 34px; height: 34px; border-radius: 50%;
  cursor: pointer; border: 2px solid transparent;
  transition: all var(--transition);
}
.preset:hover { transform: scale(1.1); }
.preset.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--border); }
.search-results {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden; z-index: 100;
}
.result-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; font-size: 13px;
  cursor: pointer; transition: background var(--transition);
  color: var(--text-secondary);
}
.result-item:hover { background: var(--bg-hover); }
.result-item.empty { color: var(--text-muted); cursor: default; }
.result-item.empty:hover { background: transparent; }
.result-name { color: var(--text-primary); font-weight: 500; }
.result-name :deep(mark) { background: none; color: var(--accent); font-weight: 600; }
.result-cat { font-size: 11px; color: var(--text-muted); margin-left: auto; }
</style>
