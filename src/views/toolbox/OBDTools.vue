<template>
  <div class="obd-tools">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: PID Decoder -->
      <el-tab-pane label="PID 解码器" name="pid">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>PID 配置</span>
              </template>
              <el-form label-position="top" size="small">
                <el-form-item label="模式 (Mode)">
                  <el-select v-model="selectedMode" style="width:100%">
                    <el-option v-for="m in modes" :key="m.value" :label="m.label" :value="m.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="PID">
                  <el-select v-model="selectedPID" filterable style="width:100%">
                    <el-option v-for="p in pidList" :key="p.code" :label="p.label" :value="p.code">
                      <span style="float:left">{{ p.code }}</span>
                      <span style="float:right;color:#909399;font-size:12px">{{ p.label }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="原始十六进制数据">
                  <el-input v-model="rawHex" placeholder="例如: 410C1A90" @input="autoDecode" />
                </el-form-item>
                <el-button type="primary" @click="decodePID" size="small">解码</el-button>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never">
              <template #header>
                <span>解码结果</span>
              </template>
              <div v-if="decodedResult" class="decode-result">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="参数">{{ decodedResult.paramName }}</el-descriptions-item>
                  <el-descriptions-item label="原始值">{{ decodedResult.rawValue }}</el-descriptions-item>
                  <el-descriptions-item label="解码值">
                    <el-tag type="success" size="large">{{ decodedResult.decodedValue }} {{ decodedResult.unit }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="状态" v-if="decodedResult.status">
                    <el-tag :type="decodedResult.status === '正常' ? 'success' : decodedResult.status === '警告' ? 'warning' : 'danger'">
                      {{ decodedResult.status }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
                <el-card shadow="never" style="margin-top:12px;background:#f5f7fa">
                  <template #header>
                    <span>计算公式</span>
                  </template>
                  <pre class="formula-display">{{ decodedResult.formula }}</pre>
                </el-card>
                <el-card shadow="never" style="margin-top:8px;background:#f5f7fa" v-if="decodedResult.explanation">
                  <template #header>
                    <span>说明</span>
                  </template>
                  <p style="font-size:13px;color:#606266">{{ decodedResult.explanation }}</p>
                </el-card>
              </div>
              <el-empty v-else description="输入十六进制数据并点击解码" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 2: DTC Lookup -->
      <el-tab-pane label="DTC 查询" name="dtc">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>DTC 查询</span>
              </template>
              <el-form label-position="top" size="small">
                <el-form-item label="输入 DTC 代码">
                  <el-input v-model="dtcInput" placeholder="例如: P0420, U0100, B0022" @keyup.enter="lookupDTC" />
                </el-form-item>
                <el-form-item label="搜索关键词">
                  <el-input v-model="dtcKeyword" placeholder="搜索描述或代码" @input="searchDTC" />
                </el-form-item>
                <el-form-item label="按类别筛选">
                  <el-select v-model="dtcCategory" style="width:100%" @change="filterDTC">
                    <el-option label="全部" value="" />
                    <el-option label="P - 动力总成 (Powertrain)" value="P" />
                    <el-option label="U - 网络 (Network)" value="U" />
                    <el-option label="B - 车身 (Body)" value="B" />
                    <el-option label="C - 底盘 (Chassis)" value="C" />
                  </el-select>
                </el-form-item>
              </el-form>
              <div class="dtc-quick-links">
                <span style="font-size:12px;color:#909399">常见故障码:</span>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
                  <el-tag v-for="code in ['P0420','P0300','P0171','P0135','P0401','P0455']" :key="code"
                    size="small" style="cursor:pointer" @click="dtcInput=code;lookupDTC()"
                  >{{ code }}</el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never" v-if="currentDTC">
              <template #header>
                <span>{{ currentDTC.code }} - {{ currentDTC.description }}</span>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="完整描述">{{ currentDTC.fullDescription }}</el-descriptions-item>
                <el-descriptions-item label="严重程度">
                  <el-tag :type="currentDTC.severity === '高' ? 'danger' : currentDTC.severity === '中' ? 'warning' : 'info'">
                    {{ currentDTC.severity }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="类别">
                  <el-tag>{{ currentDTC.category }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="可能原因">
                  <ul style="margin:4px 0;padding-left:20px">
                    <li v-for="(cause, i) in currentDTC.causes" :key="i">{{ cause }}</li>
                  </ul>
                </el-descriptions-item>
                <el-descriptions-item label="维修建议">
                  <ul style="margin:4px 0;padding-left:20px">
                    <li v-for="(fix, i) in currentDTC.fixes" :key="i">{{ fix }}</li>
                  </ul>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
            <el-card shadow="never" v-else>
              <template #header>
                <span>查询结果</span>
              </template>
              <div v-if="dtcSearchResults.length > 0">
                <el-table :data="dtcSearchResults" border stripe size="small" style="width:100%" @row-click="selectDTC">
                  <el-table-column prop="code" label="代码" width="100" />
                  <el-table-column prop="description" label="描述" />
                  <el-table-column prop="category" label="类别" width="100" />
                  <el-table-column prop="severity" label="严重程度" width="90">
                    <template #default="{ row }">
                      <el-tag :type="row.severity === '高' ? 'danger' : row.severity === '中' ? 'warning' : 'info'" size="small">
                        {{ row.severity }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-else description="输入 DTC 代码或关键词搜索" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 3: OBD Data Stream Analysis -->
      <el-tab-pane label="OBD 数据流分析" name="analysis">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>数据输入</span>
              </template>
              <el-input
                v-model="streamCSV"
                type="textarea"
                :rows="12"
                placeholder="粘贴CSV数据，格式:&#10;Time,RPM,Load,Speed,CoolantTemp&#10;0,800,25,0,85&#10;1,1200,45,20,87&#10;2,1800,60,35,88&#10;..."
              />
              <el-button type="primary" size="small" @click="parseStreamData" style="margin-top:8px">
                分析数据
              </el-button>
              <el-button size="small" @click="generateSampleStream" style="margin-top:8px;margin-left:4px">
                生成样本
              </el-button>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never" v-if="streamStats.length > 0">
              <template #header>
                <span>统计分析</span>
              </template>
              <el-table :data="streamStats" border stripe size="small" style="width:100%">
                <el-table-column prop="name" label="参数" width="120" />
                <el-table-column prop="min" label="最小值" width="90" />
                <el-table-column prop="max" label="最大值" width="90" />
                <el-table-column prop="avg" label="平均值" width="100" />
                <el-table-column prop="unit" label="单位" width="70" />
                <el-table-column label="趋势" min-width="200">
                  <template #default="{ row }">
                    <div class="trend-bar-container">
                      <div
                        class="trend-bar"
                        :style="{ width: row.trendPercent + '%', background: row.trendColor }"
                      />
                      <span class="trend-label">{{ row.currentValue }}</span>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            <el-card shadow="never" style="margin-top:12px" v-if="anomalies.length > 0">
              <template #header>
                <span>异常值提醒</span>
              </template>
              <el-table :data="anomalies" border stripe size="small" style="width:100%">
                <el-table-column prop="param" label="参数" width="100" />
                <el-table-column prop="value" label="异常值" width="100" />
                <el-table-column prop="time" label="时间(s)" width="80" />
                <el-table-column prop="reason" label="原因" />
                <el-table-column prop="suggestion" label="建议" />
              </el-table>
            </el-card>
            <el-empty v-else-if="streamCSV && streamStats.length === 0" description="请点击分析按钮" />
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 4: OBD Reference -->
      <el-tab-pane label="OBD 参考" name="reference">
        <el-collapse v-model="refCollapse">
          <el-collapse-item title="SAE J1979 模式表" name="modes">
            <el-table :data="modeTable" border stripe size="small" style="width:100%">
              <el-table-column prop="mode" label="Mode" width="80" />
              <el-table-column prop="name" label="名称" width="200" />
              <el-table-column prop="description" label="说明" />
            </el-table>
          </el-collapse-item>

          <el-collapse-item title="常见 PID 与公式" name="pids">
            <el-table :data="pidList" border stripe size="small" style="width:100%">
              <el-table-column prop="code" label="PID" width="80" />
              <el-table-column prop="pidByte" label="字节" width="60" />
              <el-table-column prop="label" label="名称" width="180" />
              <el-table-column prop="formula" label="公式" />
              <el-table-column prop="unit" label="单位" width="70" />
            </el-table>
          </el-collapse-item>

          <el-collapse-item title="OBD 连接器引脚定义 (DB16)" name="pinout">
            <div class="pinout-container">
              <pre class="pinout-diagram">
  +-----------------------+
  | 1 2 3 4 5 6 7 8      |  OBD-II (Female)
  | 9 10 11 12 13 14 15 16|  View from front
  +-----------------------+

  引脚 | 信号            | 说明
  -----+-----------------+------------------
   1   | Manufacturer     | 制造商自定义
   2   | J1850 Bus+       | 总线正 (PWM/VPW)
   3   | Manufacturer     | 制造商自定义
   4   | Chassis GND      | 底盘地
   5   | Signal GND       | 信号地
   6   | CAN High (CAN H) | CAN 总线高 (ISO 15765)
   7   | K-Line           | ISO 9141-2 / KWP2000
   8   | Manufacturer     | 制造商自定义
   9   | Manufacturer     | 制造商自定义
  10   | J1850 Bus-       | 总线负 (PWM)
  11   | Manufacturer     | 制造商自定义
  12   | Manufacturer     | 制造商自定义
  13   | Manufacturer     | 制造商自定义
  14   | CAN Low (CAN L)  | CAN 总线低 (ISO 15765)
  15   | L-Line           | ISO 9141-2 / KWP2000
  16   | Battery Power    | 电池正 (12V)
              </pre>
            </div>
          </el-collapse-item>

          <el-collapse-item title="CAN vs KWP vs VPW 协议对比" name="protocols">
            <el-table :data="protocolTable" border stripe size="small" style="width:100%">
              <el-table-column prop="feature" label="特性" width="140" />
              <el-table-column prop="can" label="CAN (ISO 15765)" />
              <el-table-column prop="kwp" label="KWP2000 (ISO 14230)" />
              <el-table-column prop="vpw" label="VPW (J1850)" />
            </el-table>
          </el-collapse-item>

          <el-collapse-item title="EOBD vs OBD2 vs JOBD vs WWH-OBD" name="standards">
            <el-table :data="standardTable" border stripe size="small" style="width:100%">
              <el-table-column prop="feature" label="特性" width="150" />
              <el-table-column prop="obd2" label="OBD-II" />
              <el-table-column prop="eobd" label="EOBD" />
              <el-table-column prop="jobd" label="JOBD" />
              <el-table-column prop="wwh" label="WWH-OBD" />
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// ============================================================
// State
// ============================================================
const activeTab = ref('pid')

// ============================================================
// PID Decoder
// ============================================================
const selectedMode = ref('01')
const selectedPID = ref('0C')
const rawHex = ref('410C1A90')

interface DecodedResult {
  paramName: string
  rawValue: string
  decodedValue: string
  unit: string
  status?: string
  formula: string
  explanation: string
}

const decodedResult = ref<DecodedResult | null>(null)

const modes = [
  { value: '01', label: 'Mode 1 - 当前数据 (Current Data)' },
  { value: '02', label: 'Mode 2 - 冻结帧 (Freeze Frame)' },
  { value: '03', label: 'Mode 3 - 故障码 (DTCs)' },
  { value: '04', label: 'Mode 4 - 清除故障码 (Clear DTCs)' },
  { value: '05', label: 'Mode 5 - 氧传感器 (O2 Sensor)' },
  { value: '06', label: 'Mode 6 - 监控 (On-Board Monitor)' },
  { value: '07', label: 'Mode 7 - 待定故障码 (Pending DTCs)' },
  { value: '09', label: 'Mode 9 - 车辆信息 (Vehicle Info)' }
]

interface PIDInfo {
  code: string
  pidByte: string
  label: string
  formula: string
  unit: string
  explanation: string
  normalRange: [number, number]
}

const pidList: PIDInfo[] = [
  { code: '01', pidByte: '2', label: '监控状态 (Monitor Status)', formula: 'Bit-coded', unit: '-', explanation: '检查引擎灯状态和就绪标志', normalRange: [0, 0xFFFF] },
  { code: '04', pidByte: '1', label: '发动机负载 (Engine Load)', formula: 'A * 100 / 255', unit: '%', explanation: '当前发动机负载百分比', normalRange: [0, 100] },
  { code: '05', pidByte: '1', label: '冷却液温度 (Coolant Temp)', formula: 'A - 40', unit: '°C', explanation: '发动机冷却液温度', normalRange: [80, 105] },
  { code: '06', pidByte: '1', label: '短时燃油修正 (STFT)', formula: '(A - 128) * 100 / 128', unit: '%', explanation: '短期燃油修正值', normalRange: [-10, 10] },
  { code: '07', pidByte: '1', label: '长时燃油修正 (LTFT)', formula: '(A - 128) * 100 / 128', unit: '%', explanation: '长期燃油修正值', normalRange: [-10, 10] },
  { code: '0B', pidByte: '1', label: '进气歧管压力 (MAP)', formula: 'A', unit: 'kPa', explanation: '进气歧管绝对压力', normalRange: [20, 105] },
  { code: '0C', pidByte: '2', label: '发动机转速 (RPM)', formula: '(A * 256 + B) / 4', unit: 'rpm', explanation: '发动机每分钟转数', normalRange: [0, 8000] },
  { code: '0D', pidByte: '1', label: '车速 (Speed)', formula: 'A', unit: 'km/h', explanation: '车辆当前行驶速度', normalRange: [0, 250] },
  { code: '0F', pidByte: '1', label: '进气温度 (IAT)', formula: 'A - 40', unit: '°C', explanation: '进气温度传感器读数', normalRange: [-20, 80] },
  { code: '10', pidByte: '2', label: '空气质量流量 (MAF)', formula: '(A * 256 + B) / 100', unit: 'g/s', explanation: '进入发动机的空气流量', normalRange: [2, 150] },
  { code: '11', pidByte: '1', label: '节气门位置 (Throttle)', formula: 'A * 100 / 255', unit: '%', explanation: '节气门开度百分比', normalRange: [0, 100] },
  { code: '14', pidByte: '2', label: '氧传感器 Bank1 (O2 B1S1)', formula: '(A * 256 + B) / 32768', unit: 'ratio', explanation: '氧传感器电压/空燃比', normalRange: [0.1, 1.0] },
  { code: '21', pidByte: '2', label: 'DTC 行驶距离', formula: 'A * 256 + B', unit: 'km', explanation: '从上次清除DTC起的行驶距离', normalRange: [0, 99999] },
  { code: '2F', pidByte: '1', label: '燃油液位 (Fuel Level)', formula: 'A * 100 / 255', unit: '%', explanation: '油箱液位百分比', normalRange: [0, 100] },
  { code: '33', pidByte: '1', label: '大气压力 (Barometric)', formula: 'A', unit: 'kPa', explanation: '环境大气压力', normalRange: [80, 110] },
  { code: '42', pidByte: '2', label: 'ECU 电压', formula: '(A * 256 + B) / 1000', unit: 'V', explanation: 'ECU 供电电压', normalRange: [11, 15] },
  { code: '5C', pidByte: '1', label: '机油温度 (Oil Temp)', formula: 'A - 40', unit: '°C', explanation: '发动机机油温度', normalRange: [80, 120] }
]

function autoDecode() {
  if (rawHex.value.length >= 6) {
    decodePID()
  }
}

function decodePID() {
  const hex = rawHex.value.replace(/\s+/g, '').toUpperCase()
  if (hex.length < 4) return

  const pid = selectedPID.value
  const pidInfo = pidList.find(p => p.code === pid)
  if (!pidInfo) return

  // Parse hex bytes after the first two (mode + pid)
  const modeByte = parseInt(hex.substring(0, 2), 16)
  const pidByte = parseInt(hex.substring(2, 4), 16)
  const dataHex = hex.substring(4)

  if (dataHex.length < parseInt(pidInfo.pidByte) * 2) return

  const bytes: number[] = []
  for (let i = 0; i < dataHex.length; i += 2) {
    bytes.push(parseInt(dataHex.substring(i, i + 2), 16))
  }

  let decodedValue: number = 0
  let rawValueStr = ''

  switch (pid) {
    case '01': {
      decodedValue = bytes[0] || 0
      rawValueStr = `0x${decodedValue.toString(16)}`
      break
    }
    case '04': {
      decodedValue = Math.round((bytes[0] || 0) * 100 / 255 * 10) / 10
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '05': {
      decodedValue = (bytes[0] || 0) - 40
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '06': {
      const stft = ((bytes[0] || 0) - 128) * 100 / 128
      decodedValue = Math.round(stft * 100) / 100
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '07': {
      const ltft = ((bytes[0] || 0) - 128) * 100 / 128
      decodedValue = Math.round(ltft * 100) / 100
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '0B': {
      decodedValue = bytes[0] || 0
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '0C': {
      const a = bytes[0] || 0
      const b = bytes[1] || 0
      decodedValue = Math.round((a * 256 + b) / 4)
      rawValueStr = `A=${a}, B=${b}`
      break
    }
    case '0D': {
      decodedValue = bytes[0] || 0
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '0F': {
      decodedValue = (bytes[0] || 0) - 40
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '10': {
      const mafA = bytes[0] || 0
      const mafB = bytes[1] || 0
      decodedValue = Math.round((mafA * 256 + mafB) / 100 * 100) / 100
      rawValueStr = `A=${mafA}, B=${mafB}`
      break
    }
    case '11': {
      decodedValue = Math.round((bytes[0] || 0) * 100 / 255 * 10) / 10
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '14': {
      const o2A = bytes[0] || 0
      const o2B = bytes[1] || 0
      decodedValue = Math.round((o2A * 256 + o2B) / 32768 * 1000) / 1000
      rawValueStr = `A=${o2A}, B=${o2B}`
      break
    }
    case '21': {
      const dtcA = bytes[0] || 0
      const dtcB = bytes[1] || 0
      decodedValue = dtcA * 256 + dtcB
      rawValueStr = `A=${dtcA}, B=${dtcB}`
      break
    }
    case '2F': {
      decodedValue = Math.round((bytes[0] || 0) * 100 / 255 * 10) / 10
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '33': {
      decodedValue = bytes[0] || 0
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    case '42': {
      const vA = bytes[0] || 0
      const vB = bytes[1] || 0
      decodedValue = Math.round((vA * 256 + vB) / 1000 * 100) / 100
      rawValueStr = `A=${vA}, B=${vB}`
      break
    }
    case '5C': {
      decodedValue = (bytes[0] || 0) - 40
      rawValueStr = `A=${bytes[0] || 0}`
      break
    }
    default: {
      decodedValue = bytes[0] || 0
      rawValueStr = bytes.map(b => `0x${b.toString(16)}`).join(' ')
    }
  }

  // Determine status
  let status: string | undefined
  const nr = pidInfo.normalRange
  if (decodedValue < nr[0] || decodedValue > nr[1]) {
    status = '异常'
  } else if (pid === '05' && (decodedValue < 80 || decodedValue > 105)) {
    status = '警告'
  } else {
    status = '正常'
  }

  decodedResult.value = {
    paramName: pidInfo.label,
    rawValue: rawValueStr,
    decodedValue: String(decodedValue),
    unit: pidInfo.unit,
    status,
    formula: pidInfo.formula,
    explanation: pidInfo.explanation
  }
}

// ============================================================
// DTC Lookup
// ============================================================
const dtcInput = ref('')
const dtcKeyword = ref('')
const dtcCategory = ref('')
const dtcSearchResults = ref<DTCEntry[]>([])
const currentDTC = ref<DTCEntry | null>(null)

interface DTCEntry {
  code: string
  description: string
  fullDescription: string
  severity: string
  category: string
  causes: string[]
  fixes: string[]
}

const dtcDatabase: DTCEntry[] = [
  { code: 'P0420', description: '催化剂效率低于阈值', fullDescription: '催化剂系统效率低于阈值 (Bank 1)', severity: '中', category: 'P',
    causes: ['氧传感器故障', '三元催化器失效', '排气泄漏', '发动机失火'],
    fixes: ['检查氧传感器信号', '检查三元催化器', '检查排气系统密封性'] },
  { code: 'P0300', description: '随机/多缸失火', fullDescription: '检测到随机或多缸失火', severity: '高', category: 'P',
    causes: ['火花塞/点火线圈故障', '燃油系统问题', '压缩比不足', '真空泄漏'],
    fixes: ['检查点火系统', '检查燃油压力', '进行压缩测试'] },
  { code: 'P0301', description: '1缸失火', fullDescription: '检测到第1缸失火', severity: '高', category: 'P',
    causes: ['1缸点火线圈故障', '1缸火花塞问题', '喷油嘴堵塞'],
    fixes: ['更换火花塞', '检测点火线圈', '清洁喷油嘴'] },
  { code: 'P0302', description: '2缸失火', fullDescription: '检测到第2缸失火', severity: '高', category: 'P',
    causes: ['2缸点火线圈故障', '2缸火花塞问题', '喷油嘴堵塞'],
    fixes: ['更换火花塞', '检测点火线圈', '清洁喷油嘴'] },
  { code: 'P0303', description: '3缸失火', fullDescription: '检测到第3缸失火', severity: '高', category: 'P',
    causes: ['3缸点火线圈故障', '3缸火花塞问题', '喷油嘴堵塞'],
    fixes: ['更换火花塞', '检测点火线圈', '清洁喷油嘴'] },
  { code: 'P0304', description: '4缸失火', fullDescription: '检测到第4缸失火', severity: '高', category: 'P',
    causes: ['4缸点火线圈故障', '4缸火花塞问题', '喷油嘴堵塞'],
    fixes: ['更换火花塞', '检测点火线圈', '清洁喷油嘴'] },
  { code: 'P0171', description: '系统过稀 (Bank 1)', fullDescription: '燃油系统过稀 (Bank 1)', severity: '中', category: 'P',
    causes: ['进气泄漏', 'MAF传感器故障', '燃油压力不足', '氧传感器故障'],
    fixes: ['检查真空管路', '清洁/更换MAF传感器', '检查燃油泵压力'] },
  { code: 'P0172', description: '系统过浓 (Bank 1)', fullDescription: '燃油系统过浓 (Bank 1)', severity: '中', category: 'P',
    causes: ['燃油压力过高', '喷油嘴泄漏', 'MAF传感器故障', '碳罐电磁阀故障'],
    fixes: ['检查燃油压力调节器', '检测喷油嘴', '检查MAF传感器'] },
  { code: 'P0135', description: '氧传感器加热器电路 (Bank1 S1)', fullDescription: '氧传感器加热器电路故障 (Bank1 传感器1)', severity: '低', category: 'P',
    causes: ['氧传感器加热器损坏', '电路断路/短路', 'ECU故障'],
    fixes: ['更换氧传感器', '检查加热器电路', '检查保险丝'] },
  { code: 'P0136', description: '氧传感器电路故障 (Bank1 S2)', fullDescription: '氧传感器电路故障 (Bank1 传感器2)', severity: '低', category: 'P',
    causes: ['氧传感器老化', '电路问题', '排气泄漏'],
    fixes: ['更换氧传感器', '检查线路连接'] },
  { code: 'P0401', description: 'EGR流量不足', fullDescription: '废气再循环流量不足', severity: '中', category: 'P',
    causes: ['EGR阀堵塞', 'EGR通道积碳', '真空管路问题'],
    fixes: ['清洁EGR阀', '检查EGR通道', '更换EGR阀'] },
  { code: 'P0455', description: '蒸发排放系统泄漏 (大)', fullDescription: '蒸发排放控制系统检测到大泄漏', severity: '低', category: 'P',
    causes: ['油箱盖未拧紧', '碳罐破裂', 'EVAP管路损坏'],
    fixes: ['拧紧油箱盖', '检查EVAP系统', '更换碳罐'] },
  { code: 'P0500', description: '车速传感器故障', fullDescription: '车速传感器电路故障', severity: '中', category: 'P',
    causes: ['车速传感器损坏', '传感器线路故障', 'ABS模块问题'],
    fixes: ['更换车速传感器', '检查线路', '检查ABS系统'] },
  { code: 'P0505', description: '怠速控制故障', fullDescription: '怠速控制系统故障', severity: '中', category: 'P',
    causes: ['怠速马达故障', '节气门体脏污', '真空泄漏'],
    fixes: ['清洁节气门体', '更换怠速马达', '检查真空管路'] },
  { code: 'P0600', description: '串行通信链路故障', fullDescription: 'ECM/PCM 串行通信链路故障', severity: '高', category: 'P',
    causes: ['CAN总线故障', 'ECU故障', '线路问题'],
    fixes: ['检查CAN总线', '诊断ECU', '检查通信线路'] },
  { code: 'P0606', description: 'ECU处理器故障', fullDescription: 'ECM/PCM 处理器故障', severity: '高', category: 'P',
    causes: ['ECU内部故障', '电源问题', '软件故障'],
    fixes: ['重新编程ECU', '更换ECU', '检查电源供应'] },
  { code: 'P0700', description: '变速箱控制故障', fullDescription: '变速箱控制系统故障', severity: '高', category: 'P',
    causes: ['TCM故障', '变速箱内部故障', '通信故障'],
    fixes: ['诊断TCM', '检查变速箱油', '专业变速箱检查'] },
  { code: 'P1000', description: 'OBD系统未就绪', fullDescription: 'OBD系统未完成自检循环', severity: '低', category: 'P',
    causes: ['电瓶断开后未完成驾驶循环', 'ECU重置'],
    fixes: ['完成标准驾驶循环', '进行OBD就绪测试'] },
  { code: 'P1101', description: 'MAF传感器范围/性能', fullDescription: 'MAF传感器超出范围', severity: '中', category: 'P',
    causes: ['MAF传感器脏污', '进气系统泄漏', 'MAF传感器故障'],
    fixes: ['清洁MAF传感器', '检查进气系统', '更换MAF传感器'] },
  { code: 'P2000', description: 'NOx催化剂效率低于阈值', fullDescription: 'NOx捕集器效率低于阈值 (Bank 1)', severity: '中', category: 'P',
    causes: ['NOx催化剂老化', '燃油含硫量高', '发动机燃烧问题'],
    fixes: ['再生NOx捕集器', '更换NOx催化剂', '检查发动机燃烧'] },

  // U Codes
  { code: 'U0001', description: '高速CAN通信总线故障', fullDescription: '高速CAN通信总线故障', severity: '高', category: 'U',
    causes: ['CAN总线短路/断路', '终端电阻故障', '模块故障'],
    fixes: ['检查CAN总线线路', '测量终端电阻', '逐个断开模块定位'] },
  { code: 'U0100', description: '与ECM通信丢失', fullDescription: '与发动机控制模块(ECM)通信丢失', severity: '高', category: 'U',
    causes: ['ECU电源故障', 'CAN总线故障', 'ECU损坏'],
    fixes: ['检查ECU供电和接地', '检查CAN总线', '更换ECU'] },
  { code: 'U0101', description: '与TCM通信丢失', fullDescription: '与变速箱控制模块(TCM)通信丢失', severity: '高', category: 'U',
    causes: ['TCM电源故障', 'CAN总线故障', 'TCM损坏'],
    fixes: ['检查TCM供电', '检查CAN总线', '更换TCM'] },
  { code: 'U0121', description: '与ABS模块通信丢失', fullDescription: '与防抱死制动系统(ABS)模块通信丢失', severity: '高', category: 'U',
    causes: ['ABS模块电源故障', 'CAN总线故障', 'ABS模块损坏'],
    fixes: ['检查ABS保险丝', '检查CAN总线', '更换ABS模块'] },
  { code: 'U0140', description: '与BCM通信丢失', fullDescription: '与车身控制模块(BCM)通信丢失', severity: '中', category: 'U',
    causes: ['BCM电源故障', 'CAN总线故障', 'BCM损坏'],
    fixes: ['检查BCM供电', '检查CAN总线', '更换BCM'] },
  { code: 'U0155', description: '与组合仪表通信丢失', fullDescription: '与仪表盘控制模块(IPC)通信丢失', severity: '中', category: 'U',
    causes: ['IPC电源故障', 'CAN总线故障', 'IPC损坏'],
    fixes: ['检查IPC供电', '检查CAN总线', '更换仪表盘'] },
  { code: 'U0401', description: '从ECM收到无效数据', fullDescription: '从发动机控制模块收到无效数据', severity: '中', category: 'U',
    causes: ['ECU软件版本不匹配', 'ECU故障', '数据帧错误'],
    fixes: ['更新ECU软件', '检查ECU', '检查CAN总线'] },

  // B Codes
  { code: 'B0001', description: '驾驶员正面气囊故障', fullDescription: '驾驶员正面安全气囊电路故障', severity: '高', category: 'B',
    causes: ['气囊模块故障', '螺旋电缆断路', '碰撞传感器故障'],
    fixes: ['检查气囊模块', '更换螺旋电缆', '诊断SRS系统'] },
  { code: 'B0002', description: '乘客正面气囊故障', fullDescription: '乘客正面安全气囊电路故障', severity: '高', category: 'B',
    causes: ['气囊模块故障', '线路问题', '乘客分类传感器故障'],
    fixes: ['检查气囊模块', '诊断SRS系统', '更换乘客传感器'] },
  { code: 'B0022', description: '驾驶员侧面气囊故障', fullDescription: '驾驶员侧面安全气囊故障', severity: '高', category: 'B',
    causes: ['侧面气囊模块故障', '碰撞传感器故障', '线路问题'],
    fixes: ['更换侧面气囊', '检查碰撞传感器', '诊断SRS系统'] },
  { code: 'B0080', description: '安全带预紧器故障', fullDescription: '驾驶员安全带预紧器电路故障', severity: '中', category: 'B',
    causes: ['预紧器故障', '线路断路', 'SRS模块故障'],
    fixes: ['更换安全带总成', '检查线路', '诊断SRS模块'] },
  { code: 'B1000', description: 'BCM内部故障', fullDescription: '车身控制模块内部故障', severity: '中', category: 'B',
    causes: ['BCM软件故障', 'BCM硬件故障', '电源异常'],
    fixes: ['重新编程BCM', '更换BCM', '检查电源'] },
  { code: 'B1010', description: '电子防盗系统故障', fullDescription: '车辆电子防盗系统故障', severity: '高', category: 'B',
    causes: ['钥匙芯片不匹配', '防盗模块故障', '天线线圈故障'],
    fixes: ['重新匹配钥匙', '更换防盗模块', '检查天线线圈'] },
  { code: 'B1200', description: '车门锁执行器故障', fullDescription: '车门锁执行器电路故障', severity: '低', category: 'B',
    causes: ['门锁马达损坏', '线路故障', 'BCM输出故障'],
    fixes: ['更换门锁马达', '检查线路', '诊断BCM'] },
  { code: 'B1400', description: '空调系统故障', fullDescription: 'HVAC控制系统故障', severity: '低', category: 'B',
    causes: ['空调控制模块故障', '温度传感器故障', '执行器故障'],
    fixes: ['诊断空调系统', '更换温度传感器', '更换执行器'] },
  { code: 'B1500', description: '照明系统故障', fullDescription: '车身照明系统电路故障', severity: '低', category: 'B',
    causes: ['灯泡烧毁', '继电器故障', 'BCM输出故障'],
    fixes: ['更换灯泡', '检查继电器', '诊断BCM'] },

  // C Codes
  { code: 'C0001', description: 'ABS泵电机故障', fullDescription: 'ABS液压泵电机电路故障', severity: '高', category: 'C',
    causes: ['ABS泵电机损坏', '继电器故障', 'ABS模块故障'],
    fixes: ['更换ABS泵', '检查继电器', '更换ABS模块'] },
  { code: 'C0035', description: '左前轮速传感器故障', fullDescription: '左前轮速传感器电路故障', severity: '中', category: 'C',
    causes: ['轮速传感器损坏', '传感器间隙不当', '齿圈损坏'],
    fixes: ['更换轮速传感器', '调整传感器间隙', '更换齿圈'] },
  { code: 'C0040', description: '右前轮速传感器故障', fullDescription: '右前轮速传感器电路故障', severity: '中', category: 'C',
    causes: ['轮速传感器损坏', '传感器间隙不当', '齿圈损坏'],
    fixes: ['更换轮速传感器', '调整传感器间隙', '更换齿圈'] },
  { code: 'C0045', description: '左后轮速传感器故障', fullDescription: '左后轮速传感器电路故障', severity: '中', category: 'C',
    causes: ['轮速传感器损坏', '传感器间隙不当', '齿圈损坏'],
    fixes: ['更换轮速传感器', '调整传感器间隙', '更换齿圈'] },
  { code: 'C0050', description: '右后轮速传感器故障', fullDescription: '右后轮速传感器电路故障', severity: '中', category: 'C',
    causes: ['轮速传感器损坏', '传感器间隙不当', '齿圈损坏'],
    fixes: ['更换轮速传感器', '调整传感器间隙', '更换齿圈'] },
  { code: 'C0100', description: '电子驻车制动故障', fullDescription: '电子驻车制动系统故障', severity: '高', category: 'C',
    causes: ['驻车制动马达故障', '控制模块故障', '开关故障'],
    fixes: ['诊断驻车制动系统', '更换马达', '更换控制模块'] },
  { code: 'C0200', description: '转向角传感器故障', fullDescription: '转向角传感器电路故障', severity: '中', category: 'C',
    causes: ['转向角传感器损坏', '安装位置偏移', '校准丢失'],
    fixes: ['更换转向角传感器', '重新校准', '检查安装位置'] },
  { code: 'C0300', description: '悬架高度传感器故障', fullDescription: '悬架高度传感器电路故障', severity: '中', category: 'C',
    causes: ['高度传感器损坏', '连杆损坏', '线路问题'],
    fixes: ['更换高度传感器', '更换连杆', '检查线路'] }
]

function lookupDTC() {
  const code = dtcInput.value.trim().toUpperCase()
  if (!code) return
  const result = dtcDatabase.find(d => d.code === code)
  if (result) {
    currentDTC.value = result
    dtcSearchResults.value = [result]
  } else {
    currentDTC.value = {
      code,
      description: '未知故障码',
      fullDescription: `未找到故障码 ${code} 的详细信息`,
      severity: '未知',
      category: code.charAt(0),
      causes: ['请查阅车辆维修手册'],
      fixes: ['使用专业诊断工具进一步检测']
    }
    dtcSearchResults.value = dtcDatabase.filter(d => d.code.startsWith(code.charAt(0)))
  }
}

function searchDTC() {
  const keyword = dtcKeyword.value.trim().toLowerCase()
  if (!keyword) {
    dtcSearchResults.value = []
    return
  }
  dtcSearchResults.value = dtcDatabase.filter(d =>
    d.code.toLowerCase().includes(keyword) ||
    d.description.toLowerCase().includes(keyword) ||
    d.fullDescription.toLowerCase().includes(keyword) ||
    d.causes.some(c => c.toLowerCase().includes(keyword))
  )
  if (dtcCategory.value) {
    dtcSearchResults.value = dtcSearchResults.value.filter(d => d.category === dtcCategory.value)
  }
  currentDTC.value = null
}

function filterDTC() {
  if (!dtcCategory.value) {
    dtcSearchResults.value = dtcKeyword.value.trim()
      ? dtcDatabase.filter(d =>
          d.code.toLowerCase().includes(dtcKeyword.value.toLowerCase()) ||
          d.description.toLowerCase().includes(dtcKeyword.value.toLowerCase()))
      : []
  } else {
    dtcSearchResults.value = dtcDatabase.filter(d => d.category === dtcCategory.value)
  }
}

function selectDTC(row: DTCEntry) {
  currentDTC.value = row
  dtcInput.value = row.code
}

// ============================================================
// Data Stream Analysis
// ============================================================
const streamCSV = ref('')
const streamStats = ref<StreamStat[]>([])
const anomalies = ref<{ param: string; value: number; time: number; reason: string; suggestion: string }[]>([])

interface StreamStat {
  name: string
  min: number
  max: number
  avg: number
  unit: string
  currentValue: number
  trendPercent: number
  trendColor: string
  normalRange: [number, number]
}

const streamNormalRanges: Record<string, [number, number]> = {
  'RPM': [600, 7000],
  'Load': [0, 100],
  'Speed': [0, 200],
  'CoolantTemp': [80, 105],
  'IAT': [-20, 80],
  'MAF': [2, 150],
  'Throttle': [0, 100],
  'FuelLevel': [0, 100],
  'MAP': [20, 105],
  'O2': [0.1, 0.9]
}

const streamUnits: Record<string, string> = {
  'RPM': 'rpm',
  'Load': '%',
  'Speed': 'km/h',
  'CoolantTemp': '°C',
  'IAT': '°C',
  'MAF': 'g/s',
  'Throttle': '%',
  'FuelLevel': '%',
  'MAP': 'kPa',
  'O2': 'V'
}

function parseStreamData() {
  const lines = streamCSV.value.trim().split('\n')
  if (lines.length < 2) return

  const headers = lines[0].split(',').map(h => h.trim())
  const dataRows: Record<string, number[]> = {}
  for (const h of headers) {
    dataRows[h] = []
  }
  anomalies.value = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => parseFloat(s.trim()))
    if (parts.length !== headers.length) continue
    for (let j = 0; j < headers.length; j++) {
      if (!isNaN(parts[j])) {
        dataRows[headers[j]].push(parts[j])
        // Check for anomalies
        const range = streamNormalRanges[headers[j]]
        if (range && i > 1) {
          const val = parts[j]
          if (val < range[0] || val > range[1]) {
            anomalies.value.push({
              param: headers[j],
              value: val,
              time: dataRows['Time'] ? dataRows['Time'][dataRows['Time'].length - 1] : i - 1,
              reason: `超出正常范围 (${range[0]} ~ ${range[1]})`,
              suggestion: `检查 ${headers[j]} 相关系统`
            })
          }
        }
      }
    }
  }

  streamStats.value = headers.filter(h => h !== 'Time').map(h => {
    const vals = dataRows[h] || []
    const min = vals.length > 0 ? Math.min(...vals) : 0
    const max = vals.length > 0 ? Math.max(...vals) : 0
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const current = vals.length > 0 ? vals[vals.length - 1] : 0
    const range = streamNormalRanges[h] || [0, 100]
    const trendPercent = Math.min(100, ((current - range[0]) / (range[1] - range[0])) * 100)
    const trendColor = current < range[0] || current > range[1] ? '#F56C6C' : '#67C23A'

    return {
      name: h,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      unit: streamUnits[h] || '',
      currentValue: current,
      trendPercent,
      trendColor,
      normalRange: range
    }
  })
}

function generateSampleStream() {
  streamCSV.value = `Time,RPM,Load,Speed,CoolantTemp,IAT,MAF,Throttle
0,725,18,0,82,25,4.2,0
1,780,22,0,83,24,5.1,1
2,810,28,5,84,24,6.3,3
3,850,35,12,84,23,8.1,8
4,920,42,18,85,23,10.5,14
5,1100,48,25,85,22,12.8,20
6,1350,55,30,86,22,15.2,28
7,1600,60,35,87,21,18.6,35
8,1850,65,40,87,21,21.3,42
9,2100,70,45,88,20,24.5,48
10,2400,72,50,88,20,27.1,52
11,2700,75,55,89,19,30.2,58
12,3000,78,60,90,19,33.8,62
13,3200,80,65,90,18,36.5,66
14,3400,82,70,91,18,39.1,70
15,3500,85,72,91,18,41.8,73
16,3600,83,70,92,17,40.2,71
17,3400,78,65,92,17,36.8,65
18,3100,72,58,91,18,32.5,58
19,2800,65,50,90,18,28.2,50
20,2500,58,42,89,19,24.1,42
21,2200,52,35,89,19,20.5,35
22,1900,45,28,88,20,16.8,28
23,1600,38,20,87,20,13.2,20
24,1300,30,12,86,21,9.5,12
25,1000,22,5,85,22,6.2,5
26,800,18,0,84,23,4.5,1
27,750,15,0,83,24,3.8,0`
}

// ============================================================
// Reference Tables
// ============================================================
const refCollapse = ref(['modes', 'pids'])

const modeTable = [
  { mode: '01', name: 'Show Current Data', description: '请求当前动力系统传感器数据' },
  { mode: '02', name: 'Show Freeze Frame Data', description: '请求冻结帧数据（故障发生时的快照）' },
  { mode: '03', name: 'Show Diagnostic Trouble Codes', description: '请求存储的DTC故障码' },
  { mode: '04', name: 'Clear/Reset Related Systems', description: '清除故障码并重置监控系统' },
  { mode: '05', name: 'Test Results, O2 Sensor', description: '请求氧传感器监测测试结果' },
  { mode: '06', name: 'Test Results, Non-Continuous', description: '请求非连续监控系统的测试结果' },
  { mode: '07', name: 'Show Pending Diagnostic Trouble Codes', description: '请求待定的DTC故障码' },
  { mode: '08', name: 'Control Operation of On-Board System', description: '控制车载系统的操作' },
  { mode: '09', name: 'Request Vehicle Information', description: '请求车辆信息（VIN等）' },
  { mode: '0A', name: 'Permanent Diagnostic Trouble Codes', description: '请求永久性DTC故障码' }
]

const protocolTable = [
  { feature: '标准', can: 'ISO 15765-4', kwp: 'ISO 14230-4', vpw: 'SAE J1850' },
  { feature: '通信介质', can: 'CAN 总线 (2线)', kwp: 'K-Line (单线)', vpw: '单线总线' },
  { feature: '波特率', can: '250k / 500k bps', kwp: '10.4k bps', vpw: '10.4k / 41.6k bps' },
  { feature: '接线', can: '引脚6 (CAN H), 14 (CAN L)', kwp: '引脚7 (K-Line), 15 (L-Line)', vpw: '引脚2 (Bus+), 10 (Bus-)' },
  { feature: '优势', can: '高速、可靠、多节点', kwp: '简单、成本低', vpw: '兼容性好' },
  { feature: '劣势', can: '成本较高', kwp: '速度慢', vpw: '带宽有限' },
  { feature: '应用', can: '2008年后大部分车型', kwp: '欧系车型 (2000-2007)', vpw: '通用/GM车型' }
]

const standardTable = [
  { feature: '全称', obd2: 'OBD-II', eobd: 'European OBD', jobd: 'Japanese OBD', wwh: 'WWH-OBD' },
  { feature: '区域', obd2: '美国', eobd: '欧盟', jobd: '日本', wwh: '全球 (UN R150)' },
  { feature: '强制年份', obd2: '1996 (汽油)', eobd: '2001 (汽油) / 2003 (柴油)', jobd: '2008', wwh: '2023 (逐步)' },
  { feature: '协议', obd2: 'CAN / J1850 / KWP', eobd: 'CAN / KWP (2000+年)', jobd: 'CAN', wwh: 'CAN (ISO 15765)' },
  { feature: '诊断接口', obd2: 'SAE J1962 (16pin)', eobd: 'SAE J1962 (16pin)', jobd: 'SAE J1962 (16pin)', wwh: 'SAE J1962 (16pin)' },
  { feature: 'PID集', obd2: 'SAE J1979', eobd: 'SAE J1979 + 扩展', jobd: 'J1979 + 日本扩展', wwh: 'ISO 27145 (扩展)' },
  { feature: '排放标准', obd2: 'EPA Tier 1/2/3', eobd: 'Euro 3/4/5/6', jobd: 'JPN 2005/2009/2016', wwh: 'UN R150 (全球)' }
]
</script>

<style scoped>
.obd-tools {
  padding: 4px;
}

.decode-result {
  width: 100%;
}

.formula-display {
  background: #f0f2f5;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  color: #303133;
  margin: 0;
  overflow-x: auto;
}

.dtc-quick-links {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.trend-bar-container {
  position: relative;
  height: 20px;
  background: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
}

.trend-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
  min-width: 2px;
}

.trend-label {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #606266;
  font-weight: 600;
}

.pinout-container {
  overflow-x: auto;
}

.pinout-diagram {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  color: #303133;
}
</style>
