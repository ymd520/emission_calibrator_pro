<template>
  <div class="rde-processor">
    <el-tabs type="border-card" class="rde-tabs">
      <!-- Tab 1: Trip Validation -->
      <el-tab-pane label="行程判定" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>行程判定 (Trip Validation) - RDE 合规性检查</span>
            </div>
          </template>
          <p>根据 EU 2016/427 (RDE 第1包) 和 EU 2016/646 (RDE 第2包) 法规，RDE 行程必须满足以下有效性条件才能用于排放评估。</p>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Edit /></el-icon>
                  <span>GPS 行程数据输入</span>
                </div>
              </template>
              <el-form :model="tripData" label-width="160px" label-position="left" size="small">
                <el-form-item label="总距离 (km)">
                  <el-input-number v-model="tripData.totalDistance" :min="0" :max="500" :step="0.1" :precision="1" />
                </el-form-item>
                <el-form-item label="持续时间 (min)">
                  <el-input-number v-model="tripData.duration" :min="0" :max="360" :step="1" />
                </el-form-item>
                <el-form-item label="累计海拔增益 (m)">
                  <el-input-number v-model="tripData.altitudeGain" :min="0" :max="5000" :step="10" />
                </el-form-item>
                <el-divider content-position="center">分段距离</el-divider>
                <el-form-item label="城市 (Urban) km">
                  <el-input-number v-model="tripData.urbanDist" :min="0" :max="200" :step="0.1" :precision="1" />
                </el-form-item>
                <el-form-item label="乡村 (Rural) km">
                  <el-input-number v-model="tripData.ruralDist" :min="0" :max="200" :step="0.1" :precision="1" />
                </el-form-item>
                <el-form-item label="高速 (Motorway) km">
                  <el-input-number v-model="tripData.motorwayDist" :min="0" :max="200" :step="0.1" :precision="1" />
                </el-form-item>
                <el-form-item label="环境温度 (°C)">
                  <el-input-number v-model="tripData.ambientTemp" :min="-30" :max="60" :step="1" />
                </el-form-item>
                <el-form-item label="海拔 (m)">
                  <el-input-number v-model="tripData.altitude" :min="-100" :max="3000" :step="10" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="validateTrip">执行行程判定</el-button>
                  <el-button @click="resetTripData">重置数据</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card shadow="never" class="result-card">
              <template #header>
                <div class="card-header">
                  <el-icon><List /></el-icon>
                  <span>有效性检查结果</span>
                </div>
              </template>
              <div v-if="tripValidationResults.length === 0" class="placeholder-text">
                请输入左侧数据并点击"执行行程判定"。
              </div>
              <div v-else>
                <el-tag
                  :type="tripOverallPass ? 'success' : 'danger'"
                  size="large"
                  class="overall-tag"
                >
                  {{ tripOverallPass ? '行程有效' : '行程无效' }}
                </el-tag>
                <el-table :data="tripValidationResults" stripe size="small" max-height="400">
                  <el-table-column prop="check" label="检查项" min-width="140" />
                  <el-table-column prop="requirement" label="要求" min-width="160" />
                  <el-table-column prop="actual" label="实际值" width="90" />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="row.pass ? 'success' : 'danger'" size="small">
                        {{ row.pass ? '通过' : '不通过' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 16px;">
          <el-col :span="12">
            <el-card shadow="never" class="ref-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Reading /></el-icon>
                  <span>RPA 与 v*a 第95百分位参考</span>
                </div>
              </template>
              <div class="formula-box">
                <p class="formula-title">RPA (Relative Positive Acceleration):</p>
                <p class="formula">RPA = (1 / d) * ∫₀ᵗ (v × a⁺) dt</p>
                <p class="formula-desc">其中 d = 总距离 (m), v = 车速 (m/s), a⁺ = 正加速度 (m/s²)</p>
                <p class="formula-desc">城市段要求: RPA ≥ 0.10 (车速 < 40 km/h 的占比 > 25% 时)</p>
              </div>
              <div class="formula-box">
                <p class="formula-title">v*a 第95百分位:</p>
                <p class="formula">v*a_[95] ≤ 10.0 m²/s³ (城市段)</p>
                <p class="formula-desc">v*a_[95] ≤ 13.5 m²/s³ (城市段, 使用扩展条件时)</p>
                <p class="formula-desc">v*a_[95] ≤ 15.0 m²/s³ (乡村段)</p>
                <p class="formula-desc">v*a_[95] ≤ 20.0 m²/s³ (高速段)</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card shadow="never" class="ref-card">
              <template #header>
                <div class="card-header">
                  <el-icon><ColdDrink /></el-icon>
                  <span>温度边界条件</span>
                </div>
              </template>
              <el-table :data="tempBoundaries" stripe size="small">
                <el-table-column prop="condition" label="条件" min-width="120" />
                <el-table-column prop="min" label="最低温度 (°C)" width="120" />
                <el-table-column prop="max" label="最高温度 (°C)" width="120" />
                <el-table-column prop="note" label="说明" min-width="160" />
              </el-table>
              <el-alert
                title="海拔修正: 海拔每升高1000m, 温度边界上移 6.5°C/km × (海拔偏差)"
                type="info"
                show-icon
                :closable="false"
                style="margin-top: 8px;"
              />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 2: Window Method -->
      <el-tab-pane label="窗口法" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>CO₂ 移动平均窗口 (MAW) 法</span>
            </div>
          </template>
          <p>MAW 方法基于 CO₂ 质量积分，将行程划分为连续的窗口，每个窗口对应参考 CO₂ 量（如 WLTC 循环 CO₂ 质量的一半）。对每个窗口计算城市、乡村和高速段的排放，最后进行加权计算。</p>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataBoard /></el-icon>
                  <span>窗口计算输入</span>
                </div>
              </template>
              <el-form :model="windowData" label-width="180px" label-position="left" size="small">
                <el-form-item label="参考 CO₂ 质量 (g)">
                  <el-input-number v-model="windowData.refCO2" :min="0" :max="10000" :step="10" />
                  <div class="form-help">WLTC 循环 CO₂ 总质量的一半</div>
                </el-form-item>
                <el-form-item label="CO₂ 质量流量数据">
                  <el-button size="small" @click="generateCO2Data">生成示例数据</el-button>
                </el-form-item>
                <el-form-item label="发动机功率 (kW)">
                  <el-input-number v-model="windowData.enginePower" :min="0" :max="500" :step="1" />
                </el-form-item>
                <el-form-item label="冷却液温度 (°C)">
                  <el-input-number v-model="windowData.coolantTemp" :min="-20" :max="120" :step="1" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="calcWindowMethod">执行窗口计算</el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <el-card shadow="never" class="ref-card" style="margin-top: 16px;">
              <template #header>
                <div class="card-header">
                  <el-icon><Reading /></el-icon>
                  <span>窗口有效性检查</span>
                </div>
              </template>
              <el-table :data="windowValidityChecks" stripe size="small">
                <el-table-column prop="check" label="检查项" min-width="140" />
                <el-table-column prop="criteria" label="标准" min-width="200" />
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card shadow="never" class="result-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>分段排放结果</span>
                </div>
              </template>
              <div v-if="windowResults.length === 0" class="placeholder-text">
                请输入数据并点击"执行窗口计算"。
              </div>
              <div v-else>
                <el-table :data="windowResults" stripe size="small">
                  <el-table-column prop="phase" label="分段" width="80" />
                  <el-table-column prop="co2" label="CO₂ (g/km)" width="110" />
                  <el-table-column prop="nox" label="NOx (mg/km)" width="110" />
                  <el-table-column prop="pn" label="PN (#/km)" width="110" />
                  <el-table-column prop="valid" label="窗口有效" width="90">
                    <template #default="{ row }">
                      <el-icon v-if="row.valid" color="#67c23a"><Check /></el-icon>
                      <el-icon v-else color="#f56c6c"><Close /></el-icon>
                    </template>
                  </el-table-column>
                </el-table>

                <el-divider content-position="center">加权最终结果</el-divider>
                <div class="weighted-result">
                  <div class="weighted-item">
                    <span class="weighted-label">M_weighted (CO₂):</span>
                    <span class="weighted-value">{{ weightedCO2.toFixed(1) }} g/km</span>
                  </div>
                  <div class="weighted-item">
                    <span class="weighted-label">M_weighted (NOx):</span>
                    <span class="weighted-value">{{ weightedNOx.toFixed(1) }} mg/km</span>
                  </div>
                  <div class="weighted-item">
                    <span class="weighted-label">M_weighted (PN):</span>
                    <span class="weighted-value">{{ weightedPN.toFixed(1) }} #/km</span>
                  </div>
                </div>
                <div class="formula-box" style="margin-top: 12px;">
                  <p class="formula-title">加权公式:</p>
                  <p class="formula">M_weighted = M_UR × 0.34 + M_RW × 0.33 + M_MOT × 0.33</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 3: Conformity Factor -->
      <el-tab-pane label="符合性因子" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>符合性因子 (Conformity Factor, CF)</span>
            </div>
          </template>
          <p>符合性因子是实际排放测量值与法规限值的比值，用于评估车辆在实际道路行驶中的排放合规性。</p>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Edit /></el-icon>
                  <span>CF 计算</span>
                </div>
              </template>
              <el-form :model="cfData" label-width="140px" label-position="left" size="small">
                <el-form-item label="测量排放值">
                  <el-input-number v-model="cfData.measured" :min="0" :max="5000" :step="1" :precision="1" />
                </el-form-item>
                <el-form-item label="法规限值">
                  <el-input-number v-model="cfData.limit" :min="0" :max="5000" :step="1" :precision="1" />
                </el-form-item>
                <el-form-item label="污染物类型">
                  <el-select v-model="cfData.pollutant" style="width: 100%;">
                    <el-option label="NOx (mg/km)" value="NOx" />
                    <el-option label="PN (#/km)" value="PN" />
                    <el-option label="CO (mg/km)" value="CO" />
                    <el-option label="HC (mg/km)" value="HC" />
                    <el-option label="PM (mg/km)" value="PM" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="calcCF">计算 CF</el-button>
                </el-form-item>
              </el-form>

              <div v-if="cfResult !== null" class="cf-result-box">
                <el-divider content-position="center">计算结果</el-divider>
                <div class="cf-value-display">
                  <span class="cf-label">CF = </span>
                  <span class="cf-value" :class="{ 'cf-pass': cfResult <= 1, 'cf-fail': cfResult > 1 }">
                    {{ cfResult.toFixed(3) }}
                  </span>
                </div>
                <el-tag :type="cfResult <= 1 ? 'success' : 'danger'" size="large" style="margin-top: 8px;">
                  {{ cfResult <= 1 ? 'CF ≤ 1: 合格 (Pass)' : `CF > 1: 不合格 (Fail) - 超出 ${((cfResult - 1) * 100).toFixed(1)}%` }}
                </el-tag>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="never" class="ref-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Reading /></el-icon>
                  <span>NTE (Not-to-Exceed) 区域</span>
                </div>
              </template>
              <p>NTE 区域是在发动机运行工况图中定义的一个区域，在该区域内排放不得超过规定限值乘以 NTE 系数。</p>
              <el-table :data="nteData" stripe size="small" style="margin-top: 8px;">
                <el-table-column prop="zone" label="NTE 区域" width="90" />
                <el-table-column prop="condition" label="条件" min-width="200" />
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="never" class="ref-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Reading /></el-icon>
                  <span>Euro 6d RDE CF 参考值 (PEMS)</span>
                </div>
              </template>
              <el-table :data="euro6dCFTable" stripe size="small">
                <el-table-column prop="pollutant" label="污染物" width="80" />
                <el-table-column prop="cfValue" label="CF 限值" width="80" />
                <el-table-column prop="margin" label="margin" width="80" />
                <el-table-column prop="note" label="说明" min-width="140" />
              </el-table>
              <el-alert
                title="CF 值解读: CF ≤ 1 = 合格; CF > 1 + margin = 不合格; 1 < CF ≤ 1+margin = 需进一步评估"
                type="warning"
                show-icon
                :closable="false"
                style="margin-top: 8px; font-size: 12px;"
              />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 4: PEMS Data Processing -->
      <el-tab-pane label="PEMS 数据处理" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>PEMS (Portable Emissions Measurement System) 数据处理流程</span>
            </div>
          </template>
          <p>PEMS 数据后处理包括时间对齐、背景浓度修正和漂移修正等步骤，确保测量数据的准确性和可靠性。</p>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Timer /></el-icon>
                  <span>时间对齐</span>
                </div>
              </template>
              <p class="section-desc">GPS、气体分析仪和 OBD 数据的时间同步。</p>
              <div class="concept-box">
                <p class="concept-title">对齐方法:</p>
                <ul>
                  <li>互相关分析: 以 CO₂ 信号为基准，对齐气体分析仪与 OBD 数据</li>
                  <li>GPS 时间戳: 使用 UTC 时间作为统一参考</li>
                  <li>典型延迟: 分析仪约 2-5s, OBD 约 0.1s</li>
                </ul>
              </div>
              <el-form :model="timeAlignData" label-width="120px" label-position="left" size="small" style="margin-top: 8px;">
                <el-form-item label="分析仪延迟 (s)">
                  <el-input-number v-model="timeAlignData.analyzerDelay" :min="0" :max="30" :step="0.5" :precision="1" />
                </el-form-item>
                <el-form-item label="OBD 延迟 (s)">
                  <el-input-number v-model="timeAlignData.obdDelay" :min="0" :max="10" :step="0.1" :precision="1" />
                </el-form-item>
                <el-form-item label="参考信号">
                  <el-select v-model="timeAlignData.refSignal" style="width: 100%;">
                    <el-option label="CO₂" value="CO2" />
                    <el-option label="车速" value="Speed" />
                    <el-option label="发动机转速" value="RPM" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="applyTimeAlign">应用时间对齐</el-button>
                </el-form-item>
              </el-form>
              <el-tag v-if="timeAlignApplied" type="success" style="margin-top: 4px;">时间对齐已应用</el-tag>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><WindPower /></el-icon>
                  <span>背景浓度修正</span>
                </div>
              </template>
              <p class="section-desc">扣除环境空气中的污染物背景浓度。</p>
              <div class="concept-box">
                <p class="concept-title">修正方法:</p>
                <p>C_corrected(t) = C_measured(t) - C_background</p>
                <p>背景浓度在行程开始前测量（环境空气采样）</p>
              </div>
              <el-form :model="bgCorrectionData" label-width="110px" label-position="left" size="small" style="margin-top: 8px;">
                <el-form-item label="背景 CO₂ (ppm)">
                  <el-input-number v-model="bgCorrectionData.bgCO2" :min="350" :max="500" :step="1" />
                </el-form-item>
                <el-form-item label="背景 NOx (ppb)">
                  <el-input-number v-model="bgCorrectionData.bgNOx" :min="0" :max="200" :step="1" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="applyBG">应用背景修正</el-button>
                </el-form-item>
              </el-form>
              <el-tag v-if="bgApplied" type="success" style="margin-top: 4px;">背景修正已应用</el-tag>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataLine /></el-icon>
                  <span>漂移修正</span>
                </div>
              </template>
              <p class="section-desc">线性漂移修正, 基于测试前后的零点和量程检查。</p>
              <div class="concept-box">
                <p class="concept-title">线性漂移修正:</p>
                <p>C_drift_corrected = C_measured × (1 - (D / 100) × (t / T))</p>
                <p>其中 D = 漂移百分比, t = 当前时间, T = 总测试时间</p>
              </div>
              <el-form :model="driftData" label-width="110px" label-position="left" size="small" style="margin-top: 8px;">
                <el-form-item label="前零点 (ppm)">
                  <el-input-number v-model="driftData.preZero" :min="0" :max="10" :step="0.1" :precision="1" />
                </el-form-item>
                <el-form-item label="后零点 (ppm)">
                  <el-input-number v-model="driftData.postZero" :min="0" :max="10" :step="0.1" :precision="1" />
                </el-form-item>
                <el-form-item label="前量程 (ppm)">
                  <el-input-number v-model="driftData.preSpan" :min="0" :max="5000" :step="1" />
                </el-form-item>
                <el-form-item label="后量程 (ppm)">
                  <el-input-number v-model="driftData.postSpan" :min="0" :max="5000" :step="1" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="applyDrift">应用漂移修正</el-button>
                </el-form-item>
              </el-form>
              <div v-if="driftApplied" style="margin-top: 4px;">
                <el-tag type="success">漂移修正已应用</el-tag>
                <div class="drift-result">
                  <p>零点漂移: {{ driftZeroPercent.toFixed(2) }}%</p>
                  <p>量程漂移: {{ driftSpanPercent.toFixed(2) }}%</p>
                  <p :class="driftZeroPercent < 2 ? 'text-success' : 'text-danger'">
                    零点漂移 {{ driftZeroPercent < 2 ? '合格 (< 2%)' : '不合格 (≥ 2%)' }}
                  </p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  InfoFilled, Edit, List, Reading, ColdDrink, DataBoard, DataAnalysis,
  Timer, WindPower, DataLine, Check, Close
} from '@element-plus/icons-vue'

// ============ Trip Validation ============
const tripData = reactive({
  totalDistance: 92.4,
  duration: 108,
  altitudeGain: 680,
  urbanDist: 34.2,
  ruralDist: 32.1,
  motorwayDist: 26.1,
  ambientTemp: 12,
  altitude: 150
})

const tripValidationResults = ref([])
const tripOverallPass = ref(false)

const tempBoundaries = [
  { condition: '正常条件', min: -7, max: 35, note: '标准RDE温度范围' },
  { condition: '扩展条件 (低温)', min: -10, max: -7, note: '需标记为扩展' },
  { condition: '扩展条件 (高温)', min: 35, max: 38, note: '需标记为扩展' },
  { condition: '高海拔扩展', min: -10, max: 38, note: '海拔 > 1000m 时适用' }
]

const windowValidityChecks = [
  { check: '窗口CO₂质量', criteria: '达到参考CO₂质量的50% ± 10%' },
  { check: '窗口持续时间', criteria: '连续时间窗口, 无数据缺失 > 1s' },
  { check: '城市段比例', criteria: '城市段数据占比 29-44%' },
  { check: '正常温度窗口', criteria: '冷却液温度首次 > 70°C 后的窗口' },
  { check: '窗口数量', criteria: '每个分段至少3个有效窗口' }
]

const nteData = [
  { zone: 'NTE #1', condition: '发动机转速 > 额定转速的 30%' },
  { zone: 'NTE #2', condition: '功率 > 额定功率的 30%' },
  { zone: 'NTE #3', condition: '排气温度 > 250°C (DPF 主动再生时)' }
]

const euro6dCFTable = [
  { pollutant: 'NOx', cfValue: '1.43', margin: '0.43', note: 'PEMS 测量, 含 margin' },
  { pollutant: 'PN', cfValue: '1.63', margin: '0.63', note: 'PEMS 测量, 含 margin' },
  { pollutant: 'CO', cfValue: '1.50', margin: '0.50', note: 'PEMS 测量, 含 margin' },
  { pollutant: 'HC (THC)', cfValue: '1.50', margin: '0.50', note: 'PEMS 测量, 含 margin' },
  { pollutant: 'NOx+HC', cfValue: '1.50', margin: '0.50', note: '组合限值, 汽油机' }
]

function validateTrip() {
  const r = []
  const d = tripData
  const urbanRatio = d.totalDistance > 0 ? (d.urbanDist / d.totalDistance) * 100 : 0
  const motorwayRatio = d.totalDistance > 0 ? (d.motorwayDist / d.totalDistance) * 100 : 0
  const altPer100km = d.totalDistance > 0 ? (d.altitudeGain / d.totalDistance) * 100 : 0

  r.push({
    check: '总距离 ≥ 48 km',
    requirement: '≥ 48 km',
    actual: `${d.totalDistance.toFixed(1)} km`,
    pass: d.totalDistance >= 48
  })
  r.push({
    check: '持续时间 ≥ 90 min',
    requirement: '≥ 90 min',
    actual: `${d.duration} min`,
    pass: d.duration >= 90
  })
  r.push({
    check: '城市段距离 ≥ 16 km',
    requirement: '≥ 16 km',
    actual: `${d.urbanDist.toFixed(1)} km`,
    pass: d.urbanDist >= 16
  })
  r.push({
    check: '城市段比例 29%-44%',
    requirement: '29% ~ 44%',
    actual: `${urbanRatio.toFixed(1)}%`,
    pass: urbanRatio >= 29 && urbanRatio <= 44
  })
  r.push({
    check: '高速段比例 < 33%',
    requirement: '< 33%',
    actual: `${motorwayRatio.toFixed(1)}%`,
    pass: motorwayRatio < 33
  })
  r.push({
    check: '海拔增益 < 1200m/100km',
    requirement: '< 1200 m/100km',
    actual: `${altPer100km.toFixed(1)} m/100km`,
    pass: altPer100km < 1200
  })
  r.push({
    check: '温度在正常范围 (-7°C ~ 35°C)',
    requirement: '-7 ~ 35 °C',
    actual: `${d.ambientTemp} °C`,
    pass: d.ambientTemp >= -7 && d.ambientTemp <= 35
  })

  tripValidationResults.value = r
  tripOverallPass.value = r.every(item => item.pass)
}

function resetTripData() {
  tripData.totalDistance = 0
  tripData.duration = 0
  tripData.altitudeGain = 0
  tripData.urbanDist = 0
  tripData.ruralDist = 0
  tripData.motorwayDist = 0
  tripData.ambientTemp = 25
  tripData.altitude = 0
  tripValidationResults.value = []
  tripOverallPass.value = false
}

// ============ Window Method ============
const windowData = reactive({
  refCO2: 1000,
  enginePower: 120,
  coolantTemp: 85
})

const windowResults = ref([])
const weightedCO2 = ref(0)
const weightedNOx = ref(0)
const weightedPN = ref(0)

function generateCO2Data() {
  windowData.refCO2 = 950
}

function calcWindowMethod() {
  const ur = { phase: 'UR (城市)', co2: 145.2, nox: 38.5, pn: 4.2e11, valid: true }
  const rw = { phase: 'RW (乡村)', co2: 128.7, nox: 22.1, pn: 2.8e11, valid: true }
  const mot = { phase: 'MOT (高速)', co2: 162.3, nox: 18.9, pn: 1.6e11, valid: false }

  windowResults.value = [ur, rw, mot]

  weightedCO2.value = ur.co2 * 0.34 + rw.co2 * 0.33 + mot.co2 * 0.33
  weightedNOx.value = ur.nox * 0.34 + rw.nox * 0.33 + mot.nox * 0.33
  weightedPN.value = ur.pn * 0.34 + rw.pn * 0.33 + mot.pn * 0.33
}

// ============ Conformity Factor ============
const cfData = reactive({
  measured: 62.0,
  limit: 60.0,
  pollutant: 'NOx'
})

const cfResult = ref(null)

function calcCF() {
  if (cfData.limit > 0) {
    cfResult.value = cfData.measured / cfData.limit
  }
}

// ============ PEMS Data Processing ============
const timeAlignData = reactive({
  analyzerDelay: 3.5,
  obdDelay: 0.2,
  refSignal: 'CO2'
})
const timeAlignApplied = ref(false)

const bgCorrectionData = reactive({
  bgCO2: 415,
  bgNOx: 25
})
const bgApplied = ref(false)

const driftData = reactive({
  preZero: 0.5,
  postZero: 1.2,
  preSpan: 1500,
  postSpan: 1485
})
const driftApplied = ref(false)
const driftZeroPercent = ref(0)
const driftSpanPercent = ref(0)

function applyTimeAlign() {
  timeAlignApplied.value = true
}

function applyBG() {
  bgApplied.value = true
}

function applyDrift() {
  const spanRef = driftData.preSpan
  driftZeroPercent.value = Math.abs(driftData.postZero - driftData.preZero) / (driftData.preSpan || 1) * 100
  driftSpanPercent.value = Math.abs(driftData.postSpan - driftData.preSpan) / (driftData.preSpan || 1) * 100
  driftApplied.value = true
}
</script>

<style scoped>
.rde-processor {
  height: 100%;
  background: #1a1f2e;
  color: #c8d0e0;
  padding: 16px;
  overflow-y: auto;
}

.rde-tabs {
  background: transparent;
  border: none;
}

:deep(.el-tabs__header) {
  background: #1e2536;
  border-bottom: 1px solid #2c3450;
  margin: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  background: #2c3450;
}

:deep(.el-tabs__item) {
  color: #8892b0;
  font-weight: 500;
  letter-spacing: 0.5px;
}

:deep(.el-tabs__item.is-active) {
  color: #ff6b35;
}

:deep(.el-tabs__active-bar) {
  background: #ff6b35;
}

:deep(.el-card) {
  background: #1e2536;
  border: 1px solid #2c3450;
  color: #c8d0e0;
  border-radius: 6px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #2c3450;
  padding: 10px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #e6e9f0;
  font-size: 14px;
}

.info-card {
  margin-bottom: 16px;
}

.info-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #8892b0;
}

.data-card, .result-card, .ref-card {
  height: 100%;
}

:deep(.el-form-item__label) {
  color: #a8b2d1;
  font-size: 12px;
}

:deep(.el-input-number) {
  width: 140px;
}

:deep(.el-input__wrapper) {
  background: #141824;
  border: 1px solid #2c3450;
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: #c8d0e0;
}

:deep(.el-table) {
  background: transparent;
  color: #c8d0e0;
}

:deep(.el-table th.el-table__cell) {
  background: #141824;
  color: #8892b0;
  border-bottom: 1px solid #2c3450;
  font-weight: 500;
  font-size: 12px;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #1a1f2e;
  font-size: 12px;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #1c2335;
}

:deep(.el-table__body tr:hover > td) {
  background: #232b44 !important;
}

:deep(.el-divider__text) {
  background: #1e2536;
  color: #8892b0;
  font-size: 12px;
}

:deep(.el-divider--horizontal) {
  border-top: 1px solid #2c3450;
}

.placeholder-text {
  color: #566185;
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}

.overall-tag {
  margin-bottom: 12px;
  font-size: 14px;
}

.formula-box {
  background: #141824;
  border: 1px solid #2c3450;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.formula-title {
  color: #e6e9f0;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
}

.formula {
  color: #ff6b35;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 4px 0;
}

.formula-desc {
  color: #8892b0;
  font-size: 12px;
  line-height: 1.5;
}

.form-help {
  color: #566185;
  font-size: 11px;
  margin-top: 2px;
}

.weighted-result {
  padding: 8px 0;
}

.weighted-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid #2c3450;
}

.weighted-label {
  color: #8892b0;
  font-size: 13px;
}

.weighted-value {
  color: #ff6b35;
  font-weight: 600;
  font-size: 14px;
}

.cf-result-box {
  margin-top: 12px;
}

.cf-value-display {
  text-align: center;
  padding: 12px 0;
}

.cf-label {
  font-size: 16px;
  color: #8892b0;
}

.cf-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.cf-pass {
  color: #67c23a;
}

.cf-fail {
  color: #f56c6c;
}

.section-desc {
  color: #8892b0;
  font-size: 12px;
  margin-bottom: 8px;
}

.concept-box {
  background: #141824;
  border: 1px solid #2c3450;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
}

.concept-title {
  color: #e6e9f0;
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
}

.concept-box ul {
  margin: 4px 0;
  padding-left: 16px;
  color: #8892b0;
  font-size: 12px;
  line-height: 1.6;
}

.concept-box p {
  color: #8892b0;
  font-size: 12px;
  line-height: 1.5;
  margin: 2px 0;
}

.drift-result {
  background: #141824;
  border: 1px solid #2c3450;
  border-radius: 4px;
  padding: 8px;
  margin-top: 6px;
}

.drift-result p {
  margin: 2px 0;
  font-size: 12px;
  color: #8892b0;
}

.text-success {
  color: #67c23a !important;
}

.text-danger {
  color: #f56c6c !important;
}

:deep(.el-button--primary) {
  background: #ff6b35;
  border-color: #ff6b35;
}

:deep(.el-button--primary:hover) {
  background: #e85a26;
  border-color: #e85a26;
}

:deep(.el-tag--success) {
  background: rgba(103, 194, 58, 0.15);
  border-color: rgba(103, 194, 58, 0.3);
  color: #67c23a;
}

:deep(.el-tag--danger) {
  background: rgba(245, 108, 108, 0.15);
  border-color: rgba(245, 108, 108, 0.3);
  color: #f56c6c;
}

:deep(.el-tag--warning) {
  background: rgba(230, 162, 60, 0.15);
  border-color: rgba(230, 162, 60, 0.3);
  color: #e6a23c;
}

:deep(.el-select .el-input__wrapper) {
  background: #141824;
}
</style>
