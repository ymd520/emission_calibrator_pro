import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToolHistoryItem {
  id: string
  name: string
  path: string
  timestamp: number
  params?: Record<string, any>
}

export const useToolsStore = defineStore('tools', () => {
  const history = ref<ToolHistoryItem[]>([])

  const addHistory = (item: Omit<ToolHistoryItem, 'timestamp'>) => {
    history.value.unshift({
      ...item,
      timestamp: Date.now()
    })
    // 只保留最近 20 条
    if (history.value.length > 20) {
      history.value = history.value.slice(0, 20)
    }
  }

  const clearHistory = () => {
    history.value = []
  }

  return {
    history,
    addHistory,
    clearHistory
  }
})
