<template>
  <div class="tuning-wizard">
    <!-- Header -->
    <div class="wizard-header">
      <h1 class="wizard-title">调校参数计算向导</h1>
      <p class="wizard-subtitle">Tuning Parameter Calculator</p>
    </div>

    <!-- Steps -->
    <el-steps
      :active="activeStep - 1"
      align-center
      finish-status="success"
      class="wizard-steps"
    >
      <el-step title="发动机参数" />
      <el-step title="燃料选择" />
      <el-step title="目标设定" />
      <el-step title="调校参数" />
    </el-steps>

    <!-- Body -->
    <div class="wizard-body">
      <!-- STEP 1: Engine Parameters -->
      <div v-if="activeStep === 1" class="step-content">
        <h2 class="step-title">发动机参数</h2>
        <p class="step-desc">请输入发动机基本参数，部分参数将自动计算</p>

        <el-card shadow="never" class="param-card">
          <el-form label-position="top" class="tune-form">
            <div class="form-grid">
              <el-form-item label="气缸数">
                <el-input-number v-model="engine.cylinders" :min="1" :max="24" :step="1" controls-position="right" class="full-width" />
              </el-form-item>
              <el-form-item label="缸径 (mm)">
                <el-input-number v-model="engine.bore" :min="30" :max="200" :step="0.5" :precision="1" controls-position="right" class="full-width" @change="calcDisplacement" />
              </el-form-item>
              <el-form-item label="行程 (mm)">
                <el-input-number v-model="engine.stroke" :min="30" :max="250" :step="0.5" :precision="1" controls-position="right" class="full-width" @change="calcDisplacement" />
              </el-form-item>
              <el-form-item label="压缩比">
                <el-input-number v-model="engine.compressionRatio" :min="6" :max="25" :step="0.1" :precision="1" controls-position="right" class="full-width" />
              </el-form-item>
              <el-form-item label="最大功率 (kW)">
                <el-input-number v-model="engine.maxPower" :min="1" :max="9999" :step="10" controls-position="right" class="full-width" />
              </el-form-item>
              <el-form-item label="最大功率转速 (RPM)">
                <el-input-number v-model="engine.powerRPM" :min="500" :max="12000" :step="100" controls-position="right" class="full-width" />
              </el-form-item>
              <el-form-item label="最大扭矩 (Nm)">
                <el-input-number v-model="engine.maxTorque" :min="1" :max="99999" :step="10" controls-position="right" class="full-width" />
              </el-form-item>
              <el-form-item label="最大扭矩转速 (RPM)">
                <el-input-number v-model="engine.torqueRPM" :min="500" :max="12000" :step="100" controls-position="right" class="full-width" />
              </el-form-item>
            </div>
          </el-form>
        </el-card>

        <!-- Calculated Values -->
        <el-card shadow="never" class="calc-card">
          <template #header>
            <span class="card-title">自动计算结果 / Auto-Calculated</span>
          </template>
          <div class="calc-results">
            <div class="calc-item">
              <span class="calc-label">排量 (Displacement)</span>
              <span class="calc-value">{{ calculatedDisplacement }} L</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">单缸排量 (Per Cylinder)</span>
              <span class="calc-value">{{ calculatedSingleDisp }} cc</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">BMEP @ 最大扭矩</span>
              <span class="calc-value">{{ calculatedBMEP }} bar</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">升功率 (Power per Liter)</span>
              <span class="calc-value">{{ calculatedPowerPerLiter }} kW/L</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">平均活塞速度 @ 最大功率</span>
              <span class="calc-value">{{ calculatedPistonSpeed }} m/s</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- STEP 2: Fuel Selection -->
      <div v-if="activeStep === 2" class="step-content">
        <h2 class="step-title">燃料选择</h2>
        <p class="step-desc">选择燃料类型，系统将自动填充燃料特性参数</p>

        <el-card shadow="never" class="param-card">
          <el-form label-position="top" class="tune-form">
            <el-form-item label="燃料类型">
              <el-select v-model="fuel.type" class="full-width" @change="onFuelChange">
                <el-option v-for="f in fuelOptions" :key="f.id" :label="f.label" :value="f.id" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Fuel Properties -->
        <el-card shadow="never" class="calc-card">
          <template #header>
            <span class="card-title">燃料特性 / Fuel Properties</span>
          </template>
          <div class="calc-results">
            <div class="calc-item">
              <span class="calc-label">密度 (Density)</span>
              <span class="calc-value">{{ fuelProperties.density }} kg/m³</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">化学计量空燃比 (Stoich AFR)</span>
              <span class="calc-value">{{ fuelProperties.stoichAFR }}:1</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">低热值 (LHV)</span>
              <span class="calc-value">{{ fuelProperties.lhv }} MJ/kg</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">H/C 比</span>
              <span class="calc-value">{{ fuelProperties.hcRatio }}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">O/C 比</span>
              <span class="calc-value">{{ fuelProperties.ocRatio }}</span>
            </div>
          </div>
        </el-card>

        <!-- Custom H/C O/C -->
        <el-card shadow="never" class="param-card">
          <template #header>
            <span class="card-title">自定义 (可选) / Custom (Optional)</span>
          </template>
          <div class="form-grid two-col">
            <el-form-item label="自定义 H/C 比">
              <el-input-number v-model="fuel.customHCRatio" :min="0.5" :max="6" :step="0.1" :precision="2" controls-position="right" class="full-width" />
            </el-form-item>
            <el-form-item label="自定义 O/C 比">
              <el-input-number v-model="fuel.customOCRatio" :min="0" :max="2" :step="0.01" :precision="2" controls-position="right" class="full-width" />
            </el-form-item>
          </div>
          <p class="custom-hint" v-if="fuel.customHCRatio || fuel.customOCRatio">
            <el-icon><WarningFilled /></el-icon>
            将使用自定义 H/C 和 O/C 值替代燃料默认值
          </p>
        </el-card>
      </div>

      <!-- STEP 3: Target Setting -->
      <div v-if="activeStep === 3" class="step-content">
        <h2 class="step-title">目标设定</h2>
        <p class="step-desc">请设定调校目标和限制参数</p>

        <el-card shadow="never" class="param-card">
          <el-form label-position="top" class="tune-form">
            <div class="form-grid two-col">
              <el-form-item label="目标类型">
                <el-select v-model="target.type" class="full-width">
                  <el-option label="功率目标 (Power Target)" value="power" />
                  <el-option label="空燃比目标 (AFR Target)" value="afr" />
                  <el-option label="排放目标 (Emission Target)" value="emission" />
                  <el-option label="经济性目标 (Economy Target)" value="economy" />
                </el-select>
              </el-form-item>
              <el-form-item label="目标值">
                <el-input-number v-model="target.value" :min="0" :max="99999" :step="10" controls-position="right" class="full-width" />
              </el-form-item>
              <el-form-item label="目标空燃比范围">
                <div class="slider-group">
                  <el-slider
                    v-model="target.afrRange"
                    range
                    :min="5"
                    :max="30"
                    :step="0.1"
                    :format-tooltip="v => 'AFR: ' + v"
                  />
                  <div class="slider-labels">
                    <span class="rich-label">浓 Rich</span>
                    <span class="stoich-label">{{ fuelProperties.stoichAFR }}:1 化学计量</span>
                    <span class="lean-label">稀 Lean</span>
                  </div>
                </div>
              </el-form-item>
              <el-form-item label="最大增压压力">
                <el-input-number v-model="target.maxBoost" :min="0" :max="5" :step="0.1" :precision="2" controls-position="right" class="full-width">
                  <template #suffix>
                    <span class="unit-select" @click="target.boostUnit = target.boostUnit === 'bar' ? 'psi' : 'bar'">
                      {{ target.boostUnit }}
                    </span>
                  </template>
                </el-input-number>
              </el-form-item>
              <el-form-item label="最高排气温度限值 (°C)">
                <el-input-number v-model="target.maxExhaustTemp" :min="400" :max="1200" :step="10" controls-position="right" class="full-width" />
              </el-form-item>
            </div>
          </el-form>
        </el-card>
      </div>

      <!-- STEP 4: Tuning Parameters -->
      <div v-if="activeStep === 4" class="step-content">
        <h2 class="step-title">调校参数</h2>
        <p class="step-desc">根据以上输入计算得出的调校参数</p>

        <!-- Warning Flags -->
        <div v-if="warnings.length > 0" class="warning-section">
          <el-alert
            title="参数超出安全限值 / Parameters Exceed Safe Limits"
            type="warning"
            show-icon
            :closable="false"
          >
            <template #default>
              <ul class="warning-list">
                <li v-for="w in warnings" :key="w">{{ w }}</li>
              </ul>
            </template>
          </el-alert>
        </div>

        <!-- Calculated Parameters -->
        <div class="tuning-results-grid">
          <el-card shadow="never" class="tune-result-card">
            <template #header>
              <span class="card-title">喷油器 / Injector</span>
            </template>
            <div class="param-list">
              <div class="param-item">
                <span class="p-label">所需喷油嘴流量</span>
                <span class="p-value">{{ tuningParams.injectorFlowCC }} cc/min</span>
              </div>
              <div class="param-item">
                <span class="p-label">燃油质量流量</span>
                <span class="p-value">{{ tuningParams.fuelFlowGperS }} g/s</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="tune-result-card">
            <template #header>
              <span class="card-title">空燃比 / AFR & Lambda</span>
            </template>
            <div class="param-list">
              <div class="param-item">
                <span class="p-label">目标 AFR</span>
                <span class="p-value">{{ tuningParams.targetAFR }}:1</span>
              </div>
              <div class="param-item">
                <span class="p-label">Lambda</span>
                <span class="p-value">{{ tuningParams.lambda }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="tune-result-card">
            <template #header>
              <span class="card-title">油耗 / Fuel Consumption</span>
            </template>
            <div class="param-list">
              <div class="param-item">
                <span class="p-label">燃油消耗率</span>
                <span class="p-value">{{ tuningParams.fuelConsumptionGperS }} g/s</span>
              </div>
              <div class="param-item">
                <span class="p-label">小时油耗</span>
                <span class="p-value">{{ tuningParams.fuelConsumptionLperH }} L/h</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="tune-result-card">
            <template #header>
              <span class="card-title">功率输出 / Power Output</span>
            </template>
            <div class="param-list">
              <div class="param-item">
                <span class="p-label">预估功率输出</span>
                <span class="p-value">{{ tuningParams.estimatedPower }} kW</span>
              </div>
              <div class="param-item">
                <span class="p-label">功率变化</span>
                <span class="p-value" :class="tuningParams.powerDelta > 0 ? 'positive' : 'negative'">
                  {{ tuningParams.powerDelta > 0 ? '+' : '' }}{{ tuningParams.powerDelta }} kW
                </span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="tune-result-card">
            <template #header>
              <span class="card-title">进气系统 / Air System</span>
            </template>
            <div class="param-list">
              <div class="param-item">
                <span class="p-label">空气质量流量需求</span>
                <span class="p-value">{{ tuningParams.airMassFlow }} g/s</span>
              </div>
              <div class="param-item">
                <span class="p-label">所需增压压力</span>
                <span class="p-value">{{ tuningParams.boostRequired }} bar</span>
              </div>
              <div class="param-item">
                <span class="p-label">增压压力 (kPa)</span>
                <span class="p-value">{{ tuningParams.boostRequiredKpa }} kPa</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="tune-result-card">
            <template #header>
              <span class="card-title">点火 / 喷油正时</span>
            </template>
            <div class="param-list">
              <div class="param-item">
                <span class="p-label">{{ ignitionLabel }}</span>
                <span class="p-value">{{ tuningParams.timing }} &deg; BTDC</span>
              </div>
              <div class="param-item">
                <span class="p-label">估算排气温度</span>
                <span class="p-value" :class="tuningParams.estimatedExhaustTemp > target.maxExhaustTemp ? 'danger' : ''">
                  {{ tuningParams.estimatedExhaustTemp }} &deg;C
                </span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Restart -->
        <div class="result-footer">
          <el-button type="primary" :icon="Refresh" @click="restartWizard">重新计算 / New Calculation</el-button>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="wizard-footer">
      <el-button
        v-if="activeStep > 1 && activeStep < 4"
        @click="prevStep"
        :icon="ArrowLeft"
      >
        上一步
      </el-button>
      <el-button
        v-if="activeStep < 4"
        type="primary"
        @click="nextStep"
        :disabled="!canProceed"
        :icon="ArrowRight"
      >
        {{ activeStep === 3 ? '计算参数' : '下一步' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ArrowLeft, ArrowRight, WarningFilled, Refresh } from '@element-plus/icons-vue'

const activeStep = ref(1)

// ---- Engine Parameters ----
const engine = reactive({
  cylinders: 4,
  bore: 86,
  stroke: 86,
  compressionRatio: 10.5,
  maxPower: 150,
  powerRPM: 5500,
  maxTorque: 280,
  torqueRPM: 3000
})

const calculatedDisplacement = computed(() => {
  const singleCC = (Math.PI / 4) * Math.pow(engine.bore / 10, 2) * (engine.stroke / 10)
  return +((singleCC * engine.cylinders) / 1000).toFixed(3)
})

const calculatedSingleDisp = computed(() => {
  return +((calculatedDisplacement.value * 1000) / engine.cylinders).toFixed(0)
})

const calculatedBMEP = computed(() => {
  // BMEP (bar) = (2 * pi * torque) / (displacement * 100)  (for 4-stroke)
  if (!calculatedDisplacement.value || calculatedDisplacement.value === 0) return 0
  const bmep = (2 * Math.PI * engine.maxTorque) / (calculatedDisplacement.value * 100)
  return +bmep.toFixed(1)
})

const calculatedPowerPerLiter = computed(() => {
  if (!calculatedDisplacement.value) return 0
  return +(engine.maxPower / calculatedDisplacement.value).toFixed(1)
})

const calculatedPistonSpeed = computed(() => {
  // Piston speed (m/s) = (2 * stroke_mm * RPM) / 60000
  return +((2 * engine.stroke * engine.powerRPM) / 60000).toFixed(1)
})

// ---- Fuel ----
const fuelOptions = [
  { id: 'gasoline', label: '汽油 (Gasoline)' },
  { id: 'diesel', label: '柴油 (Diesel)' },
  { id: 'e85', label: 'E85 (Ethanol 85%)' },
  { id: 'methanol', label: '甲醇 (Methanol)' },
  { id: 'cng', label: 'CNG (压缩天然气)' },
  { id: 'lpg', label: 'LPG (液化石油气)' }
]

const fuelPropertiesDB = {
  gasoline: { density: 745, stoichAFR: 14.7, lhv: 43.5, hcRatio: 1.87, ocRatio: 0 },
  diesel: { density: 835, stoichAFR: 14.5, lhv: 42.5, hcRatio: 1.86, ocRatio: 0 },
  e85: { density: 780, stoichAFR: 9.77, lhv: 29.2, hcRatio: 2.0, ocRatio: 0.3 },
  methanol: { density: 792, stoichAFR: 6.45, lhv: 19.7, hcRatio: 4.0, ocRatio: 1.0 },
  cng: { density: 0.72, stoichAFR: 16.8, lhv: 47.0, hcRatio: 3.8, ocRatio: 0 },
  lpg: { density: 540, stoichAFR: 15.5, lhv: 46.0, hcRatio: 2.6, ocRatio: 0 }
}

const fuel = reactive({
  type: 'gasoline',
  customHCRatio: null,
  customOCRatio: null
})

const fuelProperties = computed(() => {
  return fuelPropertiesDB[fuel.type] || fuelPropertiesDB.gasoline
})

const effectiveHCRatio = computed(() => {
  return fuel.customHCRatio ?? fuelProperties.value.hcRatio
})

const effectiveOCRatio = computed(() => {
  return fuel.customOCRatio ?? fuelProperties.value.ocRatio
})

function onFuelChange() {
  fuel.customHCRatio = null
  fuel.customOCRatio = null
}

// ---- Target ----
const target = reactive({
  type: 'power',
  value: 200,
  afrRange: [12, 16],
  maxBoost: 1.5,
  boostUnit: 'bar',
  maxExhaustTemp: 850
})

const isCIEngine = computed(() => fuel.type === 'diesel')

const ignitionLabel = computed(() => {
  return isCIEngine.value ? '喷油正时建议 (Injection Timing)' : '点火正时建议 (Ignition Timing)'
})

// ---- Tuning Calculations ----
const tuningParams = computed(() => {
  const disp = calculatedDisplacement.value // L
  const powerTarget = target.type === 'power' ? target.value : engine.maxPower * 1.15
  const stoichAFR = fuelProperties.value.stoichAFR
  const lhv = fuelProperties.value.lhv
  const density = fuelProperties.value.density

  // Effective AFR from target range (use midpoint)
  const targetAFR = (target.afrRange[0] + target.afrRange[1]) / 2
  const lambda = targetAFR / stoichAFR

  // --- Injector flow ---
  // BSFC estimate: for SI ~250 g/kWh, for CI ~210 g/kWh
  const bsfcEstimate = isCIEngine.value ? 210 : 250
  const fuelFlowGperS = (powerTarget * bsfcEstimate) / 3600
  // Convert to cc/min
  const injectorFlowCC = (fuelFlowGperS / (density / 1000)) * 60 / (engine.cylinders || 1) * 1000 * 1.2 // 20% headroom

  // --- Fuel consumption ---
  const fuelConsumptionGperS = fuelFlowGperS
  const fuelConsumptionLperH = (fuelFlowGperS * 3600) / (density / 1000) / 1000

  // --- Power output ---
  // Thermal efficiency estimate based on comp ratio
  const thermalEff = 1 - Math.pow(1 / engine.compressionRatio, 0.35)
  const fuelEnergy = fuelFlowGperS * lhv * 1000 // J/s = W
  const estimatedPower = fuelEnergy * thermalEff / 1000 // kW
  const powerDelta = estimatedPower - engine.maxPower

  // --- Air system ---
  const airMassFlow = fuelFlowGperS * targetAFR

  // --- Boost ---
  // Volumetric efficiency ~0.85, air density at STP ~1.2 kg/m³
  const engineRPMforCalc = engine.powerRPM
  const theoreticalAirFlow = (disp / 1000) * (engineRPMforCalc / 2) * 1.2 * 0.85 / 60 // kg/s
  const boostRatio = Math.max(1, airMassFlow / (theoreticalAirFlow * 1000))
  const boostRequired = boostRatio * 1.013
  const boostRequiredKpa = boostRequired * 100

  // --- Timing ---
  // Suggested timing based on fuel and compression
  let timing
  if (isCIEngine.value) {
    timing = 10 + (engine.compressionRatio - 15) * 1.5 + (lambda < 1 ? -3 : 3)
    timing = Math.max(0, Math.min(30, timing))
  } else {
    timing = 25 + (10.5 - engine.compressionRatio) * 2 + (lambda < 1 ? -5 : lambda > 1.1 ? 3 : 0)
    timing = Math.max(5, Math.min(45, timing))
  }

  // --- Exhaust temp estimate ---
  const estimatedExhaustTemp = Math.round(
    600 + (lambda < 1 ? (1 - lambda) * 800 : 0) + (boostRequired > 2 ? 50 : 0) - (isCIEngine.value ? 100 : 0)
  )

  return {
    injectorFlowCC: Math.round(injectorFlowCC * 10) / 10,
    fuelFlowGperS: +fuelFlowGperS.toFixed(2),
    targetAFR: +targetAFR.toFixed(1),
    lambda: +lambda.toFixed(3),
    fuelConsumptionGperS: +fuelConsumptionGperS.toFixed(2),
    fuelConsumptionLperH: +fuelConsumptionLperH.toFixed(2),
    estimatedPower: Math.round(estimatedPower),
    powerDelta: Math.round(powerDelta),
    airMassFlow: +(airMassFlow * 1000).toFixed(1), // convert to g/s
    boostRequired: +boostRequired.toFixed(2),
    boostRequiredKpa: Math.round(boostRequiredKpa),
    timing: Math.round(timing),
    estimatedExhaustTemp
  }
})

const warnings = computed(() => {
  const w = []
  if (tuningParams.value.boostRequired > target.maxBoost) {
    w.push(`增压压力需求 (${tuningParams.value.boostRequired} bar) 超过设定限值 (${target.maxBoost} bar)`)
  }
  if (tuningParams.value.estimatedExhaustTemp > target.maxExhaustTemp) {
    w.push(`估算排气温度 (${tuningParams.value.estimatedExhaustTemp}°C) 超过限值 (${target.maxExhaustTemp}°C)`)
  }
  if (tuningParams.value.lambda < 0.7) {
    w.push(`Lambda (${tuningParams.value.lambda}) 过低，混合气过浓，可能导致燃烧不充分`)
  }
  if (tuningParams.value.lambda > 1.5) {
    w.push(`Lambda (${tuningParams.value.lambda}) 过高，混合气过稀，可能导致失火`)
  }
  if (calculatedPistonSpeed.value > 25) {
    w.push(`平均活塞速度 (${calculatedPistonSpeed.value} m/s) 超过 25 m/s，存在机械可靠性风险`)
  }
  if (calculatedBMEP.value > 30) {
    w.push(`BMEP (${calculatedBMEP.value} bar) 超过 30 bar，缸压过高`)
  }
  return w
})

// ---- Navigation ----
const canProceed = computed(() => {
  switch (activeStep.value) {
    case 1: return engine.cylinders > 0 && engine.bore > 0 && engine.stroke > 0
    case 2: return !!fuel.type
    case 3: return target.value > 0
    default: return true
  }
})

function nextStep() {
  if (activeStep.value < 4) activeStep.value++
}
function prevStep() {
  if (activeStep.value > 1) activeStep.value--
}

function restartWizard() {
  activeStep.value = 1
  Object.assign(engine, { cylinders: 4, bore: 86, stroke: 86, compressionRatio: 10.5, maxPower: 150, powerRPM: 5500, maxTorque: 280, torqueRPM: 3000 })
  fuel.type = 'gasoline'
  fuel.customHCRatio = null
  fuel.customOCRatio = null
  Object.assign(target, { type: 'power', value: 200, afrRange: [12, 16], maxBoost: 1.5, boostUnit: 'bar', maxExhaustTemp: 850 })
}
</script>

<style scoped lang="scss">
$white: #F5F5F0;
$orange: #FF8800;
$black: #1A1A1A;
$gray: #888;
$bg-dark: #2A2A2A;

.tuning-wizard {
  min-height: 100vh;
  background: $black;
  color: $white;
  padding: 24px 32px 80px;
}

.wizard-header {
  text-align: center;
  margin-bottom: 32px;
  .wizard-title { font-size: 28px; font-weight: 700; color: $orange; margin: 0 0 4px; letter-spacing: 2px; }
  .wizard-subtitle { font-size: 13px; color: $gray; margin: 0; text-transform: uppercase; letter-spacing: 3px; }
}

.wizard-steps {
  max-width: 650px;
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
  font-size: 22px; font-weight: 600; color: $white; margin: 0 0 8px;
}
.step-desc {
  color: $gray; margin: 0 0 24px; font-size: 14px;
}

// ---- Cards ----
.param-card, .calc-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;
  margin-bottom: 16px;

  .card-title { color: $orange; font-weight: 600; font-size: 14px; }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;

  &.two-col {
    grid-template-columns: 1fr 1fr;
  }
}

.calc-results {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;

  .calc-item {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background: #222;
    border-radius: 8px;

    .calc-label {
      font-size: 12px;
      color: $gray;
      margin-bottom: 4px;
    }

    .calc-value {
      font-size: 18px;
      font-weight: 700;
      color: $orange;
    }
  }
}

.custom-hint {
  color: $orange;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
}

// ---- Slider ----
.slider-group {
  width: 100%;

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-top: 4px;

    .rich-label { color: #f44336; }
    .stoich-label { color: $orange; }
    .lean-label { color: #4CAF50; }
  }
}

// ---- Step 4: Tuning Results ----
.warning-section {
  margin-bottom: 16px;

  .warning-list {
    margin: 8px 0 0;
    padding-left: 20px;

    li { font-size: 13px; margin-bottom: 4px; }
  }

  :deep(.el-alert) {
    background: rgba($orange, 0.1);
    border: 1px solid rgba($orange, 0.3);
    border-radius: 10px;
  }
  :deep(.el-alert__title) { color: $orange; }
  :deep(.el-alert__description) { color: lighten($orange, 20%); }
}

.tuning-results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.tune-result-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  .card-title { color: $orange; font-weight: 600; font-size: 13px; }

  .param-list {
    .param-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #222;
      font-size: 14px;

      &:last-child { border-bottom: none; }

      .p-label { color: $gray; font-size: 13px; }
      .p-value {
        color: $white;
        font-weight: 600;
        font-family: 'Courier New', monospace;

        &.positive { color: #4CAF50; }
        &.negative { color: #f44336; }
        &.danger { color: #f44336; }
      }
    }
  }
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
:deep(.el-card__header) { border-bottom: 1px solid #333; }
:deep(.el-slider__runway) { background: #444; }
:deep(.el-slider__bar) { background: $orange; }
:deep(.el-slider__button) { border-color: $orange; background: $orange; }
:deep(.el-slider__stop) { background: #666; }

.unit-select {
  cursor: pointer;
  color: $orange;
  font-weight: 600;
  &:hover { text-decoration: underline; }
}

// ---- Animations ----
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
