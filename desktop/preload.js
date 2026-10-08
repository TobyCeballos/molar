const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('molarUpdater', {
  check() { return ipcRenderer.invoke('updater:check'); },
  install() { return ipcRenderer.invoke('updater:install'); },
  onStatus(callback) {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('updater-status', listener);
    return () => ipcRenderer.removeListener('updater-status', listener);
  }
});
