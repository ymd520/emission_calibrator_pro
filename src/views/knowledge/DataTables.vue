<template>
  <div class="data-tables">
    <el-tabs v-model="activeTab" class="data-tables__tabs">
      <el-tab-pane label="燃料特性表 Fuel Properties" name="fuel">
        <div class="data-tables__toolbar">
          <el-input
            v-model="fuelSearch"
            placeholder="搜索燃料 Search fuel..."
            clearable
            size="small"
            class="data-tables__search"
          />
        </div>
        <el-table
          :data="filteredFuels"
          stripe
          border
          size="small"
          class="data-tables__table"
          @sort-change="handleFuelSort"
        >
          <el-table-column prop="name" label="燃料 Fuel" sortable="custom" min-width="110" />
          <el-table-column prop="formula" label="化学式 Formula" min-width="100" />
          <el-table-column prop="density" label="密度 kg/m³" sortable="custom" width="120" />
          <el-table-column prop="lhv" label="LHV MJ/kg" sortable="custom" width="110" />
          <el-table-column prop="hhv" label="HHV MJ/kg" sortable="custom" width="110" />
          <el-table-column prop="afr_stoich" label="理论空燃比 AFR" sortable="custom" width="130" />
          <el-table-column prop="hc" label="H/C" sortable="custom" width="70" />
          <el-table-column prop="oc" label="O/C" sortable="custom" width="70" />
          <el-table-column prop="ron" label="RON 辛烷值" sortable="custom" width="100" />
          <el-table-column prop="cetane" label="十六烷值 Cetane" sortable="custom" width="110" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="排放限值变化 Emission Limits" name="limits">
        <div class="data-tables__toolbar">
          <el-select v-model="regionFilter" size="small" class="data-tables__filter">
            <el-option label="全部 All" value="all" />
            <el-option label="欧洲 Europe" value="euro" />
            <el-option label="中国 China" value="china" />
          </el-select>
        </div>
        <el-table
          :data="filteredLimits"
          stripe
          border
          size="small"
          class="data-tables__table"
          :cell-style="limitCellStyle"
        >
          <el-table-column prop="standard" label="标准 Standard" min-width="100" fixed />
          <el-table-column prop="year" label="生效年 Year" width="100" />
          <el-table-column prop="co" label="CO g/km" width="100" />
          <el-table-column prop="hc" label="HC g/km" width="100" />
          <el-table-column prop="nox" label="NOx g/km" width="100" />
          <el-table-column prop="hc_nox" label="HC+NOx g/km" width="110" />
          <el-table-column prop="pm" label="PM g/km" width="100" />
          <el-table-column prop="pn" label="PN #/km" width="110" />
        </el-table>

        <div class="data-tables__chart-section">
          <h4 class="data-tables__chart-title">限值对比 Comparison (NOx)</h4>
          <div class="data-tables__chart">
            <div class="data-tables__chart-bars">
              <div
                v-for="(item, idx) in chartItems"
                :key="idx"
                class="data-tables__chart-bar-wrapper"
              >
                <div class="data-tables__chart-bar-label">{{ item.label }}</div>
                <div class="data-tables__chart-bar-track">
                  <div
                    class="data-tables__chart-bar-fill"
                    :style="{ width: item.pct + '%', background: item.color }"
                  />
                </div>
                <div class="data-tables__chart-bar-value">{{ item.value.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="传感器参数 Sensor Parameters" name="sensor">
        <h4 class="data-tables__section-title">氧传感器 Oxygen Sensors</h4>
        <el-table :data="o2Sensors" stripe border size="small" class="data-tables__table">
          <el-table-column prop="type" label="类型 Type" min-width="130" />
          <el-table-column prop="range" label="测量范围 Range" width="150" />
          <el-table-column prop="accuracy" label="精度 Accuracy" width="120" />
          <el-table-column prop="response" label="响应时间 Response" width="120" />
          <el-table-column prop="output" label="输出信号 Output" width="120" />
          <el-table-column prop="application" label="应用 Application" min-width="140" />
        </el-table>

        <h4 class="data-tables__section-title">温度传感器 Temperature Sensors</h4>
        <el-table :data="tempSensors" stripe border size="small" class="data-tables__table">
          <el-table-column prop="type" label="类型 Type" min-width="100" />
          <el-table-column prop="range" label="温度范围 Range" width="140" />
          <el-table-column prop="accuracy" label="精度 Accuracy" width="120" />
          <el-table-column prop="response" label="响应时间 Response" width="120" />
          <el-table-column prop="output" label="输出信号 Output" width="120" />
          <el-table-column prop="application" label="应用 Application" min-width="160" />
        </el-table>

        <h4 class="data-tables__section-title">压力传感器 Pressure Sensors</h4>
        <el-table :data="pressSensors" stripe border size="small" class="data-tables__table">
          <el-table-column prop="type" label="类型 Type" min-width="130" />
          <el-table-column prop="range" label="测量范围 Range" width="150" />
          <el-table-column prop="accuracy" label="精度 Accuracy" width="120" />
          <el-table-column prop="response" label="响应时间 Response" width="120" />
          <el-table-column prop="output" label="输出信号 Output" width="120" />
          <el-table-column prop="application" label="应用 Application" min-width="160" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="分析仪性能 Analyzer Comparison" name="analyzer">
        <el-table :data="analyzers" stripe border size="small" class="data-tables__table">
          <el-table-column prop="principle" label="测量原理 Principle" min-width="130" />
          <el-table-column prop="gases" label="可测气体 Measured Gases" width="160" />
          <el-table-column prop="minRange" label="最小量程 Min Range" width="130" />
          <el-table-column prop="maxRange" label="最大量程 Max Range" width="130" />
          <el-table-column prop="repeatability" label="重复性 Repeatability" width="120" />
          <el-table-column prop="t90" label="T90响应 T90" width="100" />
          <el-table-column prop="interference" label="交叉干扰 Cross Interference" min-width="160" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="测试循环参数 Test Cycles" name="cycles">
        <el-table
          :data="testCycles"
          stripe
          border
          size="small"
          class="data-tables__table"
          row-key="name"
          @expand-change="onExpandCycle"
        >
          <el-table-column type="expand" width="40">
            <template #default="{ row }">
              <div class="data-tables__expanded">
                <h5>{{ row.name }} — 阶段分解 Phase Breakdown</h5>
                <el-table :data="row.phases" border size="small">
                  <el-table-column prop="phase" label="阶段 Phase" width="100" />
                  <el-table-column prop="duration" label="时长 Duration (s)" width="130" />
                  <el-table-column prop="distance" label="距离 Distance (km)" width="140" />
                  <el-table-column prop="avgSpeed" label="平均速度 Avg Speed (km/h)" width="170" />
                  <el-table-column prop="maxSpeed" label="最高速度 Max Speed (km/h)" width="170" />
                  <el-table-column prop="idle" label="怠速 Idle (%)" width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="循环名称 Cycle" min-width="130" sortable />
          <el-table-column prop="duration" label="时长 Duration (s)" width="130" sortable />
          <el-table-column prop="distance" label="距离 Distance (km)" width="140" sortable />
          <el-table-column prop="avgSpeed" label="平均速度 Avg Speed (km/h)" width="170" sortable />
          <el-table-column prop="maxSpeed" label="最高速度 Max Speed (km/h)" width="170" sortable />
          <el-table-column prop="idlePct" label="怠速 Idle (%)" width="100" sortable />
          <el-table-column prop="stops" label="停车次数 Stops" width="110" sortable />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/* ------------------------------------------------ */
/*  Tabs                                            */
/* ------------------------------------------------ */
const activeTab = ref('fuel')

/* ------------------------------------------------ */
/*  Fuel Properties                                 */
/* ------------------------------------------------ */
interface Fuel {
  name: string
  formula: string
  density: number
  lhv: number
  hhv: number
  afr_stoich: number
  hc: number
  oc: number
  ron: number | string
  cetane: number | string
}

const fuels: Fuel[] = [
  { name: '汽油 Gasoline', formula: 'C₄~C₁₂', density: 740, lhv: 43.5, hhv: 46.4, afr_stoich: 14.7, hc: 1.85, oc: 0.00, ron: 95, cetane: '-' },
  { name: '柴油 Diesel', formula: 'C₈~C₂₅', density: 840, lhv: 42.5, hhv: 45.4, afr_stoich: 14.5, hc: 1.95, oc: 0.00, ron: '-', cetane: 51 },
  { name: 'LPG', formula: 'C₃H₈/C₄H₁₀', density: 540, lhv: 46.1, hhv: 50.1, afr_stoich: 15.5, hc: 2.67, oc: 0.00, ron: 105, cetane: '-' },
  { name: 'CNG', formula: 'CH₄(90%+)', density: 0.72, lhv: 47.5, hhv: 52.5, afr_stoich: 17.2, hc: 3.85, oc: 0.00, ron: 120, cetane: '-' },
  { name: 'LNG', formula: 'CH₄(95%+)', density: 430, lhv: 47.5, hhv: 52.5, afr_stoich: 17.2, hc: 3.90, oc: 0.00, ron: 120, cetane: '-' },
  { name: '乙醇 Ethanol', formula: 'C₂H₅OH', density: 789, lhv: 26.8, hhv: 29.7, afr_stoich: 9.0, hc: 3.00, oc: 0.33, ron: 108, cetane: '-' },
  { name: '甲醇 Methanol', formula: 'CH₃OH', density: 792, lhv: 19.7, hhv: 22.7, afr_stoich: 6.5, hc: 4.00, oc: 0.50, ron: 110, cetane: '-' },
  { name: 'E85', formula: '85%C₂H₅OH+15%C₇H₁₆', density: 780, lhv: 29.5, hhv: 32.5, afr_stoich: 9.8, hc: 2.90, oc: 0.30, ron: 106, cetane: '-' },
  { name: '生物柴油 Biodiesel', formula: 'C₁₆~C₁₈ FAME', density: 880, lhv: 37.5, hhv: 40.2, afr_stoich: 13.1, hc: 1.75, oc: 0.10, ron: '-', cetane: 55 },
  { name: '氢气 Hydrogen', formula: 'H₂', density: 0.0899, lhv: 120.0, hhv: 141.8, afr_stoich: 34.3, hc: 0, oc: 0.00, ron: 'N/A', cetane: '-' },
  { name: '氨 Ammonia', formula: 'NH₃', density: 0.76, lhv: 18.6, hhv: 22.5, afr_stoich: 6.1, hc: 1.50, oc: 0.00, ron: 130, cetane: '-' },
  { name: '二甲醚 DME', formula: 'CH₃OCH₃', density: 660, lhv: 28.4, hhv: 31.5, afr_stoich: 9.0, hc: 3.00, oc: 0.25, ron: '-', cetane: 60 },
]

const fuelSearch = ref('')
const fuelSort = ref<{ prop: string; order: string } | null>(null)

const filteredFuels = computed(() => {
  let list = fuels
  if (fuelSearch.value.trim()) {
    const q = fuelSearch.value.trim().toLowerCase()
    list = list.filter((f) => f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q))
  }
  if (fuelSort.value?.prop) {
    const prop = fuelSort.value.prop as keyof Fuel
    const asc = fuelSort.value.order === 'ascending'
    list = [...list].sort((a, b) => {
      const va = typeof a[prop] === 'string' ? parseFloat(a[prop] as string) || 0 : (a[prop] as number)
      const vb = typeof b[prop] === 'string' ? parseFloat(b[prop] as string) || 0 : (b[prop] as number)
      return asc ? va - vb : vb - va
    })
  }
  return list
})

function handleFuelSort({ prop, order }: { prop?: string; order?: string }) {
  if (prop && order) fuelSort.value = { prop, order }
  else fuelSort.value = null
}

/* ------------------------------------------------ */
/*  Emission Limits                                 */
/* ------------------------------------------------ */
interface Limit {
  standard: string
  year: number
  co: number
  hc: number
  nox: number
  hc_nox: number
  pm: number
  pn: string
  region: 'euro' | 'china'
}

const limits: Limit[] = [
  { standard: 'Euro 1', year: 1992, co: 2.72, hc: 0.97, nox: 0.14, hc_nox: 1.11, pm: 0.14, pn: '-', region: 'euro' },
  { standard: 'Euro 2', year: 1996, co: 2.20, hc: 0.50, nox: 0.25, hc_nox: 0.75, pm: 0.08, pn: '-', region: 'euro' },
  { standard: 'Euro 3', year: 2000, co: 2.30, hc: 0.20, nox: 0.15, hc_nox: 0.35, pm: 0.05, pn: '-', region: 'euro' },
  { standard: 'Euro 4', year: 2005, co: 1.00, hc: 0.10, nox: 0.08, hc_nox: 0.18, pm: 0.025, pn: '-', region: 'euro' },
  { standard: 'Euro 5', year: 2009, co: 1.00, hc: 0.10, nox: 0.06, hc_nox: 0.16, pm: 0.005, pn: '-', region: 'euro' },
  { standard: 'Euro 6', year: 2014, co: 1.00, hc: 0.10, nox: 0.06, hc_nox: 0.16, pm: 0.005, pn: '6×10¹¹', region: 'euro' },
  { standard: 'Euro 6d', year: 2020, co: 1.00, hc: 0.10, nox: 0.06, hc_nox: 0.16, pm: 0.005, pn: '6×10¹¹', region: 'euro' },
  { standard: 'Euro 7', year: 2025, co: 0.50, hc: 0.06, nox: 0.03, hc_nox: 0.09, pm: 0.003, pn: '3×10¹¹', region: 'euro' },
  { standard: 'China 1', year: 2000, co: 3.16, hc: 1.13, nox: 0.18, hc_nox: 1.31, pm: 0.18, pn: '-', region: 'china' },
  { standard: 'China 2', year: 2004, co: 2.20, hc: 0.50, nox: 0.25, hc_nox: 0.75, pm: 0.08, pn: '-', region: 'china' },
  { standard: 'China 3', year: 2007, co: 2.30, hc: 0.20, nox: 0.15, hc_nox: 0.35, pm: 0.05, pn: '-', region: 'china' },
  { standard: 'China 4', year: 2010, co: 1.00, hc: 0.10, nox: 0.08, hc_nox: 0.18, pm: 0.025, pn: '-', region: 'china' },
  { standard: 'China 5', year: 2017, co: 1.00, hc: 0.10, nox: 0.06, hc_nox: 0.16, pm: 0.0045, pn: '6×10¹¹', region: 'china' },
  { standard: 'China 6a', year: 2020, co: 0.70, hc: 0.08, nox: 0.06, hc_nox: 0.14, pm: 0.0045, pn: '6×10¹¹', region: 'china' },
  { standard: 'China 6b', year: 2023, co: 0.50, hc: 0.05, nox: 0.035, hc_nox: 0.085, pm: 0.003, pn: '6×10¹¹', region: 'china' },
]

const regionFilter = ref('all')

const filteredLimits = computed(() => {
  if (regionFilter.value === 'all') return limits
  return limits.filter((l) => l.region === regionFilter.value)
})

function limitCellStyle({ columnIndex }: { columnIndex: number; rowIndex: number }) {
  // Column indices: 0=standard,1=year,2=co,3=hc,4=nox,5=hc_nox,6=pm,7=pn
  const valColumn = columnIndex >= 2 && columnIndex <= 6
  if (!valColumn) return {}
  const vals = filteredLimits.value.map((r) => {
    const keys = ['co', 'hc', 'nox', 'hc_nox', 'pm'] as const
    return r[keys[columnIndex - 2]] as number
  })
  const maxVal = Math.max(...vals)
  const rowVal = vals.length > 0 ? vals[vals.length - 1] : 0
  const currValIndex = filteredLimits.value.length - 1
  const currVal = filteredLimits.value.map((r) => {
    const keys = ['co', 'hc', 'nox', 'hc_nox', 'pm'] as const
    return r[keys[columnIndex - 2]] as number
  })[currValIndex] || 0
  const normalized = rowVal > 0 ? currVal / maxVal : 0.5

  if (normalized < 0.3) return { background: '#e8f5e9', color: '#1a1a1a' }
  if (normalized < 0.5) return { background: '#fff8e1', color: '#1a1a1a' }
  if (normalized < 0.7) return { background: '#fff3e0', color: '#1a1a1a' }
  return { background: '#ffebee', color: '#1a1a1a' }
}

const chartItems = computed(() => {
  return filteredLimits.value.map((l) => {
    const maxNOx = Math.max(...filteredLimits.value.map((x) => x.nox))
    const pct = maxNOx > 0 ? (l.nox / maxNOx) * 100 : 0
    const green = Math.round(120 * (1 - l.nox / maxNOx))
    const red = Math.round(120 * (l.nox / maxNOx))
    return {
      label: l.standard,
      value: l.nox,
      pct,
      color: `rgb(${red + 100}, ${green + 100}, 80)`,
    }
  })
})

/* ------------------------------------------------ */
/*  Sensor Parameters                               */
/* ------------------------------------------------ */
interface SensorRow {
  type: string
  range: string
  accuracy: string
  response: string
  output: string
  application: string
}

const o2Sensors: SensorRow[] = [
  { type: '开关型氧传感器 Switching O₂', range: 'λ 0.8~1.2', accuracy: '±0.1 λ', response: '< 100ms (活性)', output: '阶跃电压 0~1V', application: '汽油机λ=1闭环控制和催化器监控' },
  { type: '宽域氧传感器 LSU 4.2', range: 'λ 0.65~∞', accuracy: '±0.01 λ', response: '< 150ms', output: '泵电流 ±5mA', application: '汽油机宽域空燃比控制，稀燃发动机' },
  { type: '宽域氧传感器 LSU 4.9', range: 'λ 0.65~∞', accuracy: '±0.008 λ', response: '< 100ms', output: '泵电流 ±5mA (数字接口)', application: '高性能发动机控制，柴油机后处理控制' },
]

const tempSensors: SensorRow[] = [
  { type: 'K型热电偶 K-type TC', range: '-200~+1350°C', accuracy: '±1.5°C 或 ±0.4%', response: '0.5~5s (视探头)', output: '热电电压 约41µV/°C', application: '排气温度EGT测量，高温燃烧分析' },
  { type: 'NTC 热敏电阻', range: '-40~+250°C', accuracy: '±0.5°C (25°C)', response: '0.3~3s', output: '电阻 10kΩ@25°C', application: '冷却液温度ECT、进气温度IAT、机油温度' },
  { type: 'PT100 铂电阻', range: '-200~+850°C', accuracy: '±0.15°C (0°C)', response: '1~5s', output: '电阻 100Ω@0°C', application: '实验室温度测量，环境舱温度控制' },
  { type: 'PT1000 铂电阻', range: '-200~+600°C', accuracy: '±0.3°C (0°C)', response: '1~5s', output: '电阻 1000Ω@0°C', application: '汽车级温度传感器，后处理系统温度' },
]

const pressSensors: SensorRow[] = [
  { type: 'MAP 进气压力传感器', range: '20~400 kPa abs', accuracy: '±0.5% FS', response: '< 2ms', output: '模拟电压 0~5V', application: '进气歧管压力测量、发动机负荷计算' },
  { type: '压阻式压力传感器 Piezoresistive', range: '0~3000 bar', accuracy: '±0.1% FS', response: '< 1ms', output: '模拟电压/电流 4~20mA', application: '共轨燃油压力、制动气压、机油压力' },
  { type: '压电式压力传感器 Piezoelectric', range: '0~300 bar', accuracy: '±0.3% FS', response: '< 0.1ms', output: '电荷信号 pC/bar', application: '气缸压力测量、爆震信号检测' },
]

/* ------------------------------------------------ */
/*  Analyzer Comparison                             */
/* ------------------------------------------------ */
interface Analyzer {
  principle: string
  gases: string
  minRange: string
  maxRange: string
  repeatability: string
  t90: string
  interference: string
}

const analyzers: Analyzer[] = [
  { principle: 'NDIR 非色散红外', gases: 'CO, CO₂, HC, NO', minRange: '0-10 ppm', maxRange: '0-100%', repeatability: '±0.5% FS', t90: '< 3s', interference: 'H₂O交叉吸收显著，需除湿或补偿；CO₂对CO干扰' },
  { principle: 'CLD 化学发光', gases: 'NO, NOx', minRange: '0-10 ppm', maxRange: '0-10000 ppm', repeatability: '±0.5% FS', t90: '< 2s', interference: 'CO₂淬灭效应，胺类化合物干扰，需O₃发生器维护' },
  { principle: 'FID 火焰离子化', gases: 'THC, NMHC, CH₄', minRange: '0-4 ppm', maxRange: '0-50000 ppmC', repeatability: '±0.3% FS', t90: '< 1.5s', interference: 'O₂干扰（响应因子变化），需FID燃料气(H₂/He)' },
  { principle: 'PMD 顺磁检测', gases: 'O₂', minRange: '0-1%', maxRange: '0-100%', repeatability: '±0.1% FS', t90: '< 4s', interference: 'NOx和NO₂顺磁性干扰，需化学吸收预处理' },
  { principle: 'FTIR 傅里叶变换红外', gases: 'CO, CO₂, NO, NO₂, N₂O, NH₃, SO₂, CH₂O, HC等多组分', minRange: '0-1 ppm', maxRange: '0-100%', repeatability: '±1% FS', t90: '< 5s (扫描频率1Hz)', interference: 'H₂O吸收带覆盖广，需高分辨率分析或预处理；光谱重叠干扰' },
]

/* ------------------------------------------------ */
/*  Test Cycles                                     */
/* ------------------------------------------------ */
interface Phase {
  phase: string
  duration: number
  distance: number
  avgSpeed: number
  maxSpeed: number
  idle: number
}

interface TestCycle {
  name: string
  duration: number
  distance: number
  avgSpeed: number
  maxSpeed: number
  idlePct: number
  stops: number
  phases: Phase[]
}

const testCycles: TestCycle[] = [
  {
    name: 'WLTC Class 3',
    duration: 1800,
    distance: 23.27,
    avgSpeed: 46.6,
    maxSpeed: 131.3,
    idlePct: 13.4,
    stops: 9,
    phases: [
      { phase: 'Low (低速段)', duration: 589, distance: 3.09, avgSpeed: 18.9, maxSpeed: 56.5, idle: 26.6 },
      { phase: 'Medium (中速段)', duration: 433, distance: 4.76, avgSpeed: 39.5, maxSpeed: 76.6, idle: 11.1 },
      { phase: 'High (高速段)', duration: 455, distance: 7.16, avgSpeed: 56.6, maxSpeed: 97.4, idle: 6.6 },
      { phase: 'Extra High (超高速段)', duration: 323, distance: 8.26, avgSpeed: 92.0, maxSpeed: 131.3, idle: 3.4 },
    ],
  },
  {
    name: 'WLTC Class 2',
    duration: 1800,
    distance: 22.79,
    avgSpeed: 45.6,
    maxSpeed: 123.1,
    idlePct: 14.0,
    stops: 10,
    phases: [
      { phase: 'Low', duration: 589, distance: 2.96, avgSpeed: 18.1, maxSpeed: 51.4, idle: 28.0 },
      { phase: 'Medium', duration: 433, distance: 4.60, avgSpeed: 38.2, maxSpeed: 72.1, idle: 11.8 },
      { phase: 'High', duration: 455, distance: 7.00, avgSpeed: 55.4, maxSpeed: 90.3, idle: 7.1 },
      { phase: 'Extra High', duration: 323, distance: 8.23, avgSpeed: 91.8, maxSpeed: 123.1, idle: 3.6 },
    ],
  },
  {
    name: 'WLTC Class 1',
    duration: 1800,
    distance: 14.40,
    avgSpeed: 28.8,
    maxSpeed: 88.0,
    idlePct: 18.2,
    stops: 12,
    phases: [
      { phase: 'Low', duration: 589, distance: 3.00, avgSpeed: 18.3, maxSpeed: 49.1, idle: 29.5 },
      { phase: 'Medium', duration: 433, distance: 4.34, avgSpeed: 36.1, maxSpeed: 64.9, idle: 13.0 },
      { phase: 'High', duration: 455, distance: 4.69, avgSpeed: 37.1, maxSpeed: 88.0, idle: 11.2 },
      { phase: 'Extra High', duration: 323, distance: 2.37, avgSpeed: 26.6, maxSpeed: 60.8, idle: 15.3 },
    ],
  },
  {
    name: 'NEDC',
    duration: 1180,
    distance: 11.03,
    avgSpeed: 33.6,
    maxSpeed: 120.0,
    idlePct: 24.5,
    stops: 13,
    phases: [
      { phase: 'UDC (城市循环×4)', duration: 780, distance: 4.06, avgSpeed: 18.7, maxSpeed: 50.0, idle: 30.5 },
      { phase: 'EUDC (市郊循环)', duration: 400, distance: 6.97, avgSpeed: 62.6, maxSpeed: 120.0, idle: 7.5 },
    ],
  },
  {
    name: 'FTP-75',
    duration: 1874,
    distance: 17.77,
    avgSpeed: 34.1,
    maxSpeed: 91.2,
    idlePct: 18.0,
    stops: 23,
    phases: [
      { phase: 'Cold Transient (冷启动瞬态)', duration: 505, distance: 5.78, avgSpeed: 41.2, maxSpeed: 91.2, idle: 14.5 },
      { phase: 'Stabilized (稳定阶段)', duration: 864, distance: 6.24, avgSpeed: 25.9, maxSpeed: 88.2, idle: 20.8 },
      { phase: 'Hot Transient (热启动瞬态)', duration: 505, distance: 5.78, avgSpeed: 41.2, maxSpeed: 91.2, idle: 14.5 },
    ],
  },
  {
    name: 'HWFET',
    duration: 765,
    distance: 16.51,
    avgSpeed: 77.7,
    maxSpeed: 96.6,
    idlePct: 0.6,
    stops: 1,
    phases: [
      { phase: 'Highway (高速段)', duration: 765, distance: 16.51, avgSpeed: 77.7, maxSpeed: 96.6, idle: 0.6 },
    ],
  },
  {
    name: 'US06',
    duration: 596,
    distance: 12.87,
    avgSpeed: 77.9,
    maxSpeed: 129.2,
    idlePct: 7.8,
    stops: 5,
    phases: [
      { phase: 'Aggressive Driving (激烈驾驶)', duration: 596, distance: 12.87, avgSpeed: 77.9, maxSpeed: 129.2, idle: 7.8 },
    ],
  },
  {
    name: 'SC03',
    duration: 596,
    distance: 5.79,
    avgSpeed: 35.0,
    maxSpeed: 88.2,
    idlePct: 19.3,
    stops: 7,
    phases: [
      { phase: 'AC Operation (空调运行)', duration: 596, distance: 5.79, avgSpeed: 35.0, maxSpeed: 88.2, idle: 19.3 },
    ],
  },
  {
    name: 'WHTC',
    duration: 1800,
    distance: 25.16,
    avgSpeed: 50.3,
    maxSpeed: 95.0,
    idlePct: 18.0,
    stops: 8,
    phases: [
      { phase: 'Urban (城市段)', duration: 900, distance: 9.50, avgSpeed: 38.0, maxSpeed: 65.0, idle: 28.0 },
      { phase: 'Rural (乡村段)', duration: 600, distance: 10.20, avgSpeed: 61.2, maxSpeed: 85.0, idle: 8.0 },
      { phase: 'Motorway (高速段)', duration: 300, distance: 5.46, avgSpeed: 65.5, maxSpeed: 95.0, idle: 3.0 },
    ],
  },
  {
    name: 'WHSC',
    duration: 1800,
    distance: 24.80,
    avgSpeed: 49.6,
    maxSpeed: 90.0,
    idlePct: 16.5,
    stops: 7,
    phases: [
      { phase: 'Urban (城市段)', duration: 900, distance: 9.30, avgSpeed: 37.2, maxSpeed: 60.0, idle: 26.0 },
      { phase: 'Rural (乡村段)', duration: 600, distance: 10.00, avgSpeed: 60.0, maxSpeed: 80.0, idle: 7.5 },
      { phase: 'Motorway (高速段)', duration: 300, distance: 5.50, avgSpeed: 66.0, maxSpeed: 90.0, idle: 2.5 },
    ],
  },
  {
    name: 'NRTC',
    duration: 1238,
    distance: 10.80,
    avgSpeed: 31.5,
    maxSpeed: 85.0,
    idlePct: 27.0,
    stops: 15,
    phases: [
      { phase: 'Cold Start (冷启动)', duration: 619, distance: 5.40, avgSpeed: 31.4, maxSpeed: 85.0, idle: 27.0 },
      { phase: 'Hot Start (热启动)', duration: 619, distance: 5.40, avgSpeed: 31.4, maxSpeed: 85.0, idle: 27.0 },
    ],
  },
  {
    name: 'NRSC',
    duration: 600,
    distance: 6.50,
    avgSpeed: 39.0,
    maxSpeed: 80.0,
    idlePct: 10.0,
    stops: 1,
    phases: [
      { phase: '稳态工况点', duration: 600, distance: 6.50, avgSpeed: 39.0, maxSpeed: 80.0, idle: 10.0 },
    ],
  },
]

function onExpandCycle(_row: TestCycle, expandedRows: TestCycle[]) {
  // no-op, kept for future use
}

/* Workaround: import after usage to avoid hoisting issues */
import { ElTable, ElTableColumn, ElInput, ElSelect, ElOption, ElTabs, ElTabPane } from 'element-plus'
</script>

<style scoped lang="scss">
$white: #f5f5f0;
$orange: #ff8800;
$black: #1a1a1a;

.data-tables {
  padding: 24px;
  min-height: calc(100vh - 60px);
  background: $white;
  color: $black;

  &__tabs {
    :deep(.el-tabs__item) {
      font-size: 13px;
      font-weight: 500;
      color: lighten($black, 30%);
      &.is-active {
        color: $orange;
      }
      &:hover {
        color: $orange;
      }
    }
    :deep(.el-tabs__active-bar) {
      background-color: $orange;
    }
  }

  &__toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__search {
    width: 280px;
  }

  &__filter {
    width: 180px;
  }

  &__table {
    width: 100%;
    margin-bottom: 24px;

    :deep(th.el-table__cell) {
      background: darken($white, 4%);
      color: $black;
      font-weight: 600;
      font-size: 12px;
    }

    :deep(.el-table__row) {
      &:hover > td {
        background: rgba($orange, 0.04) !important;
      }
    }
  }

  &__section-title {
    font-size: 15px;
    font-weight: 600;
    color: $orange;
    margin: 24px 0 12px;
    padding-left: 8px;
    border-left: 3px solid $orange;

    &:first-of-type {
      margin-top: 0;
    }
  }

  &__chart-section {
    margin-top: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid darken($white, 8%);
  }

  &__chart-title {
    font-size: 14px;
    margin: 0 0 12px;
    color: $black;
  }

  &__chart-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__chart-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__chart-bar-label {
    width: 80px;
    font-size: 11px;
    text-align: right;
    color: lighten($black, 30%);
    flex-shrink: 0;
  }

  &__chart-bar-track {
    flex: 1;
    height: 18px;
    background: darken($white, 6%);
    border-radius: 9px;
    overflow: hidden;
  }

  &__chart-bar-fill {
    height: 100%;
    border-radius: 9px;
    transition: width 0.5s ease;
    min-width: 4px;
  }

  &__chart-bar-value {
    width: 50px;
    font-size: 11px;
    color: lighten($black, 20%);
  }

  &__expanded {
    padding: 16px;
    h5 {
      margin: 0 0 12px;
      font-size: 14px;
      color: $orange;
    }
  }
}
</style>
