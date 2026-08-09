# MyToolWorld 设计规范文档

> 版本 v1.0 | 2026-08-08  
> 用途：完整记录 MyToolWorld 的产品设计、技术架构、UI/UX 规范与开发约定，供另一台电脑从头重建工程时参考。

---

## 一、产品定义

### 1.1 产品名称与定位

| 项目 | 内容 |
|------|------|
| 产品名（中文） | 我的工具世界 |
| 产品名（英文） | MyToolWorld |
| 产品 slogan | 个人插件化工作台 |
| 定位 | 桌面端插件化工具运行容器——本身不提供业务功能，所有工具以插件形式按需安装、独立运行，侧边栏统一切换 |
| 目标用户 | 需要本地工具箱的个人用户、小团队 |

### 1.2 核心特性

- **插件化架构**：工具都是插件，按需安装/卸载，互不干扰
- **纯本地运行**：所有数据存本地（localStorage + userData 目录），无需网络
- **可分发**：外部插件打包成 zip 文件，一键导入即可使用
- **10 色主题**：商务蓝/暖棕/墨绿等，即点即换（仅作用于工作台外壳，不侵入插件内部）
- **沙箱隔离**：外部插件在 `plugin://` 协议 iframe 中运行，崩溃不影响主程序

### 1.3 设计风格

**白色商务风**（白商务）— 浅色底、专业克制、深色文字、克制色彩。

| 设计要素 | 规范 |
|----------|------|
| 底色 | `#f5f6f8`（浅灰） |
| 面板色 | `#ffffff`（纯白） |
| 边框色 | `#e5e7eb` / `#eef0f3` |
| 主文字 | `#1f2329` |
| 辅助文字 | `#4b5563` |
| 弱文字 | `#9ca3af` |
| 强调色 | 10 色可选主题，默认商务蓝 hsl(221, 83%, 53%) |
| 字体 | system-ui：PingFang SC / Microsoft YaHei / Segoe UI，15px 基准 |
| 圆角 | 6px（小）/ 10px（中）/ 14px（大） |
| 阴影 | 极轻量，`0 1px 2px rgba(16,24,40,0.05)` |
| 过渡 | 160ms cubic-bezier(0.16, 1, 0.3, 1) |

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 桌面框架 | Electron | 28.3.3 | 窗口管理、文件系统、自定义协议 |
| 前端框架 | Vue 3 (Composition API) | 3.5.41 | 渲染进程 UI |
| 构建工具 | Vite | 8.2.1 | 前端打包（base: './'） |
| 状态管理 | Pinia | 4.0.2 | 全局状态（主题、插件列表等） |
| 路由 | Vue Router | 4.6.4 | Hash 模式路由 |
| 打包工具 | electron-builder | 26.15.3 | NSIS 安装包 + portable 绿色版 |
| ZIP 处理 | adm-zip | 0.5.16 | 插件压缩包读写 |
| 并行开发 | concurrently + wait-on + cross-env | - | 开发体验 |

### 2.2 进程架构

```
┌──────────────────────────────────────────┐
│              Main Process                │
│  - BrowserWindow 创建与管理              │
│  - plugin:// 协议处理（pluginManager）   │
│  - IPC 中转（app:*, plugins:*）         │
│  - 对话框（文件选择/保存）               │
├──────────────────────────────────────────┤
│         Preload (contextBridge)          │
│  exposeInMainWorld('electronAPI', {      │
│    getAppVersion, getAppPath, plugins.*  │
│  })                                      │
├──────────────────────────────────────────┤
│           Renderer Process               │
│  - Vue 3 App (Pinia + Vue Router)        │
│  - 内置插件：直接渲染 Vue 组件           │
│  - 外部插件：<iframe src="plugin://..."> │
└──────────────────────────────────────────┘
```

### 2.3 数据流

```
用户操作
  │
  ├─→ Pinia Store (app.js) ──→ localStorage（主题/使用统计）
  │       │
  │       └─→ IPC call ──→ Main Process ──→ pluginManager.js
  │                                              │
  │                              plugins-registry.json（启用/排序/元数据）
  │                              plugins/<id>/ 目录（外部插件文件）
  │
  └─→ 内置插件 Vue 组件
        └─→ storage.js (loadData/saveData)
              └─→ localStorage（插件业务数据，命名空间隔离）
```

### 2.4 存储键命名规范

| 存储位置 | 命名空间 | 示例 |
|----------|---------|------|
| 工作台配置 | `mytoolworld:workbench:accent` | 主题色 HSL 值 |
| 使用统计 | `mytoolworld:workbench:usage` | `{ "task-manager": { openCount: 5, lastOpen: 1691... } }` |
| 插件数据 | `mytoolworld:{插件ID}:{键名}` | `mytoolworld:task-manager:tasks` |
| 文件注册表 | `%APPDATA%/MyToolWorld/plugins-registry.json` | 插件列表、启用状态、排序 |
| 外部插件文件 | `%APPDATA%/MyToolWorld/plugins/<id>/` | plugin.json + index.html + assets |

---

## 三、UI 组件规范

### 3.1 布局骨架

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (236px)          │  Topbar (56px)          │
│  ┌──────────────┐         │  ┌─────────────────────┐│
│  │ MW MyToolWorld│        │  │ [搜索...]  [🔵] [⚙] ││
│  │ v1.0         │         │  └─────────────────────┘│
│  ├──────────────┤         ├─────────────────────────┤
│  │ ● 首页       │         │                         │
│  │              │         │    Content Area         │
│  │ ▸ 办公工具   │         │    (overflow-y: auto)   │
│  │   ☑ 任务     │         │                         │
│  │ ▸ 实用工具   │         │                         │
│  │   ℳ 计算器   │         │                         │
│  │ ▸ 学习工具   │         │                         │
│  │   ▶ 课程     │         │                         │
│  ├──────────────┤         │                         │
│  │ ⚙ 插件管理 3 │         │                         │
│  │ ☰ 设置       │         │                         │
│  └──────────────┘         └─────────────────────────┘
└─────────────────────────────────────────────────────┘
```

**布局参数**：
- 侧边栏宽度：236px（CSS 变量 `--sidebar-w`）
- 顶栏高度：56px（CSS 变量 `--topbar-h`）
- 内容区内边距：28px 32px
- 窗口默认尺寸：1280×800（最小 900×600）

### 3.2 CSS 设计 Token

以下全局 CSS 变量定义在 `src/assets/global.css` 的 `:root`，具体值见上文 1.3：

| Token | 用途 |
|-------|------|
| `--accent-h/s/l` | 主题色 HSL 分量，10 色切换只改这三个 |
| `--accent` | 合成主题色 |
| `--accent-soft` | 主题色浅底（h, s, 96%） |
| `--accent-mid` | 主题色中底（h, s, 92%） |
| `--bg-root` | 页面最底背景 |
| `--bg-surface` | 面板/卡片背景 |
| `--bg-hover` | 悬停态背景 |
| `--border` | 标准边框 |
| `--border-light` | 轻量边框 |
| `--text-primary/secondary/muted` | 文字层级 |
| `--danger/success/warning` | 语义色 |
| `--radius-sm/md/lg` | 圆角 |
| `--shadow-sm/card/lg` | 阴影层级 |
| `--transition` | 全局过渡时间与缓动 |

### 3.3 复用 class

定义在 `global.css`：

| class | 用途 |
|-------|------|
| `.btn` | 按钮基础：inline-flex, gap 6px, padding 9px 18px, 14px, 500 weight |
| `.btn-primary` | 主题色填充按钮 |
| `.btn-outline` | 边框 + hover 变主题色 |
| `.btn-ghost` | 无边框，hover 显背景 |
| `.btn-sm` | 5px 12px, 12px 字号 |
| `.btn-xs` | 3px 10px, 12px 字号 |
| `.btn-danger-ghost` | 红色幽灵按钮 |
| `.card` | 白底 + 轻阴影 + 圆角 |
| `.form-label` | 14px, 500, `--text-secondary` |
| `.form-input / .form-select / .form-textarea` | 标准表单控件：白底、边框、focus 时主题色 ring |
| `.fade-in` | 入场动画：200ms ease-out, translateY(4px→0) |

### 3.4 图标系统

内置插件图标通过 `PluginIcon.vue` 渲染，type 枚举：

| type | 图标 | 颜色主题 | 适用 |
|------|------|---------|------|
| `'task'` | 勾选框 | 蓝色 `#eff6ff` / `#2563eb` | 任务管理类 |
| `'calc'` | 计算符号 | 绿色 `#ecfdf5` / `#059669` | 计算/数值类 |
| `'course'` | 播放/学习 | 紫色 `#faf5ff` / `#7c3aed` | 媒体/课程类 |
| `'default'` | 通用插件 | 灰色 `#f3f4f6` / `#6b7280` | 外部插件默认 |

每个图标都有对应的背景色 + 前景色配搭，定义在 `PluginView.vue` 的 `.frame-icon.{type}` 中。

### 3.5 字体规格

- 基础字号：15px（body）
- 标题 h1：24px, 600 weight（`.page-title`）
- 副标题：14px, `--text-muted`（`.page-subtitle`）
- 卡片/列表文字：14px
- 小字/徽标：11-12px
- 字体栈：`-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif`

---

## 四、路由设计

Hash 模式，4 条路由：

| 路径 | name | 组件 | 说明 |
|------|------|------|------|
| `/` | home | `src/views/Home.vue` | 首页：常用插件 + 最近使用 |
| `/plugins` | plugins | `src/views/PluginManager.vue` | 插件管理：表格、拖拽排序、导入导出 |
| `/settings` | settings | `src/views/Settings.vue` | 设置：主题色、版本、插件统计 |
| `/plugin/:id` | plugin | `src/views/PluginView.vue` | 插件详情：根据类型选择渲染方式 |

---

## 五、插件系统设计

### 5.1 插件类型与加载策略

| 类型 | 判断条件 | 渲染方式 | 适用场景 |
|------|---------|---------|---------|
| 内置插件 | `icon !== 'default'` 且在 `componentMap` 中有映射 | `<component :is="Component">` 直接渲染 Vue 组件 | 核心功能、与 Pinia 等紧密耦合 |
| 外部插件 | 有 `entry` 字段（不为 null） | `<iframe src="plugin://{id}/{entry}">` sandbox 加载 | 独立工具、第三方开发、可分发 |
| 占位 | 无 entry 且不在 componentMap 中 | 显示「插件界面开发中」占位卡 | 预留扩展 |

判断逻辑在 `src/views/PluginView.vue` → `pluginComponent` computed：
```js
const componentMap = { 'task-manager': ..., 'calculator': ..., 'douyin-course': ... }
const pluginComponent = computed(() => componentMap[route.params.id] || null)
```

模板中：
```html
<component v-if="pluginComponent" :is="pluginComponent" />
<iframe v-else-if="plugin && plugin.entry" :src="`plugin://${plugin.id}/${plugin.entry}`" />
<div v-else>…占位…</div>
```

### 5.2 插件注册表结构

文件：`%APPDATA%/MyToolWorld/plugins-registry.json`

```json
{
  "order": ["task-manager", "calculator", "douyin-course", "com.demo.helloworld"],
  "plugins": [
    {
      "id": "task-manager",
      "name": "个人任务管理",
      "desc": "...",
      "category": "办公工具",
      "version": "1.0.0",
      "icon": "task",
      "builtin": true,
      "entry": null,
      "enabled": true
    }
  ]
}
```

每个插件对象字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 字母开头，允许字母/数字/点/下划线/连字符 |
| `name` | string | ✅ | 显示名称 |
| `desc` | string | 否 | 插件管理表格的描述列 |
| `category` | string | 否 | 侧边栏分类名，不存在归入「未分类」 |
| `version` | string | ✅ | 语义化版本 |
| `icon` | string | ✅ | task/calc/course/default |
| `builtin` | boolean | ✅ | 是否内置 |
| `entry` | string\|null | ✅ | 入口 HTML（外部插件）或 null（内置） |
| `enabled` | boolean | ✅ | 启用状态 |

### 5.3 注册插件须修改的 3 个位置

**新增一个内置插件时，必须在三个文件注册同一个 `id`**：

1. **`src/stores/app.js`** → `FALLBACK_PLUGINS` 数组（Web 预览降级）
2. **`electron/pluginManager.js`** → `BUILTIN_PLUGINS` 数组（Electron 真实注册表）
3. **`src/views/PluginView.vue`** → `componentMap` 对象（import 并映射组件）

> 三处 id 必须完全一致，否则侧边栏看不到或路由匹配不到。

### 5.4 内置插件持久化

`src/plugins/storage.js` 提供两个工具函数：

```js
import { loadData, saveData } from '@/plugins/storage'

// 读取（自动 JSON.parse，不存在返回 fallback）
const tasks = ref(loadData('task-manager', 'tasks', []))

// 写入（自动 JSON.stringify，写入 localStorage）
function persist() { saveData('task-manager', 'tasks', tasks.value) }
```

命名空间：`mytoolworld:{pluginId}:{key}`，不同插件完全隔离。

### 5.5 外部插件规范

#### plugin.json 格式

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "1.0.0",
  "description": "简短描述",
  "author": "作者名",
  "category": "办公工具",
  "icon": "assets/icon.png",
  "main": "index.html"
}
```

`id` / `name` / `version` / `main` 为必填。

#### window.workbench API

宿主导入 `plugin://` 协议中向外部插件暴露以下全局对象（基础骨架，完整文件读写后续补齐）：

```js
window.workbench.fs.readFile(path)    // 读文本文件（作用域限制在插件自身目录）
window.workbench.fs.writeFile(path, data)  // 写文本文件
window.workbench.fs.readDir(path)     // 读目录

window.workbench.data.getPath()       // 插件数据目录绝对路径
window.workbench.data.load(key)       // 读持久化数据
window.workbench.data.save(key, value)  // 写持久化数据

window.workbench.app.getVersion()     // MyToolWorld 版本号
window.workbench.app.getTheme()       // { h, s, l, name }
```

#### 打包要求

- zip 根目录直接包含 `plugin.json` + `index.html` + `assets/`
- 允许 zip 内有一层同名文件夹包裹（导入时自动探测）
- 导入校验：zip 内必须找到 plugin.json → id/name/version/main 必填 → main 指向的文件存在 → 不满足则回滚

### 5.6 IPC 接口一览

preload.js 通过 `contextBridge.exposeInMainWorld('electronAPI', { ... })` 暴露：

```js
window.electronAPI.getAppVersion()        // → Promise<string>
window.electronAPI.getAppPath(name)       // → Promise<string>

window.electronAPI.plugins.scan()         // → Promise<{ plugins, order }>
window.electronAPI.plugins.importZip()    // → Promise<{ ok, plugin? }> // 弹出文件对话框
window.electronAPI.plugins.exportZip(id)  // → Promise<{ ok, filePath? }> // 弹出保存对话框
window.electronAPI.plugins.uninstall(id)  // → Promise<{ ok }>
window.electronAPI.plugins.setEnabled(id, enabled) // → Promise<{ ok }>
window.electronAPI.plugins.setOrder(ids)  // → Promise<{ ok }>
```

---

## 六、内置插件详解

### 6.1 个人任务管理（`task-manager`）

| 项目 | 内容 |
|------|------|
| 文件 | `src/plugins/TaskManager.vue` |
| 图标 | type: `task`, 蓝底 |
| 分类 | 办公工具 |

**功能要点**：
- 新建任务：标题、备注、截止日期、优先级（高/中/低）
- 三态切换：点击左侧方框循环「待办 → 进行中 → 已完成」
- 顶部筛选栏：全部/待办/进行中/已完成（带数量徽标）
- 排序：按创建时间/优先级/截止日期
- 过期任务红色标记，完成项划线
- 持久化 key：`tasks`

### 6.2 大小写计算器（`calculator`）

| 项目 | 内容 |
|------|------|
| 文件 | `src/plugins/Calculator.vue` |
| 图标 | type: `calc`, 绿底 |
| 分类 | 实用工具 |

**功能要点**：
- 四则运算 + 括号
- 大写转换：点击「大写」键，将计算结果或当前输入转为中文财务大写
- 算法：4 位分组（个/万/亿），正确处理「壹亿零壹」「壹万零壹」等补零场景（12 例全过）
- 计算历史：最近 30 条，点击回填，可清空
- 持久化 key：`history`

### 6.3 抖音课程管理（`douyin-course`）

| 项目 | 内容 |
|------|------|
| 文件 | `src/plugins/DouyinCourse.vue` |
| 图标 | type: `course`, 紫底 |
| 分类 | 学习工具 |

**功能要点**：
- 添加课程：粘贴抖音链接 + 名称 + 备注 + 选择文件夹
- 文件夹管理：新建文件夹、按文件夹筛选
- 点缩略图新窗口打开视频
- 已学/未学状态：点击文字一键切换
- 持久化 key：`folders` + `courses`

---

## 七、主题色系统

10 种预设色，通过修改 App.vue 绑定的 CSS 变量 `--accent-h/s/l` 实现即时切换。

| 名称 | H | S | L | 色块预览 |
|------|---|---|---|---------|
| 商务蓝（默认） | 221 | 83% | 53% | `■` hsl(221,83%,53%) |
| 沉稳青 | 192 | 70% | 42% | `■` hsl(192,70%,42%) |
| 活力橙 | 24 | 90% | 50% | `■` hsl(24,90%,50%) |
| 雅致绿 | 152 | 60% | 40% | `■` hsl(152,60%,40%) |
| 深酒红 | 348 | 65% | 45% | `■` hsl(348,65%,45%) |
| 石墨灰 | 215 | 16% | 45% | `■` hsl(215,16%,45%) |
| 靛蓝紫 | 258 | 70% | 55% | `■` hsl(258,70%,55%) |
| 天青 | 205 | 90% | 48% | `■` hsl(205,90%,48%) |
| 暖棕 | 28 | 45% | 42% | `■` hsl(28,45%,42%) |
| 墨绿 | 168 | 55% | 36% | `■` hsl(168,55%,36%) |

**作用范围**：仅工作台外壳（侧边栏高亮、顶部栏按钮、卡片强调色、按钮）。插件内部界面完全自主控制配色。

---

## 八、环境搭建与构建

### 8.1 新电脑开发环境搭建

```bash
# 1. 安装 Node.js（推荐 v24 LTS，路径 D:\Program Files\nodejs）
#    确保 npm 11.x+

# 2. 克隆 / 复制项目到本地目录（不要在同步盘上！）
#    同步盘（如华为家庭存储）会导致 electron-builder 打包时 EPERM 错误

# 3. 安装依赖
$env:NODE_ENV = 'development'     # 必须！否则 devDeps 被跳过
$env:PATH = 'D:\Program Files\nodejs;' + $env:PATH
npm install

# 4. 如果 electron 二进制下载失败（国内网络）
#    参考 workspace 下 electron-cn-dev skill 的一键脚本
#    或手动设镜像：
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
```

### 8.2 开发命令

```bash
npm run dev              # Vite + Electron 并行启动
npm run dev:web          # 仅 Vite（浏览器预览，外部插件导入不可用）

npm run build:electron   # 构建安装包（NSIS + portable）
                         # = vite build && electron-builder --win --x64
```

Vite dev server: `http://localhost:5173`（strictPort）。

### 8.3 构建配置（package.json build 字段）

```json
{
  "appId": "com.mytoolworld.workbench",
  "productName": "MyToolWorld",
  "directories": { "output": "release" },
  "win": {
    "icon": "public/icon.png",
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "shortcutName": "MyToolWorld"
  }
}
```

**⚠ 打包 EPERM 坑**：如果项目在华为家庭存储同步盘上，electron-builder 解包时 `rename win-unpacked.tmp` 会因文件锁失败。解决方法：

```json
"directories": { "output": "C:/mytool-release" }
```

构建完后手动拷回 `dist/`。

### 8.4 构建产物

| 文件 | 大小 | 说明 |
|------|------|------|
| `MyToolWorld Setup 1.0.0.exe` | ~73 MB | NSIS 安装包（支持自定义路径） |
| `MyToolWorld 1.0.0.exe` | ~73 MB | 绿色免安装版（自解压 portable） |

---

## 九、目录结构

```
mytool/
├── package.json              # Node 项目配置 + electron-builder 构建配置
├── vite.config.js            # Vite 配置（base: './', strictPort: 5173）
├── index.html                # Vite 入口（加载 /src/main.js）
├── public/
│   ├── icon.png              # 应用图标（蓝色 MW 方块，用于窗口标题栏）
│   ├── icon.ico              # ICO 格式（Windows 资源管理器）
│   └── icon.svg              # SVG 矢量原图
├── electron/                 # Electron 主进程
│   ├── main.js               # 窗口创建、plugin:// 协议注册、IPC 转发
│   ├── preload.js            # contextBridge 安全暴露 API
│   └── pluginManager.js      # 插件注册表读写、zip 导入导出、启用禁用排序
├── src/                      # 渲染进程（Vue 3）
│   ├── main.js               # createApp + Pinia + Router 挂载
│   ├── App.vue               # 根组件：布局 + 主题色 CSS 变量 + store.init()
│   ├── router/index.js       # 路由表（Hash 模式）
│   ├── stores/app.js         # Pinia store：插件列表、主题、使用统计
│   ├── assets/global.css     # 全局样式：CSS 变量、按钮、表单、动画
│   ├── components/
│   │   ├── Sidebar.vue       # 侧边栏（分类折叠、高亮、徽标）
│   │   ├── Topbar.vue        # 顶栏（搜索 + Ctrl+K、10 色取色器）
│   │   └── PluginIcon.vue    # SVG 图标组件（task/calc/course/default）
│   ├── views/
│   │   ├── Home.vue          # 首页：常用插件 Top 6 + 最近使用 Top 5
│   │   ├── PluginManager.vue # 插件管理：表格、拖拽排序、导入导出卸载
│   │   ├── Settings.vue      # 设置：主题色、版本、插件统计
│   │   └── PluginView.vue    # 插件加载容器（component 映射 or iframe）
│   └── plugins/              # 内置插件组件
│       ├── storage.js        # localStorage 持久化工具（loadData/saveData）
│       ├── TaskManager.vue   # 个人任务管理
│       ├── Calculator.vue    # 大小写计算器
│       └── DouyinCourse.vue  # 抖音课程管理
├── external-plugins/         # 外部插件开发测试空间
│   └── helloworld-demo/      # Hello World 示例（plugin.json + index.html）
├── scripts/
│   ├── test-plugin-manager.js # 插件管理器单测（12 项）
│   └── make-demo-plugin.js   # 生成测试插件 zip
├── dist/                     # 构建产物输出
│   ├── MyToolWorld Setup 1.0.0.exe
│   ├── MyToolWorld 1.0.0.exe
│   ├── helloworld-demo.zip
│   └── web/                  # Vite 构建物（electron-builder 打包时读取）
│       ├── index.html
│       └── assets/
└── docs/                     # 项目文档
    ├── README.md             # 项目说明（安装、使用、结构）
    ├── PLUGIN-DEV-GUIDE.md   # 插件开发规则
    └── DESIGN-SPEC.md        # 本文档：设计规范
```

---

## 十、开发约定与规则

### 10.1 命名空间

- localStorage key 前缀：`mytoolworld:`
- 工作台内部使用：`mytoolworld:workbench:*`
- 插件数据：`mytoolworld:{pluginId}:{key}`
- AppID：`com.mytoolworld.workbench`
- userData 目录：`%APPDATA%/MyToolWorld/`

### 10.2 新增内置插件检查清单

- [ ] 创建 `src/plugins/XXX.vue`，用 `loadData`/`saveData` 做持久化
- [ ] 在 `src/stores/app.js` → `FALLBACK_PLUGINS` 添加插件对象
- [ ] 在 `electron/pluginManager.js` → `BUILTIN_PLUGINS` 添加同上对象
- [ ] 在 `src/views/PluginView.vue` → `componentMap` 添加 import + 映射
- [ ] 在 `docs/PLUGIN-DEV-GUIDE.md` 的「已有插件 ID 一览」追加
- [ ] ID 全局唯一，不与已有冲突

### 10.3 命名规范

- 组件：PascalCase（`Sidebar.vue`, `TaskManager.vue`）
- 插件 ID：小写字母开头，kebab-case（`task-manager`, `douyin-course`）
- CSS class：kebab-case
- JS 函数/变量：camelCase
- 外部插件 ID：反向域名（`com.example.my-tool`）

### 10.4 安全规则

- `contextIsolation: true`，禁用 `nodeIntegration`
- preload.js 仅暴露白名单 API
- `plugin://` 协议检查插件 ID 正则 `^[a-z0-9][a-z0-9._-]*$`，防止注入
- 文件访问路径穿越防护（检测 `abs.startsWith(root + id)`）
- 外部插件在独立 iframe 中，`plugin://` scheme 不支持 fetch API
- CSP header 未显式设置，默认 Electron 安全策略

### 10.5 兼容性

- 当前仅支持 Windows 10+, x64
- Vue Router Hash 模式（兼容 `file://`）
- Electron 28 → Chrome 120 → 主流前端特性全部支持
- 不需要 Node polyfill（renderer 不直接访问 Node API）

---

## 十一、参考文件清单

在新电脑重建项目时，以下文件需要完整复制：

**构建配置**：`package.json`, `vite.config.js`, `index.html`

**主进程**：`electron/main.js`, `electron/preload.js`, `electron/pluginManager.js`

**渲染进程**：`src/` 全部（main.js, App.vue, router/, stores/, assets/, components/, views/, plugins/）

**静态资源**：`public/icon.png`, `public/icon.ico`, `public/icon.svg`

**外部插件示例**：`external-plugins/helloworld-demo/`（plugin.json + index.html）

**文档**：`docs/README.md`, `docs/PLUGIN-DEV-GUIDE.md`, `docs/DESIGN-SPEC.md`

**脚本**：`scripts/test-plugin-manager.js`, `scripts/make-demo-plugin.js`

**不需要复制**：`node_modules/`（npm install 重建）、`dist/`（npm run build:electron 重建）、`dist/web/`（vite build 生成）
