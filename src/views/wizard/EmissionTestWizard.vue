<template>
  <div class="emission-test-wizard" :class="{ 'wizard-complete': activeStep === 6 }">
    <!-- Header -->
    <div class="wizard-header">
      <h1 class="wizard-title">排放测试向导</h1>
      <p class="wizard-subtitle">Emission Test Wizard</p>
    </div>

    <!-- Steps Indicator -->
    <el-steps
      :active="activeStep - 1"
      align-center
      finish-status="success"
      class="wizard-steps"
    >
      <el-step title="选择测试类型" />
      <el-step title="选择测试循环" />
      <el-step title="准备清单" />
      <el-step title="测试中" />
      <el-step title="计算结果" />
      <el-step title="生成报告" />
    </el-steps>

    <!-- Step Content -->
    <div class="wizard-body">
      <!-- STEP 1: Test Type Selection -->
      <div v-if="activeStep === 1" class="step-content">
        <h2 class="step-title">选择测试类型</h2>
        <p class="step-desc">请选择您要执行的排放测试类型</p>

        <div class="test-type-grid">
          <div
            v-for="t in testTypes"
            :key="t.id"
            class="test-type-card"
            :class="{ selected: wizardData.testType === t.id }"
            @click="wizardData.testType = t.id"
          >
            <div class="type-icon">{{ t.icon }}</div>
            <div class="type-name">{{ t.label }}</div>
            <div class="type-label-en">{{ t.labelEn }}</div>
            <el-icon v-if="wizardData.testType === t.id" class="check-badge">
              <CircleCheck />
            </el-icon>
          </div>
        </div>

        <transition name="fade">
          <div v-if="selectedTypeDesc" class="type-description-panel">
            <el-alert
              :title="selectedTypeDesc"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </transition>
      </div>

      <!-- STEP 2: Test Cycle Selection -->
      <div v-if="activeStep === 2" class="step-content">
        <h2 class="step-title">选择测试循环</h2>
        <p class="step-desc">
          当前测试类型：
          <strong>{{ selectedTypeLabel }}</strong>
          <el-tag size="small" type="warning" class="ml-2" @click="activeStep = 1">
            (修改)
          </el-tag>
        </p>

        <el-radio-group
          v-model="wizardData.testCycle"
          class="cycle-list"
        >
          <div
            v-for="cycle in filteredCycles"
            :key="cycle.id"
            class="cycle-item"
          >
            <el-radio :value="cycle.id" class="cycle-radio">
              <div class="cycle-info">
                <span class="cycle-name">{{ cycle.name }}</span>
                <span class="cycle-params">
                  时长: {{ cycle.duration }} | {{ cycle.paramLabel }}: {{ cycle.paramValue }}
                </span>
              </div>
            </el-radio>
          </div>
        </el-radio-group>
      </div>

      <!-- STEP 3: Checklist -->
      <div v-if="activeStep === 3" class="step-content">
        <h2 class="step-title">准备清单</h2>
        <p class="step-desc">请逐项确认测试准备工作已完成</p>

        <div class="checklist-progress">
          <el-progress
            :percentage="checklistProgress"
            :status="checklistProgress === 100 ? 'success' : ''"
          />
          <span class="progress-text">{{ checkedCount }} / {{ checklistItems.length }} 已完成</span>
        </div>

        <div class="checklist-items">
          <div
            v-for="(item, idx) in checklistItems"
            :key="idx"
            class="checklist-item"
            :class="{ completed: item.checked }"
          >
            <el-checkbox v-model="item.checked" class="check-box">
              <span class="item-label">{{ item.label }}</span>
              <el-tag v-if="item.checked" size="small" type="success" effect="dark">OK</el-tag>
              <el-tag v-else size="small" type="info" effect="plain">待确认</el-tag>
            </el-checkbox>
          </div>
        </div>
      </div>

      <!-- STEP 4: During Test -->
      <div v-if="activeStep === 4" class="step-content">
        <h2 class="step-title">测试中</h2>
        <p class="step-desc">实时监控测试数据</p>

        <!-- Status Indicators -->
        <div class="status-bar">
          <div
            v-for="s in statusIndicators"
            :key="s.label"
            class="status-indicator"
            :class="s.status"
          >
            <span class="status-dot" />
            <span class="status-label">{{ s.label }}</span>
            <span class="status-value">{{ s.value }}</span>
          </div>
        </div>

        <!-- Real-time Data -->
        <div class="realtime-grid">
          <div class="realtime-card">
            <span class="rt-label">运行时间</span>
            <span class="rt-value">{{ formattedTime }}</span>
          </div>
          <div class="realtime-card">
            <span class="rt-label">车速 / 转速</span>
            <span class="rt-value">{{ realtime.speed }} km/h</span>
            <span class="rt-unit">{{ realtime.rpm }} RPM</span>
          </div>
          <div class="realtime-card">
            <span class="rt-label">排气温度</span>
            <span class="rt-value">{{ realtime.exhaustTemp }} &deg;C</span>
          </div>
          <div class="realtime-card">
            <span class="rt-label">CO&#8322;</span>
            <span class="rt-value">{{ realtime.co2 }} %</span>
          </div>
          <div class="realtime-card">
            <span class="rt-label">CO</span>
            <span class="rt-value">{{ realtime.co }} ppm</span>
          </div>
          <div class="realtime-card">
            <span class="rt-label">NOx</span>
            <span class="rt-value">{{ realtime.nox }} ppm</span>
          </div>
          <div class="realtime-card">
            <span class="rt-label">HC</span>
            <span class="rt-value">{{ realtime.hc }} ppm</span>
          </div>
          <div class="realtime-card">
            <span class="rt-label">过量空气系数 &#955;</span>
            <span class="rt-value">{{ realtime.lambda }}</span>
          </div>
        </div>

        <div class="test-controls">
          <el-button
            v-if="!testRunning"
            type="primary"
            size="large"
            @click="startTest"
            :icon="VideoPlay"
          >
            开始测试
          </el-button>
          <el-button
            v-else
            type="danger"
            size="large"
            @click="stopTest"
            :icon="VideoPause"
          >
            停止测试
          </el-button>
          <el-tag v-if="testRunning" type="warning" effect="dark" class="recording-tag">
            <el-icon class="blink"><CircleCheck /></el-icon> 采集中...
          </el-tag>
        </div>
      </div>

      <!-- STEP 5: Results -->
      <div v-if="activeStep === 5" class="step-content">
        <h2 class="step-title">计算结果</h2>
        <p class="step-desc">测试完成，以下是计算结果</p>

        <div class="results-summary">
          <el-card shadow="never" class="result-card">
            <template #header>
              <span class="card-title">袋采样结果 (Bag Results)</span>
            </template>
            <div class="result-row">
              <span>CO&#8322;:</span>
              <span :class="passFailClass(results.co2)">{{ results.co2 }} {{ results.unit }}</span>
            </div>
            <div class="result-row">
              <span>CO:</span>
              <span :class="passFailClass(results.co)">{{ results.co }} {{ results.unit }}</span>
            </div>
            <div class="result-row">
              <span>NOx:</span>
              <span :class="passFailClass(results.nox)">{{ results.nox }} {{ results.unit }}</span>
            </div>
            <div class="result-row">
              <span>HC:</span>
              <span :class="passFailClass(results.hc)">{{ results.hc }} {{ results.unit }}</span>
            </div>
            <div class="result-row total-row">
              <span>总距离/功:</span>
              <span>{{ results.totalDistance }} km / {{ results.totalWork }} kWh</span>
            </div>
          </el-card>

          <el-card shadow="never" class="result-card">
            <template #header>
              <span class="card-title">判定结果</span>
            </template>
            <div class="verdict">
              <el-icon v-if="results.passed" class="verdict-pass" :size="48">
                <CircleCheck />
              </el-icon>
              <el-icon v-else class="verdict-fail" :size="48">
                <CircleClose />
              </el-icon>
              <span :class="results.passed ? 'verdict-pass' : 'verdict-fail'" class="verdict-text">
                {{ results.passed ? '通过 (PASS)' : '不通过 (FAIL)' }}
              </span>
            </div>
            <div class="limit-info">
              <p>执行标准：{{ results.standard }}</p>
              <p>限值：CO&#8322; {{ results.limitCO2 }} | CO {{ results.limitCO }} | NOx {{ results.limitNOx }} | HC {{ results.limitHC }}</p>
            </div>
          </el-card>
        </div>

        <!-- Bar Chart -->
        <div class="chart-section">
          <h3>排放物对比 / Emission Comparison</h3>
          <div class="bar-chart">
            <div v-for="bar in chartBars" :key="bar.label" class="bar-group">
              <span class="bar-label">{{ bar.label }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill measured"
                  :style="{ width: bar.measuredPct + '%' }"
                  :title="'测得: ' + bar.measured + ' ' + results.unit"
                />
                <div
                  class="bar-fill limit"
                  :style="{ width: '100%' }"
                  :title="'限值: ' + bar.limit + ' ' + results.unit"
                />
              </div>
              <div class="bar-values">
                <span class="measured-val">{{ bar.measured }}</span>
                <span class="limit-val">{{ bar.limit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 6: Report -->
      <div v-if="activeStep === 6" class="step-content">
        <h2 class="step-title">生成报告</h2>
        <p class="step-desc">测试报告摘要</p>

        <el-card shadow="never" class="report-card">
          <template #header>
            <div class="report-header">
              <span class="card-title">排放测试报告 / Emission Test Report</span>
              <el-tag v-if="results.passed" type="success" size="large" effect="dark">PASS</el-tag>
              <el-tag v-else type="danger" size="large" effect="dark">FAIL</el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="测试类型">{{ selectedTypeLabel }}</el-descriptions-item>
            <el-descriptions-item label="测试循环">{{ selectedCycleLabel }}</el-descriptions-item>
            <el-descriptions-item label="测试日期">{{ reportDate }}</el-descriptions-item>
            <el-descriptions-item label="执行标准">{{ results.standard }}</el-descriptions-item>
            <el-descriptions-item label="总距离/功">{{ results.totalDistance }} km / {{ results.totalWork }} kWh</el-descriptions-item>
            <el-descriptions-item label="判定结果">
              <el-tag :type="results.passed ? 'success' : 'danger'" size="small">
                {{ results.passed ? '通过' : '不通过' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <h3 class="section-title">排放物结果 / Emission Results</h3>
          <el-table :data="reportTableData" stripe style="width: 100%">
            <el-table-column prop="pollutant" label="污染物" width="120" />
            <el-table-column prop="measured" label="测得值" width="150" />
            <el-table-column prop="limit" label="限值" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                  {{ row.passed ? 'PASS' : 'FAIL' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-divider />

          <h3 class="section-title">设备 / 准备检查 / Equipment & Preparation</h3>
          <el-tag v-for="(item, idx) in completedChecklist" :key="idx" class="checklist-tag" type="success" effect="plain">
            {{ item.label }}
          </el-tag>
        </el-card>

        <div class="report-actions">
          <el-button type="primary" :icon="Download" @click="mockAction('保存报告')">保存</el-button>
          <el-button type="warning" :icon="Document" @click="mockAction('导出PDF')">导出 PDF</el-button>
          <el-button type="danger" :icon="Refresh" @click="restartWizard">重新开始</el-button>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="wizard-footer">
      <el-button
        v-if="activeStep > 1 && activeStep < 6"
        @click="prevStep"
        :icon="ArrowLeft"
      >
        上一步
      </el-button>
      <el-button
        v-if="activeStep < 6"
        type="primary"
        @click="nextStep"
        :disabled="!canProceed"
        :icon="ArrowRight"
      >
        {{ activeStep === 5 ? '生成报告' : '下一步' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import {
  CircleCheck, CircleClose, ArrowLeft, ArrowRight,
  VideoPlay, VideoPause, Download, Document, Refresh
} from '@element-plus/icons-vue'

// ---- Reactive State ----
const activeStep = ref(1)
const testRunning = ref(false)
let testTimer = null

const wizardData = reactive({
  testType: '',
  testCycle: '',
  checklistDone: false
})

// ---- Test Types ----
const testTypes = [
  { id: 'chassis', label: '整车测试', labelEn: 'Chassis Dynamometer', icon: '🚗', desc: '在底盘测功机上对完整车辆进行排放测试，模拟实际道路行驶工况。适用于轻型车排放认证。' },
  { id: 'engine', label: '发动机测试', labelEn: 'Engine Dynamometer', icon: '🔧', desc: '在发动机台架上对发动机进行排放测试，适用于重型发动机排放认证及研发测试。' },
  { id: 'nrmm', label: '非道路机械', labelEn: 'NRMM', icon: '🏗️', desc: '非道路移动机械排放测试，包括工程机械、农业机械等。使用 NRTC/NRSC 测试循环。' },
  { id: 'marine', label: '船机', labelEn: 'Marine Engine', icon: '🚢', desc: '船用发动机排放测试，使用 E2/E3/D2/C1 等测试循环，适用于 IMO Tier 认证。' }
]

const selectedTypeLabel = computed(() => {
  const t = testTypes.find(t => t.id === wizardData.testType)
  return t ? t.label : ''
})

const selectedTypeDesc = computed(() => {
  const t = testTypes.find(t => t.id === wizardData.testType)
  return t ? t.desc : ''
})

// ---- Test Cycles ----
const cycles = {
  chassis: [
    { id: 'wltc', name: 'WLTC (Worldwide harmonized Light vehicles Test Cycle)', duration: '1800s', paramLabel: '距离', paramValue: '23.26 km' },
    { id: 'nedc', name: 'NEDC (New European Driving Cycle)', duration: '1180s', paramLabel: '距离', paramValue: '11.03 km' },
    { id: 'ftp75', name: 'FTP-75 (Federal Test Procedure)', duration: '1874s', paramLabel: '距离', paramValue: '17.77 km' },
    { id: 'us06', name: 'US06 (Supplemental FTP)', duration: '596s', paramLabel: '距离', paramValue: '12.87 km' },
    { id: 'sc03', name: 'SC03 (Air Conditioning Test)', duration: '596s', paramLabel: '距离', paramValue: '5.78 km' }
  ],
  engine: [
    { id: 'whtc', name: 'WHTC (World Harmonized Transient Cycle)', duration: '1800s', paramLabel: '扭矩/转速模式', paramValue: '瞬态' },
    { id: 'whsc', name: 'WHSC (World Harmonized Steady-State Cycle)', duration: '1800s', paramLabel: '13工况', paramValue: '稳态' },
    { id: 'esc', name: 'ESC (European Steady Cycle)', duration: '~60min', paramLabel: '13工况', paramValue: '稳态' },
    { id: 'etc', name: 'ETC (European Transient Cycle)', duration: '1800s', paramLabel: '扭矩/转速模式', paramValue: '瞬态' }
  ],
  nrmm: [
    { id: 'nrtc', name: 'NRTC (Non-Road Transient Cycle)', duration: '1238s', paramLabel: '模式', paramValue: '瞬态' },
    { id: 'nrsc', name: 'NRSC (Non-Road Steady-State Cycle)', duration: '~40min', paramLabel: '工况数', paramValue: 'C1 / D2 / G1 / G2 / G3' }
  ],
  marine: [
    { id: 'e2', name: 'E2 (Marine Propeller Law - Heavy Duty)', duration: '~60min', paramLabel: '转速/负荷', paramValue: '100%/91%/80%/63%' },
    { id: 'e3', name: 'E3 (Marine Propeller Law)', duration: '~60min', paramLabel: '转速/负荷', paramValue: '100%/75%/50%/25%' },
    { id: 'd2', name: 'D2 (Constant Speed Auxiliary)', duration: '~60min', paramLabel: '负荷点', paramValue: '100%/75%/50%/25%/10%' },
    { id: 'c1', name: 'C1 (ISO 8178 C1 - Variable Speed NR)', duration: '~40min', paramLabel: '工况数', paramValue: '8 mode' }
  ]
}

const filteredCycles = computed(() => {
  return cycles[wizardData.testType] || []
})

const selectedCycleLabel = computed(() => {
  const list = filteredCycles.value
  const c = list.find(c => c.id === wizardData.testCycle)
  return c ? c.name : ''
})

// ---- Checklist ----
const checklistItems = reactive([
  { label: '预热分析仪 (30min minimum)', checked: false },
  { label: '零点校准', checked: false },
  { label: '量程校准', checked: false },
  { label: '检漏测试', checked: false },
  { label: '安装传感器 (排温/背压/环境温湿度)', checked: false },
  { label: '传感器连接检查', checked: false },
  { label: '背景采样', checked: false },
  { label: '确认标准气有效期', checked: false },
  { label: '数据采集系统启动', checked: false },
  { label: '测功机准备 (road load / dyno mode)', checked: false }
])

const checkedCount = computed(() => checklistItems.filter(i => i.checked).length)
const checklistProgress = computed(() => Math.round((checkedCount.value / checklistItems.length) * 100))
const completedChecklist = computed(() => checklistItems.filter(i => i.checked))

// ---- Real-time Data ----
const realtime = reactive({
  time: 0,
  speed: 0,
  rpm: 0,
  exhaustTemp: 20,
  co2: 0,
  co: 0,
  nox: 0,
  hc: 0,
  lambda: 1.0
})

const formattedTime = computed(() => {
  const m = Math.floor(realtime.time / 60)
  const s = realtime.time % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const statusIndicators = computed(() => [
  { label: '分析仪', status: realtime.co2 > 0 ? 'good' : 'idle', value: realtime.co2 > 0 ? '在线' : '待命' },
  { label: '传感器', status: realtime.exhaustTemp > 30 ? 'good' : 'idle', value: realtime.exhaustTemp > 30 ? '连接' : '待命' },
  { label: '数据采集', status: testRunning ? 'good' : 'idle', value: testRunning ? '采集中' : '待命' },
  { label: '系统状态', status: 'good', value: '正常' }
])

function startTest() {
  testRunning.value = true
  realtime.time = 0
  testTimer = setInterval(() => {
    realtime.time++
    realtime.speed = Math.round(Math.random() * 120)
    realtime.rpm = Math.round(800 + Math.random() * 2200)
    realtime.exhaustTemp = Math.round(100 + Math.random() * 400)
    realtime.co2 = +(0.5 + Math.random() * 14).toFixed(1)
    realtime.co = +(Math.random() * 800).toFixed(0)
    realtime.nox = +(Math.random() * 500).toFixed(0)
    realtime.hc = +(Math.random() * 200).toFixed(0)
    realtime.lambda = +(0.8 + Math.random() * 0.4).toFixed(2)
  }, 1000)
}

function stopTest() {
  testRunning.value = false
  if (testTimer) {
    clearInterval(testTimer)
    testTimer = null
  }
  computeResults()
  activeStep.value = 5
}

// ---- Results ----
const results = reactive({
  co2: 0, co: 0, nox: 0, hc: 0,
  unit: 'g/km',
  totalDistance: 0,
  totalWork: 0,
  passed: false,
  standard: 'GB 18352.6-2016 (国VI)',
  limitCO2: 120, limitCO: 1.0, limitNOx: 0.06, limitHC: 0.1
})

const chartBars = computed(() => [
  { label: 'CO₂', measured: results.co2, measuredPct: Math.min((results.co2 / results.limitCO2) * 100, 150), limit: results.limitCO2 },
  { label: 'CO', measured: results.co, measuredPct: Math.min((results.co / results.limitCO) * 100, 150), limit: results.limitCO },
  { label: 'NOx', measured: results.nox, measuredPct: Math.min((results.nox / results.limitNOx) * 100, 150), limit: results.limitNOx },
  { label: 'HC', measured: results.hc, measuredPct: Math.min((results.hc / results.limitHC) * 100, 150), limit: results.limitHC }
])

const reportTableData = computed(() => [
  { pollutant: 'CO₂', measured: `${results.co2} ${results.unit}`, limit: `${results.limitCO2} ${results.unit}`, passed: results.co2 <= results.limitCO2 },
  { pollutant: 'CO', measured: `${results.co} ${results.unit}`, limit: `${results.limitCO} ${results.unit}`, passed: results.co <= results.limitCO },
  { pollutant: 'NOx', measured: `${results.nox} ${results.unit}`, limit: `${results.limitNOx} ${results.unit}`, passed: results.nox <= results.limitNOx },
  { pollutant: 'HC', measured: `${results.hc} ${results.unit}`, limit: `${results.limitHC} ${results.unit}`, passed: results.hc <= results.limitHC }
])

function passFailClass(val) {
  return { 'pass-val': true, fail: val > getLimitByPollutant }
}

const reportDate = computed(() => new Date().toLocaleDateString('zh-CN'))

function computeResults() {
  const maxDist = 23.26
  const progress = Math.min(realtime.time / 1800, 1)
  results.totalDistance = +(maxDist * progress).toFixed(2)
  results.totalWork = +(250 * progress).toFixed(1)
  results.co2 = +((results.limitCO2 * 0.6) + Math.random() * results.limitCO2 * 0.8).toFixed(1)
  results.co = +(Math.random() * results.limitCO * 1.5).toFixed(2)
  results.nox = +(Math.random() * results.limitNOx * 1.5).toFixed(3)
  results.hc = +(Math.random() * results.limitHC * 1.5).toFixed(3)
  results.unit = wizardData.testType === 'chassis' ? 'g/km' : 'g/kWh'
  results.passed = results.co <= results.limitCO && results.nox <= results.limitNOx && results.hc <= results.limitHC
}

// ---- Navigation ----
const canProceed = computed(() => {
  switch (activeStep.value) {
    case 1: return !!wizardData.testType
    case 2: return !!wizardData.testCycle
    case 3: return checkedCount.value === checklistItems.length
    case 4: return !testRunning
    case 5: return true
    default: return false
  }
})

function nextStep() {
  if (activeStep.value < 6) activeStep.value++
  if (activeStep.value === 4 && !testRunning) {
    startTest()
  }
}

function prevStep() {
  if (activeStep.value > 1) {
    if (activeStep.value === 5 && testRunning.value) {
      stopTest()
    }
    activeStep.value--
  }
}

function restartWizard() {
  if (testTimer) clearInterval(testTimer)
  testTimer = null
  testRunning.value = false
  wizardData.testType = ''
  wizardData.testCycle = ''
  checklistItems.forEach(i => { i.checked = false })
  Object.assign(realtime, { time: 0, speed: 0, rpm: 0, exhaustTemp: 20, co2: 0, co: 0, nox: 0, hc: 0, lambda: 1.0 })
  Object.assign(results, { co2: 0, co: 0, nox: 0, hc: 0, totalDistance: 0, totalWork: 0, passed: false })
  activeStep.value = 1
}

function mockAction(action) {
  ElMessage.success(`${action} 功能已触发 (模拟模式)`)
}

onBeforeUnmount(() => {
  if (testTimer) clearInterval(testTimer)
})
</script>

<style scoped lang="scss">
$white: #F5F5F0;
$orange: #FF8800;
$black: #1A1A1A;
$gray: #888;
$light-gray: #E8E8E3;
$bg-dark: #2A2A2A;

.emission-test-wizard {
  min-height: 100vh;
  background: $black;
  color: $white;
  padding: 24px 32px 80px;

  &.wizard-complete {
    background: linear-gradient(135deg, $black 0%, #2A2A1A 100%);
  }
}

.wizard-header {
  text-align: center;
  margin-bottom: 32px;

  .wizard-title {
    font-size: 28px;
    font-weight: 700;
    color: $orange;
    margin: 0 0 4px;
    letter-spacing: 2px;
  }

  .wizard-subtitle {
    font-size: 13px;
    color: $gray;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 3px;
  }
}

.wizard-steps {
  max-width: 900px;
  margin: 0 auto 36px;
  :deep(.el-step__title) {
    font-size: 13px;
    color: $gray;
  }
  :deep(.el-step.is-finish .el-step__title) {
    color: $orange;
  }
  :deep(.el-step.is-process .el-step__title) {
    color: $white;
    font-weight: 600;
  }
  :deep(.el-step__head.is-finish) {
    color: $orange;
    border-color: $orange;
  }
  :deep(.el-step__head.is-process) {
    color: $orange;
    border-color: $orange;
  }
  :deep(.el-step__line) {
    background: #333;
  }
  :deep(.el-step.is-finish .el-step__line) {
    background: $orange;
  }
}

.wizard-body {
  max-width: 800px;
  margin: 0 auto;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

.step-title {
  font-size: 22px;
  font-weight: 600;
  color: $white;
  margin: 0 0 8px;
}

.step-desc {
  color: $gray;
  margin: 0 0 24px;
  font-size: 14px;
}

// ---- Step 1: Test Type ----
.test-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.test-type-card {
  position: relative;
  background: $bg-dark;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: $orange;
    background: rgba($orange, 0.05);
  }

  &.selected {
    border-color: $orange;
    background: rgba($orange, 0.1);
    box-shadow: 0 0 20px rgba($orange, 0.15);
  }

  .type-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }

  .type-name {
    font-size: 16px;
    font-weight: 600;
    color: $white;
    margin-bottom: 4px;
  }

  .type-label-en {
    font-size: 12px;
    color: $gray;
  }

  .check-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    color: $orange;
    font-size: 20px;
  }
}

.type-description-panel {
  :deep(.el-alert) {
    background: $bg-dark;
    border: 1px solid #444;
    color: $white;
    border-radius: 8px;
  }
  :deep(.el-alert__title) {
    color: lighten($orange, 15%);
    font-size: 14px;
  }
  :deep(.el-alert__icon) {
    color: $orange;
  }
}

// ---- Step 2: Cycle Selection ----
.cycle-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;

  .cycle-item {
    background: $bg-dark;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 12px 16px;
    transition: all 0.2s;

    &:hover {
      border-color: $orange;
    }

    .cycle-radio {
      width: 100%;
      display: flex;
      align-items: center;
    }

    .cycle-info {
      display: flex;
      flex-direction: column;
      margin-left: 8px;

      .cycle-name {
        color: $white;
        font-weight: 500;
        font-size: 14px;
      }

      .cycle-params {
        color: $gray;
        font-size: 12px;
        margin-top: 2px;
      }
    }
  }
}

// ---- Step 3: Checklist ----
.checklist-progress {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;

  :deep(.el-progress) {
    flex: 1;
  }

  .progress-text {
    color: $gray;
    font-size: 13px;
    white-space: nowrap;
  }
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .checklist-item {
    background: $bg-dark;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 10px 16px;
    transition: all 0.2s;

    &.completed {
      border-color: #2a6b2a;
      background: rgba(#2a6b2a, 0.08);
    }

    .check-box {
      width: 100%;
      display: flex;
      align-items: center;

      :deep(.el-checkbox__label) {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
      }
    }

    .item-label {
      color: $white;
      font-size: 14px;
      flex: 1;
    }
  }
}

// ---- Step 4: Real-time ----
.status-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    background: $bg-dark;
    border: 1px solid #333;
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 13px;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: $gray;
    }

    &.good .status-dot {
      background: #4CAF50;
      box-shadow: 0 0 6px #4CAF50;
    }

    &.idle .status-dot {
      background: $gray;
    }

    .status-label {
      color: $gray;
    }

    .status-value {
      color: $white;
      font-weight: 500;
    }
  }
}

.realtime-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  .realtime-card {
    background: $bg-dark;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    transition: border-color 0.2s;

    &:hover {
      border-color: $orange;
    }

    .rt-label {
      display: block;
      font-size: 12px;
      color: $gray;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .rt-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: $white;
      font-variant-numeric: tabular-nums;
    }

    .rt-unit {
      display: block;
      font-size: 11px;
      color: $gray;
      margin-top: 2px;
    }
  }
}

.test-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;

  .recording-tag {
    .blink {
      animation: blink 1s infinite;
    }
  }
}

// ---- Step 5: Results ----
.results-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.result-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  .card-title {
    color: $orange;
    font-weight: 600;
    font-size: 15px;
  }

  .result-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    border-bottom: 1px solid #333;

    &:last-child {
      border-bottom: none;
    }

    &.total-row {
      color: $gray;
      font-size: 13px;
    }

    .pass-val {
      color: $white;
      font-weight: 500;
    }
  }

  .verdict {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;

    .verdict-pass {
      color: #4CAF50;
    }
    .verdict-fail {
      color: #f44336;
    }

    .verdict-text {
      font-size: 20px;
      font-weight: 700;
    }
  }

  .limit-info {
    font-size: 12px;
    color: $gray;
    line-height: 1.8;
    text-align: center;
  }
}

.chart-section {
  h3 {
    color: $white;
    font-size: 15px;
    margin: 0 0 16px;
    font-weight: 600;
  }
}

.bar-chart {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 20px;

  .bar-group {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    &:last-child { margin-bottom: 0; }

    .bar-label {
      width: 50px;
      color: $white;
      font-weight: 600;
      font-size: 14px;
    }

    .bar-track {
      flex: 1;
      height: 28px;
      background: #333;
      border-radius: 4px;
      position: relative;
      overflow: hidden;

      .bar-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;

        &.measured {
          background: $orange;
          z-index: 2;
          opacity: 0.9;
        }

        &.limit {
          background: #555;
          z-index: 1;
          border: 1px dashed #777;
        }
      }
    }

    .bar-values {
      width: 80px;
      text-align: right;
      font-size: 12px;

      .measured-val {
        color: $orange;
        display: block;
      }
      .limit-val {
        color: $gray;
        display: block;
      }
    }
  }
}

// ---- Step 6: Report ----
.report-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      color: $orange;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .section-title {
    color: $white;
    font-size: 15px;
    margin: 0 0 12px;
    font-weight: 600;
  }

  .checklist-tag {
    margin: 0 6px 6px 0;
  }

  :deep(.el-descriptions__title) {
    color: $orange;
  }
  :deep(.el-descriptions__label) {
    background: #222;
    color: $gray;
    border-color: #333;
  }
  :deep(.el-descriptions__content) {
    background: $bg-dark;
    color: $white;
    border-color: #333;
  }
  :deep(.el-table) {
    --el-table-bg-color: $bg-dark;
    --el-table-tr-bg-color: $bg-dark;
    --el-table-header-bg-color: #222;
    --el-table-row-hover-bg-color: #333;
    color: $white;
    border: 1px solid #333;
  }
  :deep(.el-table th.el-table__cell) {
    color: $orange;
    border-color: #333;
  }
  :deep(.el-table td.el-table__cell) {
    border-color: #333;
  }
  :deep(.el-divider) {
    border-color: #333;
  }
}

.report-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

// ---- Footer Navigation ----
.wizard-footer {
  max-width: 800px;
  margin: 32px auto 0;
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #333;
}

// ---- Element Plus overrides ----
:deep(.el-radio) {
  color: $white;
}
:deep(.el-radio.is-checked) {
  color: $orange;
}
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: $orange;
  border-color: $orange;
}
:deep(.el-radio__inner) {
  background: transparent;
  border-color: #555;
}
:deep(.el-checkbox) {
  color: $white;
}
:deep(.el-checkbox.is-checked) {
  color: #4CAF50;
}
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #4CAF50;
  border-color: #4CAF50;
}
:deep(.el-checkbox__inner) {
  background: transparent;
  border-color: #555;
}
:deep(.el-tag--success) {
  --el-tag-bg-color: rgba(#4CAF50, 0.15);
  --el-tag-border-color: #4CAF50;
  --el-tag-text-color: #4CAF50;
}
:deep(.el-tag--warning) {
  --el-tag-bg-color: rgba($orange, 0.15);
  --el-tag-border-color: $orange;
  --el-tag-text-color: $orange;
}
:deep(.el-tag--danger) {
  --el-tag-bg-color: rgba(#f44336, 0.15);
  --el-tag-border-color: #f44336;
  --el-tag-text-color: #f44336;
}
:deep(.el-button--primary) {
  --el-button-bg-color: $orange;
  --el-button-border-color: $orange;
  --el-button-hover-bg-color: lighten($orange, 10%);
  --el-button-hover-border-color: lighten($orange, 10%);
  --el-button-active-bg-color: darken($orange, 10%);
  --el-button-active-border-color: darken($orange, 10%);
  --el-button-text-color: #fff;
}
:deep(.el-button--danger) {
  --el-button-bg-color: #d32f2f;
  --el-button-border-color: #d32f2f;
  --el-button-text-color: #fff;
}
:deep(.el-progress__text) {
  color: $white;
}
:deep(.el-progress-bar__outer) {
  background: #333;
}
:deep(.el-progress-bar__inner) {
  background: $orange;
}
:deep(.el-input__wrapper) {
  background: $bg-dark;
  border-color: #444;
  box-shadow: none;
}
:deep(.el-input__inner) {
  color: $white;
}

// ---- Animations ----
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.ml-2 {
  margin-left: 8px;
  cursor: pointer;
}
</style>
