<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">插件管理</div>
        <div class="page-subtitle">管理已安装的插件模块，支持导入、导出与拖拽排序</div>
      </div>
      <button class="btn btn-primary" @click="importPlugin">+ 导入插件</button>
    </div>

    <div class="card table-card">
      <table class="mgr-table">
        <thead>
          <tr>
            <th style="width:40px"></th>
            <th>插件名称</th>
            <th>版本</th>
            <th>分类</th>
            <th>来源</th>
            <th>描述</th>
            <th>状态</th>
            <th style="width:230px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in store.plugins"
            :key="p.id"
            draggable="true"
            :class="{ 'drag-over': dragOverId === p.id }"
            @dragstart="onDragStart(p.id, $event)"
            @dragover.prevent="dragOverId = p.id"
            @dragleave="dragOverId = null"
            @drop.prevent="onDrop(p.id)"
            @dragend="onDragEnd"
          >
            <td class="drag-cell">⋮⋮</td>
            <td>
              <div class="name-cell">
                <div class="cell-icon" :class="p.icon"><PluginIcon :type="p.icon" :size="18" /></div>
                <span class="cell-name">{{ p.name }}</span>
              </div>
            </td>
            <td><span class="version">v{{ p.version }}</span></td>
            <td><span class="cat-tag">{{ p.category }}</span></td>
            <td>
              <span class="src-tag" :class="{ builtin: p.builtin }">{{ p.builtin ? '内置' : '外部' }}</span>
            </td>
            <td class="desc-cell">{{ p.desc }}</td>
            <td>
              <span class="status-dot" :class="p.enabled ? 'on' : 'off'"></span>
              {{ p.enabled ? '已启用' : '已禁用' }}
            </td>
            <td>
              <div class="actions">
                <button class="btn btn-xs btn-ghost" @click="store.togglePlugin(p.id)">
                  {{ p.enabled ? '禁用' : '启用' }}
                </button>
                <button v-if="p.enabled" class="btn btn-xs btn-outline" @click="open(p)">打开</button>
                <button v-if="!p.builtin" class="btn btn-xs btn-outline" @click="exportPlugin(p)">导出</button>
                <button class="btn btn-xs btn-danger-ghost" @click="confirmUninstall(p)">卸载</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 卸载确认 -->
    <div v-if="uninstallTarget" class="modal-overlay" @click.self="uninstallTarget = null">
      <div class="modal">
        <div class="modal-title">确认卸载</div>
        <div class="modal-body">
          确定要卸载插件「{{ uninstallTarget.name }}」吗？该插件的本地数据将一并删除，此操作不可撤销。
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="uninstallTarget = null">取消</button>
          <button class="btn btn-primary" style="background:var(--danger)" @click="doUninstall">确认卸载</button>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div v-if="toast" class="toast" :class="{ error: toastError }">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import PluginIcon from '@/components/PluginIcon.vue'

const store = useAppStore()
const router = useRouter()
const uninstallTarget = ref(null)
const toast = ref('')
const toastError = ref(false)

// ===== 拖拽排序 =====
const dragId = ref(null)
const dragOverId = ref(null)

function onDragStart(id, e) {
  dragId.value = id
  e.dataTransfer.effectAllowed = 'move'
}
function onDrop(targetId) {
  const from = dragId.value
  if (!from || from === targetId) return
  const list = store.plugins
  const fromIdx = list.findIndex(p => p.id === from)
  const toIdx = list.findIndex(p => p.id === targetId)
  if (fromIdx < 0 || toIdx < 0) return
  const [moved] = list.splice(fromIdx, 1)
  list.splice(toIdx, 0, moved)
  store.persistOrder()
  showToast('顺序已保存')
}
function onDragEnd() {
  dragId.value = null
  dragOverId.value = null
}

// ===== 操作 =====
function open(p) {
  store.recordOpen(p.id)
  router.push('/plugin/' + p.id)
}
function confirmUninstall(p) { uninstallTarget.value = p }
async function doUninstall() {
  try {
    await store.uninstallPlugin(uninstallTarget.value.id)
    showToast('插件已卸载')
  } catch (e) {
    showToast(e.message || '卸载失败', true)
  }
  uninstallTarget.value = null
}
async function importPlugin() {
  const r = await store.importPlugin()
  if (r.canceled) return
  if (r.ok) showToast(`插件「${r.plugin.name}」导入成功`)
  else showToast(r.error || '导入失败', true)
}
async function exportPlugin(p) {
  const r = await store.exportPlugin(p.id)
  if (r.canceled) return
  if (r.ok) showToast('已导出：' + r.filePath)
  else showToast(r.error || '导出失败', true)
}
function showToast(msg, isErr = false) {
  toast.value = msg
  toastError.value = isErr
  setTimeout(() => { toast.value = '' }, 2500)
}
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
.page-title { font-size: 24px; font-weight: 600; }
.page-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
.table-card { overflow: hidden; }
.mgr-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.mgr-table th {
  text-align: left; padding: 12px 14px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--bg-root);
  border-bottom: 1px solid var(--border-light);
}
.mgr-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-light); color: var(--text-secondary); }
.mgr-table tr:last-child td { border-bottom: none; }
.mgr-table tr:hover td { background: var(--bg-hover); }
.mgr-table tr.drag-over td { background: var(--accent-soft); border-top: 2px solid var(--accent); }
.mgr-table tr[draggable="true"] { cursor: default; }
.drag-cell { color: var(--text-muted); cursor: grab; font-size: 11px; letter-spacing: -2px; user-select: none; }
.name-cell { display: flex; align-items: center; gap: 10px; }
.cell-icon {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: var(--bg-root); color: var(--text-secondary);
}
.cell-icon.task { background: #eff6ff; color: #2563eb; }
.cell-icon.calc { background: #ecfdf5; color: #059669; }
.cell-icon.course { background: #faf5ff; color: #7c3aed; }
.cell-name { font-weight: 600; color: var(--text-primary); }
.version { font-size: 12.5px; color: var(--text-muted); font-family: monospace; }
.cat-tag {
  font-size: 12.5px; background: var(--bg-root);
  padding: 3px 10px; border-radius: 10px;
  color: var(--text-secondary); border: 1px solid var(--border-light);
  white-space: nowrap;
}
.src-tag {
  font-size: 11.5px; padding: 2px 8px; border-radius: 9px;
  background: #fffbeb; color: var(--warning); font-weight: 500;
  white-space: nowrap;
}
.src-tag.builtin { background: var(--accent-soft); color: var(--accent); }
.desc-cell { max-width: 220px; }
.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
.status-dot.on { background: var(--success); }
.status-dot.off { background: var(--text-muted); }
.actions { display: flex; gap: 4px; flex-wrap: wrap; }
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(16,24,40,0.4);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  padding: 24px; min-width: 400px;
  box-shadow: var(--shadow-lg);
}
.modal-title { font-size: 17px; font-weight: 600; margin-bottom: 14px; }
.modal-body { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 22px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
.toast {
  position: fixed; bottom: 32px; left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary); color: #fff;
  border-radius: var(--radius-sm);
  padding: 10px 22px;
  font-size: 13.5px;
  box-shadow: var(--shadow-lg);
  z-index: 300;
  animation: toast-in 0.2s ease-out;
  max-width: 70vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.toast.error { background: var(--danger); }
</style>
