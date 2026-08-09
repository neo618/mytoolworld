<template>
  <Teleport to="body">
    <transition name="dialog-fade">
      <div v-if="visible" class="guide-overlay" @click.self="close">
        <div class="guide-dialog">
          <div class="guide-header">
            <span class="guide-title">如何增加一个新的插件</span>
            <button class="guide-close" @click="close">&times;</button>
          </div>

          <div class="guide-body">
            <div class="guide-intro">💡 使用 AI Code 快速开发你的专属插件</div>

            <!-- Step 1 -->
            <div class="guide-step">
              <div class="guide-step-header">
                <span class="guide-step-num">第 1 步</span>
                <span class="guide-step-icon">📋</span>
              </div>
              <div class="guide-step-title">复制下面的 Prompt，粘贴给 AI Code</div>
              <div class="guide-prompt-box">
                <pre class="guide-prompt-text">{{ promptText }}</pre>
                <button class="guide-copy-btn" @click="copyPrompt">{{ copied ? '✅ 已复制' : '📋 一键复制' }}</button>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="guide-step">
              <div class="guide-step-header">
                <span class="guide-step-num">第 2 步</span>
                <span class="guide-step-icon">📦</span>
              </div>
              <div class="guide-step-title">将 AI 生成的文件打包为 .zip</div>
              <div class="guide-step-desc">
                确保 zip 根目录直接包含 plugin.json，不要在外面多套一层文件夹
              </div>
            </div>

            <!-- Step 3 -->
            <div class="guide-step">
              <div class="guide-step-header">
                <span class="guide-step-num">第 3 步</span>
                <span class="guide-step-icon">📥</span>
              </div>
              <div class="guide-step-title">导入插件</div>
              <div class="guide-step-desc">
                打开「插件管理」→ 点击「导入」→ 选择 .zip 文件 → 插件即刻出现在侧边栏
              </div>
            </div>
          </div>

          <div class="guide-footer">
            <button class="guide-btn" @click="close">确定</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const copied = ref(false)

const promptText = `请帮我开发一个 MyToolWorld 外部插件。

【插件规范】
- 纯 HTML/CSS/JS，单页面应用
- 需要 plugin.json 配置文件
- 通过 window.workbench API 与宿主通信
- 数据存储用 workbench.data.load(key) / workbench.data.save(key, value)
- 文件操作用 workbench.fs.readFile(path) / workbench.fs.writeFile(path, data)

【plugin.json 格式】
{
  "id": "com.example.your-tool",
  "name": "你的工具名",
  "version": "1.0.0",
  "description": "一句话描述",
  "author": "你的名字",
  "category": "办公工具",
  "main": "index.html"
}

【可用的宿主 API】
window.workbench.app.getVersion()    → 获取工作台版本号
window.workbench.app.getTheme()      → 获取当前主题色 { h, s, l, name }
window.workbench.data.getPath()      → 获取插件数据目录路径
window.workbench.data.load(key)      → 读取持久化数据（自动反序列化）
window.workbench.data.save(key, val) → 保存持久化数据（自动序列化）
window.workbench.fs.readFile(path)   → 读取文本文件
window.workbench.fs.writeFile(path, data) → 写入文本文件

【打包要求】
- zip 根目录直接包含 plugin.json 和 index.html
- 不要在 zip 里多套一层文件夹
- 将插件文件夹直接压缩为 .zip 即可

【我的需求】
帮我写一个 __________ 工具

请输出完整的 plugin.json 和 index.html 代码，然后告诉我如何打包成 zip 文件。`

let removeListener = null

onMounted(() => {
  if (window.electronAPI && window.electronAPI.onShowPluginGuide) {
    removeListener = window.electronAPI.onShowPluginGuide(() => {
      visible.value = true
    })
  }
})

onUnmounted(() => {
  if (removeListener) removeListener()
})

function close() {
  visible.value = false
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(promptText)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = promptText
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.guide-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
}
.guide-dialog {
  width: 560px; max-height: 85vh;
  background: #fff; border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex; flex-direction: column;
}
.guide-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.guide-title { font-size: 15px; font-weight: 600; color: #333; }
.guide-close {
  width: 28px; height: 28px;
  border: none; background: none;
  font-size: 20px; color: #999; cursor: pointer;
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.guide-close:hover { background: #f0f0f0; color: #333; }

.guide-body {
  padding: 20px 24px;
  flex: 1; overflow-y: auto;
}
.guide-intro {
  text-align: center; font-size: 15px; color: #555;
  margin-bottom: 20px; padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.guide-step {
  margin-bottom: 18px;
  padding: 14px 16px;
  background: #f8f9fb; border-radius: 10px;
  border: 1px solid #eee;
}
.guide-step-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 6px;
}
.guide-step-num {
  font-size: 13px; font-weight: 600; color: #7c3aed;
  background: #ede9fe; padding: 2px 8px; border-radius: 4px;
}
.guide-step-icon { font-size: 16px; }
.guide-step-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
.guide-step-desc { font-size: 13px; color: #888; line-height: 1.5; }

.guide-prompt-box {
  margin-top: 8px;
  background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
  overflow: hidden;
}
.guide-prompt-text {
  padding: 14px 16px;
  font-size: 12px; line-height: 1.7; color: #555;
  font-family: 'Consolas', 'Courier New', monospace;
  white-space: pre-wrap; word-break: break-all;
  max-height: 260px; overflow-y: auto;
  margin: 0;
}
.guide-copy-btn {
  display: block; width: 100%;
  padding: 8px 0;
  border: none; border-top: 1px solid #eee;
  background: #fafafa;
  font-size: 13px; color: #7c3aed; font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.guide-copy-btn:hover { background: #f5f3ff; }

.guide-footer {
  padding: 14px 20px;
  border-top: 1px solid #eee;
  display: flex; justify-content: flex-end;
  flex-shrink: 0;
}
.guide-btn {
  padding: 7px 24px; border-radius: 6px;
  background: #fff; border: 1.5px solid #7c3aed;
  color: #333; font-size: 14px; cursor: pointer;
  transition: all 0.15s;
}
.guide-btn:hover { background: #f5f3ff; }

.dialog-fade-enter-active,
.dialog-fade-leave-active { transition: opacity 0.2s; }
.dialog-fade-enter-from,
.dialog-fade-leave-to { opacity: 0; }
</style>
