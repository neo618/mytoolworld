<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ plugin?.name || '插件' }}</div>
        <div class="page-subtitle">{{ plugin?.category }} · v{{ plugin?.version }}</div>
      </div>
    </div>

    <component v-if="pluginComponent" :is="pluginComponent" />

    <iframe
      v-else-if="plugin && plugin.entry"
      class="plugin-iframe card"
      :src="`plugin://${plugin.id}/${plugin.entry}`"
    ></iframe>

    <div v-else class="plugin-frame card">
      <div class="frame-body">
        <div class="frame-icon" :class="plugin?.icon">
          <PluginIcon :type="plugin?.icon" :size="26" />
        </div>
        <div class="frame-name">{{ plugin?.name }}</div>
        <div class="frame-note">插件界面开发中，敬请期待</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import PluginIcon from '@/components/PluginIcon.vue'
import TaskManager from '@/plugins/TaskManager.vue'
import Calculator from '@/plugins/Calculator.vue'
import DouyinCourse from '@/plugins/DouyinCourse.vue'

const route = useRoute()
const store = useAppStore()
const plugin = computed(() => store.plugins.find(p => p.id === route.params.id))

const componentMap = {
  'task-manager': TaskManager,
  'calculator': Calculator,
  'douyin-course': DouyinCourse
}
const pluginComponent = computed(() => componentMap[route.params.id] || null)
</script>

<style scoped>
.page-header { margin-bottom: 22px; }
.page-title { font-size: 24px; font-weight: 600; }
.page-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
.plugin-iframe {
  width: 100%;
  height: calc(100vh - var(--topbar-h) - 150px);
  border: 1px solid var(--border-light);
  background: #fff;
}
.plugin-frame { min-height: 420px; display: flex; }
.frame-body {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 40px;
}
.frame-icon {
  width: 64px; height: 64px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
}
.frame-icon.task { background: #eff6ff; color: #2563eb; }
.frame-icon.calc { background: #ecfdf5; color: #059669; }
.frame-icon.course { background: #faf5ff; color: #7c3aed; }
.frame-name { font-size: 18px; font-weight: 600; }
.frame-note {
  margin-top: 10px;
  font-size: 13px; color: var(--text-muted);
  background: var(--bg-root);
  padding: 6px 16px; border-radius: 14px;
}
</style>
