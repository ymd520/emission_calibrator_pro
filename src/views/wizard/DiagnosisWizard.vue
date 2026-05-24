<template>
  <div class="diagnosis-wizard">
    <!-- Header -->
    <div class="wizard-header">
      <h1 class="wizard-title">排放超标诊断向导</h1>
      <p class="wizard-subtitle">Emission Exceedance Diagnosis Wizard</p>
    </div>

    <!-- Steps -->
    <el-steps
      :active="activeStep - 1"
      align-center
      finish-status="success"
      class="wizard-steps"
    >
      <el-step title="选择污染物" />
      <el-step title="输入数值" />
      <el-step title="工况信息" />
      <el-step title="诊断问答" />
      <el-step title="诊断结果" />
    </el-steps>

    <!-- Body -->
    <div class="wizard-body">
      <!-- STEP 1: Pollutant Selection -->
      <div v-if="activeStep === 1" class="step-content">
        <h2 class="step-title">选择污染物</h2>
        <p class="step-desc">请选择超标或需要诊断的污染物类型</p>

        <div class="pollutant-grid">
          <div
            v-for="p in pollutants"
            :key="p.id"
            class="pollutant-card"
            :class="{ selected: diagData.pollutant === p.id }"
            @click="diagData.pollutant = p.id"
          >
            <div class="pollutant-icon">{{ p.icon }}</div>
            <div class="pollutant-name">{{ p.label }}</div>
            <div class="pollutant-en">{{ p.labelEn }}</div>
            <el-icon v-if="diagData.pollutant === p.id" class="check-badge">
              <CircleCheck />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- STEP 2: Input Values -->
      <div v-if="activeStep === 2" class="step-content">
        <h2 class="step-title">输入数值</h2>
        <p class="step-desc">请输入实测值和限值以计算超标程度</p>

        <el-card shadow="never" class="input-card">
          <el-form label-position="top" class="diag-form">
            <el-form-item label="污染物">
              <el-input :model-value="selectedPollutantLabel" disabled />
            </el-form-item>
            <el-form-item label="实测值 (Measured Value)">
              <el-input-number
                v-model="diagData.measuredValue"
                :min="0"
                :max="99999"
                :precision="2"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="单位 (Unit)">
              <el-select v-model="diagData.unit" class="full-width">
                <el-option label="g/km" value="g/km" />
                <el-option label="g/kWh" value="g/kWh" />
                <el-option label="ppm" value="ppm" />
                <el-option label="mg/m³" value="mg/m³" />
                <el-option label="FSN" value="FSN" />
                <el-option label="m⁻¹" value="m⁻¹" />
              </el-select>
            </el-form-item>
            <el-form-item label="限值 (Limit Value)">
              <el-input-number
                v-model="diagData.limitValue"
                :min="0"
                :max="99999"
                :precision="2"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
          </el-form>

          <transition name="fade">
            <div v-if="diagData.measuredValue > 0 && diagData.limitValue > 0" class="exceedance-panel">
              <el-divider />
              <div class="exceedance-result">
                <span class="exceed-label">超标率 / Exceedance:</span>
                <span
                  class="exceed-value"
                  :class="{ critical: exceedancePct >= 100, warning: exceedancePct >= 30 && exceedancePct < 100 }"
                >
                  {{ exceedancePct >= 9999 ? '>9999' : exceedancePct }}%
                </span>
              </div>
              <el-progress
                :percentage="Math.min(Math.abs(exceedancePct), 200)"
                :format="() => exceedancePct + '%'"
                :status="exceedancePct >= 100 ? 'exception' : exceedancePct >= 30 ? 'warning' : 'success'"
              />
            </div>
          </transition>
        </el-card>
      </div>

      <!-- STEP 3: Operating Condition Info -->
      <div v-if="activeStep === 3" class="step-content">
        <h2 class="step-title">工况信息</h2>
        <p class="step-desc">请输入发动机和运行工况信息</p>

        <div class="condition-grid">
          <el-card shadow="never" class="condition-card">
            <template #header>
              <span class="card-title">发动机参数 / Engine Specs</span>
            </template>
            <el-form label-position="top" class="diag-form">
              <el-form-item label="发动机类型">
                <el-select v-model="diagData.engineType" class="full-width">
                  <el-option label="柴油机 (CI)" value="ci" />
                  <el-option label="汽油机 (SI)" value="si" />
                  <el-option label="天然气 (NG)" value="ng" />
                </el-select>
              </el-form-item>
              <el-form-item label="排量 (L)">
                <el-input-number v-model="diagData.displacement" :min="0.1" :max="100" :step="0.1" :precision="1" controls-position="right" class="full-width" />
              </el-form-item>
              <el-form-item label="额定功率 (kW)">
                <el-input-number v-model="diagData.powerRating" :min="0" :max="9999" :step="10" controls-position="right" class="full-width" />
              </el-form-item>
            </el-form>
          </el-card>

          <el-card shadow="never" class="condition-card">
            <template #header>
              <span class="card-title">运行信息 / Operating Info</span>
            </template>
            <el-form label-position="top" class="diag-form">
              <el-form-item label="燃料类型">
                <el-select v-model="diagData.fuelType" class="full-width">
                  <el-option label="柴油 (Diesel)" value="diesel" />
                  <el-option label="汽油 (Gasoline)" value="gasoline" />
                  <el-option label="天然气 (CNG)" value="cng" />
                  <el-option label="甲醇 (Methanol)" value="methanol" />
                  <el-option label="乙醇 (Ethanol)" value="ethanol" />
                </el-select>
              </el-form-item>
              <el-form-item label="行驶里程 / 运行小时数">
                <el-input-number v-model="diagData.mileage" :min="0" :max="999999" :step="1000" controls-position="right" class="full-width" />
              </el-form-item>
            </el-form>

            <el-divider content-position="left">后处理系统配置</el-divider>
            <div class="aftertreatment-grid">
              <el-checkbox v-for="at in aftertreatmentOptions" :key="at.id" v-model="at.checked" :label="at.label" border class="at-checkbox" />
            </div>
          </el-card>
        </div>
      </div>

      <!-- STEP 4: Diagnosis Q&A -->
      <div v-if="activeStep === 4" class="step-content">
        <h2 class="step-title">诊断问答</h2>
        <p class="step-desc">请回答以下问题以辅助诊断</p>

        <div class="qa-progress">
          <span class="qa-step-label">问题 {{ currentQaIndex + 1 }} / {{ qaQuestions.length }}</span>
          <el-progress
            :percentage="qaQuestions.length > 0 ? ((currentQaIndex) / qaQuestions.length) * 100 : 0"
            :format="() => ''"
          />
        </div>

        <transition name="slide" mode="out-in">
          <div v-if="currentQaIndex < qaQuestions.length" :key="currentQaIndex" class="qa-card">
            <div class="qa-number">Q{{ currentQaIndex + 1 }}</div>
            <h3 class="qa-question">{{ qaQuestions[currentQaIndex].question }}</h3>
            <div class="qa-hint" v-if="qaQuestions[currentQaIndex].hint">{{ qaQuestions[currentQaIndex].hint }}</div>
            <div class="qa-actions">
              <el-button
                type="primary"
                :icon="CircleCheck"
                @click="answerQuestion(true)"
                class="qa-btn-yes"
              >
                是 (Yes)
              </el-button>
              <el-button
                type="danger"
                :icon="CircleClose"
                @click="answerQuestion(false)"
                class="qa-btn-no"
              >
                否 (No)
              </el-button>
            </div>
          </div>
        </transition>

        <!-- Path Display -->
        <div class="qa-path" v-if="qaHistory.length > 0">
          <el-divider content-position="left">诊断路径</el-divider>
          <div class="path-items">
            <div v-for="(h, idx) in qaHistory" :key="idx" class="path-item">
              <span class="path-q">Q{{ idx + 1 }}: {{ h.question }}</span>
              <el-tag :type="h.answer ? 'success' : 'danger'" size="small">
                {{ h.answer ? '是' : '否' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 5: Diagnosis Result -->
      <div v-if="activeStep === 5" class="step-content">
        <h2 class="step-title">诊断结果</h2>
        <p class="step-desc">基于您的输入，以下是诊断结论</p>

        <div class="result-grid">
          <el-card shadow="never" class="result-card main-result">
            <template #header>
              <span class="card-title">诊断结论 / Diagnosis Conclusion</span>
            </template>
            <div class="conclusion-icon">
              <el-icon :size="56" :color="diagnosisResult.color">
                <WarningFilled />
              </el-icon>
            </div>
            <h3 class="root-cause">{{ diagnosisResult.primaryCause }}</h3>
            <p class="secondary-cause" v-if="diagnosisResult.secondaryCause">
              次要原因: {{ diagnosisResult.secondaryCause }}
            </p>
            <div class="confidence-bar">
              <span class="conf-label">置信度:</span>
              <el-progress
                :percentage="diagnosisResult.confidence"
                :color="diagnosisResult.confidence > 70 ? '#4CAF50' : diagnosisResult.confidence > 40 ? $orange : '#f44336'"
              />
              <span class="conf-value">{{ diagnosisResult.confidence }}%</span>
            </div>
          </el-card>

          <el-card shadow="never" class="result-card">
            <template #header>
              <span class="card-title">推荐措施 / Recommended Actions</span>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(action, idx) in diagnosisResult.actions"
                :key="idx"
                :timestamp="'优先级 ' + (idx + 1)"
                placement="top"
                :color="idx === 0 ? '#f44336' : idx === 1 ? $orange : '#4CAF50'"
              >
                {{ action }}
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <el-card shadow="never" class="result-card">
            <template #header>
              <span class="card-title">参考值 / Reference Values</span>
            </template>
            <div class="ref-table">
              <div v-for="ref in diagnosisResult.references" :key="ref.label" class="ref-row">
                <span class="ref-label">{{ ref.label }}</span>
                <span class="ref-value">{{ ref.value }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="result-card">
            <template #header>
              <span class="card-title">相关知识库文章 / Related Articles</span>
            </template>
            <div class="article-list">
              <a
                v-for="art in diagnosisResult.articles"
                :key="art.title"
                class="article-link"
                href="#"
                @click.prevent="mockAction('打开文章: ' + art.title)"
              >
                <el-icon><Link /></el-icon>
                {{ art.title }}
              </a>
            </div>
          </el-card>
        </div>

        <div class="result-footer">
          <el-button type="primary" :icon="Refresh" @click="restartDiagnosis">新诊断 / New Diagnosis</el-button>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="wizard-footer">
      <el-button
        v-if="activeStep > 1 && activeStep < 5"
        @click="prevStep"
        :icon="ArrowLeft"
      >
        上一步
      </el-button>
      <el-button
        v-if="activeStep < 5"
        type="primary"
        @click="nextStep"
        :disabled="!canProceed"
        :icon="ArrowRight"
      >
        {{ activeStep === 4 ? '查看诊断结果' : '下一步' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  CircleCheck, CircleClose, ArrowLeft, ArrowRight,
  WarningFilled, Refresh, Link
} from '@element-plus/icons-vue'

const $orange = '#FF8800'
const activeStep = ref(1)

const diagData = reactive({
  pollutant: '',
  measuredValue: 0,
  unit: 'g/km',
  limitValue: 0,
  engineType: '',
  displacement: 0,
  powerRating: 0,
  fuelType: '',
  mileage: 0
})

const aftertreatmentOptions = reactive([
  { id: 'dpf', label: 'DPF (颗粒捕集器)', checked: false },
  { id: 'scr', label: 'SCR (选择性催化还原)', checked: false },
  { id: 'egr', label: 'EGR (废气再循环)', checked: false },
  { id: 'twc', label: 'TWC (三元催化器)', checked: false },
  { id: 'doc', label: 'DOC (氧化催化器)', checked: false }
])

// ---- Pollutant Data ----
const pollutants = [
  { id: 'nox', label: 'NOx', labelEn: '氮氧化物', icon: '🧪' },
  { id: 'pm', label: 'PM', labelEn: '颗粒物', icon: '🌫️' },
  { id: 'hc', label: 'HC', labelEn: '碳氢化合物', icon: '⛽' },
  { id: 'co', label: 'CO', labelEn: '一氧化碳', icon: '💨' },
  { id: 'smoke', label: '烟度', labelEn: 'Smoke', icon: '⚫' },
  { id: 'multiple', label: '多污染物', labelEn: 'Multiple', icon: '🔬' }
]

const selectedPollutantLabel = computed(() => {
  const p = pollutants.find(p => p.id === diagData.pollutant)
  return p ? `${p.label} (${p.labelEn})` : ''
})

const exceedancePct = computed(() => {
  if (!diagData.measuredValue || !diagData.limitValue) return 0
  return +(((diagData.measuredValue - diagData.limitValue) / diagData.limitValue) * 100).toFixed(1)
})

// ---- Q&A System ----
const qaQuestions = computed(() => {
  const p = diagData.pollutant
  const isDiesel = diagData.engineType === 'ci'
  const hasDPF = aftertreatmentOptions.find(a => a.id === 'dpf')?.checked
  const hasSCR = aftertreatmentOptions.find(a => a.id === 'scr')?.checked
  const hasEGR = aftertreatmentOptions.find(a => a.id === 'egr')?.checked
  const hasTWC = aftertreatmentOptions.find(a => a.id === 'twc')?.checked
  const hasDOC = aftertreatmentOptions.find(a => a.id === 'doc')?.checked

  const questions = []

  if (p === 'nox' || p === 'multiple') {
    if (hasEGR) {
      questions.push({
        id: 'nox-egr',
        question: 'EGR 系统是否正常工作?',
        hint: '检查 EGR 阀开度、EGR 冷却器是否堵塞、EGR 管路是否泄漏。'
      })
    }
    if (hasSCR) {
      questions.push({
        id: 'nox-scr-injection',
        question: 'SCR 系统尿素喷射是否正常?',
        hint: '检查尿素喷嘴是否堵塞、尿素泵压力是否正常、尿素液位和品质。'
      })
      questions.push({
        id: 'nox-scr-temp',
        question: '排温是否在 SCR 工作窗口内 (200-550°C)?',
        hint: 'SCR 催化剂需要在适宜温度范围内才能有效还原 NOx。'
      })
    }
    if (isDiesel) {
      questions.push({
        id: 'nox-timing',
        question: '喷油正时是否过前?',
        hint: '喷油过早会导致燃烧温度升高，促进 NOx 生成。'
      })
      questions.push({
        id: 'nox-boost',
        question: '增压压力是否正常?',
        hint: '增压不足会导致空燃比偏低，影响燃烧和排放。'
      })
    }
    if (hasEGR) {
      questions.push({
        id: 'nox-egr-cooler',
        question: 'EGR 冷却器效率是否下降?',
        hint: '冷却效率下降会导致 EGR 气体温度升高，降低 NOx 减排效果。'
      })
    }
  }

  if (p === 'pm' || p === 'multiple' || p === 'smoke') {
    if (hasDPF) {
      questions.push({
        id: 'pm-dpf-diff',
        question: 'DPF 压差是否正常?',
        hint: '正常压差范围通常为 5-30 kPa (取决于工况)。过高可能表示堵塞。'
      })
      questions.push({
        id: 'pm-dpf-regen',
        question: '再生是否正常完成?',
        hint: '检查主动再生频率和被动再生效率。'
      })
    }
    if (isDiesel) {
      questions.push({
        id: 'pm-injector',
        question: '喷油嘴是否雾化不良?',
        hint: '喷油嘴磨损或积碳会导致雾化恶化，增加颗粒物排放。'
      })
      questions.push({
        id: 'pm-fuel-quality',
        question: '燃油品质是否合格 (十六烷值/硫含量)?',
        hint: '劣质燃油会显著增加颗粒物排放。'
      })
    }
    if (hasDOC) {
      questions.push({
        id: 'pm-doc',
        question: 'DOC 是否正常工作?',
        hint: 'DOC 故障会影响 DPF 被动再生和整体排放控制。'
      })
    }
  }

  if (p === 'hc') {
    if (hasTWC) {
      questions.push({
        id: 'hc-twc',
        question: '三元催化器(TWC)是否工作正常?',
        hint: 'TWC 失效或中毒会导致 HC 排放升高。'
      })
      questions.push({
        id: 'hc-lambda',
        question: '空燃比是否在化学计量比附近 (Lambda ≈ 1)?',
        hint: 'TWC 需要在 Lambda=1 附近才能高效转化 HC。'
      })
    }
    if (!isDiesel) {
      questions.push({
        id: 'hc-misfire',
        question: '是否存在失火 (Misfire) 现象?',
        hint: '失火会导致未燃烧 HC 直接排入排气管。'
      })
    }
    questions.push({
      id: 'hc-leak',
      question: '排气系统是否存在泄漏?',
      hint: '排气管路泄漏会导致氧传感器读数异常，影响空燃比控制。'
    })
  }

  if (p === 'co' || p === 'multiple') {
    if (hasTWC || hasDOC) {
      questions.push({
        id: 'co-converter',
        question: '催化转化器是否正常工作?',
        hint: '催化转化器效率下降会导致 CO 转化率降低。'
      })
    }
    questions.push({
      id: 'co-lambda',
      question: '混合气是否偏浓 (Lambda < 1)?',
      hint: '浓混合气会导致不完全燃烧，增加 CO 排放。'
    })
    if (isDiesel) {
      questions.push({
        id: 'co-boost',
        question: '增压系统是否正常工作?',
        hint: '增压不足会导致缸内氧气不足，增加 CO 生成。'
      })
    }
  }

  // Fallback questions if none generated
  if (questions.length === 0) {
    questions.push({
      id: 'general-1',
      question: '最近是否进行过维修或改装?',
      hint: '维修或改装可能影响排放控制系统。'
    })
    questions.push({
      id: 'general-2',
      question: '故障指示灯 (MIL) 是否点亮?',
      hint: 'MIL 点亮表示存在与排放相关的故障码。'
    })
    questions.push({
      id: 'general-3',
      question: '是否使用了合规的燃油和润滑油?',
      hint: '不合规的燃油/机油会严重影响排放和后处理系统寿命。'
    })
  }

  return questions
})

const currentQaIndex = ref(0)
const qaHistory = reactive([])

watch(() => activeStep.value, (newVal) => {
  if (newVal === 4) {
    currentQaIndex.value = 0
    qaHistory.length = 0
  }
})

function answerQuestion(answer) {
  const q = qaQuestions.value[currentQaIndex.value]
  qaHistory.push({ question: q.question, answer })

  if (currentQaIndex.value < qaQuestions.value.length - 1) {
    currentQaIndex.value++
  } else {
    activeStep.value = 5
  }
}

// ---- Diagnosis Result ----
const diagnosisResult = computed(() => {
  const p = diagData.pollutant
  const isDiesel = diagData.engineType === 'ci'
  const hasDPF = aftertreatmentOptions.find(a => a.id === 'dpf')?.checked
  const hasSCR = aftertreatmentOptions.find(a => a.id === 'scr')?.checked
  const hasEGR = aftertreatmentOptions.find(a => a.id === 'egr')?.checked
  const noAnswers = qaHistory.length === 0
  const negativeCount = qaHistory.filter(h => !h.answer).length

  let primaryCause = ''
  let secondaryCause = ''
  let confidence = 65
  let color = '#FF8800'
  const actions = []
  const references = []
  const articles = []

  if (noAnswers) {
    primaryCause = '缺少诊断信息，建议完成诊断问答'
    secondaryCause = 'Lack of diagnostic information'
    confidence = 10
    color = '#888'
    actions.push('请返回诊断问答页面并回答问题')
    actions.push('或联系技术支持获取人工诊断')
    references.push({ label: '建议', value: '完成诊断问答流程' })
    articles.push({ title: '诊断向导使用说明' })
  } else if (p === 'nox' || p === 'multiple') {
    if (negativeCount >= 3) {
      primaryCause = 'NOx 控制系统存在多处故障，建议全面检查'
      secondaryCause = isDiesel ? '喷油正时过前 + 后处理系统效率下降' : '燃烧控制异常'
      confidence = 85
      color = '#f44336'
    } else if (qaHistory.some(h => h.question.includes('尿素') && !h.answer)) {
      primaryCause = 'SCR 尿素喷射系统故障'
      secondaryCause = '尿素喷嘴堵塞或尿素泵故障'
      confidence = 92
      color = '#f44336'
    } else if (qaHistory.some(h => h.question.includes('EGR') && !h.answer)) {
      primaryCause = 'EGR 系统故障'
      secondaryCause = 'EGR 阀卡滞或 EGR 冷却器效率下降'
      confidence = 88
      color = '#FF8800'
    } else if (qaHistory.some(h => h.question.includes('正时') && !h.answer)) {
      primaryCause = '喷油正时过于提前'
      secondaryCause = 'ECU 标定参数偏移或正时传感器故障'
      confidence = 75
      color = '#FF8800'
    } else {
      primaryCause = '轻微 NOx 排放偏高，建议检查后处理系统维护状态'
      secondaryCause = '可能为多种因素叠加影响'
      confidence = 60
      color = '#FF8800'
    }
    actions.push('检查并清洗 SCR 尿素喷嘴')
    actions.push('检查 EGR 阀开度和 EGR 冷却器效率')
    actions.push('检查喷油正时标定参数')
    actions.push('检查增压压力和进气温度')
    actions.push('执行再生程序或更换 DPF')
    references.push({ label: 'NOx 正常范围 (柴油)', value: '< 0.4 g/kWh' })
    references.push({ label: 'SCR 工作温度', value: '200-550 °C' })
    references.push({ label: 'EGR 开度参考', value: '10-40% (中低负荷)' })
    articles.push({ title: 'NOx 排放超标诊断指南' })
    articles.push({ title: 'SCR 系统常见故障与维修' })
    articles.push({ title: 'EGR 系统维护周期' })
  } else if (p === 'pm' || p === 'smoke') {
    if (qaHistory.some(h => h.question.includes('压差') && !h.answer)) {
      primaryCause = 'DPF 堵塞严重'
      secondaryCause = 'DPF 灰分堆积或再生不充分'
      confidence = 95
      color = '#f44336'
    } else if (qaHistory.some(h => h.question.includes('再生') && !h.answer)) {
      primaryCause = 'DPF 再生系统故障'
      secondaryCause = '再生温度不足或再生频率过低'
      confidence = 85
      color = '#FF8800'
    } else if (qaHistory.some(h => h.question.includes('喷油嘴') && h.question.includes('雾化') && !h.answer)) {
      primaryCause = '喷油嘴雾化不良'
      secondaryCause = '喷油嘴磨损或积碳'
      confidence = 80
      color = '#FF8800'
    } else {
      primaryCause = '颗粒物排放轻微偏高，建议检查维护'
      secondaryCause = '可能与燃油品质或运行工况有关'
      confidence = 55
      color = '#FF8800'
    }
    actions.push('执行 DPF 强制再生')
    actions.push('测量 DPF 压差，评估灰分堆积程度')
    actions.push('检查喷油嘴喷雾质量')
    actions.push('更换燃油滤清器并检查燃油品质')
    actions.push('如必要，进行 DPF 清洗或更换')
    references.push({ label: 'DPF 压差 (怠速)', value: '< 10 kPa' })
    references.push({ label: 'DPF 压差 (满载)', value: '< 30 kPa' })
    references.push({ label: '烟度限值 (GB 3847)', value: '< 0.5 m⁻¹' })
    articles.push({ title: 'DPF 维护与再生指南' })
    articles.push({ title: '喷油嘴检测与维修' })
  } else if (p === 'hc') {
    if (qaHistory.some(h => h.question.includes('三元催化器') && !h.answer)) {
      primaryCause = '三元催化器 (TWC) 失效'
      secondaryCause = '催化剂中毒、热老化或机械损坏'
      confidence = 90
      color = '#f44336'
    } else if (qaHistory.some(h => h.question.includes('失火') && !h.answer)) {
      primaryCause = '发动机失火 (Misfire)'
      secondaryCause = '点火系统故障或混合气异常'
      confidence = 88
      color = '#f44336'
    } else {
      primaryCause = 'HC 排放偏高，可能与混合气过浓或后处理效率有关'
      secondaryCause = '建议检查氧传感器和燃油系统'
      confidence = 65
      color = '#FF8800'
    }
    actions.push('检查氧传感器信号是否正常')
    actions.push('检查点火系统 (火花塞/点火线圈)')
    actions.push('检查燃油压力调节器')
    actions.push('检查 TWC 转换效率')
    references.push({ label: 'HC 正常范围', value: '< 0.1 g/km' })
    references.push({ label: 'TWC 转换效率', value: '> 90%' })
    articles.push({ title: 'HC 排放超标原因分析' })
    articles.push({ title: 'TWC 故障诊断流程' })
  } else if (p === 'co') {
    if (qaHistory.some(h => h.question.includes('混合气') && h.question.includes('偏浓') && !h.answer)) {
      primaryCause = '混合气过浓 (Rich Mixture)'
      secondaryCause = '氧传感器故障、燃油压力过高或喷油嘴泄漏'
      confidence = 90
      color = '#f44336'
    } else {
      primaryCause = 'CO 排放偏高，主要与燃烧不完全有关'
      secondaryCause = '空燃比控制偏差或进气系统故障'
      confidence = 70
      color = '#FF8800'
    }
    actions.push('检查氧传感器 (前/后)')
    actions.push('检查进气系统是否有泄漏')
    actions.push('检查燃油系统压力')
    actions.push('检查催化转化器效率')
    references.push({ label: 'CO 正常范围', value: '< 1.0 g/km' })
    references.push({ label: 'Lambda 参考', value: '0.98-1.02 (SI)' })
    articles.push({ title: 'CO 排放超标诊断' })
  } else {
    primaryCause = '多污染物排放超标，建议进行全面检查'
    secondaryCause = '可能存在多个系统同时故障'
    confidence = 70
    color = '#f44336'
    actions.push('执行全面排放检测 (整车或台架)')
    actions.push('检查所有后处理系统工作状态')
    actions.push('检查 ECU 标定参数')
    actions.push('检查传感器 (氧传感器/NOx传感器/排温传感器)')
    references.push({ label: '建议', value: '进行完整的系统诊断' })
    articles.push({ title: '综合排放故障诊断' })
  }

  return { primaryCause, secondaryCause, confidence, color, actions, references, articles }
})

// ---- Navigation ----
const canProceed = computed(() => {
  switch (activeStep.value) {
    case 1: return !!diagData.pollutant
    case 2: return diagData.measuredValue > 0 && diagData.limitValue > 0
    case 3: return !!diagData.engineType && !!diagData.fuelType
    case 4: return false
    default: return true
  }
})

function nextStep() {
  if (activeStep.value < 5) activeStep.value++
}

function prevStep() {
  if (activeStep.value > 1) activeStep.value--
}

function restartDiagnosis() {
  activeStep.value = 1
  diagData.pollutant = ''
  diagData.measuredValue = 0
  diagData.unit = 'g/km'
  diagData.limitValue = 0
  diagData.engineType = ''
  diagData.displacement = 0
  diagData.powerRating = 0
  diagData.fuelType = ''
  diagData.mileage = 0
  aftertreatmentOptions.forEach(a => { a.checked = false })
  currentQaIndex.value = 0
  qaHistory.length = 0
}

function mockAction(msg) {
  ElMessage.success(`${msg} (模拟模式)`)
}
</script>

<style scoped lang="scss">
$white: #F5F5F0;
$orange: #FF8800;
$black: #1A1A1A;
$gray: #888;
$bg-dark: #2A2A2A;

.diagnosis-wizard {
  min-height: 100vh;
  background: $black;
  color: $white;
  padding: 24px 32px 80px;
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
  max-width: 750px;
  margin: 0 auto 36px;
  :deep(.el-step__title) { font-size: 13px; color: $gray; }
  :deep(.el-step.is-finish .el-step__title) { color: $orange; }
  :deep(.el-step.is-process .el-step__title) { color: $white; font-weight: 600; }
  :deep(.el-step__head.is-finish) { color: $orange; border-color: $orange; }
  :deep(.el-step__head.is-process) { color: $orange; border-color: $orange; }
  :deep(.el-step__line) { background: #333; }
  :deep(.el-step.is-finish .el-step__line) { background: $orange; }
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

// ---- Step 1: Pollutant Grid ----
.pollutant-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.pollutant-card {
  position: relative;
  background: $bg-dark;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 20px 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;

  &:hover { border-color: $orange; background: rgba($orange, 0.05); }
  &.selected {
    border-color: $orange;
    background: rgba($orange, 0.1);
    box-shadow: 0 0 20px rgba($orange, 0.15);
  }

  .pollutant-icon { font-size: 32px; margin-bottom: 6px; }
  .pollutant-name { font-size: 16px; font-weight: 600; color: $white; }
  .pollutant-en { font-size: 12px; color: $gray; }
  .check-badge { position: absolute; top: 8px; right: 8px; color: $orange; font-size: 20px; }
}

// ---- Step 2: Input Values ----
.input-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;
}

.exceedance-panel {
  animation: fadeIn 0.3s ease;

  .exceedance-result {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .exceed-label { color: $gray; font-size: 14px; }
    .exceed-value {
      font-size: 28px;
      font-weight: 700;
      color: #4CAF50;

      &.warning { color: $orange; }
      &.critical { color: #f44336; }
    }
  }
}

// ---- Step 3: Condition Info ----
.condition-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.condition-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  .card-title { color: $orange; font-weight: 600; font-size: 14px; }
}

.aftertreatment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  .at-checkbox {
    width: 100%;
    margin-right: 0;
    background: #222;
    border-color: #444;
    color: $white;
    &.is-checked {
      background: rgba($orange, 0.1);
      border-color: $orange;
      color: $orange;
    }
  }
}

// ---- Step 4: Q&A ----
.qa-progress {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  .qa-step-label { color: $gray; font-size: 13px; white-space: nowrap; }
}

.qa-card {
  background: $bg-dark;
  border: 1px solid #444;
  border-radius: 12px;
  padding: 32px;
  text-align: center;

  .qa-number {
    display: inline-block;
    background: rgba($orange, 0.15);
    color: $orange;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    line-height: 40px;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .qa-question {
    font-size: 20px;
    font-weight: 600;
    color: $white;
    margin: 0 0 8px;
  }

  .qa-hint {
    font-size: 13px;
    color: $gray;
    margin-bottom: 24px;
    padding: 8px 16px;
    background: #222;
    border-radius: 8px;
    display: inline-block;
  }

  .qa-actions {
    display: flex;
    gap: 16px;
    justify-content: center;

    .qa-btn-yes, .qa-btn-no {
      min-width: 140px;
      font-size: 16px;
    }
  }
}

.qa-path {
  margin-top: 24px;

  .path-items {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .path-item {
      background: $bg-dark;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .path-q { color: $white; font-size: 13px; }
    }
  }
}

// ---- Step 5: Results ----
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.result-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  &:first-child { grid-column: 1 / -1; }

  .card-title { color: $orange; font-weight: 600; font-size: 14px; }

  .conclusion-icon { text-align: center; margin-bottom: 12px; }

  .root-cause {
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: $white;
    margin: 0 0 4px;
  }

  .secondary-cause {
    text-align: center;
    font-size: 13px;
    color: $gray;
    margin: 0 0 16px;
  }

  .confidence-bar {
    display: flex;
    align-items: center;
    gap: 12px;

    .conf-label { color: $gray; font-size: 13px; white-space: nowrap; }
    .conf-value { color: $white; font-weight: 600; font-size: 18px; white-space: nowrap; }
    :deep(.el-progress) { flex: 1; }
  }

  .ref-table {
    .ref-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #333;
      font-size: 14px;

      &:last-child { border-bottom: none; }
      .ref-label { color: $gray; }
      .ref-value { color: $white; font-weight: 500; }
    }
  }

  .article-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .article-link {
      display: flex;
      align-items: center;
      gap: 8px;
      color: lighten($orange, 15%);
      text-decoration: none;
      font-size: 14px;
      padding: 6px 0;
      transition: color 0.2s;

      &:hover { color: $orange; text-decoration: underline; }
    }
  }

  :deep(.el-timeline-item__timestamp) { color: $gray !important; }
  :deep(.el-timeline-item__content) { color: $white; }
  :deep(.el-timeline-item__node--normal) { width: 12px; height: 12px; }
}

.result-footer {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

// ---- Navigation ----
.wizard-footer {
  max-width: 800px;
  margin: 32px auto 0;
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #333;
}

// ---- Element Plus Overrides ----
:deep(.el-form-item__label) { color: $gray; font-size: 13px; }
:deep(.el-input-number.full-width) { width: 100%; }
:deep(.el-select.full-width) { width: 100%; }
:deep(.el-input__wrapper) { background: #222; border-color: #444; box-shadow: none; }
:deep(.el-input__inner) { color: $white; }
:deep(.el-input-number__increase), :deep(.el-input-number__decrease) { background: #333; color: $white; border-color: #444; }
:deep(.el-input-number.is-controls-right .el-input-number__increase) { border-bottom-color: #444; }
:deep(.el-divider) { border-color: #333; }
:deep(.el-divider__text) { color: $gray; background: $bg-dark; }
:deep(.el-card__header) { border-bottom: 1px solid #333; }

// ---- Animations ----
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
