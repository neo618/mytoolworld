# MyToolWorld 插件开发规则文档

> 基于需求文档第五章 + 已实现系统沉淀，快速上手写一个 MyToolWorld 插件。

---

## 一、插件类型

| 类型 | 开发方式 | 加载方式 | 适用场景 |
|------|---------|---------|---------|
| **内置插件** | Vue 3 单文件组件（.vue），放在 `src/plugins/` 下 | 直接作为 Vue 组件渲染，访问 Pinia store 等完整上下文 | 核心功能、与工作台紧密耦合的工具 |
| **外部插件** | 纯 HTML/CSS/JS，通过 `window.workbench` API 与宿主通信 | 通过 `plugin://<id>/<main>` 协议在 iframe 沙箱中加载 | 独立工具、第三方开发、可分发分享 |

**如何选择**：需要 Pinia、Vue Router、Element Plus 等 → 内置；只需 HTML 就能跑、想独立分发 → 外部。

---

## 二、内置插件开发（Vue 组件）

### 2.1 文件结构

```
src/plugins/
├── YourPlugin.vue          # 插件组件（一个 .vue 文件搞定）
├── storage.js              # 持久化工具（已有，直接 import）
```

### 2.2 必需步骤

#### Step 1：创建组件 `src/plugins/YourPlugin.vue`

```vue
<template>
  <div class="your-plugin">
    <!-- 插件界面 -->
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { loadData, saveData } from '@/plugins/storage'

// 插件唯一 ID，用于 localStorage 命名空间
const PID = 'your-plugin-id'

// 数据：从 localStorage 恢复，fallback 为初始值
const data = ref(loadData(PID, 'data-key', []))

// 操作后持久化
function persist() {
  saveData(PID, 'data-key', data.value)
}
</script>

<style scoped>
.your-plugin { max-width: 860px; margin: 0 auto; }
</style>
```

#### Step 2：在 `src/stores/app.js` 注册插件元数据

找到 `FALLBACK_PLUGINS` 数组（同时注册到 `electron/pluginManager.js` 的 `BUILTIN_PLUGINS`），添加一条：

```js
{
  id: 'your-plugin-id',        // 唯一标识，与 PID 一致
  name: '你的插件名',
  desc: '一句话描述',
  category: '办公工具',         // 选择已有分类或新建
  version: '1.0.0',
  icon: 'task',                // 图标：task | calc | course | default
  builtin: true,
  entry: null                  // 内置插件必须填 null
}
```

#### Step 3：在 `src/views/PluginView.vue` 注册组件映射

在 `componentMap` 中添加：

```js
import YourPlugin from '@/plugins/YourPlugin.vue'

const componentMap = {
  'task-manager': TaskManager,
  'calculator': Calculator,
  'douyin-course': DouyinCourse,
  'your-plugin-id': YourPlugin,  // ← 添加这行
}
```

### 2.3 数据持久化

```js
import { loadData, saveData } from '@/plugins/storage'

// 读取（自动 JSON 反序列化，不存在时返回 fallback）
const items = ref(loadData('my-plugin', 'items', []))

// 写入（自动 JSON 序列化，写入 localStorage）
saveData('my-plugin', 'items', items.value)
```

命名空间规则：`MyToolWorld:{插件ID}:{键名}`，不同插件数据完全隔离。

### 2.4 可用能力

| 能力 | 使用方式 |
|------|---------|
| Vue 3 Composition API | `ref`, `reactive`, `computed`, `watch`, `onMounted` 等 |
| Pinia Store | `import { useAppStore } from '@/stores/app'` |
| 全局 CSS 变量 | `var(--accent)`, `var(--bg-surface)`, `var(--text-primary)` 等 |
| 预定义 class | `.btn`, `.btn-primary`, `.btn-outline`, `.card`, `.form-input`, `.modal-overlay` 等（见 global.css） |
| PluginIcon 组件 | `<PluginIcon type="task" :size="20" />`（task/calc/course/default） |

### 2.5 必须在两个地方注册

| 位置 | 文件 | 说明 |
|------|------|------|
| 1 | `src/stores/app.js` → `FALLBACK_PLUGINS` | Web 预览降级数据 |
| 2 | `electron/pluginManager.js` → `BUILTIN_PLUGINS` | Electron 环境真实注册表 |
| 3 | `src/views/PluginView.vue` → `componentMap` | 组件渲染映射 |

> **规则**：三个文件必须用同一个 `id`，否则侧边栏和路由匹配不到。

---

## 三、外部插件开发（HTML 独立包）

### 3.1 文件结构

```
my-plugin/
├── plugin.json       # 插件配置（必填）
├── index.html        # 入口页面（由 plugin.json 的 main 指定）
├── assets/           # 可选：icon.png、样式、脚本
│   └── icon.png
└── README.md         # 可选
```

### 3.2 plugin.json 规范（必填字段）

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "1.0.0",
  "description": "一段简短的描述，展示在插件管理中",
  "author": "作者名",
  "category": "办公工具",
  "icon": "assets/icon.png",
  "main": "index.html"
}
```

| 字段 | 必填 | 规则 |
|------|------|------|
| `id` | ✅ | 字母/数字/点/下划线/连字符，唯一标识，不可与其他插件重复 |
| `name` | ✅ | 插件显示名称，中文均可 |
| `version` | ✅ | 语义化版本，如 `1.0.0` |
| `description` | 否 | 展示在插件管理列表的描述 |
| `author` | 否 | 作者署名 |
| `category` | 否 | 分类名，不存在则归入「未分类」 |
| `icon` | 否 | 插件图标路径（相对 plugin.json），未提供则使用默认图标 |
| `main` | ✅ | 入口 HTML 文件路径（相对 plugin.json），必须存在 |

### 3.3 全局 API：`window.workbench`

宿主向所有外部插件暴露 `window.workbench` 对象，提供本地能力：

```js
// 文件系统（作用域限制在插件自身目录）
window.workbench.fs.readFile(path)    // 读取文本文件
window.workbench.fs.writeFile(path, data) // 写入文本文件
window.workbench.fs.readDir(path)     // 读取目录列表

// 数据存储（JSON，自动序列化）
window.workbench.data.getPath()       // 获取插件数据目录绝对路径
window.workbench.data.load(key)       // 读取持久化数据
window.workbench.data.save(key, value) // 保存持久化数据

// 宿主信息
window.workbench.app.getVersion()     // 获取 MyToolWorld 版本号
window.workbench.app.getTheme()       // 获取当前主题色 { h, s, l, name }
```

### 3.4 打包分发

```bash
# 将插件文件夹直接打成 zip（不要在插件目录外层再套文件夹）
# 正确：zip 根目录直接包含 plugin.json + index.html + assets/
# 错误：zip 根目录只有一个 my-plugin/ 文件夹

# Windows 右键 → 压缩 → 得到 my-plugin.zip
```

> **导入校验**：MyToolWorld 会检查(1) zip 内必须找到 plugin.json，(2) id/name/version/main 必填，(3) main 指向的文件必须存在。任一不满足则导入失败并自动回滚。

### 3.5 开发调试

1. 先用浏览器直接打开 `index.html` 调试 UI（此时 `window.workbench` 不存在）
2. 打包 zip → 导入到 MyToolWorld → 在 MyToolWorld 中打开测试完整功能
3. 内置浏览器 DevTools 可查看外部插件的 console（开启 DevTools 后切换到 iframe 上下文）

---

## 四、快速清单（新建插件时对照）

- [ ] 确定插件类型：内置 or 外部
- [ ] 如果是内置：创建 `.vue` → 注册到 store + pluginManager + PluginView
- [ ] 如果是外部：创建 `plugin.json` + `index.html` → 打包 zip → 导入测试
- [ ] 数据持久化：用 `loadData`/`saveData`（内置）或 `window.workbench.data`（外部）
- [ ] 插件 ID 全局唯一（避免与已有插件冲突）
- [ ] 界面适配：最大宽度建议 860px，不要依赖全局滚动之外的独立滚动

---

## 五、已有插件 ID 一览

| ID | 名称 | 类型 |
|------|------|------|
| `task-manager` | 个人任务管理 | 内置 |
| `calculator` | 大小写计算器 | 内置 |
| `douyin-course` | 抖音课程管理 | 内置 |

新建插件时 ID 不要和以上冲突。外部插件建议使用域名反转命名（如 `com.yourname.tool`）。
