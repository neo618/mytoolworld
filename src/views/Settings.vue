<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">设置</div>
        <div class="page-subtitle">管理应用偏好与信息</div>
      </div>
    </div>

    <div class="settings-grid">
      <div class="card section">
        <div class="section-title">外观</div>
        <div class="setting-row">
          <div>
            <div class="setting-label">主题色</div>
            <div class="setting-desc">作用于侧边栏、顶部栏、按钮等框架元素</div>
          </div>
          <div class="theme-value" @click="showPicker = !showPicker">
            <span class="theme-dot"></span>
            {{ store.accent.name }}
          </div>
        </div>
        <div v-if="showPicker" class="presets-row">
          <div
            v-for="(p, i) in presets"
            :key="i"
            class="preset"
            :class="{ active: store.accent.name === p.name }"
            :style="{ background: `hsl(${p.h},${p.s},${p.l})` }"
            :title="p.name"
            @click="store.setAccent(p)"
          ></div>
        </div>
        <div class="setting-row" style="border:none">
          <div>
            <div class="setting-label">语言</div>
            <div class="setting-desc">界面语言设置</div>
          </div>
          <span class="value">简体中文</span>
        </div>
      </div>

      <div class="card section">
        <div class="section-title">关于</div>
        <div class="about-desc">自己写的AI小软件，终于有了一个共同的家。</div>
        <div class="pain-points">
          <div class="pain-item">
            <span class="pain-icon">🔧</span>
            <div>
              <div class="pain-title">小工具越来越多，找起来头疼</div>
              <div class="pain-desc">全塞进一个工作台，分类清晰即搜即用</div>
            </div>
          </div>
          <div class="pain-item">
            <span class="pain-icon">🤖</span>
            <div>
              <div class="pain-title">每次用都要手动启动，流程割裂</div>
              <div class="pain-desc">插件式管理，常用工具一键唤起</div>
            </div>
          </div>
          <div class="pain-item">
            <span class="pain-icon">🎨</span>
            <div>
              <div class="pain-title">每加一个新功能就得改主程序</div>
              <div class="pain-desc">插件化扩展，新增AI工具零侵入</div>
            </div>
          </div>
        </div>
        <div class="support-box">
          <div class="support-header">💚 如果觉得好用</div>
          <div class="support-text">用爱发电不易，你的支持是我持续打磨下去的动力</div>
          <div class="support-qr-wrapper">
            <img src="/wechat-pay.png" alt="微信赞赏码" class="support-qr" />
            <div class="support-qr-label">微信扫码 · 请我喝杯咖啡 ☕</div>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">应用版本</div>
          <span class="value">v{{ version }}</span>
        </div>
        <div class="setting-row">
          <div class="setting-label">技术栈</div>
          <span class="tech">Vue 3 + Vite + Electron + Pinia</span>
        </div>
        <div class="setting-row" style="border:none">
          <div class="setting-label">检查更新</div>
          <button class="btn btn-sm btn-outline" @click="checkUpdate">手动检测</button>
        </div>
      </div>

      <div class="card section">
        <div class="section-title">插件</div>
        <div class="setting-row" style="border:none">
          <div>
            <div class="setting-label">已安装插件</div>
            <div class="setting-desc">共 {{ store.plugins.length }} 个，{{ store.enabledPlugins.length }} 个已启用</div>
          </div>
          <router-link to="/plugins" class="btn btn-sm btn-outline">进入管理</router-link>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const showPicker = ref(false)
const version = ref('1.0.0')
const toast = ref('')

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

onMounted(async () => {
  if (window.electronAPI) {
    version.value = await window.electronAPI.getAppVersion()
  }
})

function checkUpdate() {
  toast.value = '当前已是最新版本'
  setTimeout(() => { toast.value = '' }, 2000)
}
</script>

<style scoped>
.page-header { margin-bottom: 22px; }
.page-title { font-size: 24px; font-weight: 600; }
.page-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
.settings-grid { display: grid; gap: 20px; max-width: 640px; }
.section { padding: 22px 26px; }
.section-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid var(--border-light);
}
.about-desc {
  font-size: 15px; color: var(--text-primary); line-height: 1.6;
  margin-bottom: 16px; padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
}
.pain-points { display: flex; flex-direction: column; gap: 12px; margin-bottom: 8px; }
.pain-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px;
  background: var(--bg-subtle, #f8f9fb);
  border-radius: var(--radius-sm, 8px);
}
.pain-icon { font-size: 18px; line-height: 1.4; flex-shrink: 0; }
.pain-title { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.pain-desc { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.support-box {
  margin: 8px 0 6px;
  padding: 18px 20px 20px;
  background: var(--bg-subtle, #f8f9fb);
  border-radius: var(--radius-sm, 10px);
  border: 1px solid var(--border-light);
  text-align: center;
}
.support-header {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  margin-bottom: 4px;
}
.support-text {
  font-size: 13px; color: var(--text-muted);
  margin-bottom: 16px;
}
.support-qr-wrapper { display: inline-flex; flex-direction: column; align-items: center; }
.support-qr {
  width: 180px; height: auto;
  border-radius: var(--radius-sm, 8px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.support-qr-label {
  margin-top: 10px;
  font-size: 13px; color: var(--accent);
  font-weight: 500;
}
.setting-label { font-size: 15px; font-weight: 500; }
.setting-desc { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.value { font-size: 14px; color: var(--accent); font-weight: 500; }
.tech { font-size: 13.5px; color: var(--text-secondary); }
.theme-value {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: var(--accent); font-weight: 500;
  cursor: pointer;
}
.theme-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--accent); }
.presets-row {
  display: flex; gap: 10px; flex-wrap: wrap;
  padding: 6px 0 14px;
  border-bottom: 1px solid var(--border-light);
}
.preset {
  width: 34px; height: 34px; border-radius: 50%;
  cursor: pointer; border: 2px solid transparent;
  transition: all var(--transition);
}
.preset:hover { transform: scale(1.1); }
.preset.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--border); }
.toast {
  position: fixed; bottom: 32px; left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary); color: #fff;
  border-radius: var(--radius-sm);
  padding: 10px 22px;
  font-size: 13px;
  box-shadow: var(--shadow-lg);
  z-index: 300;
  animation: toast-in 0.2s ease-out;
}
</style>
