<template>
  <div class="asiimov-sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <!-- 品牌区 -->
    <div class="sidebar-brand" :class="{ collapsed: appStore.sidebarCollapsed }">
      <div class="brand-icon">EC</div>
      <span class="brand-text">EmissionCalibrator</span>
    </div>

    <!-- 导航菜单 -->
    <div class="sidebar-menu">
      <!-- 仪表盘 -->
      <div class="menu-section" :class="{ collapsed: appStore.sidebarCollapsed }">
        <div class="menu-section-title">概览</div>
        <router-link to="/" class="menu-item" :class="{ collapsed: appStore.sidebarCollapsed, active: $route.path === '/' }" @click="appStore.sidebarCollapsed && $emit('navigate')">
          <span class="menu-icon">📊</span>
          <span class="menu-label">仪表盘</span>
        </router-link>
      </div>

      <!-- 工具箱 -->
      <div class="menu-section" :class="{ collapsed: appStore.sidebarCollapsed }">
        <div class="menu-section-title">工具箱</div>
        <router-link v-for="tool in tools" :key="tool.path" :to="tool.path" class="menu-item" :class="{ collapsed: appStore.sidebarCollapsed, active: $route.path === tool.path }" @click="appStore.sidebarCollapsed && $emit('navigate')">
          <span class="menu-icon">{{ tool.icon }}</span>
          <span class="menu-label">{{ tool.label }}</span>
        </router-link>
      </div>

      <!-- 知识库 -->
      <div class="menu-section" :class="{ collapsed: appStore.sidebarCollapsed }">
        <div class="menu-section-title">知识库</div>
        <router-link v-for="item in knowledge" :key="item.path" :to="item.path" class="menu-item" :class="{ collapsed: appStore.sidebarCollapsed, active: $route.path === item.path }" @click="appStore.sidebarCollapsed && $emit('navigate')">
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </router-link>
      </div>

      <!-- 向导 -->
      <div class="menu-section" :class="{ collapsed: appStore.sidebarCollapsed }">
        <div class="menu-section-title">工作流向导</div>
        <router-link v-for="item in wizards" :key="item.path" :to="item.path" class="menu-item" :class="{ collapsed: appStore.sidebarCollapsed, active: $route.path === item.path }" @click="appStore.sidebarCollapsed && $emit('navigate')">
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </router-link>
      </div>

      <!-- 设置 -->
      <div class="menu-section" :class="{ collapsed: appStore.sidebarCollapsed }">
        <div class="menu-section-title">系统</div>
        <router-link to="/settings" class="menu-item" :class="{ collapsed: appStore.sidebarCollapsed, active: $route.path === '/settings' }" @click="appStore.sidebarCollapsed && $emit('navigate')">
          <span class="menu-icon">⚙️</span>
          <span class="menu-label">设置</span>
        </router-link>
      </div>
    </div>

    <!-- 折叠按钮 -->
    <div class="sidebar-footer" @click="appStore.toggleSidebar()">
      <span v-if="appStore.sidebarCollapsed">▶</span>
      <span v-else>◀</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'

defineEmits<{ navigate: [] }>()

const appStore = useAppStore()

const tools = [
  { path: '/tool/unit-converter', icon: '📐', label: '单位转换器' },
  { path: '/tool/emission-calculator', icon: '💨', label: '排放计算器' },
  { path: '/tool/tuning-calculator', icon: '🔧', label: '调校参数计算器' },
  { path: '/tool/fuel-chemistry', icon: '🧪', label: '燃料与燃烧化学' },
  { path: '/tool/pid-tuner', icon: '🎛️', label: 'PID 调参工具箱' },
  { path: '/tool/rde-processor', icon: '🛣️', label: 'RDE 数据处理' },
  { path: '/tool/data-processor', icon: '📉', label: '数据后处理工具箱' },
  { path: '/tool/diagnostic-assistant', icon: '🩺', label: '排放超标诊断助手' },
  { path: '/tool/obd-tools', icon: '🔌', label: 'OBD 诊断工具' },
  { path: '/tool/file-tools', icon: '📁', label: '文件工具' },
  { path: '/tool/music-generator', icon: '🎵', label: '排放音乐生成器' }
]

const knowledge = [
  { path: '/knowledge/regulations', icon: '📜', label: '排放法规库' },
  { path: '/knowledge/encyclopedia', icon: '📖', label: '技术百科' },
  { path: '/knowledge/glossary', icon: '📝', label: '术语词典' },
  { path: '/knowledge/formula-handbook', icon: '📐', label: '公式手册' },
  { path: '/knowledge/data-tables', icon: '📊', label: '数据表' }
]

const wizards = [
  { path: '/wizard/emission-test', icon: '🧭', label: '排放测试向导' },
  { path: '/wizard/diagnosis', icon: '🔍', label: '超标诊断向导' },
  { path: '/wizard/tuning', icon: '⚡', label: '调校参数向导' },
  { path: '/wizard/sensor-calibration', icon: '🔬', label: '传感器校准向导' }
]
</script>
