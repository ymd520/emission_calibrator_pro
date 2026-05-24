<template>
  <div class="tuning-calculator">
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
    <!-- TAB 1: 喷油系统                                               -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'injection'" class="tab-content">
      <h3 class="section-title">喷油器流量换算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>喷油器流量 (cc/min)</label>
          <input v-model.number="injFlowCcMin" type="number" min="0" step="10" />
          <button class="btn-example" @click="setExample('injFlow')">示例数据</button>
        </div>
        <div class="input-group">
          <label>燃油类型</label>
          <select v-model="injFuelType">
            <option v-for="f in fuelTypes" :key="f.name" :value="f">{{ f.name }}</option>
          </select>
        </div>
        <div class="input-group">
          <label>燃油密度 (g/mL)</label>
          <input :value="injFuelDensity" type="number" step="0.001" readonly class="readonly-field" />
        </div>
        <div class="result-box">
          <label>流量 (g/s)</label>
          <div class="result-value">{{ injectorFlowGS.toFixed(4) }} <span class="unit">g/s</span></div>
          <button class="btn-copy" @click="copyText(injectorFlowGS.toFixed(4) + ' g/s')">复制</button>
        </div>
      </div>

      <h3 class="section-title">喷油脉宽计算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>目标空燃比 (AFR)</label>
          <input v-model.number="pwAFR" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>空气质量流量 (g/s)</label>
          <input v-model.number="pwMAF" type="number" min="0" step="1" />
          <button class="btn-example" @click="setExample('pwMAF')">示例数据</button>
        </div>
        <div class="input-group">
          <label>喷油器流量 (g/s)</label>
          <input v-model.number="pwInjFlow" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>发动机转速 (RPM)</label>
          <input v-model.number="pwRPM" type="number" min="0" step="100" />
        </div>
        <div class="input-group">
          <label>气缸数</label>
          <input v-model.number="pwCylinders" type="number" min="1" step="1" />
        </div>
        <div class="result-box">
          <label>喷油脉宽 (PW)</label>
          <div class="result-value">{{ pulseWidth.toFixed(2) }} <span class="unit">ms</span></div>
          <button class="btn-copy" @click="copyText(pulseWidth.toFixed(2) + ' ms')">复制</button>
        </div>
      </div>

      <h3 class="section-title">占空比计算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>喷油脉宽 (ms)</label>
          <input v-model.number="dcPW" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>发动机转速 (RPM)</label>
          <input v-model.number="dcRPM" type="number" min="0" step="100" />
        </div>
        <div class="result-box">
          <label>占空比</label>
          <div class="result-value">{{ dutyCycle.toFixed(2) }} <span class="unit">%</span></div>
          <button class="btn-copy" @click="copyText(dutyCycle.toFixed(2) + ' %')">复制</button>
        </div>
      </div>

      <h3 class="section-title">油轨压力修正</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>实际油压 (bar)</label>
          <input v-model.number="railActual" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>额定油压 (bar)</label>
          <input v-model.number="railRated" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>额定流量 (cc/min)</label>
          <input v-model.number="railFlow" type="number" min="0" step="1" />
          <button class="btn-example" @click="setExample('rail')">示例数据</button>
        </div>
        <div class="result-box">
          <label>修正流量</label>
          <div class="result-value">{{ railCorrectedFlow.toFixed(2) }} <span class="unit">cc/min</span></div>
          <button class="btn-copy" @click="copyText(railCorrectedFlow.toFixed(2) + ' cc/min')">复制</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 2: 空燃比与碳氢比                                         -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'afr'" class="tab-content">
      <h3 class="section-title">Lambda / AFR 换算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>燃油类型</label>
          <select v-model="afrFuel">
            <option v-for="f in stoichFuels" :key="f.name" :value="f">{{ f.name }}</option>
          </select>
        </div>
        <div class="input-group">
          <label>Lambda 值</label>
          <input v-model.number="lambdaInput" type="number" min="0" step="0.01" />
        </div>
        <div class="input-group">
          <label>AFR 值</label>
          <input v-model.number="afrInput" type="number" min="0" step="0.1" />
        </div>
        <div class="result-box">
          <label>计算结果</label>
          <div class="result-value">
            当量比 Phi = {{ equivalenceRatio.toFixed(4) }}<br />
            Lambda = {{ lambdaFromAfr.toFixed(4) }}<br />
            AFR = {{ afrFromLambda.toFixed(2) }}
          </div>
          <button class="btn-copy" @click="copyText('Lambda: ' + lambdaFromAfr.toFixed(4) + ', AFR: ' + afrFromLambda.toFixed(2) + ', Phi: ' + equivalenceRatio.toFixed(4))">复制</button>
        </div>
      </div>

      <h3 class="section-title">燃料 H/C 比计算器</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>碳含量 C (%)</label>
          <input v-model.number="hc_C" type="number" min="0" max="100" step="0.01" />
          <button class="btn-example" @click="setExample('hc')">示例数据</button>
        </div>
        <div class="input-group">
          <label>氢含量 H (%)</label>
          <input v-model.number="hc_H" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="input-group">
          <label>氧含量 O (%)</label>
          <input v-model.number="hc_O" type="number" min="0" max="100" step="0.01" />
        </div>
        <div class="result-box">
          <label>计算结果</label>
          <div class="result-value">
            H/C 摩尔比 = {{ hcRatio.toFixed(4) }}<br />
            化学计量空燃比 = {{ hcStoichAFR.toFixed(2) }}
          </div>
          <button class="btn-copy" @click="copyText('H/C: ' + hcRatio.toFixed(4) + ', AFR_stoich: ' + hcStoichAFR.toFixed(2))">复制</button>
        </div>
      </div>

      <h3 class="section-title">过量空气系数</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>当前 AFR</label>
          <input v-model.number="excessAFR" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>燃料化学计量 AFR</label>
          <input v-model.number="excessStoich" type="number" min="0" step="0.1" />
        </div>
        <div class="result-box">
          <label>过量空气系数 Lambda</label>
          <div class="result-value">{{ excessLambda.toFixed(4) }}</div>
          <button class="btn-copy" @click="copyText('Lambda: ' + excessLambda.toFixed(4))">复制</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 3: 进气系统                                               -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'intake'" class="tab-content">
      <h3 class="section-title">增压压力换算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>压力值</label>
          <input v-model.number="boostValue" type="number" step="0.01" />
        </div>
        <div class="input-group">
          <label>输入单位</label>
          <select v-model="boostUnitIn">
            <option value="barA">bar (绝对)</option>
            <option value="psiA">psi (绝对)</option>
            <option value="barG">bar (表压)</option>
            <option value="psiG">psi (表压)</option>
            <option value="kPaA">kPa (绝对)</option>
            <option value="kPaG">kPa (表压)</option>
          </select>
        </div>
        <div class="result-box-wide result-box">
          <label>换算结果</label>
          <div class="result-value">
            <div v-for="r in boostResults" :key="r.label" class="result-row">
              <span class="result-label">{{ r.label }}:</span>
              <span>{{ r.value.toFixed(3) }}</span>
            </div>
          </div>
          <button class="btn-copy" @click="copyText(boostResults.map(r => r.label + ': ' + r.value.toFixed(3)).join(', '))">复制</button>
        </div>
      </div>

      <h3 class="section-title">容积效率计算器</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>排量 (L)</label>
          <input v-model.number="veDisplacement" type="number" min="0" step="0.1" />
          <button class="btn-example" @click="setExample('ve')">示例数据</button>
        </div>
        <div class="input-group">
          <label>RPM</label>
          <input v-model.number="veRPM" type="number" min="0" step="100" />
        </div>
        <div class="input-group">
          <label>MAP (kPa)</label>
          <input v-model.number="veMAP" type="number" min="0" step="1" />
        </div>
        <div class="input-group">
          <label>MAT ( C)</label>
          <input v-model.number="veMAT" type="number" step="1" />
        </div>
        <div class="input-group">
          <label>MAF (g/s)</label>
          <input v-model.number="veMAF" type="number" min="0" step="0.1" />
        </div>
        <div class="result-box">
          <label>容积效率</label>
          <div class="result-value">{{ volumetricEfficiency.toFixed(2) }} <span class="unit">%</span></div>
          <button class="btn-copy" @click="copyText(volumetricEfficiency.toFixed(2) + ' %')">复制</button>
        </div>
      </div>

      <h3 class="section-title">发动机排量计算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>缸径 (mm)</label>
          <input v-model.number="dispBore" type="number" min="0" step="0.1" />
          <button class="btn-example" @click="setExample('disp')">示例数据</button>
        </div>
        <div class="input-group">
          <label>行程 (mm)</label>
          <input v-model.number="dispStroke" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>气缸数</label>
          <input v-model.number="dispCylinders" type="number" min="1" step="1" />
        </div>
        <div class="result-box">
          <label>排量</label>
          <div class="result-value">{{ engineDisplacement.toFixed(3) }} <span class="unit">L</span></div>
          <button class="btn-copy" @click="copyText(engineDisplacement.toFixed(3) + ' L')">复制</button>
        </div>
      </div>

      <h3 class="section-title">中冷器效率</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>中冷器进口 T_in ( C)</label>
          <input v-model.number="icT_in" type="number" step="1" />
        </div>
        <div class="input-group">
          <label>中冷器出口 T_out ( C)</label>
          <input v-model.number="icT_out" type="number" step="1" />
        </div>
        <div class="input-group">
          <label>环境温度 T_amb ( C)</label>
          <input v-model.number="icT_amb" type="number" step="1" />
        </div>
        <div class="result-box">
          <label>中冷器效率</label>
          <div class="result-value">{{ intercoolerEfficiency.toFixed(2) }} <span class="unit">%</span></div>
          <button class="btn-copy" @click="copyText(intercoolerEfficiency.toFixed(2) + ' %')">复制</button>
        </div>
      </div>

      <h3 class="section-title">进气密度修正</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>实测密度 rho (kg/m^3)</label>
          <input v-model.number="airDensity" type="number" min="0" step="0.001" />
        </div>
        <div class="input-group">
          <label>实际大气压 (kPa)</label>
          <input v-model.number="airPress" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>实际温度 ( C)</label>
          <input v-model.number="airTemp" type="number" step="1" />
        </div>
        <div class="result-box">
          <label>修正密度</label>
          <div class="result-value">{{ correctedAirDensity.toFixed(4) }} <span class="unit">kg/m^3</span></div>
          <button class="btn-copy" @click="copyText(correctedAirDensity.toFixed(4) + ' kg/m^3')">复制</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 4: 点火系统                                               -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'ignition'" class="tab-content">
      <h3 class="section-title">点火正时换算</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>发动机转速 (RPM)</label>
          <input v-model.number="igRPM" type="number" min="0" step="100" />
          <button class="btn-example" @click="setExample('ig')">示例数据</button>
        </div>
        <div class="input-group">
          <label>曲轴角度 (deg)</label>
          <input v-model.number="igDeg" type="number" step="0.5" />
        </div>
        <div class="input-group">
          <label>时间 (ms)</label>
          <input v-model.number="igMs" type="number" min="0" step="0.1" />
        </div>
        <div class="result-box">
          <label>换算结果</label>
          <div class="result-value">
            {{ igDeg }} deg  =  {{ degToMs.toFixed(3) }} ms<br />
            {{ igMs }} ms  =  {{ msToDeg.toFixed(2) }} deg
          </div>
          <button class="btn-copy" @click="copyText(igDeg + ' deg = ' + degToMs.toFixed(3) + ' ms, ' + igMs + ' ms = ' + msToDeg.toFixed(2) + ' deg')">复制</button>
        </div>
      </div>

      <h3 class="section-title">火花塞热值对照表</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>NGK</th>
              <th>Bosch</th>
              <th>Champion</th>
              <th>热特性</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in sparkPlugTable" :key="row.ngk">
              <td>{{ row.ngk }}</td>
              <td>{{ row.bosch }}</td>
              <td>{{ row.champion }}</td>
              <td>{{ row.type }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 5: 涡轮增压                                               -->
    <!-- ============================================================ -->
    <div v-show="activeTab === 'turbo'" class="tab-content">
      <h3 class="section-title">A/R 比参考</h3>
      <div class="info-card">
        <p><strong>A/R (Area/Radius) 比</strong> 是涡轮增压器涡壳的一个关键几何参数：</p>
        <ul>
          <li><strong>A</strong> 涡壳喷嘴出口横截面积</li>
          <li><strong>R</strong> 从涡轮中心到喷嘴出口面积几何中心的半径</li>
        </ul>
        <p><em>A/R 值越小</em>：气流速度越快，低转速响应好，但高流量时背压大。</p>
        <p><em>A/R 值越大</em>：高流量效率高，功率上限大，但低转速迟滞明显。</p>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>A/R 范围</th><th>典型应用</th></tr>
          </thead>
          <tbody>
            <tr><td>0.35 - 0.50</td><td>小排量汽油机 / 快速响应</td></tr>
            <tr><td>0.50 - 0.70</td><td>中等排量汽油机</td></tr>
            <tr><td>0.70 - 0.90</td><td>大排量汽油机 / 轻度柴油</td></tr>
            <tr><td>0.90 - 1.20</td><td>柴油机 / 高功率汽油</td></tr>
            <tr><td>1.20 - 1.60+</td><td>大型柴油机 / 极限功率</td></tr>
          </tbody>
        </table>
      </div>

      <h3 class="section-title">涡轮匹配辅助</h3>
      <div class="calc-grid">
        <div class="input-group">
          <label>目标功率 (hp)</label>
          <input v-model.number="tmPower" type="number" min="0" step="10" />
          <button class="btn-example" @click="setExample('tm')">示例数据</button>
        </div>
        <div class="input-group">
          <label>目标增压压力 (barG)</label>
          <input v-model.number="tmBoost" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>发动机排量 (L)</label>
          <input v-model.number="tmDisplacement" type="number" min="0" step="0.1" />
        </div>
        <div class="input-group">
          <label>目标 RPM</label>
          <input v-model.number="tmRPM" type="number" min="0" step="500" />
        </div>
        <div class="result-box-wide result-box">
          <label>估算气流需求</label>
          <div class="result-value">
            <div class="result-row"><span class="result-label">空气质量流量:</span> {{ tmAirFlow.toFixed(2) }} lb/min</div>
            <div class="result-row"><span class="result-label">压力比 (PR):</span> {{ tmPR.toFixed(3) }}</div>
            <div class="result-row"><span class="result-label">估算功率:</span> {{ tmEstPower.toFixed(0) }} hp</div>
          </div>
          <button class="btn-copy" @click="copyText('Air: ' + tmAirFlow.toFixed(2) + ' lb/min, PR: ' + tmPR.toFixed(3) + ', Power: ' + tmEstPower.toFixed(0) + ' hp')">复制</button>
        </div>
      </div>
      <p class="note">提示：将压力和流量点绘制在涡轮压气机特性图上，确保工作点落在高效率区（通常大于65%）。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ---- Tab state ----
const tabs = [
  { key: 'injection', label: '喷油系统' },
  { key: 'afr', label: '空燃比与碳氢比' },
  { key: 'intake', label: '进气系统' },
  { key: 'ignition', label: '点火系统' },
  { key: 'turbo', label: '涡轮增压' }
]
const activeTab = ref('injection')

// ---- Fuel types (density in g/mL) ----
const fuelTypes = [
  { name: '汽油 (Gasoline)', density: 0.745 },
  { name: '柴油 (Diesel)', density: 0.832 },
  { name: 'E85', density: 0.780 },
  { name: '甲醇 (Methanol)', density: 0.792 }
]
const injFuelType = ref(fuelTypes[0])

// ---- Stoich AFR fuels ----
const stoichFuels = [
  { name: '汽油 (Gasoline)', stoich: 14.7 },
  { name: '柴油 (Diesel)', stoich: 14.5 },
  { name: 'E85', stoich: 9.76 },
  { name: '甲醇 (Methanol)', stoich: 6.47 },
  { name: 'CNG', stoich: 17.2 },
  { name: 'LPG', stoich: 15.5 },
  { name: '乙醇 (Ethanol)', stoich: 9.0 },
  { name: '氢气 (H2)', stoich: 34.0 }
]
const afrFuel = ref(stoichFuels[0])

// ================================================================
// TAB 1: 喷油系统
// ================================================================

// Injector flow: cc/min -> g/s
const injFlowCcMin = ref(1000)
const injFuelDensity = computed(() => injFuelType.value.density)
const injectorFlowGS = computed(() => (injFlowCcMin.value * injFuelDensity.value) / 60)

// Pulse width: PW(ms) = MAF * 120 * 1000 / (AFR * injFlow_gps * RPM * cylinders)
// air per cylinder per cycle (g) = MAF / (RPM/120) / cylinders
// fuel per cycle (g) = air / AFR
// PW (ms) = fuel / injFlow_gps * 1000
const pwAFR = ref(14.7)
const pwMAF = ref(200)
const pwInjFlow = ref(60)
const pwRPM = ref(6000)
const pwCylinders = ref(6)
const pulseWidth = computed(() => {
  if (pwAFR.value <= 0 || pwInjFlow.value <= 0 || pwRPM.value <= 0 || pwCylinders.value <= 0) return 0
  const airPerCyl = pwMAF.value / (pwRPM.value / 120) / pwCylinders.value
  const fuelPerCyl = airPerCyl / pwAFR.value
  return (fuelPerCyl / pwInjFlow.value) * 1000
})

// Duty cycle: DC(%) = PW(ms) * RPM / 1200
const dcPW = ref(15)
const dcRPM = ref(6000)
const dutyCycle = computed(() => {
  if (dcRPM.value <= 0) return 0
  return (dcPW.value * dcRPM.value) / 1200
})

// Rail pressure correction: corrected = sqrt(P_actual / P_rated) * flow_rated
const railActual = ref(4.0)
const railRated = ref(3.0)
const railFlow = ref(1000)
const railCorrectedFlow = computed(() => {
  if (railRated.value <= 0) return 0
  return Math.sqrt(railActual.value / railRated.value) * railFlow.value
})

// ================================================================
// TAB 2: 空燃比与碳氢比
// ================================================================

// Lambda <-> AFR
const lambdaInput = ref(1.0)
const afrInput = ref(14.7)
const afrFromLambda = computed(() => lambdaInput.value * afrFuel.value.stoich)
const lambdaFromAfr = computed(() =>
  afrFuel.value.stoich > 0 ? afrInput.value / afrFuel.value.stoich : 0
)
const equivalenceRatio = computed(() =>
  afrFromLambda.value > 0 ? afrFuel.value.stoich / afrFromLambda.value : 0
)

// H/C ratio from elemental analysis
// n_C = C%/12.01, n_H = H%/1.008, n_O = O%/16.00
const hc_C = ref(84)
const hc_H = ref(16)
const hc_O = ref(0)
const hcRatio = computed(() => {
  const nC = hc_C.value / 12.01
  const nH = hc_H.value / 1.008
  return nC > 0 ? nH / nC : 0
})
const hcStoichAFR = computed(() => {
  const nC = hc_C.value / 12.01
  const nH = hc_H.value / 1.008
  const nO = hc_O.value / 16.00
  const num = 137.85 * (nC + nH / 4 - nO / 2)
  const den = 12.01 * nC + 1.008 * nH + 16.00 * nO
  return den > 0 ? num / den : 0
})

// Excess air ratio
const excessAFR = ref(16.0)
const excessStoich = ref(14.7)
const excessLambda = computed(() => {
  if (excessStoich.value <= 0) return 0
  return excessAFR.value / excessStoich.value
})

// ================================================================
// TAB 3: 进气系统
// ================================================================

// Boost pressure converter
const boostValue = ref(1.0)
const boostUnitIn = ref('barA')
const boostToKpaA = computed(() => {
  const v = boostValue.value
  switch (boostUnitIn.value) {
    case 'barA': return v * 100
    case 'psiA': return v * 6.89476
    case 'barG': return (v + 1.01325) * 100
    case 'psiG': return (v + 14.6959) * 6.89476
    case 'kPaA': return v
    case 'kPaG': return v + 101.325
    default: return 0
  }
})
const boostResults = computed(() => {
  const kPa = boostToKpaA.value
  return [
    { label: 'bar (绝对)', value: kPa / 100 },
    { label: 'psi (绝对)', value: kPa / 6.89476 },
    { label: 'bar (表压)', value: kPa / 100 - 1.01325 },
    { label: 'psi (表压)', value: kPa / 6.89476 - 14.6959 },
    { label: 'kPa (绝对)', value: kPa },
    { label: 'kPa (表压)', value: kPa - 101.325 }
  ]
})

// Volumetric efficiency: VE = (MAF * R * T) / (MAP * Vd * RPM/120)
// Units: MAF[g/s], R=287.058[J/kgK], T[K], MAP[kPa], Vd[L]
// After unit cancellation: VE = MAF * 0.287058 * T / (MAP * Vd * RPM/120)
const veDisplacement = ref(3.0)
const veRPM = ref(6000)
const veMAP = ref(100)
const veMAT = ref(25)
const veMAF = ref(200)
const volumetricEfficiency = computed(() => {
  if (veMAP.value <= 0 || veDisplacement.value <= 0 || veRPM.value <= 0) return 0
  const R = 0.287058
  const T = veMAT.value + 273.15
  const numerator = veMAF.value * R * T
  const denominator = veMAP.value * veDisplacement.value * (veRPM.value / 120)
  if (denominator <= 0) return 0
  return (numerator / denominator) * 100
})

// Engine displacement: V = pi/4 * bore^2 * stroke * cylinders
const dispBore = ref(86.0)
const dispStroke = ref(86.0)
const dispCylinders = ref(6)
const engineDisplacement = computed(() => {
  const boreM = dispBore.value / 1000
  const strokeM = dispStroke.value / 1000
  return (Math.PI / 4) * boreM * boreM * strokeM * dispCylinders.value * 1000
})

// Intercooler efficiency: (T_in - T_out) / (T_in - T_amb) * 100
const icT_in = ref(120)
const icT_out = ref(50)
const icT_amb = ref(25)
const intercoolerEfficiency = computed(() => {
  const delta = icT_in.value - icT_amb.value
  if (delta <= 0) return 0
  return ((icT_in.value - icT_out.value) / delta) * 100
})

// Intake air density correction: rho_corr = rho * (101.325/P_actual) * (T_actual+273.15)/298.15
const airDensity = ref(1.225)
const airPress = ref(101.325)
const airTemp = ref(25)
const correctedAirDensity = computed(() => {
  if (airPress.value <= 0) return 0
  return airDensity.value * (101.325 / airPress.value) * ((airTemp.value + 273.15) / 298.15)
})

// ================================================================
// TAB 4: 点火系统
// ================================================================

// deg <-> ms: ms = deg / (RPM * 6), deg = ms * RPM * 6
const igRPM = ref(6000)
const igDeg = ref(20)
const igMs = ref(0.55)
const degToMs = computed(() => {
  if (igRPM.value <= 0) return 0
  return igDeg.value / (igRPM.value * 6)
})
const msToDeg = computed(() => {
  if (igRPM.value <= 0) return 0
  return igMs.value * igRPM.value * 6
})

// Spark plug heat range cross-reference
const sparkPlugTable = [
  { ngk: '9', bosch: '--', champion: '--', type: '最冷' },
  { ngk: '8', bosch: '--', champion: '--', type: '很冷' },
  { ngk: '7', bosch: 'FR7DC', champion: 'RC9YC', type: '冷' },
  { ngk: '6', bosch: 'FR6DC', champion: 'RC8YC', type: '中冷' },
  { ngk: '5', bosch: 'FR5DC', champion: 'RC7YC', type: '中等' },
  { ngk: '4', bosch: 'FR4DC', champion: 'RC6YC', type: '中热' },
  { ngk: '3', bosch: '--', champion: '--', type: '热' }
]

// ================================================================
// TAB 5: 涡轮增压
// ================================================================

const tmPower = ref(400)
const tmBoost = ref(1.0)
const tmDisplacement = ref(3.0)
const tmRPM = ref(7000)

// Air flow estimate in lb/min using displacement method
const tmAirFlow = computed(() => {
  const pr = (tmBoost.value + 1.01325) / 1.01325
  const ve = 0.85
  const dispCFM = (tmDisplacement.value * 61.0237 * tmRPM.value * ve) / (2 * 1728)
  const airDensityStd = 0.076
  return dispCFM * airDensityStd * pr
})
const tmPR = computed(() => {
  return (tmBoost.value + 1.01325) / 1.01325
})
const tmEstPower = computed(() => tmAirFlow.value * 10)

// ---- Example data loaders ----
function setExample(target) {
  switch (target) {
    case 'injFlow':
      injFlowCcMin.value = 1000
      injFuelType.value = fuelTypes[0]
      break
    case 'pwMAF':
      pwAFR.value = 14.7; pwMAF.value = 200; pwInjFlow.value = 60; pwRPM.value = 6000; pwCylinders.value = 6
      break
    case 'rail':
      railActual.value = 4.0; railRated.value = 3.0; railFlow.value = 1000
      break
    case 'hc':
      hc_C.value = 84; hc_H.value = 16; hc_O.value = 0
      break
    case 've':
      veDisplacement.value = 3.0; veRPM.value = 6000; veMAP.value = 100; veMAT.value = 25; veMAF.value = 200
      break
    case 'disp':
      dispBore.value = 86; dispStroke.value = 86; dispCylinders.value = 6
      break
    case 'ig':
      igRPM.value = 6000; igDeg.value = 20; igMs.value = 0.55
      break
    case 'tm':
      tmPower.value = 400; tmBoost.value = 1.0; tmDisplacement.value = 3.0; tmRPM.value = 7000
      break
  }
}

// ---- Copy to clipboard ----
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

.tuning-calculator {
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

.input-group input.readonly-field {
  background: #E8E8E0;
  cursor: default;
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
