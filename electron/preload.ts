import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  searchGlobal: (query: string) => ipcRenderer.invoke('search-global', query),
  onSearch: (callback: (query: string) => void) => {
    ipcRenderer.on('search', (_event, query) => callback(query))
  }
})
