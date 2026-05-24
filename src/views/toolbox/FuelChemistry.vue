<template>
  <div class="fuel-chemistry">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 1: 燃料分子量                                             -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'molwt'" class="tab-content">
      <h3 class="section-title">燃料预设</h3>
      <div class="preset-bar">
        <button
          v-for="p in fuelPresets"
          :key="p.name"
          :class="['preset-btn', { active: activePreset === p.name }]"
          @click="loadPreset(p.name)"
        >
          {{ p.label }}
        </button>
      </div>

      <h3 class="section-title">元素组成输入（质量百分比）</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>碳 C (%)</label>
          <input v-model.number="el_C" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="input-group">
          <label>氢 H (%)</label>
          <input v-model.number="el_H" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="input-group">
          <label>氧 O (%)</label>
          <input v-model.number="el_O" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="input-group">
          <label>氮 N (%)</label>
          <input v-model.number="el_N" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="input-group">
          <label>硫 S (%)</label>
          <input v-model.number="el_S" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="result-box">
          <label>总和</label>
          <div class="result-value" :class="{ warning: Math.abs(elementSum - 100) > 0.5 }">
            {{ elementSum.toFixed(2) }} %
          </div>
        </div>
      </div>

      <h3 class="section-title">计算结果</h3>
      <div class="calc-grid">
        <div class="result-box-wide result-box">
          <label>分子参数</label>
          <div class="result-value">
            <div class="result-row"><span class="result-label">化学式 (归一化):</span> {{ empiricalFormula }}</div>
            <div class="result-row" v-if="activePresetMW"><span class="result-label">分子量 (预设):</span> {{ activePresetMW.toFixed(3) }} g/mol</div>
            <div class="result-row"><span class="result-label">经验式量:</span> {{ empiricalMW.toFixed(3) }} g/mol</div>
            <div class="result-row"><span class="result-label">H/C 原子比:</span> {{ hcAtomicRatio.toFixed(4) }}</div>
            <div class="result-row"><span class="result-label">O/C 原子比:</span> {{ ocAtomicRatio.toFixed(4) }}</div>
            <div class="result-row" v-if="activePresetFormula"><span class="result-label">分子式:</span> {{ activePresetFormula }}</div>
          </div>
          <button class="btn-copy" @click="copyText('Formula: ' + empiricalFormula + ', MW: ' + empiricalMW.toFixed(3) + ', H/C: ' + hcAtomicRatio.toFixed(4) + ', O/C: ' + ocAtomicRatio.toFixed(4))">复制</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 2: 热值计算                                               -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'calorific'" class="tab-content">
      <h3 class="section-title">Dulong 公式热值计算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>碳 C (质量分数, 0-1)</label>
          <input v-model.number="dv_C" type="number" min="0" max="1" step="0.001" />
          <button class="btn-example" @click="loadDulongExample()">示例数据</button>
        </div>
        <div class="input-group">
          <label>氢 H (质量分数, 0-1)</label>
          <input v-model.number="dv_H" type="number" min="0" max="1" step="0.001" />
        </div>
        <div class="input-group">
          <label>氧 O (质量分数, 0-1)</label>
          <input v-model.number="dv_O" type="number" min="0" max="1" step="0.001" />
        </div>
        <div class="input-group">
          <label>硫 S (质量分数, 0-1)</label>
          <input v-model.number="dv_S" type="number" min="0" max="1" step="0.001" />
        </div>
        <div class="result-box">
          <label>HHV (高位热值)</label>
          <div class="result-value">{{ dulongHHV.toFixed(2) }} <span class="unit">MJ/kg</span></div>
          <button class="btn-copy" @click="copyText('HHV: ' + dulongHHV.toFixed(2) + ' MJ/kg')">复制</button>
        </div>
        <div class="result-box">
          <label>LHV (低位热值)</label>
          <div class="result-value">{{ dulongLHV.toFixed(2) }} <span class="unit">MJ/kg</span></div>
          <button class="btn-copy" @click="copyText('LHV: ' + dulongLHV.toFixed(2) + ' MJ/kg')">复制</button>
        </div>
      </div>

      <h3 class="section-title">标准燃料热值参考表</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>燃料</th>
              <th>分子式</th>
              <th>HHV (MJ/kg)</th>
              <th>LHV (MJ/kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in standardHeatingValues" :key="row.name">
              <td>{{ row.name }}</td>
              <td>{{ row.formula }}</td>
              <td>{{ row.hhv.toFixed(1) }}</td>
              <td>{{ row.lhv.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 3: 燃烧产物                                               -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'combustion'" class="tab-content">
      <h3 class="section-title">燃料组成</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>碳 C (%)</label>
          <input v-model.number="cb_C" type="number" min="0" max="100" step="0.01" />
          <button class="btn-example" @click="setCombustionExample()">示例数据</button>
        </div>
        <div class="input-group">
          <label>氢 H (%)</label>
          <input v-model.number="cb_H" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="input-group">
          <label>氧 O (%)</label>
          <input v-model.number="cb_O" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="input-group">
          <label>过量空气系数 Lambda</label>
          <input v-model.number="cbLambda" type="number" min="0" step="0.01" />
        </div>
      </div>

      <h3 class="section-title">燃烧化学方程式</h3>
      <div class="equation-box">{{ balancedEquation }}</div>

      <h3 class="section-title">理论空气量</h3>
      <div class="calc-grid">
        <div class="result-box">
          <label>理论空气量 (kg air / kg fuel)</label>
          <div class="result-value">{{ theoreticalAir.toFixed(4) }}</div>
          <button class="btn-copy" @click="copyText(theoreticalAir.toFixed(4) + ' kg air/kg fuel')">复制</button>
        </div>
        <div class="result-box">
          <label>实际空气量 (kg air / kg fuel)</label>
          <div class="result-value">{{ actualAir.toFixed(4) }}</div>
          <button class="btn-copy" @click="copyText(actualAir.toFixed(4) + ' kg air/kg fuel')">复制</button>
        </div>
      </div>

      <h3 class="section-title">燃烧产物组成</h3>
      <div class="result-box-wide result-box">
        <label>产物摩尔分数</label>
        <div class="result-value">
          <div class="result-row" v-for="p in productMoleFractions" :key="p.name">
            <span class="result-label">{{ p.name }}:</span>
            <span>{{ p.value.toFixed(4) }} ({{ (p.value * 100).toFixed(2) }}%)</span>
          </div>
        </div>
        <button class="btn-copy" @click="copyText(productMoleFractions.map(p => p.name + ': ' + (p.value * 100).toFixed(2) + '%').join(', '))">复制</button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 4: 气体物性                                               -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'gasprops'" class="tab-content">
      <h3 class="section-title">常见气体物性表</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>气体</th>
              <th>分子式</th>
              <th>MW (g/mol)</th>
              <th>密度 (kg/m^3)</th>
              <th>cp (kJ/kgK)</th>
              <th>cv (kJ/kgK)</th>
              <th>gamma</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in gasProperties" :key="g.name">
              <td>{{ g.name }}</td>
              <td>{{ g.formula }}</td>
              <td>{{ g.mw.toFixed(2) }}</td>
              <td>{{ g.densitySTP.toFixed(4) }}</td>
              <td>{{ g.cp.toFixed(3) }}</td>
              <td>{{ g.cv.toFixed(3) }}</td>
              <td>{{ g.gamma.toFixed(3) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="section-title">密度修正 (P, T)</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>参考密度 rho0 (kg/m^3)</label>
          <input v-model.number="dcDensity" type="number" min="0" step="0.001" />
        </div>
        <div class="input-group">
          <label>压力 P (kPa)</label>
          <input v-model.number="dcPressure" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>温度 T ( C)</label>
          <input v-model.number="dcTemp" type="number" step="1" />
        </div>
        <div class="result-box">
          <label>修正密度</label>
          <div class="result-value">{{ correctedGasDensity.toFixed(4) }} <span class="unit">kg/m^3</span></div>
          <button class="btn-copy" @click="copyText(correctedGasDensity.toFixed(4) + ' kg/m^3')">复制</button>
        </div>
      </div>

      <h3 class="section-title">湿度 / 露点计算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>温度 T ( C)</label>
          <input v-model.number="humidTemp" type="number" step="1" />
          <button class="btn-example" @click="setHumidityExample()">示例数据</button>
        </div>
        <div class="input-group">
          <label>相对湿度 RH (%)</label>
          <input v-model.number="humidRH" type="number" min="0" max="100" step="1" />
        </div>
        <div class="result-box">
          <label>饱和蒸汽压</label>
          <div class="result-value">{{ satPressure.toFixed(2) }} <span class="unit">kPa</span></div>
        </div>
        <div class="result-box">
          <label>绝对湿度</label>
          <div class="result-value">{{ absoluteHumidity.toFixed(4) }} <span class="unit">kg/kg dry air</span></div>
          <button class="btn-copy" @click="copyText(absoluteHumidity.toFixed(4) + ' kg/kg dry air')">复制</button>
        </div>
        <div class="result-box">
          <label>露点温度</label>
          <div class="result-value">{{ dewPoint.toFixed(1) }} <span class="unit"> C</span></div>
          <button class="btn-copy" @click="copyText(dewPoint.toFixed(1) + ' C')">复制</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ---- Tab state ----
const tabs = [
  { key: 'molwt', label: '燃料分子量' },
  { key: 'calorific', label: '热值计算' },
  { key: 'combustion', label: '燃烧产物' },
  { key: 'gasprops', label: '气体物性' }
]
const activeTab = ref('molwt')

// ================================================================
// FUEL PRESETS
// ================================================================
const fuelPresets = [
  { name: 'gasoline', label: '汽油 C8H18', formula: { C: 8, H: 18, O: 0, N: 0, S: 0 } },
  { name: 'diesel', label: '柴油 C12H23', formula: { C: 12, H: 23, O: 0, N: 0, S: 0 } },
  { name: 'ethanol', label: '乙醇 C2H5OH', formula: { C: 2, H: 6, O: 1, N: 0, S: 0 } },
  { name: 'methanol', label: '甲醇 CH3OH', formula: { C: 1, H: 4, O: 1, N: 0, S: 0 } },
  { name: 'lpg', label: 'LPG C3H8', formula: { C: 3, H: 8, O: 0, N: 0, S: 0 } },
  { name: 'cng', label: 'CNG CH4', formula: { C: 1, H: 4, O: 0, N: 0, S: 0 } },
  { name: 'biodiesel', label: '生物柴油 C19H36O2', formula: { C: 19, H: 36, O: 2, N: 0, S: 0 } },
  { name: 'hydrogen', label: '氢气 H2', formula: { C: 0, H: 2, O: 0, N: 0, S: 0 } },
  { name: 'ammonia', label: '氨 NH3', formula: { C: 0, H: 3, O: 0, N: 1, S: 0 } },
  { name: 'e85', label: 'E85 (85%乙醇+15%汽油)', formula: null }
]

function presetMW(formula) {
  if (!formula) return 0
  return formula.C * 12.01 + formula.H * 1.008 + formula.O * 16.00 + formula.N * 14.01 + formula.S * 32.07
}

function presetMassPct(formula) {
  if (!formula) return { C: 0, H: 0, O: 0, N: 0, S: 0 }
  const mw = presetMW(formula)
  if (mw <= 0) return { C: 0, H: 0, O: 0, N: 0, S: 0 }
  return {
    C: (formula.C * 12.01 / mw) * 100,
    H: (formula.H * 1.008 / mw) * 100,
    O: (formula.O * 16.00 / mw) * 100,
    N: (formula.N * 14.01 / mw) * 100,
    S: (formula.S * 32.07 / mw) * 100
  }
}

// E85 composition approximation: 85% ethanol, 15% gasoline by mass
const e85_MassPct = (() => {
  const eth = presetMassPct({ C: 2, H: 6, O: 1, N: 0, S: 0 })
  const gas = presetMassPct({ C: 8, H: 18, O: 0, N: 0, S: 0 })
  return {
    C: 0.85 * eth.C + 0.15 * gas.C,
    H: 0.85 * eth.H + 0.15 * gas.H,
    O: 0.85 * eth.O + 0.15 * gas.O,
    N: 0,
    S: 0
  }
})()

const activePreset = ref(null)
const activePresetMW = ref(null)
const activePresetFormula = ref(null)

// ---- Elemental composition inputs ----
const el_C = ref(84.0)
const el_H = ref(16.0)
const el_O = ref(0)
const el_N = ref(0)
const el_S = ref(0)

const elementSum = computed(() => el_C.value + el_H.value + el_O.value + el_N.value + el_S.value)

// ---- Computed results ----
const molesPer100g = computed(() => ({
  C: el_C.value / 12.01,
  H: el_H.value / 1.008,
  O: el_O.value / 16.00,
  N: el_N.value / 14.01,
  S: el_S.value / 32.07
}))

const hcAtomicRatio = computed(() => {
  const m = molesPer100g.value
  return m.C > 0 ? m.H / m.C : 0
})

const ocAtomicRatio = computed(() => {
  const m = molesPer100g.value
  return m.C > 0 ? m.O / m.C : 0
})

const empiricalFormula = computed(() => {
  const m = molesPer100g.value
  const vals = [m.C, m.H, m.O, m.N, m.S]
  const nonZero = vals.filter(v => v > 0)
  if (nonZero.length === 0) return 'N/A'
  const min = Math.min(...nonZero)
  const scale = m.C > 0 ? m.C : min
  if (scale <= 0) return 'N/A'
  const c = Math.round(m.C / scale * 100) / 100
  const h = Math.round(m.H / scale * 100) / 100
  const o = Math.round(m.O / scale * 100) / 100
  const n = Math.round(m.N / scale * 100) / 100
  const s = Math.round(m.S / scale * 100) / 100
  let f = ''
  if (c > 0) f += 'C' + (c > 1.01 ? subscriptNum(c) : '')
  if (h > 0) f += 'H' + (h > 1.01 ? subscriptNum(h) : '')
  if (o > 0) f += 'O' + (o > 1.01 ? subscriptNum(o) : '')
  if (n > 0) f += 'N' + (n > 1.01 ? subscriptNum(n) : '')
  if (s > 0) f += 'S' + (s > 1.01 ? subscriptNum(s) : '')
  return f
})

function subscriptNum(v) {
  const rounded = Math.round(v)
  return String(rounded)
}

const empiricalMW = computed(() => {
  const m = molesPer100g.value
  const totalMoles = m.C + m.H + m.O + m.N + m.S
  if (totalMoles <= 0) return 0
  return 100 / totalMoles
})

// Load preset
function loadPreset(name) {
  activePreset.value = name
  const preset = fuelPresets.find(p => p.name === name)
  if (!preset) return
  if (name === 'e85') {
    el_C.value = e85_MassPct.C
    el_H.value = e85_MassPct.H
    el_O.value = e85_MassPct.O
    el_N.value = 0
    el_S.value = 0
    activePresetMW.value = null
    activePresetFormula.value = '~C' + (Math.round(e85_MassPct.C / 12.01 * 100) / 100) + 'H' + (Math.round(e85_MassPct.H / 1.008 * 100) / 100) + 'O' + (Math.round(e85_MassPct.O / 16.00 * 100) / 100)
    return
  }
  if (preset.formula) {
    const pct = presetMassPct(preset.formula)
    el_C.value = Math.round(pct.C * 100) / 100
    el_H.value = Math.round(pct.H * 100) / 100
    el_O.value = Math.round(pct.O * 100) / 100
    el_N.value = Math.round(pct.N * 100) / 100
    el_S.value = Math.round(pct.S * 100) / 100
    activePresetMW.value = presetMW(preset.formula)
    const f = preset.formula
    let fs = ''
    if (f.C > 0) fs += 'C' + (f.C > 1 ? String(f.C) : '')
    if (f.H > 0) fs += 'H' + (f.H > 1 ? String(f.H) : '')
    if (f.O > 0) fs += 'O' + (f.O > 1 ? String(f.O) : '')
    if (f.N > 0) fs += 'N' + (f.N > 1 ? String(f.N) : '')
    if (f.S > 0) fs += 'S' + (f.S > 1 ? String(f.S) : '')
    activePresetFormula.value = fs
  }
}

// ================================================================
// TAB 2: 热值计算 (Dulong formula)
// ================================================================
const dv_C = ref(0.841)
const dv_H = ref(0.159)
const dv_O = ref(0)
const dv_S = ref(0)

const dulongHHV = computed(() => {
  return 33.8 * dv_C.value + 144 * (dv_H.value - dv_O.value / 8) + 9.42 * dv_S.value
})

const dulongLHV = computed(() => {
  return dulongHHV.value - 2.442 * (9 * dv_H.value / 100)
})

function loadDulongExample() {
  dv_C.value = 0.841
  dv_H.value = 0.159
  dv_O.value = 0
  dv_S.value = 0
}

const standardHeatingValues = [
  { name: '汽油 (Gasoline)', formula: 'C8H18', hhv: 44.0, lhv: 41.1 },
  { name: '柴油 (Diesel)', formula: 'C12H23', hhv: 45.5, lhv: 42.5 },
  { name: '乙醇 (Ethanol)', formula: 'C2H5OH', hhv: 29.7, lhv: 26.8 },
  { name: '甲醇 (Methanol)', formula: 'CH3OH', hhv: 22.7, lhv: 19.9 },
  { name: 'LPG (Propane)', formula: 'C3H8', hhv: 49.3, lhv: 45.8 },
  { name: 'CNG (Methane)', formula: 'CH4', hhv: 55.5, lhv: 50.0 },
  { name: '生物柴油 (Biodiesel)', formula: 'C19H36O2', hhv: 39.8, lhv: 37.2 },
  { name: '氢气 (Hydrogen)', formula: 'H2', hhv: 141.8, lhv: 120.0 },
  { name: '氨 (Ammonia)', formula: 'NH3', hhv: 22.5, lhv: 18.6 },
  { name: '煤炭 (Bituminous)', formula: '--', hhv: 30.0, lhv: 28.5 }
]

// ================================================================
// TAB 3: 燃烧产物
// ================================================================
const cb_C = ref(84)
const cb_H = ref(16)
const cb_O = ref(0)
const cbLambda = ref(1.0)

// Moles per 100g fuel
const cbMoles = computed(() => ({
  C: cb_C.value / 12.01,
  H: cb_H.value / 1.008,
  O: cb_O.value / 16.00
}))

// Stoichiometric oxygen required (moles O2 per 100g fuel)
const stoichO2 = computed(() => {
  const m = cbMoles.value
  return m.C + m.H / 4 - m.O / 2
})

const theoreticalAir = computed(() => {
  const o2 = stoichO2.value
  if (o2 <= 0) return 0
  // O2 mass per 100g fuel: o2_mol * 32 g/mol / 100g * 1000...
  // Theoretical air kg/kg fuel = (O2 moles * 32 / 1000) / (0.231 * fuel mass / 1000) * 100
  // O2 mass (kg) per kg fuel = o2 * 32 / 1000 * 1000/100 = o2 * 32 / 100 = o2 * 0.32
  // Air mass = O2 mass / 0.231
  const o2mass = o2 * 32 / 100 // kg O2 per kg fuel (since o2 is moles O2 per 100g)
  return o2mass / 0.231
})

const actualAir = computed(() => {
  return theoreticalAir.value * cbLambda.value
})

const balancedEquation = computed(() => {
  const m = cbMoles.value
  const o2_stoich = stoichO2.value
  if (o2_stoich <= 0) return '无法计算 (无碳氢燃料)'
  const lambda = cbLambda.value
  const o2_actual = o2_stoich * lambda
  const n2 = o2_actual * 3.76

  // Normalize to 1 mole of C (or if no C, 1 mole of fuel)
  const scale = m.C > 0 ? m.C : 1
  const cCoef = m.C > 0 ? 1 : 0
  const hCoef = m.H > 0 ? m.H / scale : 0
  const oCoef = m.O > 0 ? m.O / scale : 0

  // Coeffs for balanced equation
  const aC = cCoef
  const aH2 = hCoef / 2
  const aO2_in = o2_actual / scale
  const aN2_in = n2 / scale
  const aCO2 = m.C / scale
  const aH2O = m.H / (2 * scale)
  const aO2_out = (o2_actual - o2_stoich) / scale
  const aN2_out = n2 / scale

  let eq = ''
  // Fuel term
  eq += fmtCoeff(1) + '('
  if (cb_C.value > 0) eq += 'C' + (cCoef > 1 ? String(Math.round(cCoef * 100) / 100) : '')
  if (cb_H.value > 0) eq += 'H' + (Math.round(hCoef * 100) / 100)
  if (cb_O.value > 0) eq += 'O' + (Math.round(oCoef * 100) / 100)
  eq += ')'
  eq += ' + ' + fmtCoeff(aO2_in) + 'O2'
  eq += ' + ' + fmtCoeff(aN2_in) + 'N2'
  eq += '  ->  '
  eq += fmtCoeff(aCO2) + 'CO2'
  if (aH2O > 0) eq += ' + ' + fmtCoeff(aH2O) + 'H2O'
  if (aO2_out > 0.001) eq += ' + ' + fmtCoeff(aO2_out) + 'O2'
  eq += ' + ' + fmtCoeff(aN2_out) + 'N2'
  return eq
})

function fmtCoeff(v) {
  if (v <= 0) return '0'
  const r = Math.round(v * 100) / 100
  return Math.abs(r - Math.round(r)) < 0.005 ? String(Math.round(r)) : String(r.toFixed(2))
}

const productMoleFractions = computed(() => {
  const m = cbMoles.value
  const o2_stoich = stoichO2.value
  if (o2_stoich <= 0) return []
  const lambda = cbLambda.value
  const o2_actual = o2_stoich * lambda
  const n2 = o2_actual * 3.76
  const co2 = m.C
  const h2o = m.H / 2
  const o2_excess = o2_actual - o2_stoich
  const totalMoles = co2 + h2o + o2_excess + n2
  if (totalMoles <= 0) return []
  return [
    { name: 'CO2', value: co2 / totalMoles },
    { name: 'H2O', value: h2o / totalMoles },
    { name: 'O2 (excess)', value: o2_excess / totalMoles },
    { name: 'N2', value: n2 / totalMoles }
  ]
})

function setCombustionExample() {
  cb_C.value = 84
  cb_H.value = 16
  cb_O.value = 0
  cbLambda.value = 1.0
}

// ================================================================
// TAB 4: 气体物性
// ================================================================
const gasProperties = [
  { name: '空气', formula: '--', mw: 28.97, densitySTP: 1.293, cp: 1.005, cv: 0.718, gamma: 1.400 },
  { name: '氮气', formula: 'N2', mw: 28.01, densitySTP: 1.250, cp: 1.040, cv: 0.743, gamma: 1.400 },
  { name: '氧气', formula: 'O2', mw: 32.00, densitySTP: 1.429, cp: 0.918, cv: 0.658, gamma: 1.395 },
  { name: '二氧化碳', formula: 'CO2', mw: 44.01, densitySTP: 1.964, cp: 0.846, cv: 0.657, gamma: 1.288 },
  { name: '一氧化碳', formula: 'CO', mw: 28.01, densitySTP: 1.250, cp: 1.040, cv: 0.744, gamma: 1.398 },
  { name: '氢气', formula: 'H2', mw: 2.016, densitySTP: 0.090, cp: 14.307, cv: 10.183, gamma: 1.405 },
  { name: '水蒸气', formula: 'H2O', mw: 18.02, densitySTP: 0.804, cp: 1.872, cv: 1.410, gamma: 1.327 },
  { name: '甲烷', formula: 'CH4', mw: 16.04, densitySTP: 0.717, cp: 2.227, cv: 1.704, gamma: 1.307 },
  { name: '乙烷', formula: 'C2H6', mw: 30.07, densitySTP: 1.342, cp: 1.766, cv: 1.490, gamma: 1.185 },
  { name: '丙烷', formula: 'C3H8', mw: 44.10, densitySTP: 1.967, cp: 1.679, cv: 1.478, gamma: 1.136 },
  { name: '丁烷', formula: 'C4H10', mw: 58.12, densitySTP: 2.593, cp: 1.676, cv: 1.523, gamma: 1.100 },
  { name: '氩气', formula: 'Ar', mw: 39.95, densitySTP: 1.784, cp: 0.520, cv: 0.312, gamma: 1.667 },
  { name: '氦气', formula: 'He', mw: 4.003, densitySTP: 0.179, cp: 5.193, cv: 3.116, gamma: 1.667 },
  { name: '氨', formula: 'NH3', mw: 17.03, densitySTP: 0.760, cp: 2.060, cv: 1.580, gamma: 1.304 },
  { name: '二氧化硫', formula: 'SO2', mw: 64.06, densitySTP: 2.860, cp: 0.622, cv: 0.484, gamma: 1.285 },
  { name: '一氧化氮', formula: 'NO', mw: 30.01, densitySTP: 1.340, cp: 0.996, cv: 0.720, gamma: 1.383 },
  { name: '二氧化氮', formula: 'NO2', mw: 46.01, densitySTP: 2.054, cp: 0.804, cv: 0.640, gamma: 1.256 },
  { name: '硫化氢', formula: 'H2S', mw: 34.08, densitySTP: 1.521, cp: 1.003, cv: 0.770, gamma: 1.302 },
  { name: '乙烯', formula: 'C2H4', mw: 28.05, densitySTP: 1.252, cp: 1.548, cv: 1.290, gamma: 1.200 },
  { name: '一氯甲烷', formula: 'CH3Cl', mw: 50.49, densitySTP: 2.254, cp: 0.812, cv: 0.650, gamma: 1.249 },
  { name: '丙炔', formula: 'C3H4', mw: 40.06, densitySTP: 1.788, cp: 1.420, cv: 1.200, gamma: 1.183 }
]

// Density correction: rho(P,T) = rho_STP * P/101.325 * 273.15/(T+273.15)
const dcDensity = ref(1.293)
const dcPressure = ref(101.325)
const dcTemp = ref(25)
const correctedGasDensity = computed(() => {
  if (dcPressure.value <= 0) return 0
  return dcDensity.value * (dcPressure.value / 101.325) * (273.15 / (dcTemp.value + 273.15))
})

// Humidity / Dewpoint calculator
const humidTemp = ref(25)
const humidRH = ref(60)

// Magnus formula for saturation vapor pressure (kPa)
function saturationPressure(T_C) {
  // Magnus-Tetens approximation for 0..100 C
  return 0.61078 * Math.exp((17.27 * T_C) / (T_C + 237.3))
}

// Inverse Magnus for dew point
function dewPointFromVP(e_kPa) {
  if (e_kPa <= 0) return -273.15
  const a = 17.27
  const b = 237.3
  const val = Math.log(e_kPa / 0.61078)
  return (b * val) / (a - val)
}

const satPressure = computed(() => {
  return saturationPressure(humidTemp.value)
})

const absoluteHumidity = computed(() => {
  const p_sat = saturationPressure(humidTemp.value)
  const p_vap = p_sat * humidRH.value / 100
  // Absolute humidity = 0.62198 * p_vap / (p_total - p_vap)
  // p_total at sea level approx 101.325 kPa
  if (p_vap >= 101.325) return Infinity
  return 0.62198 * p_vap / (101.325 - p_vap)
})

const dewPoint = computed(() => {
  const p_sat = saturationPressure(humidTemp.value)
  const p_vap = p_sat * humidRH.value / 100
  return dewPointFromVP(p_vap)
})

function setHumidityExample() {
  humidTemp.value = 25
  humidRH.value = 60
}

// ---- Copy ----
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(String(text)).catch(() => {})
  }
}
</script>

<style scoped>
/* Asiimov theme: #F5F5F0 / #FF8800 / #1A1A1A */
:host {
  --bg: #F5F5F0;
  --accent: #FF8800;
  --dark: #1A1A1A;
  --text: #1A1A1A;
  --border: #CCCCBB;
  --card-bg: #FFFFFF;
}

.fuel-chemistry {
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--text);
  background: var(--bg);
  padding: 16px;
  min-height: 100%;
  box-sizing: border-box;
}

.tabs {
  display: flex;
  gap: 2px;
  border-bottom: 2px solid var(--accent);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  background: var(--dark);
  color: #F5F5F0;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
  border-radius: 4px 4px 0 0;
}

.tab-btn:hover {
  background: #333;
}

.tab-btn.active {
  background: var(--accent);
  color: var(--dark);
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.section-title {
  color: var(--dark);
  border-left: 4px solid var(--accent);
  padding-left: 10px;
  margin: 24px 0 12px;
  font-size: 16px;
  font-weight: 700;
}

.preset-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.preset-btn {
  background: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--dark);
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.preset-btn:hover {
  border-color: var(--accent);
  background: rgba(255, 136, 0, 0.05);
}

.preset-btn.active {
  background: var(--accent);
  color: var(--dark);
  border-color: var(--accent);
}

.calc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  background: var(--card-bg);
  padding: 16px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
}

.input-group input,
.input-group select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: #FAFAF5;
  color: var(--dark);
  font-size: 14px;
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(255, 136, 0, 0.2);
}

.btn-example {
  background: transparent;
  border: 1px dashed var(--accent);
  color: var(--accent);
  padding: 3px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
  margin-top: 2px;
  align-self: flex-start;
}

.btn-example:hover {
  background: rgba(255, 136, 0, 0.1);
}

.result-box {
  background: var(--dark);
  color: #F5F5F0;
  padding: 12px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.result-box label {
  font-size: 12px;
  font-weight: 600;
  color: #FF8800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}

.result-value .unit {
  font-size: 13px;
  font-weight: 400;
  color: #CCCCBB;
}

.result-row {
  font-size: 14px;
  font-weight: 400;
  margin: 2px 0;
}

.result-label {
  color: #FF8800;
  margin-right: 6px;
}

.result-box-wide {
  grid-column: 1 / -1;
}

.result-value.warning {
  color: #FF4444;
}

.btn-copy {
  background: var(--accent);
  color: var(--dark);
  border: none;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 3px;
  align-self: flex-start;
}

.btn-copy:hover {
  background: #e67a00;
}

.table-wrapper {
  overflow-x: auto;
  margin: 12px 0;
  background: var(--card-bg);
  border-radius: 6px;
  border: 1px solid var(--border);
  padding: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: var(--dark);
  color: #F5F5F0;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}

.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--dark);
}

.data-table tr:nth-child(even) td {
  background: #FAFAF5;
}

.data-table tr:hover td {
  background: rgba(255, 136, 0, 0.05);
}

.equation-box {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
  margin: 12px 0;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.7;
  color: var(--dark);
  overflow-x: auto;
  white-space: nowrap;
}

.info-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--dark);
}

.info-card ul {
  margin: 8px 0;
  padding-left: 20px;
}

.info-card li {
  margin: 4px 0;
}

.note {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 8px;
}
</style>
