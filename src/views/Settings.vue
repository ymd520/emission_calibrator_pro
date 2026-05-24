<template>
  <div class="settings-page" :class="{ dark: settings.appearance.theme === 'dark' }">
    <!-- Header -->
    <div class="settings-header">
      <h1 class="page-title">设置</h1>
      <p class="page-subtitle">Settings</p>
    </div>

    <div class="settings-body">
      <!-- Section: Appearance -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="section-header">
            <el-icon :size="20"><MagicStick /></el-icon>
            <span class="section-title">外观 / Appearance</span>
            <el-tag v-if="settingsSaved" size="small" type="success" effect="dark" class="saved-tag">
              已保存
            </el-tag>
          </div>
        </template>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">主题 / Theme</span>
            <span class="setting-desc">切换亮色/暗色主题</span>
          </div>
          <el-switch
            v-model="settings.appearance.theme"
            active-value="dark"
            inactive-value="light"
            active-text="暗色"
            inactive-text="亮色"
            class="theme-switch"
            @change="saveSettings"
          />
        </div>

        <el-divider />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">字体大小 / Font Size</span>
            <span class="setting-desc">Small / Medium / Large</span>
          </div>
          <el-radio-group
            v-model="settings.appearance.fontSize"
            size="small"
            @change="saveSettings"
          >
            <el-radio-button value="small">小 / S</el-radio-button>
            <el-radio-button value="medium">中 / M</el-radio-button>
            <el-radio-button value="large">大 / L</el-radio-button>
          </el-radio-group>
        </div>

        <el-divider />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">侧边栏模式 / Sidebar Mode</span>
            <span class="setting-desc">默认展开或折叠</span>
          </div>
          <el-radio-group
            v-model="settings.appearance.sidebarMode"
            size="small"
            @change="saveSettings"
          >
            <el-radio-button value="expanded">展开 / Expanded</el-radio-button>
            <el-radio-button value="collapsed">折叠 / Collapsed</el-radio-button>
          </el-radio-group>
        </div>
      </el-card>

      <!-- Section: Calculation -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="section-header">
            <el-icon :size="20"><Setting /></el-icon>
            <span class="section-title">计算 / Calculation</span>
            <el-tag v-if="settingsSaved" size="small" type="success" effect="dark" class="saved-tag">
              已保存
            </el-tag>
          </div>
        </template>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">小数精度 / Decimal Precision</span>
            <span class="setting-desc">计算结果保留位数：{{ settings.calculation.decimalPrecision }} 位</span>
          </div>
          <div class="slider-wrap">
            <el-slider
              v-model="settings.calculation.decimalPrecision"
              :min="2"
              :max="8"
              :step="2"
              show-stops
              :marks="precisionMarks"
              class="precision-slider"
              @change="saveSettings"
            />
          </div>
        </div>

        <el-divider />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">默认单位制 / Unit System</span>
            <span class="setting-desc">公制 (Metric) 或 英制 (Imperial)</span>
          </div>
          <el-radio-group
            v-model="settings.calculation.unitSystem"
            size="small"
            @change="saveSettings"
          >
            <el-radio-button value="metric">公制 / Metric</el-radio-button>
            <el-radio-button value="imperial">英制 / Imperial</el-radio-button>
          </el-radio-group>
        </div>

        <el-divider />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">温度单位 / Temperature Unit</span>
            <span class="setting-desc">摄氏 / 华氏 / 开尔文</span>
          </div>
          <el-radio-group
            v-model="settings.calculation.tempUnit"
            size="small"
            @change="saveSettings"
          >
            <el-radio-button value="celsius">°C</el-radio-button>
            <el-radio-button value="fahrenheit">°F</el-radio-button>
            <el-radio-button value="kelvin">K</el-radio-button>
          </el-radio-group>
        </div>
      </el-card>

      <!-- Section: Knowledge Base -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="section-header">
            <el-icon :size="20"><Notebook /></el-icon>
            <span class="section-title">知识库 / Knowledge Base</span>
            <el-tag v-if="settingsSaved" size="small" type="success" effect="dark" class="saved-tag">
              已保存
            </el-tag>
          </div>
        </template>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">PDF 路径 / Resources Path</span>
            <span class="setting-desc">设置知识库文档所在目录路径</span>
          </div>
          <div class="path-input-group">
            <el-input
              v-model="settings.knowledgeBase.pdfPath"
              placeholder="请输入资源文件路径..."
              size="default"
              class="path-input"
              @change="saveSettings"
            >
              <template #append>
                <el-button @click="mockAction('浏览文件夹')" :icon="FolderOpened" />
              </template>
            </el-input>
          </div>
        </div>

        <el-divider />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">数据表管理 / Data Sheet Management</span>
            <span class="setting-desc">导入或导出数据表文件</span>
          </div>
          <div class="action-btns">
            <el-button @click="mockAction('导入数据表')" :icon="Upload" size="small">导入 / Import</el-button>
            <el-button @click="mockAction('导出数据表')" :icon="Download" size="small">导出 / Export</el-button>
          </div>
        </div>
      </el-card>

      <!-- Section: Data Management -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="section-header">
            <el-icon :size="20"><DataAnalysis /></el-icon>
            <span class="section-title">数据管理 / Data Management</span>
          </div>
        </template>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">导出设置 / Export Settings</span>
            <span class="setting-desc">将所有设置导出为 JSON 文件</span>
          </div>
          <el-button @click="exportSettings" :icon="Download" type="primary" plain>导出 / Export</el-button>
        </div>

        <el-divider />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">导入设置 / Import Settings</span>
            <span class="setting-desc">从 JSON 文件导入设置</span>
          </div>
          <el-button @click="importSettings" :icon="Upload" type="warning" plain>导入 / Import</el-button>
        </div>

        <el-divider />

        <div class="setting-row danger-zone">
          <div class="setting-info">
            <span class="setting-label label-danger">清除所有用户数据 / Clear All Data</span>
            <span class="setting-desc">此操作不可撤销，将清除所有本地存储的数据和设置</span>
          </div>
          <el-button @click="confirmClearData" :icon="Delete" type="danger">清除 / Clear</el-button>
        </div>
      </el-card>

      <!-- Section: About -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="section-header">
            <el-icon :size="20"><InfoFilled /></el-icon>
            <span class="section-title">关于 / About</span>
          </div>
        </template>

        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="应用名称 / App Name">
            <span class="about-value">Emission Calibrator Pro</span>
          </el-descriptions-item>
          <el-descriptions-item label="版本 / Version">
            <span class="about-value">{{ appInfo.version }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="技术栈 / Tech Stack">
            <span class="about-value">{{ appInfo.techStack }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="构建日期 / Build Date">
            <span class="about-value">{{ appInfo.buildDate }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="框架 / Framework">
            <span class="about-value">Electron + Vue 3 + Element Plus</span>
          </el-descriptions-item>
          <el-descriptions-item label="主题 / Theme">
            <span class="about-value">Asiimov (White / Orange / Black)</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- Clear Data Confirmation Dialog -->
    <el-dialog
      v-model="clearDialogVisible"
      title="确认清除数据"
      width="400px"
      :close-on-click-modal="false"
      class="clear-dialog"
    >
      <div class="dialog-body">
        <el-icon :size="48" class="dialog-warning-icon"><WarningFilled /></el-icon>
        <p class="dialog-warning-text">
          您确定要清除所有用户数据吗？<br />
          此操作将删除所有本地存储的设置、校准记录和用户数据，<br />
          <strong>此操作不可撤销！</strong>
        </p>
      </div>
      <template #footer>
        <el-button @click="clearDialogVisible = false">取消 / Cancel</el-button>
        <el-button type="danger" @click="clearAllData">确认清除 / Confirm Clear</el-button>
      </template>
    </el-dialog>

    <!-- Success Message -->
    <transition name="toast">
      <div v-if="toastVisible" class="settings-toast">
        <el-alert
          :title="toastMessage"
          type="success"
          :closable="false"
          show-icon
          center
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  MagicStick, Setting, Notebook, DataAnalysis, InfoFilled,
  FolderOpened, Upload, Download, Delete, WarningFilled
} from '@element-plus/icons-vue'

// ---- App Info ----
const appInfo = {
  version: '2.0.0',
  techStack: 'Vue 3 + Composition API + TypeScript + SCSS',
  buildDate: '2026-05-24'
}

// ---- Settings State ----
const defaultSettings = {
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    sidebarMode: 'expanded'
  },
  calculation: {
    decimalPrecision: 4,
    unitSystem: 'metric',
    tempUnit: 'celsius'
  },
  knowledgeBase: {
    pdfPath: ''
  }
}

const settings = reactive({
  appearance: { ...defaultSettings.appearance },
  calculation: { ...defaultSettings.calculation },
  knowledgeBase: { ...defaultSettings.knowledgeBase }
})

const settingsSaved = ref(false)
const clearDialogVisible = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')

const precisionMarks = {
  2: '2',
  4: '4',
  6: '6',
  8: '8'
}

// ---- Persistence ----
function loadSettings() {
  try {
    const stored = localStorage.getItem('emission-calibrator-settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.appearance) Object.assign(settings.appearance, parsed.appearance)
      if (parsed.calculation) Object.assign(settings.calculation, parsed.calculation)
      if (parsed.knowledgeBase) Object.assign(settings.knowledgeBase, parsed.knowledgeBase)
    }
  } catch (e) {
    console.warn('Failed to load settings:', e)
  }
}

function saveSettings() {
  try {
    const data = {
      appearance: { ...settings.appearance },
      calculation: { ...settings.calculation },
      knowledgeBase: { ...settings.knowledgeBase }
    }
    localStorage.setItem('emission-calibrator-settings', JSON.stringify(data))
    settingsSaved.value = true
    showToast('设置已保存 / Settings Saved')
    setTimeout(() => { settingsSaved.value = false }, 2000)
  } catch (e) {
    console.warn('Failed to save settings:', e)
    showToast('保存失败 / Save Failed')
  }
}

// ---- Export / Import ----
function exportSettings() {
  try {
    const data = {
      ...settings,
      exportDate: new Date().toISOString(),
      appVersion: appInfo.version
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emission-calibrator-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('设置已导出 / Settings Exported')
  } catch (e) {
    showToast('导出失败 / Export Failed')
  }
}

function importSettings() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.appearance) Object.assign(settings.appearance, data.appearance)
        if (data.calculation) Object.assign(settings.calculation, data.calculation)
        if (data.knowledgeBase) Object.assign(settings.knowledgeBase, data.knowledgeBase)
        saveSettings()
        showToast('设置已导入 / Settings Imported')
      } catch (err) {
        showToast('导入失败：文件格式错误 / Import Failed: Invalid Format')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// ---- Clear Data ----
function confirmClearData() {
  clearDialogVisible.value = true
}

function clearAllData() {
  try {
    localStorage.removeItem('emission-calibrator-settings')
    Object.assign(settings, {
      appearance: { ...defaultSettings.appearance },
      calculation: { ...defaultSettings.calculation },
      knowledgeBase: { ...defaultSettings.knowledgeBase }
    })
    clearDialogVisible.value = false
    showToast('所有数据已清除 / All Data Cleared')
  } catch (e) {
    showToast('清除失败 / Clear Failed')
  }
}

// ---- Toast ----
let toastTimer = null

function showToast(msg) {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2500)
}

function mockAction(msg) {
  showToast(`${msg} (模拟模式)`)
}

// ---- Init ----
onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
$white: #F5F5F0;
$orange: #FF8800;
$black: #1A1A1A;
$gray: #888;
$bg-dark: #2A2A2A;

.settings-page {
  min-height: 100vh;
  background: $white;
  color: #333;
  padding: 24px 32px 80px;
  transition: background 0.3s, color 0.3s;

  &.dark {
    background: $black;
    color: $white;
  }
}

.settings-header {
  text-align: center;
  margin-bottom: 32px;

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: $orange;
    margin: 0 0 4px;
    letter-spacing: 2px;
  }

  .page-subtitle {
    font-size: 13px;
    color: $gray;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 3px;
  }
}

.settings-body {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ---- Cards ----
.settings-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  transition: border-color 0.3s;
  overflow: hidden;

  .dark & {
    border-color: #333;
    background: $bg-dark !important;
  }

  :deep(.el-card__header) {
    border-bottom: 1px solid #eee;
    padding: 16px 20px;

    .dark & {
      border-bottom-color: #333;
    }
  }

  :deep(.el-card__body) {
    padding: 20px;

    .dark & {
      background: $bg-dark;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $orange;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      flex: 1;
    }

    .saved-tag {
      animation: fadeIn 0.2s ease;
    }
  }
}

// ---- Setting Rows ----
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 4px 0;

  &.danger-zone {
    .setting-desc {
      color: #e57373;

      .dark & { color: #ef9a9a; }
    }
  }

  .setting-info {
    flex: 1;

    .setting-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 2px;

      &.label-danger {
        color: #d32f2f;

        .dark & { color: #ef5350; }
      }
    }

    .setting-desc {
      display: block;
      font-size: 12px;
      color: $gray;
    }
  }

  .slider-wrap {
    min-width: 240px;

    .precision-slider {
      :deep(.el-slider__runway) {
        .dark & { background: #444; }
      }
      :deep(.el-slider__bar) { background: $orange; }
      :deep(.el-slider__button) { border-color: $orange; background: $orange; }
      :deep(.el-slider__marks-text) {
        font-size: 12px;
        color: $gray;
      }
      :deep(.el-slider__stop) {
        .dark & { background: #555; }
      }
    }
  }

  .path-input-group {
    min-width: 320px;

    .path-input {
      :deep(.el-input__wrapper) {
        .dark & { background: #222; border-color: #444; box-shadow: none; }
      }
      :deep(.el-input__inner) {
        .dark & { color: $white; }
      }
      :deep(.el-input-group__append) {
        .dark & {
          background: #333;
          border-color: #444;
          color: $white;
        }
      }
    }
  }

  .action-btns {
    display: flex;
    gap: 8px;
  }
}

// ---- Divider ----
:deep(.el-divider) {
  margin: 16px 0;
  border-color: #eee;

  .dark & { border-color: #333; }
}

// ---- About Descriptions ----
:deep(.el-descriptions__title) { color: $orange; }
:deep(.el-descriptions__label) {
  .dark & {
    background: #222;
    color: $gray;
    border-color: #333;
  }
}
:deep(.el-descriptions__content) {
  .dark & {
    background: $bg-dark;
    color: $white;
    border-color: #333;
  }
}

.about-value {
  font-weight: 500;
}

// ---- Theme Switch ----
.theme-switch {
  :deep(.el-switch__label) {
    font-size: 13px;
    color: $gray;

    &.is-active { color: $orange; }
  }
}

// ---- Dialog ----
.clear-dialog {
  .dialog-body {
    text-align: center;
    padding: 16px 0;

    .dialog-warning-icon { color: #f44336; margin-bottom: 12px; }
    .dialog-warning-text {
      font-size: 14px;
      line-height: 1.8;
      color: #666;

      .dark & { color: #ccc; }
    }
  }

  :deep(.el-dialog) {
    .dark & {
      background: $bg-dark;
      border-color: #444;
    }
  }

  :deep(.el-dialog__title) {
    .dark & { color: $white; }
  }

  :deep(.el-dialog__body) {
    .dark & { background: $bg-dark; }
  }

  :deep(.el-dialog__footer) {
    .dark & { background: $bg-dark; border-top: 1px solid #333; }
  }
}

// ---- Toast ----
.settings-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 300px;

  :deep(.el-alert) {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }
}

// ---- Button Overrides ----
:deep(.el-button--primary.is-plain) {
  .dark & {
    --el-button-plain-bg-color: rgba($orange, 0.1);
    --el-button-plain-border-color: $orange;
    color: $orange;
  }
}

:deep(.el-button--warning.is-plain) {
  .dark & {
    --el-button-plain-bg-color: rgba(#ffa726, 0.1);
    --el-button-plain-border-color: #ffa726;
    color: #ffa726;
  }
}

// ---- Radio Group ----
:deep(.el-radio-button__inner) {
  .dark & {
    background: #222;
    color: $gray;
    border-color: #444;
  }
}
:deep(.el-radio-button.is-active .el-radio-button__inner) {
  .dark & {
    background: $orange;
    border-color: $orange;
    color: #fff;
    box-shadow: none;
  }
}

// ---- Animations ----
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }
</style>
