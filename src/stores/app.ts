import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const themeMode = ref<'light' | 'dark'>('light')

  // 搜索
  const searchQuery = ref('')
  const showSearch = ref(false)

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const toggleTheme = () => {
    themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
  }

  const openSearch = () => {
    showSearch.value = true
    searchQuery.value = ''
  }

  const closeSearch = () => {
    showSearch.value = false
    searchQuery.value = ''
  }

  return {
    sidebarCollapsed,
    themeMode,
    searchQuery,
    showSearch,
    toggleSidebar,
    toggleTheme,
    openSearch,
    closeSearch
  }
})
