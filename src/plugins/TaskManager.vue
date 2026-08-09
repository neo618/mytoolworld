<template>
  <div class="task-plugin">
    <div class="toolbar">
      <div class="filters">
        <button
          v-for="f in filters" :key="f.value"
          class="filter-btn" :class="{ active: filter === f.value }"
          @click="filter = f.value"
        >{{ f.label }}<span class="count">{{ countBy(f.value) }}</span></button>
      </div>
      <div class="sort-box">
        <select v-model="sortBy" class="form-select sort-select">
          <option value="created">按创建时间</option>
          <option value="priority">按优先级</option>
          <option value="due">按截止日期</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="openEditor(null)">+ 新建任务</button>
      </div>
    </div>

    <div v-if="sortedTasks.length === 0" class="empty">
      <div class="empty-icon">☑</div>
      <div>暂无任务，点击右上角「新建任务」开始</div>
    </div>

    <div v-else class="task-list">
      <div v-for="t in sortedTasks" :key="t.id" class="task-item" :class="{ done: t.status === 'done' }">
        <div class="check" :class="t.status" @click="cycleStatus(t)" :title="statusLabel(t.status)">
          <span v-if="t.status === 'done'">✓</span>
          <span v-else-if="t.status === 'doing'">◐</span>
        </div>
        <div class="info">
          <div class="title">{{ t.title }}</div>
          <div class="meta">
            <span class="prio" :class="t.priority">{{ prioLabel(t.priority) }}</span>
            <span v-if="t.due" class="due" :class="{ overdue: isOverdue(t) }">截止 {{ t.due }}</span>
            <span v-if="t.note" class="note">{{ t.note }}</span>
          </div>
        </div>
        <span class="status-tag" :class="t.status">{{ statusLabel(t.status) }}</span>
        <button class="btn btn-xs btn-ghost" @click="openEditor(t)">编辑</button>
        <button class="btn btn-xs btn-danger-ghost" @click="remove(t.id)">删除</button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editing" class="modal-overlay" @click.self="editing = null">
      <div class="modal">
        <div class="modal-title">{{ editing.id ? '编辑任务' : '新建任务' }}</div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">任务标题 *</label>
            <input v-model="editing.title" class="form-input" placeholder="要做什么？" ref="titleInput" />
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="editing.note" class="form-textarea" rows="2" placeholder="补充说明（可选）"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">截止日期</label>
              <input v-model="editing.due" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">优先级</label>
              <select v-model="editing.priority" class="form-select">
                <option value="high">高</option>
                <option value="med">中</option>
                <option value="low">低</option>
              </select>
            </div>
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
import { ref, computed, nextTick } from 'vue'
import { loadData, saveData } from '@/plugins/storage'

const PID = 'task-manager'
const tasks = ref(loadData(PID, 'tasks', []))
const filter = ref('all')
const sortBy = ref('created')
const editing = ref(null)
const titleInput = ref(null)

const filters = [
  { label: '全部', value: 'all' },
  { label: '待办', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'done' }
]

const prioOrder = { high: 0, med: 1, low: 2 }

const sortedTasks = computed(() => {
  let list = filter.value === 'all' ? [...tasks.value] : tasks.value.filter(t => t.status === filter.value)
  if (sortBy.value === 'priority') list.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority])
  else if (sortBy.value === 'due') list.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
  else list.sort((a, b) => b.createdAt - a.createdAt)
  return list
})

function countBy(f) { return f === 'all' ? tasks.value.length : tasks.value.filter(t => t.status === f).length }
function statusLabel(s) { return { todo: '待办', doing: '进行中', done: '已完成' }[s] }
function prioLabel(p) { return { high: '高', med: '中', low: '低' }[p] }
function isOverdue(t) { return t.due && t.status !== 'done' && t.due < new Date().toISOString().slice(0, 10) }

function cycleStatus(t) {
  t.status = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo'
  persist()
}

function openEditor(t) {
  editing.value = t ? { ...t } : { id: null, title: '', note: '', due: '', priority: 'med', status: 'todo' }
  nextTick(() => titleInput.value?.focus())
}

function save() {
  if (!editing.value.title.trim()) return
  if (editing.value.id) {
    const idx = tasks.value.findIndex(x => x.id === editing.value.id)
    if (idx >= 0) tasks.value[idx] = { ...editing.value }
  } else {
    tasks.value.push({ ...editing.value, id: Date.now(), createdAt: Date.now() })
  }
  editing.value = null
  persist()
}

function remove(id) {
  tasks.value = tasks.value.filter(t => t.id !== id)
  persist()
}

function persist() { saveData(PID, 'tasks', tasks.value) }
</script>

<style scoped>
.task-plugin { max-width: 860px; margin: 0 auto; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
.filters { display: flex; gap: 6px; }
.filter-btn {
  padding: 7px 14px; font-size: 13.5px; font-weight: 500;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: 18px; color: var(--text-secondary); cursor: pointer;
  transition: all var(--transition);
  display: flex; align-items: center; gap: 6px;
}
.filter-btn:hover { border-color: var(--accent); color: var(--accent); }
.filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.count { font-size: 11.5px; opacity: 0.75; }
.sort-box { display: flex; gap: 8px; align-items: center; }
.sort-select { width: 130px; height: 34px; font-size: 13px; }
.empty { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 14px; }
.empty-icon { font-size: 44px; margin-bottom: 14px; opacity: 0.35; }
.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition);
}
.task-item:hover { border-color: var(--border); box-shadow: var(--shadow-card); }
.task-item.done { opacity: 0.6; }
.check {
  width: 20px; height: 20px; border-radius: 6px;
  border: 2px solid var(--border);
  cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff;
  transition: all var(--transition);
}
.check.doing { border-color: var(--warning); background: var(--warning); }
.check.done { border-color: var(--success); background: var(--success); }
.info { flex: 1; min-width: 0; }
.title { font-size: 14.5px; font-weight: 500; }
.task-item.done .title { text-decoration: line-through; }
.meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; font-size: 12px; color: var(--text-muted); }
.prio { padding: 1px 8px; border-radius: 9px; font-weight: 500; }
.prio.high { background: #fef2f2; color: var(--danger); }
.prio.med { background: #fffbeb; color: var(--warning); }
.prio.low { background: var(--bg-root); color: var(--text-muted); }
.due.overdue { color: var(--danger); font-weight: 500; }
.note { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
.status-tag { font-size: 12px; font-weight: 500; padding: 2px 10px; border-radius: 10px; flex-shrink: 0; }
.status-tag.todo { background: var(--bg-root); color: var(--text-secondary); }
.status-tag.doing { background: #fffbeb; color: var(--warning); }
.status-tag.done { background: #ecfdf5; color: var(--success); }
.form-group { margin-bottom: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
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
