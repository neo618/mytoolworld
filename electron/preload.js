const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getAppPath: (name) => ipcRenderer.invoke('app:getPath', name),
  plugins: {
    scan: () => ipcRenderer.invoke('plugins:scan'),
    importZip: () => ipcRenderer.invoke('plugins:import'),
    exportZip: (id) => ipcRenderer.invoke('plugins:export', id),
    uninstall: (id) => ipcRenderer.invoke('plugins:uninstall', id),
    setEnabled: (id, enabled) => ipcRenderer.invoke('plugins:setEnabled', id, enabled),
    setOrder: (ids) => ipcRenderer.invoke('plugins:setOrder', ids)
  }
})
