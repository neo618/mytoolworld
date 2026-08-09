<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ greeting }}</div>
        <div class="page-subtitle">{{ today }}</div>
      </div>
      <router-link to="/plugins" class="btn btn-outline">插件管理 →</router-link>
    </div>

    <div class="section-header">
      <span class="section-label">常用插件</span>
      <router-link to="/plugins" class="section-link">查看全部</router-link>
    </div>
    <div class="plugin-grid">
      <div
        v-for="p in store.frequentPlugins"
        :key="p.id"
        class="plugin-card"
        @click="open(p)"
      >
        <div class="card-icon" :class="p.icon">
          <PluginIcon :type="p.icon" :size="24" />
        </div>
        <div class="card-info">
          <div class="card-name">{{ p.name }}</div>
          <div class="card-desc">{{ p.desc }}</div>
          <div class="card-meta">
            <span class="card-badge">{{ p.category }}</span>
            <span>v{{ p.version }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-header">
      <span class="section-label">最近使用</span>
    </div>
    <div class="card recent-card">
      <div
        v-for="p in store.recentPlugins"
        :key="p.id"
        class="recent-item"
        @click="open(p)"
      >
        <div class="recent-icon" :class="p.icon">
          <PluginIcon :type="p.icon" :size="18" />
        </div>
        <div class="recent-name">{{ p.name }}</div>
        <div class="recent-time">{{ formatTime(p.lastOpen) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import PluginIcon from '@/components/PluginIcon.vue'

const store = useAppStore()
const router = useRouter()

const hour = new Date().getHours()
const greeting = computed(() => {
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})
const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

function open(p) {
  store.recordOpen(p.id)
  router.push('/plugin/' + p.id)
}
function formatTime(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins + ' 分钟前'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + ' 小时前'
  return Math.floor(hours / 24) + ' 天前'
}
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 24px; font-weight: 600; letter-spacing: -0.01em; }
.page-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-label { font-size: 13px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-muted); }
.section-link { font-size: 14px; color: var(--accent); font-weight: 500; }
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px; margin-bottom: 34px;
}
.plugin-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 20px;
  cursor: pointer;
  transition: all var(--transition);
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: var(--shadow-sm);
}
.plugin-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(16,24,40,0.08);
  transform: translateY(-2px);
}
.plugin-card:active { transform: scale(0.985); }
.card-icon {
  width: 48px; height: 48px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
}
.card-icon.task { background: #eff6ff; color: #2563eb; }
.card-icon.calc { background: #ecfdf5; color: #059669; }
.card-icon.course { background: #faf5ff; color: #7c3aed; }
.card-name { font-size: 15.5px; font-weight: 600; margin-bottom: 4px; }
.card-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
.card-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); margin-top: 8px; }
.card-badge {
  font-size: 11px; font-weight: 500;
  padding: 2px 8px; border-radius: 10px;
  background: var(--accent-soft); color: var(--accent);
}
.recent-card { padding: 6px; }
.recent-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  cursor: pointer; transition: background var(--transition);
}
.recent-item:hover { background: var(--bg-hover); }
.recent-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.recent-icon.task { background: #eff6ff; color: #2563eb; }
.recent-icon.calc { background: #ecfdf5; color: #059669; }
.recent-icon.course { background: #faf5ff; color: #7c3aed; }
.recent-name { font-size: 14.5px; font-weight: 500; flex: 1; }
.recent-time { font-size: 12.5px; color: var(--text-muted); }
</style>
