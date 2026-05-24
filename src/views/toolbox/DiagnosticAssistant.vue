<template>
  <div class="diagnostic-assistant">
    <el-tabs type="border-card" class="da-tabs">
      <!-- Tab 1: Guided Diagnosis -->
      <el-tab-pane label="引导诊断" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>引导诊断 (Guided Diagnosis) — 逐步排查排放超标原因</span>
            </div>
          </template>
          <p>选择污染物类型、发动机型号和运行工况后，回答诊断问题，系统将自动缩小可能原因范围，提供最可能的故障诊断结果。</p>
        </el-card>

        <el-steps :active="diagnosisStep" align-center class="diag-steps" finish-status="success" process-status="process">
          <el-step title="选择污染物" />
          <el-step title="发动机类型" />
          <el-step title="运行工况" />
          <el-step title="故障树诊断" />
          <el-step title="诊断结果" />
        </el-steps>

        <!-- Step 1: Select Pollutant -->
        <div v-if="diagnosisStep === 0" class="step-content">
          <el-card shadow="never" class="select-card">
            <template #header>
              <div class="card-header"><el-icon><WarningFilled /></el-icon><span>选择超标的污染物</span></div>
            </template>
            <el-radio-group v-model="selectedPollutant" class="pollutant-grid">
              <el-radio-button label="NOx" class="pollutant-btn">
                <div class="pollutant-option">
                  <span class="pollutant-icon">NO<sub>x</sub></span>
                  <span class="pollutant-name">氮氧化物</span>
                </div>
              </el-radio-button>
              <el-radio-button label="PM" class="pollutant-btn">
                <div class="pollutant-option">
                  <span class="pollutant-icon">PM</span>
                  <span class="pollutant-name">颗粒物</span>
                </div>
              </el-radio-button>
              <el-radio-button label="HC" class="pollutant-btn">
                <div class="pollutant-option">
                  <span class="pollutant-icon">HC</span>
                  <span class="pollutant-name">碳氢化合物</span>
                </div>
              </el-radio-button>
              <el-radio-button label="CO" class="pollutant-btn">
                <div class="pollutant-option">
                  <span class="pollutant-icon">CO</span>
                  <span class="pollutant-name">一氧化碳</span>
                </div>
              </el-radio-button>
              <el-radio-button label="Smoke" class="pollutant-btn">
                <div class="pollutant-option">
                  <span class="pollutant-icon">Smoke</span>
                  <span class="pollutant-name">烟度</span>
                </div>
              </el-radio-button>
            </el-radio-group>
            <div style="margin-top: 16px; text-align: center;">
              <el-button type="primary" :disabled="!selectedPollutant" @click="diagnosisStep = 1">下一步</el-button>
            </div>
          </el-card>
        </div>

        <!-- Step 2: Engine Type -->
        <div v-if="diagnosisStep === 1" class="step-content">
          <el-card shadow="never" class="select-card">
            <template #header>
              <div class="card-header"><el-icon><Setting /></el-icon><span>选择发动机类型</span></div>
            </template>
            <el-radio-group v-model="selectedEngine" class="engine-grid">
              <el-radio-button label="Diesel SI" class="engine-btn">
                <div class="engine-option">
                  <span class="engine-name">Diesel SI</span>
                  <span class="engine-sub">压燃式柴油机</span>
                </div>
              </el-radio-button>
              <el-radio-button label="Gasoline SI" class="engine-btn">
                <div class="engine-option">
                  <span class="engine-name">Gasoline SI</span>
                  <span class="engine-sub">点燃式汽油机</span>
                </div>
              </el-radio-button>
              <el-radio-button label="CNG" class="engine-btn">
                <div class="engine-option">
                  <span class="engine-name">CNG</span>
                  <span class="engine-sub">压缩天然气</span>
                </div>
              </el-radio-button>
              <el-radio-button label="Dual Fuel" class="engine-btn">
                <div class="engine-option">
                  <span class="engine-name">Dual Fuel</span>
                  <span class="engine-sub">双燃料</span>
                </div>
              </el-radio-button>
            </el-radio-group>
            <div style="margin-top: 16px; text-align: center;">
              <el-button @click="diagnosisStep = 0">上一步</el-button>
              <el-button type="primary" :disabled="!selectedEngine" @click="diagnosisStep = 2" style="margin-left: 8px;">下一步</el-button>
            </div>
          </el-card>
        </div>

        <!-- Step 3: Operating Condition -->
        <div v-if="diagnosisStep === 2" class="step-content">
          <el-card shadow="never" class="select-card">
            <template #header>
              <div class="card-header"><el-icon><TrendCharts /></el-icon><span>选择超标时的运行工况</span></div>
            </template>
            <el-radio-group v-model="selectedCondition" class="condition-grid">
              <el-radio-button label="Cold Start" class="condition-btn">
                <div class="condition-option">
                  <span class="condition-icon">❄️</span>
                  <span class="condition-name">冷启动</span>
                  <span class="condition-sub">冷却液温度 < 30°C</span>
                </div>
              </el-radio-button>
              <el-radio-button label="Warm" class="condition-btn">
                <div class="condition-option">
                  <span class="condition-icon">🌡️</span>
                  <span class="condition-name">热机</span>
                  <span class="condition-sub">正常运行温度</span>
                </div>
              </el-radio-button>
              <el-radio-button label="High Load" class="condition-btn">
                <div class="condition-option">
                  <span class="condition-icon">⬆️</span>
                  <span class="condition-name">高负荷</span>
                  <span class="condition-sub">大油门/满载</span>
                </div>
              </el-radio-button>
              <el-radio-button label="Low Load" class="condition-btn">
                <div class="condition-option">
                  <span class="condition-icon">⬇️</span>
                  <span class="condition-name">低负荷</span>
                  <span class="condition-sub">怠速/小油门</span>
                </div>
              </el-radio-button>
              <el-radio-button label="Transient" class="condition-btn">
                <div class="condition-option">
                  <span class="condition-icon">↗️</span>
                  <span class="condition-name">瞬态</span>
                  <span class="condition-sub">加减速过程</span>
                </div>
              </el-radio-button>
              <el-radio-button label="Idle" class="condition-btn">
                <div class="condition-option">
                  <span class="condition-icon">⏸️</span>
                  <span class="condition-name">怠速</span>
                  <span class="condition-sub">空档/停车</span>
                </div>
              </el-radio-button>
            </el-radio-group>
            <div style="margin-top: 16px; text-align: center;">
              <el-button @click="diagnosisStep = 1">上一步</el-button>
              <el-button type="primary" :disabled="!selectedCondition" @click="startDiagnosticTree" style="margin-left: 8px;">开始诊断</el-button>
            </div>
          </el-card>
        </div>

        <!-- Step 4: Decision Tree -->
        <div v-if="diagnosisStep === 3" class="step-content">
          <el-card shadow="never" class="tree-card">
            <template #header>
              <div class="card-header">
                <el-icon><Share /></el-icon>
                <span>故障树诊断 — {{ currentQuestion ? currentQuestion.text : '诊断完成' }}</span>
              </div>
            </template>

            <div v-if="currentQuestion" class="tree-content">
              <div class="question-box">
                <el-alert
                  :title="currentQuestion.text"
                  type="warning"
                  show-icon
                  :closable="false"
                />
              </div>

              <div v-if="currentQuestion.hint" class="question-hint">
                <el-alert :title="currentQuestion.hint" type="info" show-icon :closable="false" />
              </div>

              <div class="question-actions">
                <el-button type="success" size="large" @click="answerQuestion(true)" class="yes-btn">
                  <el-icon><Check /></el-icon> 是 (Yes)
                </el-button>
                <el-button type="danger" size="large" @click="answerQuestion(false)" class="no-btn">
                  <el-icon><Close /></el-icon> 否 (No)
                </el-button>
              </div>

              <div class="tree-path">
                <p class="path-title">诊断路径:</p>
                <div class="path-steps">
                  <el-tag v-for="(step, i) in diagnosisPath" :key="i" size="small" class="path-tag">
                    {{ step }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div v-else class="tree-complete">
              <el-empty description="故障树已遍历完毕">
                <el-button type="primary" @click="diagnosisStep = 4">查看诊断结果</el-button>
              </el-empty>
            </div>
          </el-card>
        </div>

        <!-- Step 5: Diagnosis Results -->
        <div v-if="diagnosisStep === 4" class="step-content">
          <el-card shadow="never" class="result-card">
            <template #header>
              <div class="card-header">
                <el-icon><DataAnalysis /></el-icon>
                <span>诊断结果报告</span>
              </div>
            </template>

            <div class="diag-summary">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="污染物">{{ selectedPollutant }}</el-descriptions-item>
                <el-descriptions-item label="发动机">{{ selectedEngine }}</el-descriptions-item>
                <el-descriptions-item label="工况">{{ selectedCondition }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <el-table :data="diagnosisResults" stripe size="small" style="margin-top: 12px;">
              <el-table-column prop="rank" label="排名" width="60" />
              <el-table-column prop="cause" label="可能原因" min-width="160" />
              <el-table-column prop="probability" label="概率" width="80">
                <template #default="{ row }">
                  <span :class="row.probability >= 70 ? 'text-danger' : row.probability >= 40 ? 'text-warning' : 'text-success'">
                    {{ row.probability }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="action" label="建议检查" min-width="200" />
            </el-table>

            <div class="diag-actions" style="margin-top: 16px; text-align: center;">
              <el-button @click="resetDiagnosis">重新诊断</el-button>
              <el-button type="primary" @click="addToCaseNotes">添加到案例笔记</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Fault Pattern Library -->
      <el-tab-pane label="故障模式库" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>故障模式库 (Fault Pattern Library) — 已知故障模式目录</span>
            </div>
          </template>
        </el-card>

        <el-row :gutter="16" style="margin-bottom: 16px;">
          <el-col :span="6">
            <el-input
              v-model="faultSearch"
              placeholder="搜索故障模式..."
              clearable
              size="small"
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="18">
            <el-radio-group v-model="faultCategoryFilter" size="small">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="SCR">SCR</el-radio-button>
              <el-radio-button label="DPF">DPF</el-radio-button>
              <el-radio-button label="EGR">EGR</el-radio-button>
              <el-radio-button label="O2 Sensor">O2 Sensor</el-radio-button>
              <el-radio-button label="Turbo">Turbo</el-radio-button>
              <el-radio-button label="Fuel">Fuel</el-radio-button>
              <el-radio-button label="Ignition">Ignition</el-radio-button>
            </el-radio-group>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col
            v-for="fault in filteredFaults"
            :key="fault.name"
            :xs="24" :sm="12" :md="8" :lg="6"
            style="margin-bottom: 16px;"
          >
            <el-card shadow="never" class="fault-card">
              <div class="fault-card-header">
                <span class="fault-name">{{ fault.name }}</span>
                <el-tag
                  :type="fault.severity === 'critical' ? 'danger' : fault.severity === 'major' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ fault.severity === 'critical' ? '严重' : fault.severity === 'major' ? '重要' : '一般' }}
                </el-tag>
              </div>
              <el-tag size="small" class="fault-category-tag">{{ fault.category }}</el-tag>
              <div class="fault-section">
                <p class="fault-section-title">症状:</p>
                <p class="fault-text">{{ fault.symptoms }}</p>
              </div>
              <div class="fault-section">
                <p class="fault-section-title">可能原因:</p>
                <p class="fault-text">{{ fault.causes }}</p>
              </div>
              <div class="fault-section">
                <p class="fault-section-title">诊断步骤:</p>
                <p class="fault-text">{{ fault.steps }}</p>
              </div>
              <div class="fault-section">
                <p class="fault-section-title">参考值:</p>
                <p class="fault-text">{{ fault.refValues }}</p>
              </div>
              <div class="fault-section">
                <p class="fault-section-title">修复建议:</p>
                <p class="fault-text">{{ fault.fix }}</p>
              </div>
            </el-card>
          </el-col>
          <el-col v-if="filteredFaults.length === 0" :span="24">
            <el-empty description="未找到匹配的故障模式" />
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 3: Case Library -->
      <el-tab-pane label="案例库" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>案例库 (Case Library) — 真实排放故障案例分析</span>
            </div>
          </template>
        </el-card>

        <el-row :gutter="16">
          <el-col
            v-for="caseItem in caseLibrary"
            :key="caseItem.id"
            :xs="24" :sm="12" :md="8"
            style="margin-bottom: 16px;"
          >
            <el-card shadow="never" class="case-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>{{ caseItem.title }}</span>
                </div>
              </template>
              <div class="case-section">
                <p class="case-section-title">车辆信息:</p>
                <p class="case-text">{{ caseItem.vehicle }}</p>
              </div>
              <div class="case-section">
                <p class="case-section-title">问题描述:</p>
                <p class="case-text">{{ caseItem.problem }}</p>
              </div>
              <div class="case-section">
                <p class="case-section-title">数据读数:</p>
                <p class="case-text mono">{{ caseItem.data }}</p>
              </div>
              <div class="case-section">
                <p class="case-section-title">诊断过程:</p>
                <p class="case-text">{{ caseItem.diagnosis }}</p>
              </div>
              <div class="case-section">
                <p class="case-section-title">解决方案:</p>
                <p class="case-text">{{ caseItem.solution }}</p>
              </div>
              <el-tag
                :type="caseItem.result === 'resolved' ? 'success' : 'warning'"
                size="small"
                style="margin-top: 8px;"
              >
                {{ caseItem.result === 'resolved' ? '已解决' : '部分解决' }}
              </el-tag>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 4: Reference Values -->
      <el-tab-pane label="参考值" class="tab-pane">
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>参考值 (Reference Values) — 关键参数正常范围</span>
            </div>
          </template>
          <p>以下为排放诊断中常用的关键参数参考范围，可用于快速判断传感器或系统是否异常。</p>
        </el-card>

        <el-card shadow="never" class="ref-card">
          <template #header>
            <div class="card-header">
              <el-icon><Reading /></el-icon>
              <span>关键参数参考范围表</span>
            </div>
          </template>
          <el-table :data="referenceValues" stripe size="small" class="ref-table">
            <el-table-column prop="parameter" label="参数" width="160" />
            <el-table-column prop="normal" label="正常范围" min-width="200" />
            <el-table-column prop="caution" label="警戒范围" min-width="200" />
            <el-table-column prop="abnormal" label="异常范围" min-width="200" />
            <el-table-column prop="unit" label="单位" width="80" />
          </el-table>
        </el-card>

        <el-card shadow="never" class="color-key-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>颜色标识说明</span>
            </div>
          </template>
          <div class="color-key">
            <div class="color-item">
              <span class="color-badge" style="background: #67c23a;"></span>
              <span>正常 (Normal) — 参数在正常范围内</span>
            </div>
            <div class="color-item">
              <span class="color-badge" style="background: #e6a23c;"></span>
              <span>警戒 (Caution) — 参数偏高或偏低，建议检查</span>
            </div>
            <div class="color-item">
              <span class="color-badge" style="background: #f56c6c;"></span>
              <span>异常 (Abnormal) — 参数严重偏离，必须检修</span>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  InfoFilled, WarningFilled, Setting, TrendCharts, Share,
  DataAnalysis, Search, Document, Reading, Check, Close
} from '@element-plus/icons-vue'

// ============ Guided Diagnosis ============
const diagnosisStep = ref(0)
const selectedPollutant = ref('')
const selectedEngine = ref('')
const selectedCondition = ref('')

// Decision tree state
const currentNode = ref(null)
const currentQuestion = ref(null)
const diagnosisPath = ref([])
const diagnosisResults = ref([])

// ============ Decision Tree Definitions ============

// NOx diagnostic tree
const noxTree = {
  text: 'NOx 排放是否伴随着排气温度异常升高 (> 600°C)？',
  hint: '排气温度过高会导致 NOx 生成量增加，同时可能降低 SCR 效率。',
  yes: {
    text: 'EGR 阀开度是否正常 (读取 EGR 位置传感器)？',
    hint: 'EGR 系统故障时 NOx 会显著升高。断开 EGR 阀连接器，检查占空比信号。',
    questionId: 'nox_egr',
    yes: {
      text: 'SCR 系统尿素喷射是否正常 (检查喷嘴是否堵塞)？',
      hint: 'SCR 转化效率低会导致 NOx 排放超标。观察尿素喷射量和排气温度是否满足喷射条件。',
      questionId: 'nox_scr',
      yes: {
        text: '喷油正时是否过度提前 (检查喷油提前角)？',
        hint: '喷油提前角过大会导致燃烧温度升高，NOx 增加。对比 ECU 标定值和实际值。',
        questionId: 'nox_timing',
        yes: {
          text: '燃烧室温度是否异常高 (检查中冷器效率)？',
          hint: '进气温度过高会导致燃烧温度升高。检查中冷器是否有堵塞或冷却不足。',
          questionId: 'nox_temp',
          yes: { result: true },
          no: { result: true }
        },
        no: { result: true }
      },
      no: { result: true }
    },
    no: { result: true }
  },
  no: {
    text: '是否在冷启动阶段 NOx 偏高？',
    hint: '冷启动时 SCR 未达到工作温度，NOx 转化效率低属于正常现象，但若超出限值则需要检查。',
    questionId: 'nox_cold',
    yes: {
      text: 'SCR 加热系统是否正常工作？',
      hint: '部分 SCR 系统配有电加热或燃烧器加热，加速催化剂升温。',
      questionId: 'nox_heat',
      yes: { result: true },
      no: { result: true }
    },
    no: {
      text: 'NOx 传感器读数是否合理 (与其他运营参数对比)？',
      hint: 'NOx 传感器漂移或故障会导致误报。检查传感器供电电压和信号范围。',
      questionId: 'nox_sensor',
      yes: { result: true },
      no: { result: true }
    }
  }
}

// PM diagnostic tree
const pmTree = {
  text: '排气背压是否过高 (检查 DPF 差压)？',
  hint: 'DPF 堵塞会导致排气背压升高 (> 100 mbar 警告)，影响燃烧质量并增加 PM 排放。',
  yes: {
    text: 'DPF 是否已进行过再生 (检查再生历史记录)？',
    hint: 'DPF 长时间未再生会导致碳载量过高。检查 DPF 碳载量模型值。',
    questionId: 'pm_dpf',
    yes: {
      text: 'DPF 是否存在物理损坏或泄漏？',
      hint: 'DPF 破裂会导致过滤效率下降，PM 排放超标。使用内窥镜检查 DPF 载体。',
      questionId: 'pm_dpf_damage',
      yes: { result: true },
      no: { result: true }
    },
    no: { result: true }
  },
  no: {
    text: '喷油嘴是否存在滴漏或雾化不良？',
    hint: '喷油嘴故障会导致燃油燃烧不充分，产生大量 PM。检查回油量和喷油嘴回油脉宽。',
    questionId: 'pm_injector',
    yes: { result: true },
    no: {
      text: '空气滤清器是否堵塞 (检查进气量 MAF 值)？',
      hint: '进气不足会导致燃烧不完全，PM 增加。对比标准 MAF 值与实际值。',
      questionId: 'pm_air',
      yes: { result: true },
      no: {
        text: '燃油质量是否合格 (检查燃油含水/含硫量)？',
        hint: '低品质燃油 (高硫/高含水) 会导致 PM 显著增加。检查燃油样本。',
        questionId: 'pm_fuel',
        yes: { result: true },
        no: { result: true }
      }
    }
  }
}

// HC diagnostic tree
const hcTree = {
  text: '是否存在缺火 (Misfire) 现象 (读取发动机缺火计数器)？',
  hint: '缺火是 HC 升高的最常见原因。使用诊断仪读取缺火计数器，检查各缸缺火次数。',
  yes: {
    text: '缺火集中在某个特定气缸？',
    hint: '单缸缺火通常与该缸点火/喷油相关；所有缸缺火则可能是共性问题。',
    questionId: 'hc_misfire_single',
    yes: {
      text: '该缸点火线圈和火花塞是否正常？',
      hint: '检查点火线圈电阻、火花塞电极磨损和积碳情况。测量点火次级波形。',
      questionId: 'hc_ignition',
      yes: { result: true },
      no: { result: true }
    },
    no: { result: true }
  },
  no: {
    text: '喷油量是否过大 (检查长期燃油修正值)？',
    hint: '燃油修正值超出 ±20% 表示喷油系统异常。检查氧传感器闭环控制。',
    questionId: 'hc_injection',
    yes: { result: true },
    no: {
      text: '三元催化器 (TWC) 转化效率是否正常？',
      hint: '催化器老化或中毒会导致 HC 转化效率下降。比较前后氧传感器信号。',
      questionId: 'hc_catalyst',
      yes: { result: true },
      no: {
        text: '氧传感器信号响应是否正常 (检查响应时间)？',
        hint: '氧传感器老化会导致响应变慢 (< 100ms 为正常)，影响空燃比控制。',
        questionId: 'hc_o2',
        yes: { result: true },
        no: { result: true }
      }
    }
  }
}

// CO diagnostic tree
const coTree = {
  text: '空燃比是否过浓 (Lambda < 0.95)？',
  hint: '混合气过浓是 CO 升高的主要原因。检查 Lambda 传感器和燃油修正。',
  yes: {
    text: '氧传感器信号是否正常？',
    hint: '氧传感器老化或污染会导致空燃比控制偏移。检查传感器电压变化范围 (0.1-0.9V)。',
    questionId: 'co_o2',
    yes: { result: true },
    no: { result: true }
  },
  no: {
    text: '进气系统是否有泄漏 (检查进气歧管真空度)？',
    hint: '进气泄漏会导致混合气失调。检查真空管路和进气垫片。',
    questionId: 'co_leak',
    yes: { result: true },
    no: { result: true }
  }
}

// Smoke diagnostic tree
const smokeTree = {
  text: '冒烟颜色是否为蓝色 (烧机油)？',
  hint: '蓝烟 = 烧机油；黑烟 = 燃烧不完全；白烟 = 冷却液进入燃烧室。',
  yes: {
    text: '涡轮增压器油封是否泄漏？',
    hint: '涡轮油封泄漏会导致机油进入进气管。检查中冷器是否有机油残留。',
    questionId: 'smoke_turbo',
    yes: { result: true },
    no: { result: true }
  },
  no: {
    text: '是否冒黑烟 (燃油燃烧不完全)？',
    hint: '黑烟表明燃油过多或进气不足。检查喷油量和进气系统。',
    questionId: 'smoke_black',
    yes: {
      text: '喷油正时是否延迟？',
      hint: '喷油过迟会导致燃烧不完全。对比 ECU 标定喷油正时。',
      questionId: 'smoke_timing',
      yes: { result: true },
      no: { result: true }
    },
    no: { result: true }
  }
}

const diagnosticTrees = {
  NOx: noxTree,
  PM: pmTree,
  HC: hcTree,
  CO: coTree,
  Smoke: smokeTree
}

function getProbabilityRankings(treeResults) {
  const allCauses = []
  const path = treeResults.map(r => r.answer || '').filter(Boolean).join(' -> ')

  if (selectedPollutant.value === 'NOx') {
    if (path.includes('排气温度异常')) {
      allCauses.push(
        { cause: 'EGR 阀卡滞或堵塞', probability: 85, action: '清洗或更换 EGR 阀，检查 EGR 冷却器' },
        { cause: 'SCR 尿素喷射系统故障', probability: 75, action: '检查尿素喷嘴、尿素泵和喷射控制单元' },
        { cause: '喷油正时过度提前', probability: 65, action: '重新标定喷油正时，检查 ECU 脉谱图' }
      )
    } else if (path.includes('冷启动')) {
      allCauses.push(
        { cause: 'SCR 催化剂未达到工作温度', probability: 90, action: '检查 SCR 加热系统，考虑使用保温措施' },
        { cause: '冷启动加浓导致 NOx 升高', probability: 60, action: '检查冷启动策略标定' },
        { cause: 'NOx 传感器冷态漂移', probability: 40, action: '校准或更换 NOx 传感器' }
      )
    } else {
      allCauses.push(
        { cause: 'NOx 传感器故障或漂移', probability: 70, action: '使用标准气体校准或更换 NOx 传感器' },
        { cause: '进气温度过高', probability: 55, action: '检查中冷器效率' },
        { cause: '燃烧室积碳导致压缩比变化', probability: 35, action: '执行燃烧室清洗' }
      )
    }
  } else if (selectedPollutant.value === 'PM') {
    if (path.includes('排气背压')) {
      allCauses.push(
        { cause: 'DPF 堵塞 (碳载量过高)', probability: 90, action: '执行 DPF 再生，检查再生频率' },
        { cause: 'DPF 灰分沉积过多', probability: 70, action: '检查 DPF 灰分载量，考虑专业清洗' },
        { cause: 'DPF 裂纹或损坏', probability: 30, action: '内窥镜检查 DPF 载体，更换 DPF' }
      )
    } else {
      allCauses.push(
        { cause: '喷油嘴雾化不良或滴漏', probability: 80, action: '拆检喷油嘴，测试喷油量均匀性' },
        { cause: '空气滤清器严重堵塞', probability: 60, action: '更换空气滤清器，检查进气管路' },
        { cause: '燃油质量不达标', probability: 50, action: '检测燃油样本 (硫含量/含水率)' }
      )
    }
  } else if (selectedPollutant.value === 'HC') {
    if (path.includes('缺火')) {
      allCauses.push(
        { cause: '点火系统故障 (线圈/火花塞)', probability: 85, action: '更换故障气缸的点火线圈和火花塞' },
        { cause: '喷油嘴堵塞或失效', probability: 60, action: '清洗或更换喷油嘴' },
        { cause: '气缸压缩压力不足', probability: 35, action: '执行气缸压缩测试' }
      )
    } else {
      allCauses.push(
        { cause: '空燃比过浓 (Lambda 控制故障)', probability: 75, action: '检查氧传感器和燃油修正值' },
        { cause: '三元催化器转化效率下降', probability: 65, action: '检查催化器温度, 评估是否需要更换' },
        { cause: '氧传感器响应迟缓', probability: 45, action: '更换氧传感器' }
      )
    }
  } else if (selectedPollutant.value === 'CO') {
    allCauses.push(
      { cause: '氧传感器故障导致混合气过浓', probability: 80, action: '检查氧传感器电压和响应时间' },
      { cause: '燃油压力过高', probability: 60, action: '检查燃油压力调节器和燃油泵' },
      { cause: '进气系统泄漏', probability: 50, action: '烟雾测试检查进气系统密封性' }
    )
  } else if (selectedPollutant.value === 'Smoke') {
    if (path.includes('蓝色')) {
      allCauses.push(
        { cause: '涡轮增压器油封泄漏', probability: 80, action: '检查涡轮轴间隙, 更换油封' },
        { cause: '气门油封老化', probability: 60, action: '更换气门油封' },
        { cause: '活塞环磨损', probability: 40, action: '执行缸压测试, 评估发动机大修' }
      )
    } else {
      allCauses.push(
        { cause: '喷油正时延迟', probability: 75, action: '重新标定喷油正时' },
        { cause: '喷油嘴雾化不良', probability: 65, action: '拆检喷油嘴' },
        { cause: '进气不足 (涡轮/空滤)', probability: 45, action: '检查涡轮增压器和空气滤清器' }
      )
    }
  }

  return allCauses.map((c, i) => ({ ...c, rank: i + 1 }))
}

function startDiagnosticTree() {
  const tree = diagnosticTrees[selectedPollutant.value]
  if (tree) {
    currentNode.value = tree
    currentQuestion.value = tree
    diagnosisPath.value = []
    diagnosisStep.value = 3
  }
}

function answerQuestion(answer) {
  const node = currentNode.value
  if (!node) return

  diagnosisPath.value.push(answer ? `是: ${node.text}` : `否: ${node.text}`)

  const branch = answer ? node.yes : node.no

  if (branch.result) {
    // End of tree branch
    currentQuestion.value = null
    currentNode.value = null
    diagnosisResults.value = getProbabilityRankings(diagnosisPath.value || [])
  } else if (branch.text) {
    // Continue to next question
    currentNode.value = branch
    currentQuestion.value = branch
  } else {
    currentQuestion.value = null
    currentNode.value = null
    diagnosisResults.value = getProbabilityRankings(diagnosisPath.value || [])
  }
}

function resetDiagnosis() {
  diagnosisStep.value = 0
  selectedPollutant.value = ''
  selectedEngine.value = ''
  selectedCondition.value = ''
  currentNode.value = null
  currentQuestion.value = null
  diagnosisPath.value = []
  diagnosisResults.value = []
}

function addToCaseNotes() {
  // Placeholder for adding to case notes
}

// ============ Fault Pattern Library ============
const faultSearch = ref('')
const faultCategoryFilter = ref('')

const faultLibrary = [
  {
    name: 'SCR 尿素喷嘴堵塞',
    category: 'SCR',
    severity: 'critical',
    symptoms: 'NOx 排放升高，尿素消耗量减少，排气管有白色结晶物',
    causes: '尿素结晶堵塞喷嘴孔，或尿素品质不纯含杂质',
    steps: '1. 读取 NOx 传感器值; 2. 检查尿素喷射量; 3. 拆检喷嘴; 4. 清洗或更换',
    refValues: '正常喷射量: 3-7 L/1000km; NOx 转化率 > 80%',
    fix: '热水清洗喷嘴，更换尿素滤芯，使用合格 AdBlue'
  },
  {
    name: 'DPF 灰分堵塞',
    category: 'DPF',
    severity: 'critical',
    symptoms: '排气背压升高，动力下降，再生频繁，油耗增加',
    causes: '长时间使用产生不可再生灰分积累，或机油灰分过高(>1%)',
    steps: '1. 读取 DPF 差压; 2. 检查碳载量模型; 3. 执行强制再生; 4. 评估灰分量',
    refValues: 'DPF 差压: 正常 3-50 mbar, 警告 50-100 mbar, 堵塞 > 100 mbar',
    fix: 'DPF 拆卸专业清洗，或更换 DPF，改用低灰分机油 (Cx 标准)'
  },
  {
    name: 'EGR 阀积碳卡滞',
    category: 'EGR',
    severity: 'major',
    symptoms: '怠速不稳，NOx 升高，加速迟滞，EGR 故障灯亮',
    causes: 'EGR 阀积碳导致阀门卡滞在关闭或半开位置',
    steps: '1. 读取 EGR 位置传感器; 2. 手动激活 EGR 阀; 3. 拆检清洗',
    refValues: 'EGR 开度: 0%(关闭) - 100%(全开); EGR 率: 0-50%',
    fix: '拆卸清洗 EGR 阀及通道，检查 EGR 冷却器，更新 PCV 系统'
  },
  {
    name: '氧传感器老化 (宽带)',
    category: 'O2 Sensor',
    severity: 'major',
    symptoms: '燃油修正值偏移超 ±20%，油耗增加，排放升高',
    causes: '传感器老化、铅中毒或硅中毒导致响应变慢',
    steps: '1. 读取氧传感器电压/电流; 2. 检查响应时间; 3. 对比前后氧传感器',
    refValues: '响应时间 < 100ms; 窄带: 0.1-0.9V; 宽带: Lambda 0.7-1.3',
    fix: '更换氧传感器（建议 OEM 原厂件），检查排气系统密封性'
  },
  {
    name: '涡轮增压器油封泄漏',
    category: 'Turbo',
    severity: 'critical',
    symptoms: '排蓝烟，机油消耗增加，中冷器有机油，涡轮异响',
    causes: '涡轮轴密封环磨损，或回油管堵塞导致油压过高',
    steps: '1. 检查中冷器残留机油; 2. 测量涡轮轴间隙; 3. 检查回油管',
    refValues: '轴向间隙 < 0.1mm; 径向间隙 < 0.3mm; 增压压力随转速线性变化',
    fix: '更换涡轮增压器，清洗中冷器和进气管路，更换机油'
  },
  {
    name: '喷油嘴雾化不良',
    category: 'Fuel',
    severity: 'major',
    symptoms: 'PM 增加，油耗升高，怠速抖动，加速时冒黑烟',
    causes: '喷油嘴磨损、积碳或针阀卡滞导致喷射压力不足',
    steps: '1. 测试回油量; 2. 执行喷油嘴平衡测试; 3. 拆检喷油嘴',
    refValues: '回油量偏差 < 10%; 喷油量偏差 < 5%; 喷油压力 (CR) 1600-2200 bar',
    fix: '超声波清洗喷油嘴，或更换喷油嘴，更新燃油滤清器'
  },
  {
    name: '点火线圈击穿',
    category: 'Ignition',
    severity: 'critical',
    symptoms: '缺火故障码，HC 升高，加速顿挫，发动机抖动',
    causes: '点火线圈绝缘老化、击穿或次级绕组断路',
    steps: '1. 读取缺火计数器; 2. 交换点火线圈测试; 3. 测量点火次级波形',
    refValues: '初级绕组: 0.4-0.8 Ohm; 次级绕组: 6-15 kOhm; 点火电压 > 15kV',
    fix: '更换故障气缸点火线圈，同时更换火花塞'
  },
  {
    name: 'SCR 催化剂中毒',
    category: 'SCR',
    severity: 'critical',
    symptoms: 'NOx 转化效率持续下降 (< 50%)，尿素喷射正常但排放超标',
    causes: '燃油含硫过高导致钒基催化剂中毒，或冷却液泄漏进入排气',
    steps: '1. 检查 NOx 转化效率; 2. 催化剂温度窗口测试; 3. 内窥镜观察',
    refValues: 'SCR 转化率: 正常 70-99%; 活性区温度: 200-450°C',
    fix: '脱硫再生(高温运行)，如不可逆中毒则更换 SCR 催化器'
  },
  {
    name: '三元催化器堵塞',
    category: 'DPF',
    severity: 'major',
    symptoms: '高速无力，排气背压升高，油耗增加，发动机过热',
    causes: '陶瓷载体熔化或积碳严重堵塞通道',
    steps: '1. 测量排气背压; 2. 红外测温检查温度分布; 3. 内窥镜检查',
    refValues: '怠速排压 < 0.3 bar; 满负荷 < 1.0 bar; 前后温差 < 50°C',
    fix: '更换三元催化器，排查引起堵塞的根源 (烧机油/混合气过浓)'
  },
  {
    name: '进气温度传感器故障',
    category: 'O2 Sensor',
    severity: 'major',
    symptoms: '进气温度读数异常，NOx 控制异常，冷启动困难',
    causes: '传感器热敏电阻短路/断路，或线路接触不良',
    steps: '1. 读取 IAT 值与实际参考对比; 2. 测量传感器电阻; 3. 检查线路',
    refValues: 'IAT 随工况变化: 环境温度 ~ 120°C (增压后); NTC 电阻: 2.5kOhm @25°C',
    fix: '更换进气温度传感器 (IAT), 检查线束连接器'
  },
  {
    name: '燃油压力调节器故障',
    category: 'Fuel',
    severity: 'major',
    symptoms: '喷油量不稳定，混合气过浓或过稀，动力不足',
    causes: '机械式调节器膜片破裂或电控式传感器故障',
    steps: '1. 读取燃油压力值; 2. 燃油泵压力测试; 3. 检查回油量',
    refValues: '低压油路: 3-6 bar; 高压油路(CR): 200-2200 bar (随负荷)',
    fix: '更换燃油压力调节器或高压燃油泵'
  },
  {
    name: 'PCV 系统故障',
    category: 'Ignition',
    severity: 'minor',
    symptoms: '怠速不稳，进气系统积碳加速，机油消耗异常',
    causes: 'PCV 阀卡滞或膜片破裂导致曲轴箱通风异常',
    steps: '1. 怠速时检查 PCV 阀抖动; 2. 测量曲轴箱压力; 3. 检查管路',
    refValues: '曲轴箱真空度: 10-30 mbar (怠速); PCV 阀电阻: 10-30 Ohm (加热型)',
    fix: '更换 PCV 阀和通风管路，清理进气门积碳'
  }
]

const filteredFaults = computed(() => {
  return faultLibrary.filter(f => {
    const matchesSearch = !faultSearch.value ||
      f.name.toLowerCase().includes(faultSearch.value.toLowerCase()) ||
      f.symptoms.toLowerCase().includes(faultSearch.value.toLowerCase()) ||
      f.causes.toLowerCase().includes(faultSearch.value.toLowerCase())
    const matchesCat = !faultCategoryFilter.value || f.category === faultCategoryFilter.value
    return matchesSearch && matchesCat
  })
})

// ============ Case Library ============
const caseLibrary = [
  {
    id: 1,
    title: '案例 #247: NOx 超标 — SCR 喷嘴堵塞',
    vehicle: '2021 柴油 SUV, 2.0L, 110kW, EU6d, 行驶里程 85,000km',
    problem: 'RDE 测试 NOx 排放超标 (CF=1.62)，实验室测试正常。仅在实际道路测试中出现 NOx 升高。',
    data: 'NEDC NOx: 42 mg/km (限值 60)\nRDE NOx: 97 mg/km\n尿素消耗: 0.8 L/1000km (正常 4-6)\nSCR 入口温度: 320°C',
    diagnosis: '1. 读取故障码: 无相关 DTC\n2. 对比 NEDC vs RDE: 仅 RDE 超标, 指向 SCR\n3. 检查尿素消耗量: 过低 (0.8 L/1000km)\n4. 拆检尿素喷嘴: 发现结晶堵塞',
    solution: '更换尿素喷嘴，清洗尿素管路和滤芯。重新测试 RDE NOx = 38 mg/km, CF = 0.63。建议每 60,000km 更换尿素滤芯。',
    result: 'resolved'
  },
  {
    id: 2,
    title: '案例 #312: PM 严重超标 — DPF 灰分堵塞',
    vehicle: '2019 柴油货车, 3.0L, 150kW, EU6c, 行驶里程 220,000km',
    problem: 'PM 排放超标 3 倍，频繁 DPF 再生 (每 200km 一次)，动力明显下降。',
    data: 'PM: 0.015 g/km (限值 0.0045)\nDPF 差压: 185 mbar (正常 10-50)\n灰分载量: 8.5 g/L\n机油消耗: 1.5L/5000km',
    diagnosis: '1. 读取 DPF 数据: 碳载量 45%, 灰分量极高\n2. 执行静止再生: 碳载量降为 5%, 但差压仍 175 mbar\n3. 确认灰分不可再生: 需专业清洗\n4. 追溯原因: 使用了高灰分机油',
    solution: '拆卸 DPF 进行专业清洗 (超声波 + 高压水洗)，恢复差压至 25 mbar。改用低灰分机油 (ACEA C3)。重新测试 PM = 0.0038 g/km。',
    result: 'resolved'
  },
  {
    id: 3,
    title: '案例 #158: HC 超标 — 点火线圈击穿',
    vehicle: '2020 汽油轿车, 1.5L, 96kW, EU6d, 行驶里程 62,000km',
    problem: 'HC 排放超标 (238 mg/km, 限值 100 mg/km)，发动机故障灯亮，行驶时偶发顿挫。',
    data: 'HC: 238 mg/km\nCO: 0.85 g/km (正常)\n缺火计数器: 第2缸 127次/1000转\n点火次级波形: 第2缸击穿电压 < 5kV',
    diagnosis: '1. 读取缺火计数器: 第2缸大量缺火\n2. 交换点火线圈: 缺火转移到第3缸\n3. 检查火花塞: 电极磨损正常\n4. 波形分析: 次级击穿电压过低',
    solution: '更换第2缸点火线圈和全部火花塞。重新测试 HC = 28 mg/km。定期检查点火系统, 建议 60,000km 更换火花塞。',
    result: 'resolved'
  },
  {
    id: 4,
    title: '案例 #405: CO 超标 — 氧传感器老化',
    vehicle: '2018 汽油 MPV, 2.0L, 125kW, EU6b, 行驶里程 130,000km',
    problem: '年检 CO 超标 (12.5 g/km, 限值 1.0 g/km)，空燃比严重偏浓。',
    data: 'CO: 12.5 g/km (限值 1.0)\nHC: 320 mg/km\nLambda: 0.82\n短期燃油修正: -18%\n长期燃油修正: -25%\n前氧传感器电压: 0.7V 恒定',
    diagnosis: '1. 读取氧传感器: 前氧电压固定在 0.7V (正常应 0.1-0.9V 波动)\n2. 断开氧传感器: ECU 进入开环, 混合气仍偏浓\n3. 测量燃油压力: 4.8 bar (正常 3.5-4.0)\n4. 检查燃油压力调节器: 膜片破裂',
    solution: '更换氧传感器和燃油压力调节器。短期燃油修正恢复至 -2%, 长期恢复至 0%。CO 降至 0.35 g/km。',
    result: 'resolved'
  },
  {
    id: 5,
    title: '案例 #089: 排蓝烟 — 涡轮增压器油封泄漏',
    vehicle: '2017 柴油 SUV, 2.2L, 140kW, EU6b, 行驶里程 180,000km',
    problem: '加速时排气管冒蓝烟，机油消耗严重 (1L/1000km)，动力下降。',
    data: '机油消耗: 1.0 L/1000km (正常 < 0.5)\n涡轮增压压力: 最大 1.1 bar (标定 1.6 bar)\n中冷器: 大量机油残留\n涡轮径向间隙: 0.45mm',
    diagnosis: '1. 检查机油消耗: 无外漏迹象\n2. 检查排气: 怠速无烟, 加速冒蓝烟\n3. 拆检进气管: 大量机油\n4. 测量涡轮间隙: 径向间隙超标\n5. 涡轮轴密封环磨损',
    solution: '更换涡轮增压器总成，清洗中冷器和全部进气管路。更换机油和滤清器。复检机油消耗恢复至 0.1L/1000km。',
    result: 'resolved'
  },
  {
    id: 6,
    title: '案例 #531: EGR 导致 NOx 反复超标',
    vehicle: '2022 柴油轿车, 1.6L, 88kW, EU6d, 行驶里程 45,000km',
    problem: 'RDE NOx 间歇性超标，故障灯不亮，但不是每次测试都超标。',
    data: 'RDE NOx (第1次): 72 mg/km (超标)\nRDE NOx (第2次): 38 mg/km (正常)\nEGR 开度: 0-12% (标定 0-40%)\nEGR 冷却器出口温度: 85°C (正常 < 60°C)',
    diagnosis: '1. 读取 EGR 数据: 开度限值 12%, 标定为 40%\n2. 手动激活 EGR 阀: 响应正常\n3. 检查 EGR 冷却器: 冷却效率下降\n4. EGR 冷却器内部部分堵塞, 导致进气温度过高, ECU 限制 EGR',
    solution: '清洗 EGR 冷却器和水道，更换冷却液。重新测试 EGR 开度恢复至 0-38%, RDE NOx = 35 mg/km。',
    result: 'resolved'
  },
  {
    id: 7,
    title: '案例 #672: 碳罐电磁阀故障导致 HC 偶发超标',
    vehicle: '2021 汽油轿车, 1.4L, 90kW, EU6d, 行驶里程 55,000km',
    problem: '实验室 WLTC HC 偶发超标 (130 mg/km), 非偶发时正常 (45 mg/km)。',
    data: 'HC (超标): 130 mg/km\nHC (正常): 45 mg/km\n燃油蒸发系统: 多次 DTC P0441\n碳罐电磁阀占空比: 100% 恒开',
    diagnosis: '1. 分析超标时刻: 均发生在减速断油后\n2. 碳罐电磁阀状态: 卡滞在全开位置\n3. 减速时进气歧管真空度大, 大量燃油蒸气进入\n4. 空燃比瞬间过浓, HC 升高',
    solution: '更换碳罐电磁阀。重新测试 HC 稳定在 38-45 mg/km。建议每 80,000km 检查碳罐系统。',
    result: 'resolved'
  }
]

// ============ Reference Values ============
const referenceValues = [
  {
    parameter: '进气歧管压力 (MAP)',
    normal: '25-60 kPa (怠速) / 80-250 kPa (负荷)',
    caution: '60-80 kPa 或 250-280 kPa',
    abnormal: '< 25 kPa 或 > 280 kPa',
    unit: 'kPa'
  },
  {
    parameter: '排气温度 (排气管)',
    normal: '150-300°C (怠速) / 300-650°C (行驶)',
    caution: '650-750°C 或 100-150°C',
    abnormal: '> 750°C (危险) 或 < 100°C',
    unit: '°C'
  },
  {
    parameter: 'Lambda (空燃比)',
    normal: '0.97-1.03 (闭环)',
    caution: '0.85-0.97 或 1.03-1.15',
    abnormal: '< 0.85 或 > 1.15',
    unit: '-'
  },
  {
    parameter: 'EGR 开度/率',
    normal: '0-40% (开度) / 5-30% (EGR率)',
    caution: '40-50% (开度) / 30-40% (EGR率)',
    abnormal: '恒定为 0% 或 > 50% (开度)',
    unit: '%'
  },
  {
    parameter: 'DPF 差压',
    normal: '3-30 mbar (清洁) / 30-50 mbar (正常)',
    caution: '50-100 mbar (需再生)',
    abnormal: '> 100 mbar (堵塞)',
    unit: 'mbar'
  },
  {
    parameter: 'SCR NOx 转化效率',
    normal: '70-99%',
    caution: '50-70%',
    abnormal: '< 50%',
    unit: '%'
  },
  {
    parameter: '进气温度 (IAT)',
    normal: '环境温度 ~ 50°C',
    caution: '50-70°C',
    abnormal: '> 70°C (增压后冷却不足)',
    unit: '°C'
  },
  {
    parameter: '冷却液温度',
    normal: '85-105°C (热机)',
    caution: '105-115°C 或 70-85°C',
    abnormal: '> 115°C 或 < 70°C (热机后)',
    unit: '°C'
  },
  {
    parameter: '燃油压力 (高压共轨)',
    normal: '200-500 bar (怠速) / 1200-2200 bar (负荷)',
    caution: '500-700 bar 或 1000-1200 bar',
    abnormal: '< 200 bar 或 > 2500 bar',
    unit: 'bar'
  },
  {
    parameter: '氧传感器电压 (窄带)',
    normal: '0.1-0.9V (周期性波动)',
    caution: '0.1-0.3V 或 0.7-0.9V 稳定',
    abnormal: '恒定 0.45V 或 < 0.1V 或 > 0.9V',
    unit: 'V'
  },
  {
    parameter: '涡轮增压压力',
    normal: '0.8-1.2 bar (怠速) / 1.2-2.5 bar (满负荷)',
    caution: '比标定低 0.2-0.5 bar',
    abnormal: '比标定低 > 0.5 bar 或超压',
    unit: 'bar'
  },
  {
    parameter: 'MAF (质量空气流量)',
    normal: '2-6 g/s (怠速) / 50-200 g/s (满负荷)',
    caution: '偏离标定值 15-25%',
    abnormal: '偏离标定值 > 25%',
    unit: 'g/s'
  }
]
</script>

<style scoped>
.diagnostic-assistant {
  height: 100%;
  background: #1a1f2e;
  color: #c8d0e0;
  padding: 16px;
  overflow-y: auto;
}

.da-tabs {
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

/* Steps */
.diag-steps {
  margin: 24px 0;
  padding: 0 20px;
}

:deep(.el-step__head.is-process) {
  color: #ff6b35;
  border-color: #ff6b35;
}

:deep(.el-step__head.is-wait) {
  color: #2c3450;
  border-color: #2c3450;
}

:deep(.el-step__head.is-success) {
  color: #67c23a;
  border-color: #67c23a;
}

:deep(.el-step__title.is-process) {
  color: #ff6b35;
  font-weight: 600;
  font-size: 13px;
}

:deep(.el-step__title.is-wait) {
  color: #566185;
  font-size: 13px;
}

:deep(.el-step__title.is-success) {
  color: #67c23a;
  font-size: 13px;
}

:deep(.el-step__description) {
  display: none;
}

.step-content {
  max-width: 900px;
  margin: 0 auto;
}

.select-card {
  min-height: 300px;
}

/* Pollutant selection */
.pollutant-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: 16px 0;
}

.pollutant-btn {
  margin: 0 !important;
}

.pollutant-btn :deep(.el-radio-button__inner) {
  width: 130px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #141824;
  border: 1px solid #2c3450;
  color: #8892b0;
  border-radius: 8px !important;
  padding: 0;
}

.pollutant-btn :deep(.el-radio-button__inner:hover) {
  background: #1c2335;
  color: #ff6b35;
}

.pollutant-btn :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: rgba(255, 107, 53, 0.15);
  border-color: #ff6b35;
  color: #ff6b35;
  box-shadow: none;
}

.pollutant-option {
  text-align: center;
}

.pollutant-icon {
  display: block;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.pollutant-name {
  display: block;
  font-size: 11px;
  opacity: 0.7;
}

/* Engine selection */
.engine-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: 16px 0;
}

.engine-btn {
  margin: 0 !important;
}

.engine-btn :deep(.el-radio-button__inner) {
  width: 160px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #141824;
  border: 1px solid #2c3450;
  color: #8892b0;
  border-radius: 8px !important;
  padding: 0;
}

.engine-btn :deep(.el-radio-button__inner:hover) {
  background: #1c2335;
  color: #ff6b35;
}

.engine-btn :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: rgba(255, 107, 53, 0.15);
  border-color: #ff6b35;
  color: #ff6b35;
  box-shadow: none;
}

.engine-option {
  text-align: center;
}

.engine-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
}

.engine-sub {
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}

/* Condition selection */
.condition-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: 16px 0;
}

.condition-btn {
  margin: 0 !important;
}

.condition-btn :deep(.el-radio-button__inner) {
  width: 120px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #141824;
  border: 1px solid #2c3450;
  color: #8892b0;
  border-radius: 8px !important;
  padding: 0;
}

.condition-btn :deep(.el-radio-button__inner:hover) {
  background: #1c2335;
  color: #ff6b35;
}

.condition-btn :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: rgba(255, 107, 53, 0.15);
  border-color: #ff6b35;
  color: #ff6b35;
  box-shadow: none;
}

.condition-option {
  text-align: center;
}

.condition-icon {
  display: block;
  font-size: 22px;
  margin-bottom: 4px;
}

.condition-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.condition-sub {
  display: block;
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
}

/* Decision Tree */
.tree-card {
  min-height: 300px;
}

.question-box {
  margin-bottom: 12px;
}

.question-hint {
  margin-bottom: 16px;
}

.question-actions {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin: 24px 0;
}

.yes-btn, .no-btn {
  min-width: 140px;
  font-size: 15px;
}

.tree-path {
  background: #141824;
  border: 1px solid #2c3450;
  border-radius: 4px;
  padding: 12px;
}

.path-title {
  color: #8892b0;
  font-size: 12px;
  margin-bottom: 8px;
}

.path-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.path-tag {
  font-size: 11px;
}

.tree-complete {
  padding: 40px 0;
}

/* Results */
.diag-summary {
  margin-bottom: 12px;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.text-warning {
  color: #e6a23c;
  font-weight: 600;
}

.text-success {
  color: #67c23a;
  font-weight: 600;
}

:deep(.el-descriptions) {
  background: transparent;
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

/* Fault Library */
.search-input {
  margin-bottom: 8px;
}

:deep(.el-input__wrapper) {
  background: #141824;
  border: 1px solid #2c3450;
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: #c8d0e0;
}

:deep(.el-radio-button__inner) {
  background: #141824;
  border: 1px solid #2c3450;
  color: #8892b0;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: rgba(255, 107, 53, 0.15);
  border-color: #ff6b35;
  color: #ff6b35;
  box-shadow: none;
}

.fault-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fault-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.fault-name {
  color: #e6e9f0;
  font-weight: 600;
  font-size: 14px;
}

.fault-category-tag {
  margin-bottom: 8px;
}

.fault-section {
  margin-bottom: 6px;
  font-size: 12px;
}

.fault-section-title {
  color: #8892b0;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.fault-text {
  color: #c8d0e0;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

/* Case Library */
.case-card {
  height: 100%;
}

.case-section {
  margin-bottom: 8px;
}

.case-section-title {
  color: #8892b0;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.case-text {
  color: #c8d0e0;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

.case-text.mono {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background: #141824;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
}

/* Reference Values */
.ref-table {
  width: 100%;
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

.color-key-card {
  margin-top: 16px;
}

.color-key {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #c8d0e0;
}

.color-badge {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

:deep(.el-button--primary) {
  background: #ff6b35;
  border-color: #ff6b35;
}

:deep(.el-button--primary:hover) {
  background: #e85a26;
  border-color: #e85a26;
}

:deep(.el-table__body td) {
  border-bottom: 1px solid #1a1f2e;
}

:deep(.el-alert--warning) {
  background: rgba(230, 162, 60, 0.1);
  border: 1px solid rgba(230, 162, 60, 0.3);
  color: #e6a23c;
}

:deep(.el-alert--info) {
  background: rgba(68, 138, 255, 0.1);
  border: 1px solid rgba(68, 138, 255, 0.2);
  color: #8892b0;
}

:deep(.el-alert__title) {
  font-size: 14px;
  color: inherit;
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
</style>
