const { app, BrowserWindow, ipcMain, dialog, protocol, net, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const pm = require('./pluginManager')

const isDev = process.env.NODE_ENV === 'development'

// 外部插件通过 plugin://<plugin-id>/<file> 加载，沙箱隔离
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'plugin',
    privileges: { standard: true, secure: true, supportFetchAPI: false, stream: true, bypassCSP: false }
  }
])

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '我的工具世界',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: true,
    show: false,
    backgroundColor: '#f5f6f8',
    icon: path.join(__dirname, '../public/icon.png')
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/web/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  // 中文菜单栏
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        { label: '退出', accelerator: 'Alt+F4', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于我的工具世界',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('app:showAbout')
            }
          }
        },
        {
          label: '如何增加一个新的插件',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('app:showPluginGuide')
            }
          }
        }
      ]
    }
  ]))

  // plugin:// 协议处理：从 userData/plugins/<id>/ 下取文件
  protocol.handle('plugin', (request) => {
    const url = new URL(request.url)
    const pluginId = url.hostname
    // 防路径穿越
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(pluginId)) {
      return new Response('Invalid plugin id', { status: 400 })
    }
    let relPath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'
    const root = pm.pluginsRoot()
    const abs = path.normalize(path.join(root, pluginId, relPath))
    if (!abs.startsWith(path.normalize(path.join(root, pluginId)))) {
      return new Response('Forbidden', { status: 403 })
    }
    if (!fs.existsSync(abs)) return new Response('Not found', { status: 404 })
    return net.fetch(path.normalize(abs).replace(/^([a-zA-Z]):/, 'file:///$1:').replace(/\\/g, '/'))
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ===== IPC: 基础 =====
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:getPath', (_, name) => app.getPath(name))

// ===== IPC: 插件管理 =====
ipcMain.handle('plugins:scan', () => pm.scanPlugins())

ipcMain.handle('plugins:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Plugin Package', extensions: ['zip'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true }
  try {
    return pm.importPlugin(result.filePaths[0])
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('plugins:export', async (_, id) => {
  try {
    return await pm.exportPlugin(mainWindow, id)
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('plugins:uninstall', (_, id) => {
  try {
    return pm.uninstallPlugin(id)
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('plugins:setEnabled', (_, id, enabled) => {
  try {
    return pm.setEnabled(id, enabled)
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('plugins:setOrder', (_, ids) => {
  try {
    return pm.setOrder(ids)
  } catch (e) {
    return { ok: false, error: e.message }
  }
})
