const { app, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const AdmZip = require('adm-zip')

// 内置插件注册表（Vue 组件实现，entry 为 null）
const BUILTIN_PLUGINS = [
  {
    id: 'task-manager', name: '个人任务管理',
    desc: '本地待办任务管理，支持优先级与截止日期',
    category: '办公工具', version: '1.0.0', icon: 'task', builtin: true, entry: null
  },
  {
    id: 'calculator', name: '大小写计算器',
    desc: '数学计算与中文财务大写金额转换',
    category: '实用工具', version: '1.0.0', icon: 'calc', builtin: true, entry: null
  },
  {
    id: 'douyin-course', name: '抖音课程管理',
    desc: '抖音视频链接收藏与学习进度管理',
    category: '学习工具', version: '1.0.0', icon: 'course', builtin: true, entry: null
  }
]

function pluginsRoot() {
  return path.join(app.getPath('userData'), 'plugins')
}
function registryPath() {
  return path.join(app.getPath('userData'), 'plugins-registry.json')
}

function ensureRoot() {
  const root = pluginsRoot()
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true })
}

function loadRegistry() {
  ensureRoot()
  const rp = registryPath()
  if (!fs.existsSync(rp)) {
    // 首次运行：写入内置插件注册表
    const initial = {
      order: BUILTIN_PLUGINS.map(p => p.id),
      plugins: BUILTIN_PLUGINS.map(p => ({ ...p, enabled: true }))
    }
    fs.writeFileSync(rp, JSON.stringify(initial, null, 2), 'utf-8')
    return initial
  }
  try {
    return JSON.parse(fs.readFileSync(rp, 'utf-8'))
  } catch {
    return { order: [], plugins: [] }
  }
}

function saveRegistry(reg) {
  fs.writeFileSync(registryPath(), JSON.stringify(reg, null, 2), 'utf-8')
}

// 扫描：注册表 + 磁盘插件目录（外部插件以 plugin.json 为准刷新元数据）
function scanPlugins() {
  const reg = loadRegistry()
  const root = pluginsRoot()
  for (const p of reg.plugins) {
    if (p.builtin) continue
    const manifestPath = path.join(root, p.id, 'plugin.json')
    if (fs.existsSync(manifestPath)) {
      try {
        const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        p.name = m.name || p.name
        p.version = m.version || p.version
        p.desc = m.description || p.desc
        p.category = m.category || p.category || '未分类'
        p.entry = m.main || p.entry
      } catch { /* manifest 损坏则保留注册表数据 */ }
    }
  }
  // 按 order 排序
  const orderMap = {}
  reg.order.forEach((id, i) => { orderMap[id] = i })
  reg.plugins.sort((a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999))
  return reg
}

function validateManifest(dir) {
  const manifestPath = path.join(dir, 'plugin.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error('压缩包中未找到 plugin.json')
  }
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  if (!m.id || !/^[a-z0-9][a-z0-9._-]*$/i.test(m.id)) throw new Error('plugin.json 缺少合法的 id 字段')
  if (!m.name) throw new Error('plugin.json 缺少 name 字段')
  if (!m.version) throw new Error('plugin.json 缺少 version 字段')
  if (!m.main) throw new Error('plugin.json 缺少 main 字段（入口页面）')
  if (!fs.existsSync(path.join(dir, m.main))) throw new Error(`入口文件 ${m.main} 不存在`)
  return m
}

// 导入 zip：解压到临时目录 → 校验 → 移动到 plugins/<id>，失败回滚
function importPlugin(zipPath) {
  const root = pluginsRoot()
  ensureRoot()
  const tmpDir = path.join(root, '.tmp-import-' + Date.now())
  try {
    const zip = new AdmZip(zipPath)
    zip.extractAllTo(tmpDir, true)

    // 允许 zip 内有一层同名文件夹包裹
    let pluginDir = tmpDir
    if (!fs.existsSync(path.join(tmpDir, 'plugin.json'))) {
      const entries = fs.readdirSync(tmpDir)
      if (entries.length === 1 && fs.statSync(path.join(tmpDir, entries[0])).isDirectory()) {
        pluginDir = path.join(tmpDir, entries[0])
      }
    }

    const manifest = validateManifest(pluginDir)
    const reg = loadRegistry()

    if (reg.plugins.some(p => p.id === manifest.id)) {
      throw new Error(`插件 ${manifest.id} 已安装`)
    }

    const target = path.join(root, manifest.id)
    if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true })
    fs.cpSync(pluginDir, target, { recursive: true })

    reg.plugins.push({
      id: manifest.id,
      name: manifest.name,
      desc: manifest.description || '',
      category: manifest.category || '未分类',
      version: manifest.version,
      icon: 'default',
      builtin: false,
      entry: manifest.main,
      enabled: true
    })
    reg.order.push(manifest.id)
    saveRegistry(reg)
    return { ok: true, plugin: manifest }
  } finally {
    // 清理临时目录（回滚保障）
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// 导出：打包 plugins/<id> 为 zip
async function exportPlugin(mainWindow, id) {
  const root = pluginsRoot()
  const dir = path.join(root, id)
  const reg = loadRegistry()
  const p = reg.plugins.find(x => x.id === id)
  if (!p) throw new Error('插件不存在')
  if (p.builtin) throw new Error('内置插件暂不支持导出')
  if (!fs.existsSync(dir)) throw new Error('插件目录不存在')

  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出插件',
    defaultPath: `${p.name}-v${p.version}.zip`,
    filters: [{ name: 'Plugin Package', extensions: ['zip'] }]
  })
  if (result.canceled || !result.filePath) return { ok: false, canceled: true }

  const zip = new AdmZip()
  zip.addLocalFolder(dir)
  zip.writeZip(result.filePath)
  return { ok: true, filePath: result.filePath }
}

function uninstallPlugin(id) {
  const reg = loadRegistry()
  const idx = reg.plugins.findIndex(p => p.id === id)
  if (idx < 0) throw new Error('插件不存在')
  const p = reg.plugins[idx]
  if (!p.builtin) {
    const dir = path.join(pluginsRoot(), id)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  }
  reg.plugins.splice(idx, 1)
  reg.order = reg.order.filter(x => x !== id)
  saveRegistry(reg)
  return { ok: true }
}

function setEnabled(id, enabled) {
  const reg = loadRegistry()
  const p = reg.plugins.find(x => x.id === id)
  if (!p) throw new Error('插件不存在')
  p.enabled = enabled
  saveRegistry(reg)
  return { ok: true }
}

function setOrder(orderedIds) {
  const reg = loadRegistry()
  const valid = orderedIds.filter(id => reg.plugins.some(p => p.id === id))
  // 兜底：注册表中存在但未出现在排序里的插件追加到末尾
  reg.plugins.forEach(p => { if (!valid.includes(p.id)) valid.push(p.id) })
  reg.order = valid
  saveRegistry(reg)
  return { ok: true }
}

module.exports = {
  scanPlugins, importPlugin, exportPlugin, uninstallPlugin, setEnabled, setOrder, pluginsRoot
}
