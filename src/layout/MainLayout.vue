<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <!-- 侧边栏 -->
    <Sidebar @navigate="handleNavigate" />

    <!-- 主区域 -->
    <div class="asiimov-main">
      <!-- 顶部栏 -->
      <header class="main-header">
        <div class="header-title">{{ currentTitle }}</div>
        <div class="header-actions">
          <!-- 全局搜索 -->
          <div class="search-box" @click="appStore.openSearch()">
            <span class="search-icon">🔍</span>
            <span class="search-placeholder">搜索工具或知识点...</span>
            <span class="search-shortcut">Ctrl+K</span>
          </div>

          <!-- 设置快捷按钮 -->
          <button class="btn-icon" @click="router.push('/settings')" title="设置">
            ⚙️
          </button>
        </div>
      </header>

      <!-- 搜索弹窗 -->
      <Teleport to="body">
        <div v-if="appStore.showSearch" class="search-overlay" @click.self="appStore.closeSearch()">
          <div class="search-modal">
            <div class="search-input-wrap">
              <span class="search-input-icon">🔍</span>
              <input
                ref="searchInputRef"
                v-model="appStore.searchQuery"
                class="search-input"
                placeholder="搜索工具、知识点、公式..."
                @keydown.escape="appStore.closeSearch()"
                @keydown.enter="handleSearchEnter"
              />
              <button class="search-close" @click="appStore.closeSearch()">ESC</button>
            </div>
            <div class="search-results" v-if="appStore.searchQuery">
              <div class="search-no-result" v-if="filteredResults.length === 0">
                未找到相关结果
              </div>
              <div
                v-for="item in filteredResults"
                :key="item.path"
                class="search-result-item"
                @click="navigateTo(item.path)"
              >
                <span class="result-icon">{{ item.icon }}</span>
                <div class="result-info">
                  <div class="result-title">{{ item.name }}</div>
                  <div class="result-path">{{ item.category }}</div>
                </div>
              </div>
            </div>
            <div class="search-hint" v-else>
              输入关键词搜索，支持拼音和模糊匹配
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 内容区 -->
      <main class="main-content">
        <router-view />
      </main>

      <!-- 底部状态栏 -->
      <footer class="main-footer">
        <span>EmissionCalibrator Pro v2.0</span>
        <span class="footer-right">提供 11 个专业工具 · 5 大知识库 · 4 个工作流向导</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Sidebar from './Sidebar.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const searchInputRef = ref<HTMLInputElement>()

const currentTitle = computed(() => {
  return (route.meta?.title as string) || 'EmissionCalibrator Pro'
})

// 全局 Ctrl+K 快捷键
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    appStore.openSearch()
  }
  if (e.key === 'Escape') {
    appStore.closeSearch()
  }
})

watch(() => appStore.showSearch, async (val) => {
  if (val) {
    await nextTick()
    searchInputRef.value?.focus()
  }
})

// 搜索数据源
const searchIndex = [
  // 工具
  ...tools,
  // 知识库
  ...knowledge,
  // 向导
  ...wizards
].map(item => ({
  ...item,
  searchText: `${item.name} ${item.category}`.toLowerCase()
}))

const tools = [
  { path: '/tool/unit-converter', icon: '📐', name: '单位转换器', category: '工具箱' },
  { path: '/tool/emission-calculator', icon: '💨', name: '排放计算器', category: '工具箱' },
  { path: '/tool/tuning-calculator', icon: '🔧', name: '调校参数计算器', category: '工具箱' },
  { path: '/tool/fuel-chemistry', icon: '🧪', name: '燃料与燃烧化学', category: '工具箱' },
  { path: '/tool/pid-tuner', icon: '🎛️', name: 'PID 调参工具箱', category: '工具箱' },
  { path: '/tool/rde-processor', icon: '🛣️', name: 'RDE 数据处理', category: '工具箱' },
  { path: '/tool/data-processor', icon: '📉', name: '数据后处理工具箱', category: '工具箱' },
  { path: '/tool/diagnostic-assistant', icon: '🩺', name: '排放超标诊断助手', category: '工具箱' },
  { path: '/tool/obd-tools', icon: '🔌', name: 'OBD 诊断工具', category: '工具箱' },
  { path: '/tool/file-tools', icon: '📁', name: '文件工具', category: '工具箱' },
  { path: '/tool/music-generator', icon: '🎵', name: '排放音乐生成器', category: '工具箱' }
]

const knowledge = [
  { path: '/knowledge/regulations', icon: '📜', name: '排放法规库', category: '知识库' },
  { path: '/knowledge/encyclopedia', icon: '📖', name: '技术百科', category: '知识库' },
  { path: '/knowledge/glossary', icon: '📝', name: '术语词典', category: '知识库' },
  { path: '/knowledge/formula-handbook', icon: '📐', name: '公式手册', category: '知识库' },
  { path: '/knowledge/data-tables', icon: '📊', name: '数据表', category: '知识库' }
]

const wizards = [
  { path: '/wizard/emission-test', icon: '🧭', name: '排放测试向导', category: '工作流向导' },
  { path: '/wizard/diagnosis', icon: '🔍', name: '超标诊断向导', category: '工作流向导' },
  { path: '/wizard/tuning', icon: '⚡', name: '调校参数向导', category: '工作流向导' },
  { path: '/wizard/sensor-calibration', icon: '🔬', name: '传感器校准向导', category: '工作流向导' }
]

const filteredResults = computed(() => {
  const q = appStore.searchQuery.toLowerCase()
  if (!q) return []

  return searchIndex.filter(item =>
    item.searchText.includes(q) ||
    item.name.toLowerCase().includes(q)
  )
})

const handleSearchEnter = () => {
  if (filteredResults.value.length > 0) {
    navigateTo(filteredResults.value[0].path)
  }
}

const navigateTo = (path: string) => {
  appStore.closeSearch()
  router.push(path)
}

const handleNavigate = () => {
  // 用于移动端或紧凑模式下点击导航后操作
}
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  width: 240px;

  &:hover {
    border-color: var(--asiimov-primary);
  }

  .search-icon {
    font-size: 14px;
    margin-right: 8px;
  }

  .search-placeholder {
    font-size: 12px;
    color: var(--text-muted);
    flex: 1;
  }

  .search-shortcut {
    font-size: 10px;
    padding: 1px 5px;
    background: var(--asiimov-gray);
    border-radius: 3px;
    color: var(--text-muted);
  }
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  font-size: 16px;

  &:hover {
    background: var(--bg-hover);
  }
}

// 搜索弹窗
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding-top: 120px;
}

.search-modal {
  width: 560px;
  max-height: 480px;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;

  .search-input-icon {
    font-size: 18px;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 16px;
    background: transparent;
    color: var(--text-primary);

    &::placeholder {
      color: var(--text-muted);
    }
  }

  .search-close {
    padding: 2px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    font-size: 11px;
    color: var(--text-muted);
  }
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.search-no-result {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 14px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  .result-icon {
    font-size: 20px;
  }

  .result-info {
    flex: 1;
  }

  .result-title {
    font-size: 14px;
    font-weight: 500;
  }

  .result-path {
    font-size: 11px;
    color: var(--text-muted);
  }
}

.search-hint {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

// 底部状态栏
.main-footer {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: var(--bg-header);
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  flex-shrink: 0;

  .footer-right {
    margin-left: auto;
  }
}

.main-header {
  .header-title {
    font-size: 16px;
    font-weight: 600;
  }
}
</style>
