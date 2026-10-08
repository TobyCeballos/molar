const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('molarUpdater', {
  onStatus(callback) {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('updater-status', listener);
    return () => ipcRenderer.removeListener('updater-status', listener);
  }
});
