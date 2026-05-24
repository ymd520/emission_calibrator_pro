<template>
  <div class="dashboard">
    <!-- 欢迎区 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>EmissionCalibrator Pro</h1>
        <p>专业排放校准 · 知识工具箱 — 桌⾯客户端</p>
      </div>
    </div>

    <!-- 快捷入口：工具箱 -->
    <div class="section-header">
      <h2>🛠️ 工具箱</h2>
      <span class="section-count">11 个⼯具</span>
    </div>

    <div class="tool-grid">
      <div
        v-for="tool in tools"
        :key="tool.path"
        class="asiimov-card tool-grid-item"
        @click="router.push(tool.path)"
      >
        <div class="tool-icon">{{ tool.icon }}</div>
        <div class="tool-name">{{ tool.name }}</div>
        <div class="tool-desc">{{ tool.desc }}</div>
      </div>
    </div>

    <!-- 知识库 -->
    <div class="section-header" style="margin-top: 32px;">
      <h2>📚 知识库</h2>
      <span class="section-count">5 ⼤子库</span>
    </div>

    <div class="tool-grid">
      <div
        v-for="item in knowledge"
        :key="item.path"
        class="asiimov-card tool-grid-item"
        @click="router.push(item.path)"
      >
        <div class="tool-icon">{{ item.icon }}</div>
        <div class="tool-name">{{ item.name }}</div>
        <div class="tool-desc">{{ item.desc }}</div>
      </div>
    </div>

    <!-- 工作流向导 -->
    <div class="section-header" style="margin-top: 32px;">
      <h2>🧭 工作流向导</h2>
      <span class="section-count">4 个引导流程</span>
    </div>

    <div class="wizard-strip">
      <div
        v-for="item in wizards"
        :key="item.path"
        class="asiimov-card wizard-item"
        @click="router.push(item.path)"
      >
        <div class="wizard-icon">{{ item.icon }}</div>
        <div class="wizard-info">
          <div class="wizard-name">{{ item.name }}</div>
          <div class="wizard-steps">{{ item.steps }}</div>
        </div>
        <span class="wizard-arrow">→</span>
      </div>
    </div>

    <!-- 最近使用记录 -->
    <div class="section-header" style="margin-top: 32px;" v-if="toolsStore.history.length > 0">
      <h2>🕐 最近使用</h2>
      <button class="btn-asiimov btn-asiimov-ghost" @click="toolsStore.clearHistory()">清除记录</button>
    </div>
    <div v-if="toolsStore.history.length > 0" class="recent-list">
      <div v-for="item in toolsStore.history.slice(0, 5)" :key="item.timestamp" class="recent-item" @click="router.push(item.path)">
        <span>{{ item.name }}</span>
        <span class="recent-time">{{ formatTime(item.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useToolsStore } from '@/stores/tools'

const router = useRouter()
const toolsStore = useToolsStore()

const tools = [
  { path: '/tool/unit-converter', icon: '📐', name: '单位转换器', desc: '12 类单位实时换算，支持自定义组合' },
  { path: '/tool/emission-calculator', icon: '💨', name: '排放计算器', desc: 'CO₂/NOx/THC/PM 计算 + 碳平衡法全实现' },
  { path: '/tool/tuning-calculator', icon: '🔧', name: '调校参数计算器', desc: '喷油/空燃比/碳氢比/增压/点火/涡轮' },
  { path: '/tool/fuel-chemistry', icon: '🧪', name: '燃料与燃烧化学', desc: '分子量/热值/燃烧产物/气体物性查询' },
  { path: '/tool/pid-tuner', icon: '🎛️', name: 'PID 调参工具箱', desc: 'Kp/Ki/Kd ↔ G/TI/TD 互转 + 仿真器 + 场景库' },
  { path: '/tool/rde-processor', icon: '🛣️', name: 'RDE 数据处理', desc: '行程判定/窗口法/符合性因子' },
  { path: '/tool/data-processor', icon: '📉', name: '数据后处理', desc: '滤波/积分/循环切割/质量检查' },
  { path: '/tool/diagnostic-assistant', icon: '🩺', name: '超标诊断助手', desc: '交互式诊断树 / 故障模式库 / 案例库' },
  { path: '/tool/obd-tools', icon: '🔌', name: 'OBD 诊断工具', desc: 'PID 解码 / DTC 查询 / CSV 分析' },
  { path: '/tool/file-tools', icon: '📁', name: '文件工具', desc: 'Hex 查看 / Checksum / CSV 可视化' },
  { path: '/tool/music-generator', icon: '🎵', name: '排放音乐生成器', desc: '排放值 → 旋律/节奏/和弦，6 种音色' }
]

const knowledge = [
  { path: '/knowledge/regulations', icon: '📜', name: '排放法规库', desc: '中国/欧洲/美国 PDF 正式版 · 中英对照 · 标准对比' },
  { path: '/knowledge/encyclopedia', icon: '📖', name: '技术百科', desc: '发动机 / 后处理 / 测量设备 / 传感器 / 测试循环' },
  { path: '/knowledge/glossary', icon: '📝', name: '术语词典', desc: '500+ 专业术语中英对照，分类浏览' },
  { path: '/knowledge/formula-handbook', icon: '📐', name: '公式手册', desc: '交互式面板，含推导+实例+实时计算' },
  { path: '/knowledge/data-tables', icon: '📊', name: '数据表', desc: '燃料特性 / 限值变化 / 传感器参数 / 测试循环参数' }
]

const wizards = [
  { path: '/wizard/emission-test', icon: '🧭', name: '排放测试向导', steps: '6 步完成排放测试全流程' },
  { path: '/wizard/diagnosis', icon: '🔍', name: '超标诊断向导', steps: '5 步定位排放超标原因' },
  { path: '/wizard/tuning', icon: '⚡', name: '调校参数向导', steps: '4 步生成调校参考参数' },
  { path: '/wizard/sensor-calibration', icon: '🔬', name: '传感器校准向导', steps: '分类型指导安装与校准' }
]

const formatTime = (ts: number) => {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.dashboard {
  max-width: 1200px;
}

.welcome-section {
  background: linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #FF8800, #FF9A2E, #FF8800);
  }

  h1 {
    font-size: 24px;
    color: white;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    font-size: 16px;
    font-weight: 600;
  }

  .section-count {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--asiimov-gray-light);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.wizard-strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wizard-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateX(4px);
  }

  .wizard-icon {
    font-size: 28px;
    margin-right: 16px;
    flex-shrink: 0;
  }

  .wizard-info {
    flex: 1;
  }

  .wizard-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .wizard-steps {
    font-size: 12px;
    color: var(--text-muted);
  }

  .wizard-arrow {
    font-size: 18px;
    color: var(--asiimov-primary);
  }
}

.recent-list {
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;

  .recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.15s;
    font-size: 13px;

    &:hover {
      background: var(--bg-hover);
    }

    &:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }

    .recent-time {
      color: var(--text-muted);
      font-size: 11px;
    }
  }
}
</style>
