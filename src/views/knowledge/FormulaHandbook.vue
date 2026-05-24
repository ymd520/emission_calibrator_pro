<template>
  <div class="formula-handbook">
    <div class="formula-handbook__sidebar">
      <h2 class="formula-handbook__sidebar-title">公式手册</h2>
      <div
        v-for="cat in categories"
        :key="cat.name"
        class="formula-handbook__category"
      >
        <div class="formula-handbook__category-name">{{ cat.name }}</div>
        <div
          v-for="f in cat.formulas"
          :key="f.key"
          class="formula-handbook__formula-link"
          :class="{ 'formula-handbook__formula-link--active': activeFormula?.key === f.key }"
          @click="activeFormula = f"
        >
          {{ f.label }}
        </div>
      </div>
    </div>

    <div class="formula-handbook__content">
      <template v-if="activeFormula">
        <div class="formula-handbook__card">
          <div class="formula-handbook__card-header">
            <h3>{{ activeFormula.label }}</h3>
            <span class="formula-handbook__card-en">{{ activeFormula.en }}</span>
          </div>

          <div class="formula-handbook__formula-display">
            <code>{{ activeFormula.formula }}</code>
          </div>

          <div class="formula-handbook__desc">
            <p>{{ activeFormula.desc }}</p>
          </div>

          <div class="formula-handbook__variables">
            <h4>变量 Variables</h4>
            <div
              v-for="(v, idx) in activeFormula.vars"
              :key="idx"
              class="formula-handbook__var-row"
            >
              <div class="formula-handbook__var-info">
                <span class="formula-handbook__var-symbol">{{ v.symbol }}</span>
                <span class="formula-handbook__var-name">{{ v.name }}</span>
                <span class="formula-handbook__var-unit">{{ v.unit }}</span>
              </div>
              <div class="formula-handbook__var-input">
                <el-input-number
                  v-model="varValues[idx]"
                  :precision="4"
                  :step="v.step ?? 1"
                  :min="v.min ?? -Infinity"
                  :max="v.max ?? Infinity"
                  size="small"
                  controls-position="right"
                />
              </div>
            </div>
          </div>

          <div class="formula-handbook__actions">
            <el-button type="warning" @click="computeResult">计算 Calculate</el-button>
            <el-button @click="fillExample">示例 Example</el-button>
            <el-button @click="resetVars">重置 Reset</el-button>
          </div>

          <div v-if="result !== null" class="formula-handbook__result">
            <div class="formula-handbook__result-header">
              <span>结果 Result</span>
              <el-button
                size="small"
                text
                @click="copyResult"
              >
                复制 Copy
              </el-button>
            </div>
            <div class="formula-handbook__result-value">
              {{ result.toFixed(4) }}&nbsp;<span class="formula-handbook__result-unit">{{ activeFormula.resultUnit }}</span>
            </div>
          </div>

          <div class="formula-handbook__derivation-toggle" @click="showDerivation = !showDerivation">
            <el-icon>
              <ArrowDown v-if="!showDerivation" />
              <ArrowUp v-else />
            </el-icon>
            {{ showDerivation ? '收起推导' : '展开推导' }} Show derivation
          </div>
          <div v-if="showDerivation && activeFormula.derivation" class="formula-handbook__derivation">
            <div v-for="(step, si) in activeFormula.derivation" :key="si" class="formula-handbook__derivation-step">
              <div class="formula-handbook__derivation-num">{{ si + 1 }}</div>
              <div>
                <p class="formula-handbook__derivation-text">{{ step }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="formula-handbook__placeholder">
        <el-empty description="从左侧选择一个公式 / Select a formula from the sidebar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

/* ---- Types ---- */
interface FormulaVar {
  symbol: string
  name: string
  unit: string
  default: number
  step?: number
  min?: number
  max?: number
}

interface Formula {
  key: string
  label: string
  en: string
  formula: string
  desc: string
  vars: FormulaVar[]
  compute: (vals: number[]) => number
  example: number[]
  resultUnit: string
  derivation?: string[]
}

interface FormulaCategory {
  name: string
  formulas: Formula[]
}

/* ---- Data ---- */
const categories: FormulaCategory[] = [
  {
    name: '排放计算',
    formulas: [
      {
        key: 'carbon_balance',
        label: '碳平衡法 Carbon Balance',
        en: 'Carbon Balance Method',
        formula: 'FC = (0.273 × CO₂ + 0.429 × CO + 0.866 × HC) × Q / ρ',
        desc: '根据排气中碳基气体（CO₂、CO、HC）的浓度和排气流量计算燃料消耗量。碳平衡基本原理：输入碳 = 输出碳。该方法不依赖直接油耗测量，是排放测试中验证油耗的常用方法。',
        vars: [
          { symbol: 'CO₂', name: '二氧化碳浓度', unit: '%', default: 14.0, step: 0.1, min: 0, max: 20 },
          { symbol: 'CO', name: '一氧化碳浓度', unit: '%', default: 0.5, step: 0.1, min: 0, max: 10 },
          { symbol: 'HC', name: '碳氢化合物浓度', unit: 'ppm', default: 200, step: 10, min: 0, max: 10000 },
          { symbol: 'Q', name: '排气流量', unit: 'kg/h', default: 300, step: 10, min: 0, max: 5000 },
          { symbol: 'ρ', name: '燃料密度', unit: 'kg/L', default: 0.84, step: 0.01, min: 0.6, max: 1.0 },
        ],
        compute: (v: number[]) => (0.273 * v[0] + 0.429 * v[1] + 0.866 * v[2] / 10000) * v[3] / v[4],
        example: [14.0, 0.5, 200, 300, 0.84],
        resultUnit: 'L/h',
        derivation: [
          '碳平衡原理：燃料中的碳全部转化为排气中含碳气体（CO₂、CO、HC）',
          '单位质量燃料中的碳质量 = FC × ρ × w_C，其中w_C为燃料碳质量分数（≈0.85-0.87）',
          '排气中碳质量 = Q × (0.273 × CO₂% + 0.429 × CO% + 0.866 × HC_ppm / 10000)',
          '联立得 FC = (0.273 × CO₂ + 0.429 × CO + 0.866 × HC) × Q / ρ',
          '注：0.273 = 12/44 (C/CO₂), 0.429 = 12/28 (C/CO), 0.866 = 12/13.85 (C/CH₁.₈₅ 平均HC组成)',
        ],
      },
      {
        key: 'ppm_mgm3',
        label: '浓度换算 ppm ↔ mg/m³',
        en: 'Concentration Conversion',
        formula: 'mg/m³ = ppm × M / 22.4 × 273.15/(273.15+T) × P/101.325',
        desc: '将气态污染物体积浓度（ppm）换算为质量浓度（mg/m³），需考虑实际温度和压力修正。在排放测试中法规限值通常以克/公里或克/千瓦时给出，但分析仪输出为ppm，因此需要换算。',
        vars: [
          { symbol: 'ppm', name: '体积浓度', unit: 'ppm', default: 100, step: 10, min: 0, max: 1000000 },
          { symbol: 'M', name: '气体摩尔质量', unit: 'g/mol', default: 46.01, step: 0.01, min: 2, max: 200 },
          { symbol: 'T', name: '气体温度', unit: '°C', default: 25, step: 1, min: -50, max: 200 },
          { symbol: 'P', name: '大气压力', unit: 'kPa', default: 101.325, step: 0.1, min: 50, max: 150 },
        ],
        compute: (v: number[]) => v[0] * v[1] / 22.4 * (273.15 / (273.15 + v[2])) * (v[3] / 101.325),
        example: [100, 46.01, 25, 101.325],
        resultUnit: 'mg/m³',
        derivation: [
          '理想气体标准摩尔体积：0°C, 101.325kPa时，1mol = 22.4L',
          'ppm定义：体积分数，即百万分之一 (10⁻⁶)',
          '1ppm = 10⁻⁶ m³/m³，即1m³气体中含10⁻⁶ m³的目标气体',
          '目标气体摩尔数 = 10⁻⁶ × V_总 / 22.4 × (273.15/(273.15+T)) × (P/101.325)',
          '目标气体质量 = 摩尔数 × M = mg/m³',
          '合并得 mg/m³ = ppm × M / 22.4 × 273.15/(273.15+T) × P/101.325',
          '标准状态下 (0°C, 101.325kPa) 简化为：mg/m³ = ppm × M / 22.4',
        ],
      },
      {
        key: 'bsfc_be',
        label: '比排放 g/kWh',
        en: 'Brake Specific Emission',
        formula: 'BE = ṁ / P',
        desc: '比排放（Brake Specific Emission）是发动机每输出1千瓦时功所排放的污染物质量，单位g/kWh。这是发动机排放认证的标准度量方式。',
        vars: [
          { symbol: 'ṁ', name: '污染物质量流量', unit: 'g/h', default: 500, step: 10, min: 0, max: 50000 },
          { symbol: 'P', name: '发动机功率', unit: 'kW', default: 200, step: 10, min: 0, max: 2000 },
        ],
        compute: (v: number[]) => v[0] / v[1],
        example: [500, 200],
        resultUnit: 'g/kWh',
        derivation: [
          '比排放定义：单位功的污染物排放质量',
          '污染物总质量 = ∫ ṁ dt (g)',
          '发动机输出功 = ∫ P dt (kWh)',
          '比排放 = 污染物总质量 / 总功 = ṁ / P (假设稳态工况)',
          '对于瞬态循环，需要对整个循环积分：BE = ∫ṁ dt / ∫P dt',
        ],
      },
      {
        key: 'wet_dry',
        label: '湿干基修正',
        en: 'Wet-to-Dry Correction',
        formula: 'C_dry = C_wet × (1 + 1.88 × 0.05 × H/C)',
        desc: '将湿基测量浓度（含水蒸气）修正为干基浓度（扣除水蒸气）。排放法规中CO和NOx通常以干基报告，而HC以湿基报告。该修正基于燃料的氢碳比（H/C）计算水蒸气含量。',
        vars: [
          { symbol: 'C_wet', name: '湿基浓度', unit: 'ppm', default: 100, step: 1, min: 0, max: 10000 },
          { symbol: 'H/C', name: '氢碳原子比', unit: '-', default: 1.85, step: 0.01, min: 0.5, max: 4.0 },
        ],
        compute: (v: number[]) => v[0] * (1 + 1.88 * 0.05 * v[1]),
        example: [100, 1.85],
        resultUnit: 'ppm (dry)',
        derivation: [
          '燃烧反应示意：CH_x + (1+x/4)O₂ → CO₂ + (x/2)H₂O',
          '水蒸气摩尔分数 = (x/2) / (1 + x/4 + 3.76(1+x/4)) — 空气中N₂',
          '简化得 KW = 1 + 1.88 × 0.05 × H/C',
          '其中KW为干湿基修正因子，C_dry = C_wet × KW',
          '1.88来源于N₂/O₂体积比（3.76）和简化假设',
          '0.05为经验系数，适用于典型燃料组成',
        ],
      },
      {
        key: 'o2_ref',
        label: 'O₂基准修正',
        en: 'O₂ Reference Correction',
        formula: 'C_ref = C_meas × (21 - O₂_ref) / (21 - O₂_meas)',
        desc: '将实际测量浓度修正到参考O₂浓度下的值，以消除过量空气稀释的影响。不同法规对参考O₂浓度有不同规定：汽油机通常6%，柴油机13%，燃气轮机15%。',
        vars: [
          { symbol: 'C_meas', name: '实测浓度', unit: 'ppm', default: 100, step: 1, min: 0, max: 10000 },
          { symbol: 'O₂_ref', name: '参考O₂浓度', unit: '%', default: 6, step: 0.5, min: 0, max: 21 },
          { symbol: 'O₂_meas', name: '实测O₂浓度', unit: '%', default: 10, step: 0.1, min: 0, max: 21 },
        ],
        compute: (v: number[]) => v[0] * (21 - v[1]) / (21 - v[2]),
        example: [100, 6, 10],
        resultUnit: 'ppm (corrected)',
        derivation: [
          '稀释效应原理：不同过量空气系数下排气浓度被不同比例稀释',
          '假设总排气体积中N₂比例基本恒定',
          'O₂浓度反映了稀释程度，O₂越高表示稀释越大',
          '修正公式：C_ref × (21 - O₂_ref) = C_meas × (21 - O₂_meas)',
          '物理意义：将测量浓度校正到统一O₂基准下的当量浓度',
          '21%为空气中O₂体积分数',
        ],
      },
    ],
  },
  {
    name: '发动机性能',
    formulas: [
      {
        key: 'power_torque',
        label: '功率转矩 Power & Torque',
        en: 'Power and Torque Relationship',
        formula: 'P (kW) = T (Nm) × RPM / 9549',
        desc: '发动机功率与转矩和转速的关系公式。p是中国发动机性能标定的核心公式，用于在试验台架上进行功率修正和性能计算。',
        vars: [
          { symbol: 'T', name: '转矩', unit: 'Nm', default: 400, step: 10, min: 0, max: 5000 },
          { symbol: 'RPM', name: '发动机转速', unit: 'rpm', default: 2000, step: 100, min: 0, max: 10000 },
        ],
        compute: (v: number[]) => v[0] * v[1] / 9549,
        example: [400, 2000],
        resultUnit: 'kW',
        derivation: [
          '功率定义：单位时间内做功的多少',
          'P (W) = ω × T，其中ω为角速度(rad/s)，T为扭矩(Nm)',
          'ω = 2π × RPM / 60 (将rpm转换为rad/s)',
          'P (W) = 2π × RPM × T / 60',
          'P (kW) = 2π × RPM × T / 60000',
          '2π / 60000 ≈ 1/9549',
          '因此 P(kW) = T(Nm) × RPM / 9549',
        ],
      },
      {
        key: 'bmep',
        label: '平均有效压力 BMEP',
        en: 'Brake Mean Effective Pressure',
        formula: 'BMEP (bar) = 2π × T / (V_d × n_cyl)',
        desc: '平均有效压力表示发动机每工作循环单位排量所做的功，是衡量发动机设计水平和性能的关键指标。自然吸气汽油机约8-12bar，增压柴油机可达20-25bar。',
        vars: [
          { symbol: 'T', name: '转矩', unit: 'Nm', default: 400, step: 10, min: 0, max: 5000 },
          { symbol: 'V_d', name: '单缸排量', unit: 'L', default: 0.5, step: 0.1, min: 0.1, max: 5 },
          { symbol: 'n_cyl', name: '气缸数', unit: '-', default: 6, step: 1, min: 1, max: 16 },
        ],
        compute: (v: number[]) => 2 * Math.PI * v[0] / (v[1] * v[2]) / 100,
        example: [400, 0.5, 6],
        resultUnit: 'bar',
        derivation: [
          'BMEP定义：每循环单位排量所做的平均有效功',
          'W_cycle = 2π × T (四冲程发动机每两转做功一次)',
          '总排量 V_total = V_d × n_cyl',
          'BMEP = W_cycle / V_total = 2π × T / (V_d × n_cyl)',
          '1 bar = 10⁵ Pa = 10⁵ N/m² = 100 J/L',
          '因此 BMEP(bar) = [2π × T / (V_d × n_cyl)] / 100',
        ],
      },
      {
        key: 've',
        label: '容积效率 Volumetric Efficiency',
        en: 'Volumetric Efficiency',
        formula: 'VE = MAF / (MAP × V_d × RPM × M_air / (2 × R × T))',
        desc: '容积效率衡量发动机每循环实际进入气缸的空气质量与理论最大进气量的比值。自然吸气发动机VE通常在80-90%，增压发动机可通过100%。',
        vars: [
          { symbol: 'MAF', name: '空气质量流量', unit: 'g/s', default: 100, step: 1, min: 0, max: 500 },
          { symbol: 'MAP', name: '进气歧管压力', unit: 'kPa', default: 100, step: 1, min: 0, max: 500 },
          { symbol: 'V_d', name: '发动机总排量', unit: 'L', default: 3.0, step: 0.1, min: 0.5, max: 20 },
          { symbol: 'RPM', name: '发动机转速', unit: 'rpm', default: 2000, step: 100, min: 0, max: 10000 },
          { symbol: 'T', name: '进气温度', unit: 'K', default: 298, step: 1, min: 200, max: 500 },
        ],
        compute: (v: number[]) => {
          const M_air = 28.97 // g/mol
          const R = 8.314 // J/(mol·K)
          return v[0] / (v[1] * 1000 * v[2] * 0.001 * v[3] * M_air / (2 * R * v[4]))
        },
        example: [100, 100, 3.0, 2000, 298],
        resultUnit: '%',
        derivation: [
          '容积效率定义：实际进气质量 / 理论最大进气质量',
          '理论最大进气质量 = 气缸容积 × 进气密度 × (循环频率)',
          '进气密度 = P / (R_specific × T)，其中R_specific = R / M_air',
          '四冲程发动机每两转完成一个进气循环',
          '理论进气质量流量 = MAP × V_d × RPM × M_air / (2 × R × T)',
          'VE = MAF / 理论进气质量流量',
          '典型的VE范围：自然吸气80-95%，增压100-130%',
        ],
      },
    ],
  },
  {
    name: '化学计量',
    formulas: [
      {
        key: 'afr_stoich',
        label: '理论空燃比 Stoichiometric AFR',
        en: 'Stoichiometric Air-Fuel Ratio',
        formula: 'AFR_stoich = 34.56 × (C/3 + H - O/8)',
        desc: '燃料完全燃烧所需的化学计量空气-燃料质量比。汽油约14.7:1，柴油约14.5:1，乙醇约9:1。该公式基于燃料的元素组成计算所需氧气量。',
        vars: [
          { symbol: 'C', name: '碳质量分数', unit: 'kg/kg fuel', default: 0.87, step: 0.01, min: 0, max: 1 },
          { symbol: 'H', name: '氢质量分数', unit: 'kg/kg fuel', default: 0.13, step: 0.01, min: 0, max: 1 },
          { symbol: 'O', name: '氧质量分数', unit: 'kg/kg fuel', default: 0.0, step: 0.01, min: 0, max: 1 },
        ],
        compute: (v: number[]) => 34.56 * (v[0] / 3 + v[1] - v[2] / 8),
        example: [0.87, 0.13, 0.0],
        resultUnit: '-',
        derivation: [
          '完全燃烧：C→CO₂, H→H₂O',
          'C + O₂ → CO₂，每kg C需 32/12 = 2.667 kg O₂',
          '2H₂ + O₂ → 2H₂O，每kg H需 8 kg O₂',
          '燃料自身含氧可减少外部需氧量',
          '总需氧量 = 2.667C + 8H - O (kg O₂/kg fuel)',
          '空气中O₂质量分数为23.15%',
          'AFR_stoich = (2.667C + 8H - O) / 0.2315',
          '2.667/0.2315 ≈ 11.52, 8/0.2315 ≈ 34.56',
          '整理得 AFR_stoich = 34.56 × (C/3 + H - O/8)',
        ],
      },
      {
        key: 'hc_ratio',
        label: '氢碳比 H/C Ratio',
        en: 'Hydrogen-to-Carbon Ratio',
        formula: 'H/C = (m_H / 1.008) / (m_C / 12.011)',
        desc: '燃料中氢原子与碳原子的摩尔比。是影响排放特性和燃烧产物组成的重要参数。汽油H/C约1.7-1.9，柴油约1.8-2.0，甲烷为4.0。',
        vars: [
          { symbol: 'm_H', name: '氢质量分数', unit: 'kg/kg fuel', default: 0.13, step: 0.01, min: 0, max: 1 },
          { symbol: 'm_C', name: '碳质量分数', unit: 'kg/kg fuel', default: 0.87, step: 0.01, min: 0, max: 1 },
        ],
        compute: (v: number[]) => (v[0] / 1.008) / (v[1] / 12.011),
        example: [0.13, 0.87],
        resultUnit: '-',
        derivation: [
          'H/C摩尔比 = H原子摩尔数 / C原子摩尔数',
          'H摩尔数 = m_H / 1.008 (1.008为H原子量)',
          'C摩尔数 = m_C / 12.011 (12.011为C原子量)',
          'H/C = (m_H / 1.008) / (m_C / 12.011)',
          '典型值：汽油≈1.85，柴油≈1.95，天然气≈3.8-4.0',
        ],
      },
      {
        key: 'hvv',
        label: '燃料热值 Heating Value',
        en: 'Fuel Heating Value',
        formula: 'HHV = 33.8C + 144(H - O/8) + 9.42S',
        desc: '根据燃料元素组成计算的高位热值（MJ/kg），基于Dulong公式的简化版本。HHV包含水蒸气的汽化潜热，LHV = HHV - 2.444 × (9H/100)。',
        vars: [
          { symbol: 'C', name: '碳质量分数', unit: '%', default: 87, step: 0.1, min: 0, max: 100 },
          { symbol: 'H', name: '氢质量分数', unit: '%', default: 13, step: 0.1, min: 0, max: 100 },
          { symbol: 'O', name: '氧质量分数', unit: '%', default: 0, step: 0.1, min: 0, max: 100 },
          { symbol: 'S', name: '硫质量分数', unit: '%', default: 0, step: 0.01, min: 0, max: 5 },
        ],
        compute: (v: number[]) => 33.8 * v[0] / 100 + 144 * (v[1] / 100 - v[2] / 100 / 8) + 9.42 * v[3] / 100,
        example: [87, 13, 0, 0.005],
        resultUnit: 'MJ/kg',
        derivation: [
          'Dulong公式：基于元素分析估算热值的经验公式',
          'C→CO₂放热约33.8 MJ/kg C',
          'H₂→H₂O放热约144 MJ/kg H₂',
          'S→SO₂放热约9.42 MJ/kg S',
          '燃料中O可减少需氧量，等效减少H的贡献',
          'HHV = 33.8C + 144(H - O/8) + 9.42S',
          '注：公式中C、H、O、S为质量分数(%)',
          'LHV = HHV - 2.444 × (9H × 0.01) 扣除水蒸气汽化潜热',
        ],
      },
    ],
  },
  {
    name: '流体热力',
    formulas: [
      {
        key: 'ideal_gas',
        label: '理想气体状态方程 Ideal Gas Law',
        en: 'Ideal Gas Law',
        formula: 'PV = nRT',
        desc: '理想气体状态方程描述压力（P）、体积（V）、物质量（n）和温度（T）之间的关系。在排放测试中广泛用于排气流量计算、浓度换算和密度修正。',
        vars: [
          { symbol: 'P', name: '压力', unit: 'kPa', default: 101.325, step: 1, min: 0, max: 10000 },
          { symbol: 'V', name: '体积', unit: 'm³', default: 1, step: 0.1, min: 0, max: 1000 },
          { symbol: 'T', name: '温度', unit: 'K', default: 298.15, step: 1, min: 0, max: 2000 },
        ],
        compute: (v: number[]) => (v[0] * 1000) * v[1] / (8.314 * v[2]),
        example: [101.325, 1, 298.15],
        resultUnit: 'mol',
        derivation: [
          '理想气体状态方程：PV = nRT',
          'P为绝对压力(Pa)，V为体积(m³)，n为摩尔数(mol)，T为绝对温度(K)',
          'R为通用气体常数 = 8.314 J/(mol·K)',
          '可变形为 n = PV/RT — 计算给定条件下的气体摩尔数',
          '用于标准状态换算：标准状态(0°C, 101.325kPa)下1mol=22.414L',
          '实际使用需注意温度必须为开尔文：K = °C + 273.15',
        ],
      },
      {
        key: 'density_correct',
        label: '密度修正 Density Correction',
        en: 'Density Correction',
        formula: 'ρ = ρ₀ × P/P₀ × T₀/T',
        desc: '将参考状态的密度修正到实际温度和压力条件下的密度。在发动机进气密度修正和排放测量体积流量计算中广泛应用。',
        vars: [
          { symbol: 'ρ₀', name: '参考密度', unit: 'kg/m³', default: 1.293, step: 0.001, min: 0, max: 10 },
          { symbol: 'P', name: '实际压力', unit: 'kPa', default: 100, step: 1, min: 0, max: 500 },
          { symbol: 'T', name: '实际温度', unit: 'K', default: 298, step: 1, min: 200, max: 500 },
        ],
        compute: (v: number[]) => v[0] * v[1] / 101.325 * 273.15 / v[2],
        example: [1.293, 100, 298],
        resultUnit: 'kg/m³',
        derivation: [
          '基于理想气体状态方程：ρ = PM/(RT)',
          '参考状态：ρ₀ = P₀M/(RT₀)',
          '实际状态：ρ = PM/(RT)',
          '两式相除得 ρ/ρ₀ = (P/P₀) × (T₀/T)',
          '因此 ρ = ρ₀ × P/P₀ × T₀/T',
          '标准空气密度 ρ₀ = 1.293 kg/m³ (0°C, 101.325kPa)',
        ],
      },
      {
        key: 'reynolds',
        label: '雷诺数 Reynolds Number',
        en: 'Reynolds Number',
        formula: 'Re = ρvD/μ',
        desc: '雷诺数是流体力学中表征流体惯性力与粘性力之比的量纲一参数。用于判断流动状态（层流/湍流），在进气系统、排气系统、EGR管路等流体设计中至关重要。',
        vars: [
          { symbol: 'ρ', name: '流体密度', unit: 'kg/m³', default: 1.2, step: 0.01, min: 0.1, max: 1000 },
          { symbol: 'v', name: '流速', unit: 'm/s', default: 10, step: 1, min: 0, max: 200 },
          { symbol: 'D', name: '水力直径', unit: 'm', default: 0.05, step: 0.005, min: 0.001, max: 1 },
          { symbol: 'μ', name: '动力粘度', unit: 'Pa·s', default: 1.8e-5, step: 1e-6, min: 1e-6, max: 1 },
        ],
        compute: (v: number[]) => v[0] * v[1] * v[2] / v[3],
        example: [1.2, 10, 0.05, 1.8e-5],
        resultUnit: '-',
        derivation: [
          '雷诺数 = 惯性力 / 粘性力',
          '惯性力 ≈ ρv²L² (ρ密度, v速度, L特征长度)',
          '粘性力 ≈ μvL (μ动力粘度)',
          'Re = (ρv²L²) / (μvL) = ρvL/μ',
          '对于圆管流动，特征长度L取管径D',
          'Re < 2300 为层流，2300 < Re < 4000 为过渡流，Re > 4000 为湍流',
          '排气系统中Re通常＞10⁴，属于充分发展湍流',
        ],
      },
    ],
  },
]

/* ---- State ---- */
const activeFormula = ref<Formula | null>(null)
const showDerivation = ref(false)

const varValues = reactive<Record<string, number[]>>({})
const result = ref<number | null>(null)

// Initialize var values for all formulas
categories.forEach((cat) => {
  cat.formulas.forEach((f) => {
    varValues[f.key] = [...f.vars.map((v) => v.default)]
  })
})

/* ---- Methods ---- */
function computeResult() {
  if (!activeFormula.value) return
  const vals = varValues[activeFormula.value.key] ?? []
  const r = activeFormula.value.compute(vals)
  result.value = r
}

function fillExample() {
  if (!activeFormula.value) return
  varValues[activeFormula.value.key] = [...activeFormula.value.example]
  computeResult()
}

function resetVars() {
  if (!activeFormula.value) return
  varValues[activeFormula.value.key] = [...activeFormula.value.vars.map((v) => v.default)]
  result.value = null
}

function copyResult() {
  if (result.value === null || !activeFormula.value) return
  const text = `${activeFormula.value.label}: ${result.value.toFixed(4)} ${activeFormula.value.resultUnit}`
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('结果已复制 / Result copied')
  })
}

// Watch for formula changes — reset result
import { watch } from 'vue'
watch(activeFormula, () => {
  result.value = null
  showDerivation.value = false
})
</script>

<style scoped lang="scss">
$white: #f5f5f0;
$orange: #ff8800;
$black: #1a1a1a;

.formula-handbook {
  display: flex;
  min-height: calc(100vh - 60px);
  background: $white;
  color: $black;

  &__sidebar {
    width: 240px;
    flex-shrink: 0;
    background: darken($white, 3%);
    border-right: 1px solid darken($white, 10%);
    padding: 20px 0;
    overflow-y: auto;
  }

  &__sidebar-title {
    font-size: 18px;
    font-weight: 700;
    color: $orange;
    padding: 0 16px 16px;
    margin: 0;
    border-bottom: 1px solid darken($white, 10%);
  }

  &__category {
    padding: 12px 0;
  }

  &__category-name {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: lighten($black, 40%);
    padding: 0 16px;
    margin-bottom: 4px;
    letter-spacing: 1px;
  }

  &__formula-link {
    padding: 8px 16px 8px 24px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    border-left: 3px solid transparent;

    &:hover {
      background: rgba($orange, 0.06);
      color: $orange;
    }

    &--active {
      background: rgba($orange, 0.1);
      color: $orange;
      border-left-color: $orange;
      font-weight: 600;
    }
  }

  &__content {
    flex: 1;
    padding: 24px 32px;
    overflow-y: auto;
  }

  &__placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 400px;
  }

  &__card {
    background: #fff;
    border-radius: 12px;
    padding: 28px;
    border: 1px solid darken($white, 8%);
    max-width: 900px;
  }

  &__card-header {
    margin-bottom: 16px;
    h3 {
      font-size: 20px;
      margin: 0 0 4px;
      color: $black;
    }
  }

  &__card-en {
    font-size: 13px;
    color: lighten($black, 40%);
    font-style: italic;
  }

  &__formula-display {
    background: darken($white, 4%);
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid darken($white, 10%);

    code {
      font-size: 18px;
      font-family: 'Courier New', Courier, monospace;
      color: $black;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  &__desc {
    margin-bottom: 20px;
    p {
      font-size: 13px;
      line-height: 1.7;
      color: lighten($black, 20%);
      margin: 0;
    }
  }

  &__variables {
    margin-bottom: 20px;
    h4 {
      font-size: 14px;
      margin: 0 0 12px;
      color: $black;
      font-weight: 600;
    }
  }

  &__var-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid darken($white, 6%);

    &:last-child {
      border-bottom: none;
    }
  }

  &__var-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__var-symbol {
    font-weight: 700;
    font-family: 'Times New Roman', serif;
    font-size: 15px;
    min-width: 30px;
    color: $black;
  }

  &__var-name {
    font-size: 13px;
    color: lighten($black, 20%);
    min-width: 180px;
  }

  &__var-unit {
    font-size: 12px;
    color: lighten($black, 40%);
    font-style: italic;
  }

  &__var-input {
    :deep(.el-input-number) {
      width: 140px;
    }

    :deep(.el-input-number__increase),
    :deep(.el-input-number__decrease) {
      background: $white;
    }
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  &__result {
    background: rgba($orange, 0.06);
    border: 1px solid rgba($orange, 0.2);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  &__result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    color: $black;
  }

  &__result-value {
    font-size: 24px;
    font-weight: 700;
    color: $orange;
  }

  &__result-unit {
    font-size: 14px;
    font-weight: 400;
    color: lighten($black, 30%);
  }

  &__derivation-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: lighten($black, 30%);
    cursor: pointer;
    padding: 8px 0;
    transition: color 0.15s;

    &:hover {
      color: $orange;
    }
  }

  &__derivation {
    margin-top: 12px;
    border-top: 1px solid darken($white, 8%);
    padding-top: 12px;
  }

  &__derivation-step {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__derivation-num {
    width: 24px;
    height: 24px;
    background: $orange;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__derivation-text {
    font-size: 13px;
    line-height: 1.6;
    color: lighten($black, 20%);
    margin: 0;
  }
}
</style>
