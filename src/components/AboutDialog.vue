<template>
  <Teleport to="body">
    <transition name="dialog-fade">
      <div v-if="visible" class="about-overlay" @click.self="close">
        <div class="about-dialog">
          <div class="about-dialog-header">
            <span class="about-dialog-title">关于</span>
            <button class="about-dialog-close" @click="close">&times;</button>
          </div>

          <div class="about-dialog-body">
            <div class="about-brand">
              <img src="/app-icon.png" alt="我的工具世界" class="about-icon-img" />
              <div class="about-name">我的工具世界</div>
              <div class="about-version">版本 {{ version }}</div>
            </div>

            <div class="about-desc">自己写的AI小软件，终于有了一个共同的家。</div>

            <div class="about-pain-points">
              <div class="about-pain-item">
                <span class="about-pain-icon">🔧</span>
                <div>
                  <div class="about-pain-title">小工具越来越多，找起来头疼</div>
                  <div class="about-pain-desc">全塞进一个工作台，分类清晰即搜即用</div>
                </div>
              </div>
              <div class="about-pain-item">
                <span class="about-pain-icon">🤖</span>
                <div>
                  <div class="about-pain-title">每次用都要手动启动，流程割裂</div>
                  <div class="about-pain-desc">插件式管理，常用工具一键唤起</div>
                </div>
              </div>
              <div class="about-pain-item">
                <span class="about-pain-icon">🎨</span>
                <div>
                  <div class="about-pain-title">每加一个新功能就得改主程序</div>
                  <div class="about-pain-desc">插件化扩展，新增AI工具零侵入</div>
                </div>
              </div>
            </div>

            <div class="about-support">
              <div class="about-support-header">💚 如果觉得好用</div>
              <div class="about-support-text">用爱发电不易，你的支持是我持续打磨下去的动力</div>
              <div class="about-qr-wrapper">
                <img src="/wechat-pay.png" alt="微信赞赏码" class="about-qr" />
                <div class="about-qr-label">微信扫码 · 请我喝杯咖啡 ☕</div>
              </div>
            </div>
          </div>

          <div class="about-dialog-footer">
            <button class="about-btn" @click="close">确定</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const version = ref('1.0.0')

let removeListener = null

onMounted(async () => {
  if (window.electronAPI) {
    version.value = await window.electronAPI.getAppVersion()
    console.log('[AboutDialog] Mounted, electronAPI available')
    if (window.electronAPI.onShowAbout) {
      removeListener = window.electronAPI.onShowAbout(() => {
        console.log('[AboutDialog] Received showAbout event!')
        visible.value = true
      })
      console.log('[AboutDialog] Listener registered')
    } else {
      console.error('[AboutDialog] onShowAbout not found on electronAPI!')
    }
  } else {
    console.error('[AboutDialog] electronAPI not available!')
  }
})

onUnmounted(() => {
  if (removeListener) removeListener()
})

function close() {
  visible.value = false
}
</script>

<style scoped>
.about-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
}
.about-dialog {
  width: 440px; max-height: 85vh; overflow-y: auto;
  background: #fff; border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex; flex-direction: column;
}
.about-dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.about-dialog-title { font-size: 15px; font-weight: 600; color: #333; }
.about-dialog-close {
  width: 28px; height: 28px;
  border: none; background: none;
  font-size: 20px; color: #999; cursor: pointer;
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.about-dialog-close:hover { background: #f0f0f0; color: #333; }

.about-dialog-body {
  padding: 24px 28px 20px;
  flex: 1; overflow-y: auto;
}
.about-brand {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 16px;
}
.about-icon-img {
  width: 64px; height: 64px; border-radius: 16px;
  margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.about-name { font-size: 18px; font-weight: 600; color: #7c3aed; }
.about-version { font-size: 13px; color: #888; margin-top: 2px; }

.about-desc {
  text-align: center; font-size: 14px; color: #555;
  margin-bottom: 18px; padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.about-pain-points {
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 16px;
}
.about-pain-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px;
  background: #f8f9fb; border-radius: 8px;
}
.about-pain-icon { font-size: 18px; line-height: 1.4; flex-shrink: 0; }
.about-pain-title { font-size: 13px; font-weight: 500; color: #333; }
.about-pain-desc { font-size: 12px; color: #999; margin-top: 2px; }

.about-support {
  text-align: center;
  padding: 18px 20px 20px;
  background: #f8f9fb; border-radius: 10px;
  border: 1px solid #eee;
}
.about-support-header { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 4px; }
.about-support-text { font-size: 13px; color: #999; margin-bottom: 14px; }
.about-qr-wrapper { display: inline-flex; flex-direction: column; align-items: center; }
.about-qr {
  width: 160px; height: auto; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.about-qr-label {
  margin-top: 8px; font-size: 13px; color: #7c3aed; font-weight: 500;
}

.about-dialog-footer {
  padding: 14px 20px;
  border-top: 1px solid #eee;
  display: flex; justify-content: flex-end;
  flex-shrink: 0;
}
.about-btn {
  padding: 7px 24px; border-radius: 6px;
  background: #fff; border: 1.5px solid #7c3aed;
  color: #333; font-size: 14px; cursor: pointer;
  transition: all 0.15s;
}
.about-btn:hover { background: #f5f3ff; }

.dialog-fade-enter-active,
.dialog-fade-leave-active { transition: opacity 0.2s; }
.dialog-fade-enter-from,
.dialog-fade-leave-to { opacity: 0; }
</style>
