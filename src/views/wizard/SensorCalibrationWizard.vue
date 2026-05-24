<template>
  <div class="sensor-calibration-wizard">
    <!-- Header -->
    <div class="wizard-header">
      <h1 class="wizard-title">传感器安装与校准向导</h1>
      <p class="wizard-subtitle">Sensor Installation & Calibration Wizard</p>
    </div>

    <!-- Steps -->
    <el-steps
      :active="activeStep - 1"
      align-center
      finish-status="success"
      class="wizard-steps"
    >
      <el-step title="选择传感器类型" />
      <el-step title="安装要求" />
      <el-step title="校准方法" />
      <el-step title="校准记录" />
    </el-steps>

    <!-- Body -->
    <div class="wizard-body">
      <!-- STEP 1: Sensor Selection -->
      <div v-if="activeStep === 1" class="step-content">
        <h2 class="step-title">选择传感器类型</h2>
        <p class="step-desc">请选择需要安装和校准的传感器类型</p>

        <el-tabs v-model="sensorCategory" class="sensor-tabs">
          <el-tab-pane
            v-for="cat in sensorCategories"
            :key="cat.id"
            :label="cat.label"
            :name="cat.id"
          >
            <div class="sensor-grid">
              <div
                v-for="s in cat.sensors"
                :key="s.id"
                class="sensor-card"
                :class="{ selected: wizardData.sensorId === s.id }"
                @click="selectSensor(s)"
              >
                <div class="sensor-name">{{ s.name }}</div>
                <div class="sensor-range">{{ s.range }}</div>
                <el-icon v-if="wizardData.sensorId === s.id" class="check-badge">
                  <CircleCheck />
                </el-icon>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <transition name="fade">
          <div v-if="selectedSensor" class="sensor-detail-card">
            <el-card shadow="never">
              <template #header>
                <div class="sensor-detail-header">
                  <span class="card-title">{{ selectedSensor.name }} 详细信息</span>
                  <el-tag type="warning" effect="dark">{{ selectedSensor.category }}</el-tag>
                </div>
              </template>
              <div class="sensor-detail-body">
                <div class="sensor-image-placeholder">
                  <el-icon :size="48"><Monitor /></el-icon>
                  <span class="placeholder-text">传感器示意图占位</span>
                </div>
                <div class="sensor-specs">
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="测量范围">{{ selectedSensor.range }}</el-descriptions-item>
                    <el-descriptions-item label="精度">{{ selectedSensor.accuracy }}</el-descriptions-item>
                    <el-descriptions-item label="典型应用">{{ selectedSensor.application }}</el-descriptions-item>
                    <el-descriptions-item label="输出信号">{{ selectedSensor.output }}</el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-card>
          </div>
        </transition>
      </div>

      <!-- STEP 2: Installation Requirements -->
      <div v-if="activeStep === 2" class="step-content">
        <h2 class="step-title">安装要求</h2>
        <p class="step-desc">
          传感器：
          <strong>{{ selectedSensor?.name || '' }}</strong>
          <el-tag size="small" type="warning" class="ml-2" @click="activeStep = 1">(修改)</el-tag>
        </p>

        <div class="install-grid">
          <el-card shadow="never" class="install-card">
            <template #header>
              <span class="card-title"><el-icon><Position /></el-icon> 安装位置 / Position</span>
            </template>
            <p class="install-text">{{ installInfo.position }}</p>
            <p class="install-text" v-if="installInfo.depth"><strong>插入深度:</strong> {{ installInfo.depth }}</p>
          </el-card>

          <el-card shadow="never" class="install-card">
            <template #header>
              <span class="card-title"><el-icon><FullScreen /></el-icon> 安装方向 / Orientation</span>
            </template>
            <p class="install-text">{{ installInfo.orientation }}</p>
          </el-card>

          <el-card shadow="never" class="install-card">
            <template #header>
              <span class="card-title"><el-icon><Connection /></el-icon> 接线要求 / Wiring</span>
            </template>
            <p class="install-text">{{ installInfo.wiring }}</p>
            <p class="install-text" v-if="installInfo.connector"><strong>连接器:</strong> {{ installInfo.connector }}</p>
          </el-card>

          <el-card shadow="never" class="install-card">
            <template #header>
              <span class="card-title"><el-icon><Suitcase /></el-icon> 扭矩规格 / Torque</span>
            </template>
            <p class="install-text">{{ installInfo.torque }}</p>
          </el-card>

          <el-card shadow="never" class="install-card wide-card">
            <template #header>
              <span class="card-title"><el-icon><WarningFilled /></el-icon> 环境考虑 / Environment</span>
            </template>
            <p class="install-text">{{ installInfo.environment }}</p>
          </el-card>

          <el-card shadow="never" class="install-card wide-card">
            <template #header>
              <span class="card-title"><el-icon><Picture /></el-icon> 安装示意图 / Diagram</span>
            </template>
            <div class="diagram-placeholder">
              <el-icon :size="64"><PictureFilled /></el-icon>
              <span>安装示意图 (CSS placeholder)</span>
              <div class="diagram-note">Installation diagram will be displayed here</div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- STEP 3: Calibration Procedure -->
      <div v-if="activeStep === 3" class="step-content">
        <h2 class="step-title">校准方法</h2>
        <p class="step-desc">按照以下步骤完成传感器校准</p>

        <el-card shadow="never" class="cal-procedure-card">
          <template #header>
            <span class="card-title">校准步骤 / Calibration Procedure</span>
          </template>
          <el-steps direction="vertical" :active="calStepIndex" class="cal-steps">
            <el-step
              v-for="(step, idx) in calibrationProcedure"
              :key="idx"
              :title="'步骤 ' + (idx + 1)"
              :description="step"
            />
          </el-steps>
        </el-card>

        <div class="cal-supplement-grid">
          <el-card shadow="never" class="cal-supplement">
            <template #header>
              <span class="card-title">所需设备 / Required Equipment</span>
            </template>
            <ul class="equip-list">
              <li v-for="eq in requiredEquipment" :key="eq">{{ eq }}</li>
            </ul>
          </el-card>

          <el-card shadow="never" class="cal-supplement">
            <template #header>
              <span class="card-title">校准点 / Calibration Points</span>
            </template>
            <div class="cal-points">
              <div class="cal-point">
                <span class="cp-label">零点 (Zero)</span>
                <span class="cp-value">{{ calPoints.zero }}</span>
              </div>
              <div class="cal-point">
                <span class="cp-label">量程 (Span)</span>
                <span class="cp-value">{{ calPoints.span }}</span>
              </div>
              <div class="cal-point">
                <span class="cp-label">中间点 (Mid)</span>
                <span class="cp-value">{{ calPoints.mid }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="cal-supplement wide-supplement">
            <template #header>
              <span class="card-title">校准周期 / Frequency</span>
            </template>
            <p class="install-text">{{ calFrequency }}</p>
          </el-card>

          <el-card shadow="never" class="cal-supplement wide-supplement">
            <template #header>
              <span class="card-title">常见错误与故障排除 / Common Errors</span>
            </template>
            <div v-for="(err, idx) in commonErrors" :key="idx" class="error-item">
              <el-tag size="small" type="danger" class="err-tag">Error {{ idx + 1 }}</el-tag>
              <span>{{ err }}</span>
            </div>
          </el-card>
        </div>
      </div>

      <!-- STEP 4: Calibration Record -->
      <div v-if="activeStep === 4" class="step-content">
        <h2 class="step-title">校准记录</h2>
        <p class="step-desc">填写并生成校准记录</p>

        <el-card shadow="never" class="record-card">
          <template #header>
            <span class="card-title">校准证书 / Calibration Certificate</span>
          </template>

          <el-descriptions :column="2" border class="record-descriptions">
            <el-descriptions-item label="传感器类型" :span="2">{{ selectedSensor?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="传感器编号">{{ recordData.serialNumber }}</el-descriptions-item>
            <el-descriptions-item label="测量范围">{{ selectedSensor?.range || '-' }}</el-descriptions-item>
            <el-descriptions-item label="精度等级">{{ selectedSensor?.accuracy || '-' }}</el-descriptions-item>
            <el-descriptions-item label="校准日期">{{ recordData.calDate }}</el-descriptions-item>
            <el-descriptions-item label="校准人员">
              <el-input v-model="recordData.technician" placeholder="请输入姓名" size="small" class="inline-input" />
            </el-descriptions-item>
            <el-descriptions-item label="下次校准日期">
              <el-date-picker
                v-model="recordData.nextCalDate"
                type="date"
                placeholder="选择日期"
                size="small"
                class="inline-input"
                value-format="YYYY-MM-DD"
              />
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <h3 class="section-title">校准数据 / Calibration Data</h3>
          <el-table :data="calibrationDataTable" stripe size="small" class="cal-table">
            <el-table-column prop="point" label="校准点" width="100" />
            <el-table-column prop="standard" label="标准值" width="120" />
            <el-table-column label="As-Found (实测值)">
              <template #default="{ row }">
                <el-input v-model="row.asFound" size="small" class="table-input" />
              </template>
            </el-table-column>
            <el-table-column label="As-Left (调整后)">
              <template #default="{ row }">
                <el-input v-model="row.asLeft" size="small" class="table-input" />
              </template>
            </el-table-column>
            <el-table-column label="误差">
              <template #default="{ row }">
                <span :class="getErrorClass(row)">{{ getError(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.pass ? 'success' : 'danger'" size="small">
                  {{ row.pass ? 'PASS' : 'FAIL' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <!-- Overall Status -->
          <div class="overall-status">
            <span class="status-label">整体判定:</span>
            <el-tag :type="overallPass ? 'success' : 'danger'" size="large" effect="dark">
              {{ overallPass ? '通过 (PASS)' : '不通过 (FAIL)' }}
            </el-tag>
          </div>

          <el-divider />

          <div class="record-actions">
            <el-button type="primary" :icon="Download" @click="mockAction('下载校准记录')">下载记录 / Download Record</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Navigation -->
    <div class="wizard-footer">
      <el-button
        v-if="activeStep > 1"
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
        {{ activeStep === 3 ? '生成记录' : '下一步' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  CircleCheck, ArrowLeft, ArrowRight, Download,
  Monitor, Position, FullScreen, Connection,
  Suitcase, WarningFilled, Picture, PictureFilled
} from '@element-plus/icons-vue'

const activeStep = ref(1)
const sensorCategory = ref('temperature')

const wizardData = reactive({
  sensorId: '',
  serialNumber: 'SN-' + Math.random().toString(36).substring(2, 8).toUpperCase()
})

// ---- Sensor Database ----
const sensorCategories = [
  {
    id: 'temperature',
    label: '温度传感器 (Temperature)',
    sensors: [
      { id: 'k-tc', name: 'K-type TC', category: '温度', range: '-200 ~ 1370 °C', accuracy: '±0.4%', application: '排气温度、发动机测温', output: 'mV (热电偶)' },
      { id: 't-tc', name: 'T-type TC', category: '温度', range: '-250 ~ 400 °C', accuracy: '±0.5%', application: '低温精密测量', output: 'mV (热电偶)' },
      { id: 'j-tc', name: 'J-type TC', category: '温度', range: '0 ~ 760 °C', accuracy: '±0.75%', application: '工业炉窑', output: 'mV (热电偶)' },
      { id: 'n-tc', name: 'N-type TC', category: '温度', range: '-200 ~ 1300 °C', accuracy: '±0.4%', application: '高温高精度测量', output: 'mV (热电偶)' },
      { id: 'pt100', name: 'PT100 (RTD)', category: '温度', range: '-200 ~ 850 °C', accuracy: '±0.1°C (Class A)', application: '实验室、环境温度、进气温度', output: '电阻 (100Ω @ 0°C)' },
      { id: 'pt1000', name: 'PT1000 (RTD)', category: '温度', range: '-200 ~ 850 °C', accuracy: '±0.15°C (Class A)', application: '高精度低温测量', output: '电阻 (1000Ω @ 0°C)' },
      { id: 'ntc', name: 'NTC 热敏电阻', category: '温度', range: '-40 ~ 300 °C', accuracy: '±0.5°C (典型)', application: '冷却液温度、进气温度', output: '电阻 (负温度系数)' }
    ]
  },
  {
    id: 'pressure',
    label: '压力传感器 (Pressure)',
    sensors: [
      { id: 'map', name: 'MAP Sensor', category: '压力', range: '0 ~ 5 bar abs', accuracy: '±0.5% FSO', application: '进气歧管绝对压力', output: '0.5-4.5V 模拟' },
      { id: 'piezoresistive', name: 'Piezoresistive', category: '压力', range: '0 ~ 2000 bar', accuracy: '±0.25% FSO', application: '缸压、共轨压力', output: 'mV/V 或 4-20mA' },
      { id: 'piezoelectric', name: 'Piezoelectric', category: '压力', range: '0 ~ 300 bar', accuracy: '±1% FSO', application: '动态缸压测量', output: '电荷信号 (pC)' }
    ]
  },
  {
    id: 'oxygen',
    label: '氧传感器 (Oxygen)',
    sensors: [
      { id: 'switching', name: 'Switching O2', category: '氧气', range: 'Lambda 0.8-1.2', accuracy: '±0.1 Lambda', application: '空燃比闭环控制 (SI)', output: '0-1V 阶跃信号' },
      { id: 'lsu42', name: 'Wideband LSU 4.2', category: '氧气', range: 'Lambda 0.65-∞', accuracy: '±0.01 Lambda', application: '宽带空燃比测量', output: '0-5V 线性' },
      { id: 'lsu49', name: 'Wideband LSU 4.9', category: '氧气', range: 'Lambda 0.65-∞', accuracy: '±0.007 Lambda', application: '宽带空燃比测量 (新一代)', output: 'CAN / 0-5V' }
    ]
  },
  {
    id: 'flow',
    label: '流量传感器 (Flow)',
    sensors: [
      { id: 'maf-hotwire', name: 'MAF (Hot Wire)', category: '流量', range: '0 ~ 600 kg/h', accuracy: '±2%', application: '发动机进气质量流量', output: '0-5V 频率信号' },
      { id: 'maf-hotfilm', name: 'MAF (Hot Film)', category: '流量', range: '0 ~ 800 kg/h', accuracy: '±1.5%', application: '发动机进气质量流量 (高精度)', output: '0-5V 或 频率' }
    ]
  }
]

const selectedSensor = computed(() => {
  for (const cat of sensorCategories) {
    const s = cat.sensors.find(s => s.id === wizardData.sensorId)
    if (s) return s
  }
  return null
})

function selectSensor(s) {
  wizardData.sensorId = s.id
}

// ---- Installation Info ----
const installInfo = computed(() => {
  const s = selectedSensor.value
  if (!s) return {}

  const info = {
    position: '安装在排气系统直管段，距离发动机排气歧管出口 300-500mm。安装位置应避免弯头、变径等气流扰动区域，确保测量代表性。',
    torque: 'M12 x 1.5 螺纹，安装扭矩 20-30 Nm。使用铜垫片或抗高温防咬死涂层。',
    environment: '工作环境温度：-40 ~ 85°C。传感器本体需耐 200°C 辐射热。振动等级：< 10g RMS。需考虑防水防尘 (IP67 以上)。'
  }

  if (s.category === '温度') {
    if (s.id.startsWith('pt') || s.id === 'ntc') {
      info.position = '插入管道中心线位置，插入深度为管道直径的 1/3 ~ 2/3。使用热电阻套管 (Thermowell) 安装于高压或流动介质中。'
      info.depth = '管道外径的 1/2 ~ 2/3'
      info.orientation = '水平管道从侧面或底部 45° 安装；垂直管道从侧面水平安装。感温端逆流安装。'
      info.wiring = '三线制或四线制连接以消除引线电阻影响。使用屏蔽双绞线，屏蔽层单端接地。'
      info.connector = 'M12 x 1 圆形连接器 (4-pin)'
      info.torque = 'M20 x 1.5 或 1/2" NPT 螺纹，安装扭矩 25-35 Nm。使用 PTFE 密封带。'
    } else {
      info.position = '热电偶插入深度至少为管道直径的 5-10 倍。对于非接触测量，距离目标表面 10-50mm。'
      info.depth = '管道内径的 5-10 倍 (插入式)'
      info.orientation = '推荐水平或向下 45° 安装，避免水分积聚在接线端。热电偶接点应位于气流中心。'
      info.wiring = '使用与热电偶类型匹配的补偿导线。避免与动力电缆并行敷设。'
      info.connector = 'Miniature 标准热电偶插头'
      info.torque = '安装法兰螺栓扭矩 10-15 Nm'
    }
  } else if (s.category === '压力') {
    if (s.id === 'piezoelectric') {
      info.position = '传感器直接安装于测量点，避免使用长引压管 (会影响动态响应)。'
      info.depth = '齐平安装 (Flush Mount)'
      info.orientation = '垂直安装，膜片朝下以避免积碳/水分积聚。'
      info.wiring = '使用低噪声同轴电缆。电荷放大器应靠近传感器安装 (距离 < 5m)。'
      info.connector = 'BNC / 10-32 UNF'
      info.torque = 'M5 x 0.8 螺纹，扭矩 5-8 Nm'
      info.environment = '工作温度 -50 ~ 250°C (水冷型可达 500°C)。抗振动 100g。需定期清洁膜片。'
    } else {
      info.position = '引压管安装于管道侧面或顶部。引压管长度尽量短 (< 2m)，倾斜向下以利于排水。'
      info.depth = '标准压力接口'
      info.orientation = '垂直或水平安装，膜片垂直向下。'
      info.wiring = '4-20mA 回路使用双绞屏蔽线。供电电压 12-36V DC。'
      info.connector = 'M12 x 1 圆形连接器 (4-pin) 或 飞线'
      info.torque = 'G1/4" 或 1/4" NPT，扭矩 15-25 Nm'
    }
  } else if (s.category === '氧气') {
    info.position = '安装在排气歧管后方 500-1000mm 处，确保传感器加热后不被排气冷却过度。'
    info.depth = '传感器探头伸入排气管 20-30mm'
    info.orientation = '水平安装或向下倾斜 10-30°，避免冷凝水积聚在传感器内部。安装角度自水平向上不超过 90°。'
    info.wiring = '宽带氧传感器需使用专用控制器 (LSU 控制器)。6-pin 或 4-pin 专用线束。加热器电源需 12V/3A 以上。'
    info.connector = '专用 6-pin (LSU) 或 4-pin (Switching)'
    info.torque = 'M18 x 1.5 螺纹，扭矩 40-50 Nm。使用抗高温防咬死涂层。'
    info.environment = '排气温度：-40 ~ 900°C。传感器本体耐温 250°C。需定期清洁探头积碳。'
  } else if (s.category === '流量') {
    info.position = '安装在空气滤清器后、节气门/增压器前的直管段。上游直管段 > 5 倍管径，下游 > 3 倍管径。'
    info.depth = '传感器位于管道中心'
    info.orientation = '安装方向与气流方向一致 (外壳有箭头标记)。水平或垂直安装均可。'
    info.wiring = '使用屏蔽线。频率信号输出使用双绞屏蔽线。供电电压 5V 或 12V。'
    info.connector = '6-pin 矩形连接器 (Bosch/JT)'
    info.torque = '卡箍式安装，卡箍扭矩 3-5 Nm'
    info.environment = '进气温度 -40 ~ 120°C。需防水防尘。传感器热膜/热线易受污染，需定期清洁。'
  }

  return info
})

// ---- Calibration Procedure ----
const calStepIndex = computed(() => -1) // inactive, show all

const calibrationProcedure = computed(() => {
  const s = selectedSensor.value
  if (!s) return ['请先选择传感器']

  const base = [
    '将传感器连接到校准设备和数据采集系统，预热 30 分钟以上以达到热稳定。',
    '确认校准设备 (标准器) 在有效期内，精度等级至少为被校传感器的 3 倍。',
    '进行零点校准：将传感器置于零参考条件下，调整零点偏移至标准值。',
    '进行量程校准：将传感器置于满量程参考条件下，调整增益/斜率至标准值。',
    '记录 As-Found 和 As-Left 数据。'
  ]

  if (s.category === '温度') {
    if (s.id.startsWith('pt') || s.id === 'ntc') {
      base.splice(2, 0, '将电阻标准箱连接到传感器端子，模拟 0°C (100Ω 或 1000Ω) 进行零点校验。')
      base.splice(4, 0, '将电阻标准箱连接，模拟 100°C (138.5Ω PT100 / 1385Ω PT1000) 进行量程校验。')
      base.splice(5, 0, '中间点校验：50°C、200°C 等至少一个中间点线性度检查。')
    } else {
      base.splice(2, 0, '将热电偶参考端置于 0°C (冰点槽) 或使用参考端补偿。')
      base.splice(3, 0, '使用干井炉或管式炉提供标准温度，从低温到高温逐点校验 (至少 5 个点)。')
      base.splice(5, 0, '升温/降温滞回测试：记录升温与降温曲线的差异。')
    }
  } else if (s.category === '压力') {
    base.splice(2, 0, '使用压力标准器 (活塞式压力计或数字压力标准器)。')
    base.splice(3, 0, '零点校准：通大气压力 (绝压传感器需真空参考)。')
    base.splice(4, 0, '量程校准：施加满量程压力的 50%、100% 逐点校验。')
  } else if (s.category === '氧气') {
    base.splice(2, 0, 'Lambda 零点：通入环境空气 (Lambda = 1.0 或 20.9% O₂)。')
    base.splice(3, 0, 'Lambda 量程：使用标准混合气 (Lambda = 0.7 或 1.3) 校验。')
    base.splice(4, 0, '动态响应测试：阶跃变化 Lambda，记录响应时间 (t90 < 100ms)。')
  } else if (s.category === '流量') {
    base.splice(2, 0, '使用标准流量标定台 (音速喷嘴或转子流量计)。')
    base.splice(3, 0, '零点：关闭气流，确认输出为 0 Hz 或 0V。')
    base.splice(4, 0, '量程：在满量程流量的 20%、40%、60%、80%、100% 各点校验。')
  }

  return base
})

const requiredEquipment = computed(() => {
  const s = selectedSensor.value
  if (!s) return []

  const base = ['数字万用表 (6.5 位以上)', '精密直流电源', '数据采集系统']

  if (s.category === '温度') {
    base.push('干井炉或恒温槽 (-40 ~ 1400°C)')
    base.push('标准铂电阻温度计 (SPRT)')
    if (s.id.startsWith('pt')) base.push('精密电阻标准箱')
    else base.push('冰点槽 (0°C 参考端)')
  } else if (s.category === '压力') {
    base.push('数字压力控制器/活塞式压力计')
    base.push('真空泵 (绝压传感器校准)')
  } else if (s.category === '氧气') {
    base.push('标准气体 (多种 Lambda 值)')
    base.push('氧传感器控制器/LSU 控制器')
  } else if (s.category === '流量') {
    base.push('音速喷嘴流量标定台')
    base.push('频率计/示波器')
  }

  return base
})

const calPoints = computed(() => {
  const s = selectedSensor.value
  if (!s) return { zero: '-', span: '-', mid: '-' }

  if (s.category === '温度') {
    return { zero: '0°C (冰点)', span: s.range.split('~')[1]?.trim() || '500°C', mid: '中间温度点' }
  } else if (s.category === '压力') {
    return { zero: '0 bar (大气/真空)', span: s.range.split('~')[1]?.trim() || '满量程', mid: '50% 量程' }
  } else if (s.category === '氧气') {
    return { zero: 'Lambda 1.0 (空气)', span: 'Lambda 0.7 或 1.3', mid: 'Lambda 0.85 或 1.15' }
  } else {
    return { zero: '0 kg/h (关闭)', span: '满量程 100%', mid: '50% 量程' }
  }
})

const calFrequency = computed(() => {
  const s = selectedSensor.value
  if (!s) return ''
  if (s.category === '温度') return '推荐每 6 个月校准一次。对于关键应用 (排放测试)，建议每 3 个月校准一次。'
  if (s.category === '压力') return '推荐每 12 个月校准一次。高精度应用每 6 个月。'
  if (s.category === '氧气') return '推荐每 3 个月校准一次。频繁使用或高精度排放测试每月一次。'
  if (s.category === '流量') return '推荐每 12 个月校准一次。受污染环境中每 6 个月。'
  return ''
})

const commonErrors = computed(() => {
  const s = selectedSensor.value
  if (!s) return []

  const base = ['接线错误或接触不良导致的读数异常', '电磁干扰 (EMI) 导致信号噪声']

  if (s.category === '温度') {
    base.push('热电偶参考端温度补偿错误')
    base.push('热电阻自热效应导致读数偏高')
    base.push('插入深度不足导致测量偏差')
  } else if (s.category === '压力') {
    base.push('引压管堵塞或泄漏')
    base.push('膜片污染导致零点漂移')
    base.push('安装扭矩不当导致膜片变形')
  } else if (s.category === '氧气') {
    base.push('传感器加热不足 (排气温度过低)')
    base.push('探头积碳导致响应变慢')
    base.push('参考空气腔污染')
  } else if (s.category === '流量') {
    base.push('热膜/热线污染导致灵敏度下降')
    base.push('气流扰动 (直管段不足) 导致测量误差')
    base.push('回火损坏传感器')
  }

  return base
})

// ---- Calibration Record Data ----
const recordData = reactive({
  serialNumber: wizardData.serialNumber,
  technician: '',
  calDate: new Date().toISOString().slice(0, 10),
  nextCalDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
})

const calibrationDataTable = computed(() => {
  const points = ['零点', '50% 量程', '100% 量程']
  const standards = ['0.00', '50.00', '100.00']
  return points.map((p, i) => ({
    point: p,
    standard: standards[i],
    asFound: '',
    asLeft: '',
    pass: true
  }))
})

function getError(row) {
  if (!row.asFound || !row.asLeft) return '-'
  const err = Math.abs(parseFloat(row.asLeft) - parseFloat(row.standard))
  return err.toFixed(2)
}

function getErrorClass(row) {
  if (!row.asFound || !row.asLeft) return ''
  const err = Math.abs(parseFloat(row.asLeft) - parseFloat(row.standard))
  return err > 1 ? 'error-high' : 'error-low'
}

const overallPass = computed(() => {
  return calibrationDataTable.value.every(r => r.pass !== false)
})

// ---- Navigation ----
const canProceed = computed(() => {
  switch (activeStep.value) {
    case 1: return !!wizardData.sensorId
    case 2: return true
    case 3: return true
    default: return true
  }
})

function nextStep() {
  if (activeStep.value < 4) activeStep.value++
}
function prevStep() {
  if (activeStep.value > 1) activeStep.value--
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

.sensor-calibration-wizard {
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
  max-width: 900px;
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

// ---- Step 1: Sensor Selection ----
.sensor-tabs {
  :deep(.el-tabs__item) {
    color: $gray;
    font-size: 14px;
    &.is-active { color: $orange; }
  }
  :deep(.el-tabs__active-bar) { background: $orange; }
  :deep(.el-tabs__nav-wrap::after) { background: #333; }
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.sensor-card {
  position: relative;
  background: $bg-dark;
  border: 2px solid #333;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;

  &:hover { border-color: $orange; background: rgba($orange, 0.05); }
  &.selected {
    border-color: $orange;
    background: rgba($orange, 0.1);
    box-shadow: 0 0 16px rgba($orange, 0.12);
  }

  .sensor-name { font-size: 15px; font-weight: 600; color: $white; margin-bottom: 4px; }
  .sensor-range { font-size: 12px; color: $gray; }
  .check-badge { position: absolute; top: 6px; right: 6px; color: $orange; font-size: 18px; }
}

.sensor-detail-card {
  margin-top: 20px;

  .card-title { color: $orange; font-weight: 600; font-size: 15px; }

  .sensor-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sensor-detail-body {
    display: flex;
    gap: 24px;

    .sensor-image-placeholder {
      width: 200px;
      min-height: 160px;
      background: #222;
      border: 2px dashed #444;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: $gray;
      flex-shrink: 0;

      .placeholder-text { font-size: 12px; }
    }

    .sensor-specs { flex: 1; }
  }

  :deep(.el-card__body) {
    background: $bg-dark;
  }
  :deep(.el-descriptions__label) { background: #222; color: $gray; border-color: #333; }
  :deep(.el-descriptions__content) { background: $bg-dark; color: $white; border-color: #333; }
}

// ---- Step 2: Installation ----
.install-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .wide-card { grid-column: 1 / -1; }
}

.install-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  .card-title {
    color: $orange;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .install-text {
    color: $white;
    font-size: 14px;
    line-height: 1.7;
    margin: 0 0 8px;

    &:last-child { margin-bottom: 0; }
  }

  .diagram-placeholder {
    min-height: 200px;
    background: #222;
    border: 2px dashed #444;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: $gray;
    font-size: 14px;

    .diagram-note { font-size: 12px; opacity: 0.6; }
  }
}

// ---- Step 3: Calibration ----
.cal-procedure-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;
  margin-bottom: 16px;

  .card-title { color: $orange; font-weight: 600; font-size: 14px; }

  .cal-steps {
    :deep(.el-step__title) { color: $white; font-size: 14px; }
    :deep(.el-step__description) { color: $gray; font-size: 13px; line-height: 1.6; }
    :deep(.el-step__head) { color: $orange; border-color: $orange; }
    :deep(.el-step__line) { background: #444; }
  }
}

.cal-supplement-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .wide-supplement { grid-column: 1 / -1; }
}

.cal-supplement {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  .card-title { color: $orange; font-weight: 600; font-size: 14px; }

  .equip-list {
    margin: 0;
    padding-left: 18px;

    li {
      color: $white;
      font-size: 14px;
      margin-bottom: 6px;
      line-height: 1.5;
    }
  }

  .cal-points {
    .cal-point {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #333;
      font-size: 14px;

      &:last-child { border-bottom: none; }

      .cp-label { color: $gray; }
      .cp-value { color: $white; font-weight: 500; }
    }
  }

  .error-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 10px;
    color: $white;
    font-size: 14px;
    line-height: 1.5;

    .err-tag { flex-shrink: 0; margin-top: 1px; }
  }

  .install-text {
    color: $white;
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
  }
}

// ---- Step 4: Record ----
.record-card {
  background: $bg-dark;
  border: 1px solid #333;
  border-radius: 10px;

  .card-title { color: $orange; font-weight: 600; font-size: 16px; }

  .section-title {
    color: $white;
    font-size: 15px;
    margin: 0 0 12px;
    font-weight: 600;
  }

  .inline-input {
    width: 100%;
    max-width: 220px;
  }

  .table-input {
    max-width: 120px;
  }

  .cal-table {
    margin-bottom: 16px;
  }

  .overall-status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;

    .status-label { color: $gray; font-size: 15px; }
  }

  .record-actions {
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }

  :deep(.el-descriptions__title) { color: $orange; }
  :deep(.el-descriptions__label) { background: #222; color: $gray; border-color: #333; }
  :deep(.el-descriptions__content) { background: $bg-dark; color: $white; border-color: #333; }
  :deep(.el-table) {
    --el-table-bg-color: $bg-dark;
    --el-table-tr-bg-color: $bg-dark;
    --el-table-header-bg-color: #222;
    --el-table-row-hover-bg-color: #333;
    color: $white;
    border: 1px solid #333;
  }
  :deep(.el-table th.el-table__cell) { color: $orange; border-color: #333; }
  :deep(.el-table td.el-table__cell) { border-color: #333; }
  :deep(.el-divider) { border-color: #333; }
}

.error-high { color: #f44336; font-weight: 600; }
.error-low { color: #4CAF50; }

// ---- Navigation ----
.wizard-footer {
  max-width: 900px;
  margin: 32px auto 0;
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #333;
}

// ---- Element Plus Overrides ----
:deep(.el-form-item__label) { color: $gray; font-size: 13px; }
:deep(.el-input__wrapper) { background: #222; border-color: #444; box-shadow: none; }
:deep(.el-input__inner) { color: $white; }
:deep(.el-input-number__increase), :deep(.el-input-number__decrease) { background: #333; color: $white; border-color: #444; }
:deep(.el-card__header) { border-bottom: 1px solid #333; }
:deep(.el-card__body) { background: $bg-dark; }
:deep(.el-date-editor) { --el-date-editor-width: 100%; }
:deep(.el-picker-panel) { background: $bg-dark; border-color: #444; }
:deep(.el-date-table td) { color: $white; }
:deep(.el-date-table td.today) { color: $orange; }
:deep(.el-month-table td .cell) { color: $white; }
:deep(.el-year-table td .cell) { color: $white; }

.ml-2 { margin-left: 8px; cursor: pointer; }

// ---- Animations ----
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
