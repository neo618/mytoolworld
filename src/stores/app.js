import { defineStore } from 'pinia'

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem('mytoolworld:workbench:' + key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
function saveState(key, value) {
  localStorage.setItem('mytoolworld:workbench:' + key, JSON.stringify(value))
}

// Web 预览降级数据（Electron 环境会被真实注册表覆盖）
const FALLBACK_PLUGINS = [
  { id: 'task-manager', name: '个人任务管理', desc: '本地待办任务管理，支持优先级与截止日期', category: '办公工具', version: '1.0.0', enabled: true, icon: 'task', builtin: true, entry: null },
  { id: 'calculator', name: '大小写计算器', desc: '数学计算与中文财务大写金额转换', category: '实用工具', version: '1.0.0', enabled: true, icon: 'calc', builtin: true, entry: null },
  { id: 'douyin-course', name: '抖音课程管理', desc: '抖音视频链接收藏与学习进度管理', category: '学习工具', version: '1.0.0', enabled: true, icon: 'course', builtin: true, entry: null }
]

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export const useAppStore = defineStore('app', {
  state: () => ({
    ready: false,
    accent: loadState('accent', { name: '商务蓝', h: 221, s: '83%', l: '53%' }),
    plugins: FALLBACK_PLUGINS.map(p => ({ ...p, openCount: 0, lastOpen: 0 })),
    usage: loadState('usage', {}) // { id: { openCount, lastOpen } }
  }),
  getters: {
    enabledPlugins: (s) => s.plugins.filter(p => p.enabled),
    frequentPlugins: (s) =>
      [...s.plugins].filter(p => p.enabled)
        .sort((a, b) => (b.openCount || 0) - (a.openCount || 0)).slice(0, 6),
    recentPlugins: (s) =>
      [...s.plugins].filter(p => p.enabled && p.lastOpen)
        .sort((a, b) => b.lastOpen - a.lastOpen).slice(0, 5),
    categories: (s) => {
      const map = {}
      s.plugins.forEach(p => {
        if (!p.enabled) return
        if (!map[p.category]) map[p.category] = []
        map[p.category].push(p)
      })
      return map
    }
  },
  actions: {
    async init() {
      // 恢复使用统计
      Object.keys(this.usage).forEach(id => {
        const p = this.plugins.find(x => x.id === id)
        if (p) Object.assign(p, this.usage[id])
      })
      if (isElectron) {
        const reg = await window.electronAPI.plugins.scan()
        this.plugins = reg.plugins.map(p => ({
          ...p,
          openCount: this.usage[p.id]?.openCount || 0,
          lastOpen: this.usage[p.id]?.lastOpen || 0
        }))
      }
      this.ready = true
    },
    async togglePlugin(id) {
      const p = this.plugins.find(x => x.id === id)
      if (!p) return
      p.enabled = !p.enabled
      if (isElectron) await window.electronAPI.plugins.setEnabled(id, p.enabled)
    },
    async uninstallPlugin(id) {
      if (isElectron) {
        const r = await window.electronAPI.plugins.uninstall(id)
        if (!r.ok) throw new Error(r.error)
      }
      const idx = this.plugins.findIndex(x => x.id === id)
      if (idx >= 0) this.plugins.splice(idx, 1)
    },
    async importPlugin() {
      if (!isElectron) return { ok: false, error: '预览环境不支持' }
      const r = await window.electronAPI.plugins.importZip()
      if (r.ok) await this.init()
      return r
    },
    async exportPlugin(id) {
      if (!isElectron) return { ok: false, error: '预览环境不支持' }
      return await window.electronAPI.plugins.exportZip(id)
    },
    async persistOrder() {
      const ids = this.plugins.map(p => p.id)
      if (isElectron) await window.electronAPI.plugins.setOrder(ids)
    },
    recordOpen(id) {
      const p = this.plugins.find(x => x.id === id)
      if (!p) return
      p.openCount = (p.openCount || 0) + 1
      p.lastOpen = Date.now()
      this.usage[id] = { openCount: p.openCount, lastOpen: p.lastOpen }
      saveState('usage', this.usage)
    },
    setAccent(a) { this.accent = a; saveState('accent', a) }
  }
})
