/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    getAppVersion: () => Promise<string>
    getPlatform: () => Promise<string>
    searchGlobal: (query: string) => Promise<{ query: string }>
    onSearch: (callback: (query: string) => void) => void
  }
}
