<template>
  <div class="course-plugin">
    <div class="toolbar">
      <div class="folders">
        <button
          class="folder-btn" :class="{ active: currentFolder === '' }"
          @click="currentFolder = ''"
        >全部<span class="count">{{ courses.length }}</span></button>
        <button
          v-for="f in folders" :key="f"
          class="folder-btn" :class="{ active: currentFolder === f }"
          @click="currentFolder = f"
        >{{ f }}<span class="count">{{ courses.filter(c => c.folder === f).length }}</span></button>
        <button class="folder-btn add-folder" @click="addFolder" title="新建文件夹">+</button>
      </div>
      <button class="btn btn-primary btn-sm" @click="openEditor(null)">+ 添加课程</button>
    </div>

    <div v-if="filtered.length === 0" class="empty">
      <div class="empty-icon">▶</div>
      <div>暂无课程，点击右上角「添加课程」收藏抖音视频</div>
    </div>

    <div v-else class="course-list">
      <div v-for="c in filtered" :key="c.id" class="course-item">
        <div class="thumb" @click="openVideo(c)">▶</div>
        <div class="info" @click="openVideo(c)">
          <div class="name">{{ c.name }}</div>
          <div class="meta">
            <span class="folder-tag">{{ c.folder }}</span>
            <span v-if="c.note">{{ c.note }}</span>
          </div>
        </div>
        <span
          class="status" :class="c.learned ? 'learned' : 'unlearned'"
          @click="toggleLearned(c)"
          :title="c.learned ? '点击标记为未学' : '点击标记为已学'"
        >{{ c.learned ? '已学' : '未学' }}</span>
        <button class="btn btn-xs btn-ghost" @click="openEditor(c)">编辑</button>
        <button class="btn btn-xs btn-danger-ghost" @click="remove(c.id)">删除</button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editing" class="modal-overlay" @click.self="editing = null">
      <div class="modal">
        <div class="modal-title">{{ editing.id ? '编辑课程' : '添加课程' }}</div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">抖音视频链接 *</label>
            <input v-model="editing.url" class="form-input" placeholder="https://www.douyin.com/video/..." />
          </div>
          <div class="form-group">
            <label class="form-label">课程名称</label>
            <input v-model="editing.name" class="form-input" placeholder="给课程起个名字" />
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <input v-model="editing.note" class="form-input" placeholder="补充说明（可选）" />
          </div>
          <div class="form-group">
            <label class="form-label">所属文件夹</label>
            <select v-model="editing.folder" class="form-select">
              <option v-for="f in folders" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="editing = null">取消</button>
          <button class="btn btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { loadData, saveData } from '@/plugins/storage'

const PID = 'douyin-course'
const courses = ref(loadData(PID, 'courses', []))
const folderList = ref(loadData(PID, 'folders', ['默认']))
const currentFolder = ref('')
const editing = ref(null)

const folders = computed(() => folderList.value)
const filtered = computed(() =>
  currentFolder.value === '' ? courses.value : courses.value.filter(c => c.folder === currentFolder.value)
)

function addFolder() {
  const name = prompt('新文件夹名称：')
  if (!name || !name.trim()) return
  if (folderList.value.includes(name.trim())) return
  folderList.value.push(name.trim())
  saveData(PID, 'folders', folderList.value)
}

function openEditor(c) {
  editing.value = c
    ? { ...c }
    : { id: null, url: '', name: '', note: '', folder: folderList.value[0], learned: false }
}

function save() {
  if (!editing.value.url.trim()) return
  if (!editing.value.name.trim()) editing.value.name = editing.value.url
  if (editing.value.id) {
    const idx = courses.value.findIndex(x => x.id === editing.value.id)
    if (idx >= 0) courses.value[idx] = { ...editing.value }
  } else {
    courses.value.push({ ...editing.value, id: Date.now() })
  }
  editing.value = null
  saveData(PID, 'courses', courses.value)
}

function remove(id) {
  courses.value = courses.value.filter(c => c.id !== id)
  saveData(PID, 'courses', courses.value)
}

function toggleLearned(c) {
  c.learned = !c.learned
  saveData(PID, 'courses', courses.value)
}

function openVideo(c) {
  window.open(c.url, '_blank')
  if (!c.learned) { /* 打开不自动标记，由用户点击状态 */ }
}
</script>

<style scoped>
.course-plugin { max-width: 860px; margin: 0 auto; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
.folders { display: flex; gap: 6px; flex-wrap: wrap; }
.folder-btn {
  padding: 7px 14px; font-size: 13.5px; font-weight: 500;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: 18px; color: var(--text-secondary); cursor: pointer;
  transition: all var(--transition);
  display: flex; align-items: center; gap: 6px;
}
.folder-btn:hover { border-color: var(--accent); color: var(--accent); }
.folder-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.folder-btn.add-folder { padding: 7px 12px; font-weight: 600; }
.count { font-size: 11.5px; opacity: 0.75; }
.empty { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 14px; }
.empty-icon { font-size: 44px; margin-bottom: 14px; opacity: 0.35; }
.course-list { display: flex; flex-direction: column; gap: 8px; }
.course-item {
  display: flex; align-items: center; gap: 14px;
  padding: 13px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition);
}
.course-item:hover { border-color: var(--border); box-shadow: var(--shadow-card); }
.thumb {
  width: 64px; height: 40px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; cursor: pointer; flex-shrink: 0;
  transition: all var(--transition);
}
.thumb:hover { filter: brightness(0.95); }
.info { flex: 1; min-width: 0; cursor: pointer; }
.name { font-size: 14.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; font-size: 12px; color: var(--text-muted); }
.folder-tag {
  background: var(--bg-root); border: 1px solid var(--border-light);
  padding: 1px 8px; border-radius: 9px; font-size: 11.5px;
}
.status {
  font-size: 12.5px; font-weight: 600;
  padding: 4px 14px; border-radius: 12px;
  cursor: pointer; flex-shrink: 0;
  transition: all var(--transition);
}
.status.learned { background: #ecfdf5; color: var(--success); }
.status.unlearned { background: #fffbeb; color: var(--warning); }
.form-group { margin-bottom: 14px; }
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(16,24,40,0.4);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: var(--bg-surface); border-radius: var(--radius-md);
  padding: 24px; width: 440px; box-shadow: var(--shadow-lg);
}
.modal-title { font-size: 17px; font-weight: 600; margin-bottom: 16px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
</style>
