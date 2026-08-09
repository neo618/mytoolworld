<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="/app-icon.png" alt="Logo" class="sidebar-logo" />
      <span class="title">我的工具世界</span>
      <span class="version">v1.0</span>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :class="{ active: isActive('/') }">
        <span class="icon">⌂</span>
        <span>首页</span>
      </router-link>

      <div v-for="(items, cat) in store.categories" :key="cat" class="nav-group">
        <div class="group-header" @click="toggleGroup(cat)">
          <span class="arrow" :class="{ open: !collapsed[cat] }">▸</span>
          <span class="group-label">{{ cat }}</span>
        </div>
        <div class="group-items" :style="{ maxHeight: collapsed[cat] ? '0px' : (items.length * 40) + 'px' }">
          <router-link
            v-for="p in items"
            :key="p.id"
            :to="'/plugin/' + p.id"
            class="nav-item"
            :class="{ active: isActive('/plugin/' + p.id) }"
          >
            <span class="icon"><PluginIcon :type="p.icon" :size="18" /></span>
            <span>{{ p.name }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/plugins" class="nav-item flat" :class="{ active: isActive('/plugins') }">
        <span class="icon">⚙</span>
        <span>插件管理</span>
        <span class="badge">{{ store.enabledPlugins.length }}</span>
      </router-link>
      <router-link to="/settings" class="nav-item flat" :class="{ active: isActive('/settings') }">
        <span class="icon">☰</span>
        <span>设置</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import PluginIcon from './PluginIcon.vue'

const store = useAppStore()
const route = useRoute()
const collapsed = reactive({})

function toggleGroup(cat) { collapsed[cat] = !collapsed[cat] }
function isActive(path) { return route.path === path }
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  background: var(--bg-surface);
  border-right: 1px solid var(--border-light);
  display: flex; flex-direction: column; flex-shrink: 0;
}
.sidebar-header {
  padding: 0 18px; height: var(--topbar-h);
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border-light);
}
.sidebar-logo {
  width: 34px; height: 34px;
  border-radius: 8px; object-fit: cover;
}
.title { font-size: 16px; font-weight: 600; }
.version { font-size: 12px; color: var(--text-muted); margin-left: auto; }
.sidebar-nav { flex: 1; overflow-y: auto; padding: 10px 0; }
.nav-group { margin-bottom: 2px; }
.group-header {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; cursor: pointer;
}
.group-header:hover { background: var(--bg-hover); }
.arrow { font-size: 10px; color: var(--text-muted); transition: transform var(--transition); }
.arrow.open { transform: rotate(90deg); }
.group-label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-muted); }
.group-items { overflow: hidden; transition: max-height 0.25s ease; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 18px 9px 34px;
  font-size: 14px; font-weight: 500;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  transition: all var(--transition);
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.nav-item.active {
  color: var(--accent);
  background: var(--accent-soft);
  border-left-color: var(--accent);
}
.icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.badge {
  margin-left: auto; font-size: 11px;
  background: var(--accent-soft); color: var(--accent);
  padding: 1px 7px; border-radius: 10px; font-weight: 600;
}
.sidebar-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--border-light);
  display: flex; flex-direction: column; gap: 2px;
}
.nav-item.flat { padding: 9px 10px; border-left: none; border-radius: var(--radius-sm); }
</style>
