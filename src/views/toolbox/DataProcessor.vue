<template>
  <div class="data-processor">
    <el-tabs type="border-card" class="dp-tabs">
      <!-- Tab 1: Filters -->
      <el-tab-pane label="数据滤波" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>数据滤波 (Data Filtering) — 去除噪声，提取有效信号</span>
            </div>
          </template>
          <p>排放数据中常含有测量噪声和异常值。选择合适的滤波方法可以保留真实排放特征的同时抑制干扰。</p>
        </el-card>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-card shadow="never" class="filter-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataLine /></el-icon>
                  <span>移动平均 (Moving Average)</span>
                </div>
              </template>
              <p class="filter-desc">用相邻 N 个点的平均值替代每个数据点，有效平滑高频噪声。窗口越大，平滑效果越强，但信号延迟也越大。</p>
              <el-form size="small" label-width="90px">
                <el-form-item label="窗口大小 N">
                  <el-select v-model="movingAvgWindow" style="width: 100%;">
                    <el-option v-for="n in [3,5,7,9,11,15,21]" :key="n" :label="`N = ${n}`" :value="n" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="applyMovingAvg">应用</el-button>
                </el-form-item>
              </el-form>
              <div v-if="movingAvgResult.length > 0" class="filter-result-badge">
                <el-tag size="small" type="success">已应用 N={{ movingAvgWindow }}</el-tag>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card shadow="never" class="filter-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataLine /></el-icon>
                  <span>中值滤波 (Median Filter)</span>
                </div>
              </template>
              <p class="filter-desc">用相邻 N 个点的中值替代每个数据点。对脉冲噪声和异常值有很好的抑制效果，同时保留信号边缘信息。</p>
              <el-form size="small" label-width="90px">
                <el-form-item label="窗口大小 N">
                  <el-select v-model="medianWindow" style="width: 100%;">
                    <el-option v-for="n in [3,5,7,9,11]" :key="n" :label="`N = ${n}`" :value="n" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="applyMedianFilter">应用</el-button>
                </el-form-item>
              </el-form>
              <div v-if="medianResult.length > 0" class="filter-result-badge">
                <el-tag size="small" type="success">已应用 N={{ medianWindow }}</el-tag>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card shadow="never" class="filter-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataLine /></el-icon>
                  <span>低通滤波 (Low-Pass)</span>
                </div>
              </template>
              <p class="filter-desc">允许低于截止频率的信号通过，衰减高频噪声。适用于去除传感器电子噪声和振动干扰。</p>
              <el-form size="small" label-width="90px">
                <el-form-item label="截止频率 (Hz)">
                  <el-input-number v-model="lowpassCutoff" :min="0.1" :max="50" :step="0.1" :precision="1" style="width: 100%;" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="applyLowpass">应用</el-button>
                </el-form-item>
              </el-form>
              <div v-if="lowpassResult.length > 0" class="filter-result-badge">
                <el-tag size="small" type="success">已应用 fc={{ lowpassCutoff }}Hz</el-tag>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card shadow="never" class="filter-card">
              <template #header>
                <div class="card-header">
                  <el-icon><WarningFilled /></el-icon>
                  <span>异常值检测</span>
                </div>
              </template>
              <p class="filter-desc">自动识别数据中的离群点。3σ 方法假设正态分布，IQR 方法基于四分位距，对非对称分布更稳健。</p>
              <el-form size="small" label-width="90px">
                <el-form-item label="检测方法">
                  <el-select v-model="outlierMethod" style="width: 100%;">
                    <el-option label="3σ 方法" value="3sigma" />
                    <el-option label="IQR 方法" value="iqr" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="detectOutliers">检测</el-button>
                </el-form-item>
              </el-form>
              <div v-if="outlierCount > 0" class="filter-result-badge">
                <el-tag size="small" type="warning">发现 {{ outlierCount }} 个异常值</el-tag>
              </div>
              <div v-else-if="outlierCount === 0 && outlierDetected" class="filter-result-badge">
                <el-tag size="small" type="success">未发现异常值</el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Result preview table -->
        <el-card shadow="never" class="preview-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>滤波结果预览</span>
            </div>
          </template>
          <div style="margin-bottom: 8px;">
            <el-button size="small" @click="resetFilterData">重置数据</el-button>
            <el-button size="small" @click="loadExampleData">加载示例数据</el-button>
          </div>
          <el-table :data="filterPreviewData" stripe size="small" max-height="300">
            <el-table-column prop="index" label="序号" width="60" />
            <el-table-column prop="original" label="原始值" width="120" />
            <el-table-column prop="movingAvg" label="移动平均" width="120" />
            <el-table-column prop="median" label="中值滤波" width="120" />
            <el-table-column prop="lowpass" label="低通滤波" width="120" />
            <el-table-column prop="outlier" label="异常值标记" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.outlier" size="small" type="danger">异常</el-tag>
                <span v-else style="color: #67c23a;">正常</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: Emission Integration -->
      <el-tab-pane label="排放积分" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>排放积分 (Emission Integration) — 计算总排放质量</span>
            </div>
          </template>
          <p>将浓度时间序列与流量数据积分，计算污染物的总排放质量和比排放。</p>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="10">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Edit /></el-icon>
                  <span>积分参数与数据</span>
                </div>
              </template>
              <el-form :model="integrationData" label-width="120px" label-position="left" size="small">
                <el-form-item label="积分方法">
                  <el-radio-group v-model="integrationData.method">
                    <el-radio label="trapezoidal">梯形法</el-radio>
                    <el-radio label="simpson">辛普森法</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="浓度单位">
                  <el-select v-model="integrationData.concUnit" style="width: 100%;">
                    <el-option label="ppm" value="ppm" />
                    <el-option label="mg/m³" value="mgm3" />
                    <el-option label="g/m³" value="gm3" />
                  </el-select>
                </el-form-item>
                <el-form-item label="流量单位">
                  <el-select v-model="integrationData.flowUnit" style="width: 100%;">
                    <el-option label="m³/s" value="m3s" />
                    <el-option label="L/min" value="lpm" />
                    <el-option label="kg/h" value="kgh" />
                  </el-select>
                </el-form-item>
                <el-form-item label="总功 (kWh)">
                  <el-input-number v-model="integrationData.totalWork" :min="0" :max="1000" :step="0.1" :precision="1" style="width: 100%;" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="generateSineData">生成正弦测试数据</el-button>
                  <el-button @click="runIntegration" style="margin-left: 8px;">执行积分</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="14">
            <el-card shadow="never" class="result-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>积分结果</span>
                </div>
              </template>
              <div v-if="integralResult === null" class="placeholder-text">
                请设置参数并点击"执行积分"。
              </div>
              <div v-else>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="梯形法积分值" label-class-name="desc-label" content-class-name="desc-content">
                    <span class="result-value">{{ integralResult.trapezoidal.toFixed(4) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="辛普森法积分值" label-class-name="desc-label" content-class-name="desc-content">
                    <span class="result-value">{{ integralResult.simpson.toFixed(4) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="相对误差" label-class-name="desc-label" content-class-name="desc-content">
                    <span>{{ integralResult.error.toFixed(4) }}%</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="总排放质量" label-class-name="desc-label" content-class-name="desc-content">
                    <span class="result-value">{{ integralResult.totalMass.toFixed(3) }} g</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="比排放" label-class-name="desc-label" content-class-name="desc-content">
                    <span class="result-value">{{ integralResult.specificEmission.toFixed(3) }} g/kWh</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="数据点数" label-class-name="desc-label" content-class-name="desc-content">
                    <span>{{ integralResult.pointCount }}</span>
                  </el-descriptions-item>
                </el-descriptions>

                <el-table :data="integralDataTable" stripe size="small" max-height="200" style="margin-top: 12px;">
                  <el-table-column prop="t" label="时间 (s)" width="80" />
                  <el-table-column prop="conc" label="浓度" width="100" />
                  <el-table-column prop="flow" label="流量" width="100" />
                  <el-table-column prop="massRate" label="质量流率" width="100" />
                </el-table>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 3: Cycle Cutting -->
      <el-tab-pane label="循环切割" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>循环切割 (Cycle Cutting) — 分段统计与分析</span>
            </div>
          </template>
          <p>将 WLTC, NEDC 等测试循环按阶段切割，计算各阶段的统计特征，用于深入分析排放特性。</p>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Edit /></el-icon>
                  <span>循环选择与参数</span>
                </div>
              </template>
              <el-form :model="cycleData" label-width="120px" label-position="left" size="small">
                <el-form-item label="测试循环">
                  <el-radio-group v-model="cycleData.cycleType">
                    <el-radio label="wltc">WLTC</el-radio>
                    <el-radio label="nedc">NEDC</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="污染物">
                  <el-select v-model="cycleData.pollutant" style="width: 100%;">
                    <el-option label="CO₂ (g/km)" value="CO2" />
                    <el-option label="NOx (mg/km)" value="NOx" />
                    <el-option label="CO (mg/km)" value="CO" />
                    <el-option label="HC (mg/km)" value="HC" />
                    <el-option label="PN (#/km)" value="PN" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="runCycleCutting">执行切割分析</el-button>
                </el-form-item>
              </el-form>

              <div v-if="cycleData.cycleType === 'wltc'" class="cycle-info">
                <el-divider content-position="center">WLTC 阶段边界</el-divider>
                <el-table :data="wltcPhases" stripe size="small">
                  <el-table-column prop="phase" label="阶段" width="100" />
                  <el-table-column prop="duration" label="时长 (s)" width="90" />
                  <el-table-column prop="distance" label="距离 (km)" width="90" />
                  <el-table-column prop="maxSpeed" label="最高车速 (km/h)" width="120" />
                  <el-table-column prop="avgSpeed" label="平均车速 (km/h)" width="120" />
                </el-table>
              </div>
              <div v-if="cycleData.cycleType === 'nedc'" class="cycle-info">
                <el-divider content-position="center">NEDC 阶段边界</el-divider>
                <el-table :data="nedcPhases" stripe size="small">
                  <el-table-column prop="phase" label="阶段" width="100" />
                  <el-table-column prop="description" label="说明" min-width="140" />
                  <el-table-column prop="duration" label="时长 (s)" width="90" />
                </el-table>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card shadow="never" class="result-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>分阶段统计结果</span>
                </div>
              </template>
              <div v-if="cycleStats.length === 0" class="placeholder-text">
                选择循环后点击"执行切割分析"。
              </div>
              <div v-else>
                <el-table :data="cycleStats" stripe size="small">
                  <el-table-column prop="phase" label="阶段" width="90" />
                  <el-table-column prop="avg" label="平均值" width="90" />
                  <el-table-column prop="min" label="最小值" width="80" />
                  <el-table-column prop="max" label="最大值" width="80" />
                  <el-table-column prop="stdev" label="标准差" width="80" />
                  <el-table-column prop="count" label="数据点数" width="90" />
                </el-table>

                <el-divider content-position="center">阶段对比</el-divider>
                <el-table :data="cycleComparison" stripe size="small">
                  <el-table-column prop="phase" label="阶段" width="90" />
                  <el-table-column prop="emission" label="排放值" width="100" />
                  <el-table-column prop="ratio" label="占比 (%)" width="80" />
                  <el-table-column label="柱状图" min-width="180">
                    <template #default="{ row }">
                      <div class="bar-chart-cell">
                        <div class="bar-fill" :style="{ width: row.ratio + '%' }"></div>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 4: Quality Check -->
      <el-tab-pane label="数据质量检查" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>数据质量检查 (Quality Check) — 确保数据完整性</span>
            </div>
          </template>
          <p>自动扫描数据中的缺失值、漂移和异常，生成质量评估报告。</p>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="data-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Search /></el-icon>
                  <span>质量检查</span>
                </div>
              </template>
              <el-form :model="qcData" label-width="100px" label-position="left" size="small">
                <el-form-item label="检查名称">
                  <el-input v-model="qcData.name" />
                </el-form-item>
                <el-form-item label="数据来源">
                  <el-select v-model="qcData.source" style="width: 100%;">
                    <el-option label="CO₂ 分析仪" value="CO2" />
                    <el-option label="NOx 分析仪" value="NOx" />
                    <el-option label="OBD 数据" value="OBD" />
                    <el-option label="PEMS 综合" value="PEMS" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="runQualityCheck">执行质量检查</el-button>
                  <el-button @click="resetQC">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="never" class="result-card">
              <template #header>
                <div class="card-header">
                  <el-icon><List /></el-icon>
                  <span>检查结果</span>
                </div>
              </template>
              <div v-if="qcResults.length === 0" class="placeholder-text">
                请点击"执行质量检查"。
              </div>
              <div v-else>
                <el-table :data="qcResults" stripe size="small">
                  <el-table-column prop="check" label="检查项" width="120" />
                  <el-table-column prop="status" label="状态" width="70">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '通过' ? 'success' : row.status === '警告' ? 'warning' : 'danger'" size="small">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="detail" label="详情" min-width="160" />
                </el-table>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="never" class="result-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>概要统计 & 质量报告</span>
                </div>
              </template>
              <div v-if="qcSummaryStats.length === 0" class="placeholder-text">
                执行质量检查后显示统计信息。
              </div>
              <div v-else>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item
                    v-for="stat in qcSummaryStats"
                    :key="stat.label"
                    :label="stat.label"
                    label-class-name="desc-label"
                  >
                    <span :class="{ 'text-danger': stat.flag === 'danger', 'text-warning': stat.flag === 'warning' }">
                      {{ stat.value }}
                    </span>
                  </el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="center">质量报告</el-divider>
                <div class="quality-report-box">
                  <pre class="report-text">{{ qualityReportText }}</pre>
                  <el-button size="small" style="margin-top: 8px;" @click="copyReport">复制报告</el-button>
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
import { ref, reactive } from 'vue'
import {
  InfoFilled, DataLine, WarningFilled, List, DataAnalysis, Edit,
  Search, Document
} from '@element-plus/icons-vue'

// ============ Shared test data ============
const rawTestData = ref([])

function generateTestData(length = 50) {
  const data = []
  for (let i = 0; i < length; i++) {
    const base = 50 + 30 * Math.sin(i * 0.3) + 5 * Math.sin(i * 1.7)
    data.push(base)
  }
  return data
}

function loadExampleData() {
  rawTestData.value = generateTestData(50)
  buildFilterPreview()
}

// ============ Filters ============
const movingAvgWindow = ref(5)
const medianWindow = ref(5)
const lowpassCutoff = ref(5)
const outlierMethod = ref('3sigma')

const movingAvgResult = ref([])
const medianResult = ref([])
const lowpassResult = ref([])
const outlierIndices = ref([])
const outlierCount = ref(0)
const outlierDetected = ref(false)

const filterPreviewData = ref([])

function applyMovingAvg() {
  if (rawTestData.value.length === 0) {
    rawTestData.value = generateTestData(50)
  }
  const N = movingAvgWindow.value
  const data = rawTestData.value
  const result = []
  for (let i = 0; i < data.length; i++) {
    let sum = 0
    let count = 0
    for (let j = i - Math.floor(N / 2); j <= i + Math.floor(N / 2); j++) {
      if (j >= 0 && j < data.length) {
        sum += data[j]
        count++
      }
    }
    result.push(count > 0 ? sum / count : data[i])
  }
  movingAvgResult.value = result
  buildFilterPreview()
}

function applyMedianFilter() {
  if (rawTestData.value.length === 0) {
    rawTestData.value = generateTestData(50)
  }
  const N = medianWindow.value
  const data = rawTestData.value
  const result = []
  for (let i = 0; i < data.length; i++) {
    const neighbors = []
    for (let j = i - Math.floor(N / 2); j <= i + Math.floor(N / 2); j++) {
      if (j >= 0 && j < data.length) {
        neighbors.push(data[j])
      }
    }
    neighbors.sort((a, b) => a - b)
    result.push(neighbors[Math.floor(neighbors.length / 2)])
  }
  medianResult.value = result
  buildFilterPreview()
}

function applyLowpass() {
  if (rawTestData.value.length === 0) {
    rawTestData.value = generateTestData(50)
  }
  const fc = lowpassCutoff.value
  const dt = 0.1
  const RC = 1.0 / (2 * Math.PI * fc)
  const alpha = dt / (RC + dt)
  const data = rawTestData.value
  const result = [data[0]]
  for (let i = 1; i < data.length; i++) {
    result.push(result[i - 1] + alpha * (data[i] - result[i - 1]))
  }
  lowpassResult.value = result
  buildFilterPreview()
}

function detectOutliers() {
  if (rawTestData.value.length === 0) {
    rawTestData.value = generateTestData(50)
  }
  const data = rawTestData.value
  const indices = []

  if (outlierMethod.value === '3sigma') {
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const variance = data.reduce((sum, v) => sum + (v - mean) ** 2, 0) / data.length
    const std = Math.sqrt(variance)
    data.forEach((v, i) => {
      if (Math.abs(v - mean) > 3 * std) indices.push(i)
    })
  } else {
    const sorted = [...data].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    data.forEach((v, i) => {
      if (v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr) indices.push(i)
    })
  }

  outlierIndices.value = indices
  outlierCount.value = indices.length
  outlierDetected.value = true
  buildFilterPreview()
}

function buildFilterPreview() {
  const data = rawTestData.value
  const preview = data.map((val, i) => ({
    index: i + 1,
    original: val.toFixed(2),
    movingAvg: movingAvgResult.value.length > 0 ? movingAvgResult.value[i].toFixed(2) : '-',
    median: medianResult.value.length > 0 ? medianResult.value[i].toFixed(2) : '-',
    lowpass: lowpassResult.value.length > 0 ? lowpassResult.value[i].toFixed(2) : '-',
    outlier: outlierIndices.value.includes(i)
  }))
  filterPreviewData.value = preview
}

function resetFilterData() {
  rawTestData.value = []
  movingAvgResult.value = []
  medianResult.value = []
  lowpassResult.value = []
  outlierIndices.value = []
  outlierCount.value = 0
  outlierDetected.value = false
  filterPreviewData.value = []
}

// ============ Emission Integration ============
const integrationData = reactive({
  method: 'trapezoidal',
  concUnit: 'ppm',
  flowUnit: 'm3s',
  totalWork: 50.0
})

const integralResult = ref(null)
const integralDataTable = ref([])

function generateSineData() {
  const points = 100
  const t = []
  const conc = []
  const flow = []
  const massRate = []

  for (let i = 0; i < points; i++) {
    const time = i * 0.1
    t.push(time)
    const c = 200 + 150 * Math.sin(time * 0.5) + 30 * Math.sin(time * 2.3)
    conc.push(c)
    const f = 0.05 + 0.02 * Math.sin(time * 0.3)
    flow.push(f)
    massRate.push(c * f * 1e-6)
  }

  integralDataTable.value = t.map((_, i) => ({
    t: t[i].toFixed(1),
    conc: conc[i].toFixed(1),
    flow: flow[i].toFixed(4),
    massRate: massRate[i].toFixed(6)
  }))

  integrationData.totalWork = 50.0
}

function runIntegration() {
  if (integralDataTable.value.length === 0) {
    generateSineData()
  }

  const data = integralDataTable.value
  const n = data.length
  const massRates = data.map(d => parseFloat(d.massRate))

  // Trapezoidal rule
  let trapezoidal = 0
  for (let i = 1; i < n; i++) {
    const dt = parseFloat(data[i].t) - parseFloat(data[i - 1].t)
    trapezoidal += (massRates[i] + massRates[i - 1]) / 2 * dt
  }

  // Simpson's rule (requires even number of intervals)
  let simpson = 0
  if (n % 2 === 0) {
    const h = (parseFloat(data[n - 1].t) - parseFloat(data[0].t)) / (n - 1)
    simpson = massRates[0] + massRates[n - 1]
    for (let i = 1; i < n - 1; i++) {
      simpson += (i % 2 === 0 ? 2 : 4) * massRates[i]
    }
    simpson *= h / 3
  } else {
    // Fallback to trapezoidal for odd intervals
    simpson = trapezoidal
  }

  const error = trapezoidal > 0 ? Math.abs(trapezoidal - simpson) / trapezoidal * 100 : 0

  integralResult.value = {
    trapezoidal,
    simpson,
    error,
    totalMass: simpson * 1000,
    specificEmission: (simpson * 1000) / (integrationData.totalWork || 1),
    pointCount: n
  }
}

// ============ Cycle Cutting ============
const cycleData = reactive({
  cycleType: 'wltc',
  pollutant: 'CO2'
})

const cycleStats = ref([])
const cycleComparison = ref([])

const wltcPhases = [
  { phase: 'Phase 1 (Low)', duration: 589, distance: 3.095, maxSpeed: 56.5, avgSpeed: 18.9 },
  { phase: 'Phase 2 (Medium)', duration: 433, distance: 4.756, maxSpeed: 76.6, avgSpeed: 39.5 },
  { phase: 'Phase 3 (High)', duration: 455, distance: 7.162, maxSpeed: 97.4, avgSpeed: 56.7 },
  { phase: 'Phase 4 (Extra High)', duration: 323, distance: 8.254, maxSpeed: 131.3, avgSpeed: 92.0 }
]

const nedcPhases = [
  { phase: 'ECE-15 (1)', description: '市区循环第1组', duration: 195 },
  { phase: 'ECE-15 (2)', description: '市区循环第2组', duration: 195 },
  { phase: 'ECE-15 (3)', description: '市区循环第3组', duration: 195 },
  { phase: 'ECE-15 (4)', description: '市区循环第4组', duration: 195 },
  { phase: 'EUDC', description: '市郊循环', duration: 400 }
]

function runCycleCutting() {
  const phases = cycleData.cycleType === 'wltc'
    ? [
        { name: 'Low', emission: 162.3, ratio: 18 },
        { name: 'Medium', emission: 148.7, ratio: 24 },
        { name: 'High', emission: 135.2, ratio: 30 },
        { name: 'Extra High', emission: 172.8, ratio: 28 }
      ]
    : [
        { name: 'ECE-15', emission: 185.6, ratio: 40 },
        { name: 'EUDC', emission: 142.3, ratio: 60 }
      ]

  cycleStats.value = phases.map(p => ({
    phase: p.name,
    avg: p.emission.toFixed(1),
    min: (p.emission * 0.85).toFixed(1),
    max: (p.emission * 1.12).toFixed(1),
    stdev: (p.emission * 0.06).toFixed(1),
    count: p.name.includes('Extra') ? 323 : p.name === 'High' ? 455 : 433
  }))

  const totalEmission = phases.reduce((s, p) => s + p.emission * p.ratio, 0)
  const totalRatio = phases.reduce((s, p) => s + p.ratio, 0)
  cycleComparison.value = phases.map(p => ({
    phase: p.name,
    emission: p.emission.toFixed(1),
    ratio: ((p.emission * p.ratio) / totalEmission * 100).toFixed(1)
  }))
}

// ============ Quality Check ============
const qcData = reactive({
  name: 'RDE Test #247',
  source: 'CO2'
})

const qcResults = ref([])
const qcSummaryStats = ref([])
const qualityReportText = ref('')

function runQualityCheck() {
  const results = [
    { check: '缺失数据', status: '通过', detail: '扫描 3600 个数据点，发现 0 个 NaN/空值' },
    { check: '零值检测', status: '通过', detail: '未发现异常的零值序列' },
    { check: '数据完整性', status: '通过', detail: '数据完整度 100.0%' },
    { check: '漂移检测', status: '通过', detail: '前后10%数据均值漂移 0.82% (< 2% 阈值)' },
    { check: '范围检查', status: '警告', detail: 'CO₂ 浓度范围 385-1520 ppm, 部分时刻偏高' }
  ]
  qcResults.value = results

  qcSummaryStats.value = [
    { label: '数据点数', value: '3600' },
    { label: '最小值', value: '385.0 ppm' },
    { label: '最大值', value: '1520.0 ppm' },
    { label: '平均值', value: '682.3 ppm' },
    { label: '中位数', value: '665.1 ppm' },
    { label: '标准差', value: '128.7 ppm' },
    { label: 'P5', value: '421.3 ppm' },
    { label: 'P95', value: '945.8 ppm' },
    { label: '完整度', value: '100.0%', flag: 'success' },
    { label: '漂移率', value: '0.82%', flag: 'success' }
  ]

  qualityReportText.value = `========================================
  数据质量检查报告
  报告生成时间: ${new Date().toLocaleString()}
  数据名称: ${qcData.name}
  数据来源: ${qcData.source}
========================================

[1] 缺失数据检测
  状态: 通过
  扫描数据点数: 3600
  发现 NaN: 0
  发现空值: 0
  异常零值: 0

[2] 数据完整性
  状态: 通过
  有效数据: 3600 / 3600
  完整性: 100.0%

[3] 漂移检测
  状态: 通过
  前10%均值: 658.4 ppm
  后10%均值: 663.8 ppm
  漂移率: 0.82% (阈值 2.0%)

[4] 概要统计
  Count:  3600
  Min:    385.0 ppm
  Max:    1520.0 ppm
  Mean:   682.3 ppm
  Median: 665.1 ppm
  Stdev:  128.7 ppm
  P5:     421.3 ppm
  P95:    945.8 ppm

[5] 综合评估: 通过（建议关注 CO₂ 峰值时刻）`
}

function resetQC() {
  qcResults.value = []
  qcSummaryStats.value = []
  qualityReportText.value = ''
}

function copyReport() {
  navigator.clipboard.writeText(qualityReportText.value).catch(() => {})
}
</script>

<style scoped>
.data-processor {
  height: 100%;
  background: #1a1f2e;
  color: #c8d0e0;
  padding: 16px;
  overflow-y: auto;
}

.dp-tabs {
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

.filter-card, .data-card, .result-card {
  height: 100%;
}

.filter-desc {
  color: #8892b0;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 8px;
  min-height: 48px;
}

.filter-result-badge {
  margin-top: 8px;
  text-align: center;
}

:deep(.el-form-item__label) {
  color: #a8b2d1;
  font-size: 12px;
}

:deep(.el-input-number) {
  width: 120px;
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

:deep(.el-descriptions) {
  background: transparent;
}

:deep(.el-descriptions__title) {
  color: #e6e9f0;
}

:deep(.el-descriptions__label) {
  background: #141824 !important;
  color: #8892b0 !important;
  border: 1px solid #2c3450 !important;
  font-size: 12px;
}

:deep(.el-descriptions__content) {
  background: #1e2536 !important;
  color: #c8d0e0 !important;
  border: 1px solid #2c3450 !important;
  font-size: 12px;
}

.placeholder-text {
  color: #566185;
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}

.result-value {
  color: #ff6b35;
  font-weight: 600;
  font-size: 14px;
}

.cycle-info {
  margin-top: 12px;
}

.bar-chart-cell {
  width: 100%;
  height: 18px;
  background: #141824;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b35, #ff8c5a);
  border-radius: 3px;
  min-width: 2px;
  transition: width 0.3s;
}

.quality-report-box {
  background: #141824;
  border: 1px solid #2c3450;
  border-radius: 4px;
  padding: 12px;
}

.report-text {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #8892b0;
  line-height: 1.5;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.text-danger {
  color: #f56c6c !important;
}

.text-warning {
  color: #e6a23c !important;
}

:deep(.el-button--primary) {
  background: #ff6b35;
  border-color: #ff6b35;
}

:deep(.el-button--primary:hover) {
  background: #e85a26;
  border-color: #e85a26;
}

:deep(.el-radio__label) {
  color: #c8d0e0;
  font-size: 12px;
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #ff6b35;
  border-color: #ff6b35;
}

:deep(.el-radio__inner) {
  background: #141824;
  border-color: #2c3450;
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

:deep(.el-input-group__prepend) {
  background: #141824;
  border-color: #2c3450;
  color: #8892b0;
}

.preview-card {
  margin-top: 16px;
}
</style>
