// 插件数据持久化工具：每个插件独立命名空间，localStorage 存储
export function loadData(pluginId, key, fallback) {
  try {
    const raw = localStorage.getItem(`mytoolworld:${pluginId}:${key}`)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function saveData(pluginId, key, value) {
  localStorage.setItem(`mytoolworld:${pluginId}:${key}`, JSON.stringify(value))
}
