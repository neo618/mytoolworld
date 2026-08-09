<template>
  <div class="app" :style="accentVars">
    <Sidebar />
    <div class="main">
      <Topbar />
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
onMounted(() => store.init())
const accentVars = computed(() => {
  const h = store.accent.h
  const s = store.accent.s
  const l = store.accent.l
  return {
    '--accent-h': h,
    '--accent-s': s,
    '--accent-l': l,
    '--accent': `hsl(${h},${s},${l})`,
    '--accent-soft': `hsl(${h},${s},96%)`,
    '--accent-mid': `hsl(${h},${s},92%)`
  }
})
</script>

<style scoped>
.app { display: flex; height: 100%; }
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.content { flex: 1; overflow-y: auto; padding: 28px 32px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
