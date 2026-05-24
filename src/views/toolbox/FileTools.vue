<template>
  <div class="file-tools">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: CSV Viewer -->
      <el-tab-pane label="CSV 可视化" name="csv">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>CSV 输入</span>
              </template>
              <el-input
                v-model="csvInput"
                type="textarea"
                :rows="10"
                placeholder="粘贴CSV数据..."
              />
              <div style="margin-top:8px;display:flex;gap:8px">
                <el-button type="primary" size="small" @click="parseCSV">解析</el-button>
                <el-button size="small" @click="loadSampleCSV">加载样本</el-button>
                <el-button size="small" @click="clearCSV">清空</el-button>
              </div>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never" v-if="csvParsed.headers.length > 0">
              <template #header>
                <span>数据表格 ({{ csvParsed.rows.length }} 行)</span>
              </template>
              <el-table :data="csvParsed.rows" height="200" border stripe size="small" style="width:100%" max-height="250">
                <el-table-column
                  v-for="(header, i) in csvParsed.headers"
                  :key="i"
                  :prop="String(i)"
                  :label="header"
                  :width="i < csvParsed.headers.length - 1 ? 100 : undefined"
                />
              </el-table>
            </el-card>

            <el-card shadow="never" style="margin-top:12px" v-if="csvStats.length > 0">
              <template #header>
                <span>列统计</span>
              </template>
              <el-table :data="csvStats" border stripe size="small" style="width:100%">
                <el-table-column prop="name" label="列" width="120" />
                <el-table-column prop="min" label="最小值" width="100" />
                <el-table-column prop="max" label="最大值" width="100" />
                <el-table-column prop="mean" label="平均值" width="120" />
                <el-table-column prop="count" label="计数" width="80" />
              </el-table>
            </el-card>

            <el-card shadow="never" style="margin-top:12px" v-if="csvParsed.headers.length > 1">
              <template #header>
                <div class="chart-header">
                  <span>SVG 折线图</span>
                  <div style="display:flex;gap:8px;align-items:center">
                    <span style="font-size:12px;color:#909399">Y轴:</span>
                    <el-select v-model="chartYColumn" size="small" style="width:140px">
                      <el-option v-for="(h, i) in csvParsed.headers.slice(1)" :key="i" :label="h" :value="i + 1" />
                    </el-select>
                  </div>
                </div>
              </template>
              <div class="chart-wrapper">
                <svg
                  :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                  :width="chartWidth"
                  :height="chartHeight"
                  style="background:#fafafa;border-radius:4px"
                >
                  <line
                    v-for="(tick, i) in yTicks"
                    :key="'grid_'+i"
                    :x1="chartPadding"
                    :y1="tick.y"
                    :x2="chartWidth - chartPadding"
                    :y2="tick.y"
                    stroke="#e4e7ed"
                    stroke-width="0.5"
                  />
                  <text
                    v-for="(tick, i) in yTicks"
                    :key="'ylabel_'+i"
                    :x="chartPadding - 5"
                    :y="tick.y + 4"
                    text-anchor="end"
                    font-size="9"
                    fill="#909399"
                  >{{ tick.label }}</text>
                  <text
                    v-for="(tick, i) in xTicks"
                    :key="'xlabel_'+i"
                    :x="tick.x"
                    :y="chartHeight - 5"
                    text-anchor="middle"
                    font-size="9"
                    fill="#909399"
                  >{{ tick.label }}</text>
                  <polyline
                    :points="chartPoints"
                    fill="none"
                    stroke="#409eff"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                  <circle
                    v-for="(pt, i) in chartPointData"
                    :key="'pt_'+i"
                    :cx="pt.x"
                    :cy="pt.y"
                    r="2.5"
                    fill="#409eff"
                    stroke="#fff"
                    stroke-width="1"
                  />
                </svg>
              </div>
            </el-card>

            <el-card shadow="never" style="margin-top:12px" v-if="csvParsed.rows.length > 0">
              <template #header>
                <span>导出</span>
              </template>
              <el-button size="small" type="success" @click="exportCSV">导出当前数据为CSV</el-button>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 2: Hex Viewer -->
      <el-tab-pane label="Hex 查看器" name="hex">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>数据输入</span>
              </template>
              <el-form label-position="top" size="small">
                <el-form-item label="输入文本或十六进制数据">
                  <el-input
                    v-model="hexInput"
                    type="textarea"
                    :rows="8"
                    placeholder="粘贴文本或十六进制字节（以空格分隔）如: 48 65 6C 6C 6F"
                  />
                </el-form-item>
                <div style="display:flex;gap:8px">
                  <el-button type="primary" size="small" @click="parseHexInput">解析</el-button>
                  <el-button size="small" @click="hexInput = '48 65 6C 6C 6F 20 57 6F 72 6C 64 21'; parseHexInput()">样本</el-button>
                </div>
              </el-form>
              <div class="hex-info" v-if="hexBytes.length > 0">
                <p>文件大小: {{ hexBytes.length }} 字节 ({{ (hexBytes.length / 1024).toFixed(2) }} KB)</p>
              </div>
            </el-card>
            <el-card shadow="never" style="margin-top:12px" v-if="hexBytes.length > 0">
              <template #header>
                <span>搜索</span>
              </template>
              <el-input v-model="hexSearch" placeholder="搜索十六进制模式 (如: 48 65)" size="small" @keyup.enter="searchHex">
                <template #append>
                  <el-button @click="searchHex" size="small">搜索</el-button>
                </template>
              </el-input>
              <div v-if="hexSearchResults" style="margin-top:8px">
                <el-tag v-if="hexSearchResults.length > 0" type="success">
                  找到 {{ hexSearchResults.length }} 处匹配
                </el-tag>
                <el-tag v-else type="info">未找到匹配</el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never" v-if="hexBytes.length > 0">
              <template #header>
                <span>Hex 视图 (偏移 | 字节 | ASCII)</span>
              </template>
              <div class="hex-viewer-container">
                <div class="hex-viewer">
                  <div class="hex-row" v-for="(row, idx) in hexRows" :key="idx">
                    <span class="hex-offset">{{ row.offset }}</span>
                    <span class="hex-separator">|</span>
                    <span class="hex-bytes">
                      <span
                        v-for="(b, bi) in row.bytes"
                        :key="bi"
                        class="hex-byte"
                        :class="{ 'search-match': isSearchMatch(row.offset + bi) }"
                      >{{ b.toString(16).padStart(2, '0') }}</span>
                    </span>
                    <span class="hex-separator">|</span>
                    <span class="hex-ascii">{{ row.ascii }}</span>
                  </div>
                </div>
              </div>
            </el-card>
            <el-empty v-else description="输入数据后点击解析" />
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 3: Checksum Calculator -->
      <el-tab-pane label="Checksum 校验" name="checksum">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>输入</span>
              </template>
              <el-form label-position="top" size="small">
                <el-form-item label="数据类型">
                  <el-radio-group v-model="csInputType">
                    <el-radio value="hex">十六进制</el-radio>
                    <el-radio value="text">文本</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="数据">
                  <el-input
                    v-model="csInput"
                    type="textarea"
                    :rows="4"
                    :placeholder="csInputType === 'hex' ? '输入十六进制字节 (如: 01 02 03 FF)' : '输入文本'"
                  />
                </el-form-item>
                <el-form-item label="算法">
                  <el-select v-model="csAlgorithm" style="width:100%">
                    <el-option label="XOR 8-bit" value="xor8" />
                    <el-option label="XOR 16-bit" value="xor16" />
                    <el-option label="和校验 (Additive)" value="additive" />
                    <el-option label="求和补码 (Sum Complement)" value="sumcomp" />
                    <el-option label="CRC-8" value="crc8" />
                    <el-option label="CRC-16" value="crc16" />
                    <el-option label="CRC-16 Modbus" value="crc16modbus" />
                    <el-option label="SHA-256" value="sha256" />
                  </el-select>
                </el-form-item>
                <el-button type="primary" size="small" @click="calculateChecksum" style="width:100%">
                  计算
                </el-button>
              </el-form>
            </el-card>
            <el-card shadow="never" style="margin-top:12px" v-if="csResult !== null">
              <template #header>
                <span>验证</span>
              </template>
              <el-form label-position="top" size="small">
                <el-form-item label="期望值 (十六进制)">
                  <el-input v-model="csExpected" placeholder="如: 0xAB" />
                </el-form-item>
                <el-button size="small" @click="verifyChecksum" style="width:100%">
                  验证
                </el-button>
              </el-form>
              <div v-if="csVerifyResult !== null" style="margin-top:8px">
                <el-tag v-if="csVerifyResult" type="success" size="large">验证通过 ✓</el-tag>
                <el-tag v-else type="danger" size="large">验证失败 ✗</el-tag>
              </div>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-card shadow="never" v-if="csResult !== null">
              <template #header>
                <span>计算结果</span>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="算法">{{ csAlgorithmLabel }}</el-descriptions-item>
                <el-descriptions-item label="结果 (Hex)">
                  <el-tag type="success" size="large" style="font-family:monospace;font-size:16px">{{ csResult.hex }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="结果 (Dec)">{{ csResult.dec }}</el-descriptions-item>
                <el-descriptions-item label="结果 (Bin)">{{ csResult.bin }}</el-descriptions-item>
                <el-descriptions-item label="数据长度">{{ csResult.dataLength }} 字节</el-descriptions-item>
              </el-descriptions>
              <el-card shadow="never" style="margin-top:12px;background:#f5f7fa" v-if="csSteps.length > 0">
                <template #header>
                  <span>计算步骤</span>
                </template>
                <pre class="cs-steps">{{ csSteps.join('\n') }}</pre>
              </el-card>
            </el-card>
            <el-empty v-else description="输入数据并选择算法后计算" />
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 4: Batch Processing -->
      <el-tab-pane label="文件批处理" name="batch">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>文本工具</span>
              </template>
              <el-form label-position="top" size="small">
                <el-form-item label="操作">
                  <el-select v-model="batchOp" style="width:100%">
                    <el-option label="行计数" value="count" />
                    <el-option label="字词计数" value="words" />
                    <el-option label="查找替换" value="replace" />
                    <el-option label="排序行" value="sort" />
                    <el-option label="排序行 (降序)" value="sortdesc" />
                    <el-option label="移除重复行" value="uniq" />
                    <el-option label="提取CSV列" value="extract" />
                    <el-option label="正则表达式测试" value="regex" />
                    <el-option label="Base64 编码" value="base64enc" />
                    <el-option label="Base64 解码" value="base64dec" />
                    <el-option label="URL 编码" value="urlenc" />
                    <el-option label="URL 解码" value="urldec" />
                    <el-option label="大小写转换" value="case" />
                    <el-option label="反转行" value="reverse" />
                  </el-select>
                </el-form-item>
                <el-form-item label="输入文本">
                  <el-input
                    v-model="batchInput"
                    type="textarea"
                    :rows="8"
                    placeholder="输入要处理的文本..."
                  />
                </el-form-item>

                <!-- Find & Replace options -->
                <template v-if="batchOp === 'replace'">
                  <el-form-item label="查找">
                    <el-input v-model="batchFind" placeholder="要查找的文本" />
                  </el-form-item>
                  <el-form-item label="替换为">
                    <el-input v-model="batchReplace" placeholder="替换文本" />
                  </el-form-item>
                </template>

                <!-- Extract column options -->
                <template v-if="batchOp === 'extract'">
                  <el-form-item label="列号 (从1开始)">
                    <el-input-number v-model="batchColumn" :min="1" :max="100" />
                  </el-form-item>
                  <el-form-item label="分隔符">
                    <el-input v-model="batchDelimiter" placeholder="," style="width:80px" />
                  </el-form-item>
                </template>

                <!-- Regex options -->
                <template v-if="batchOp === 'regex'">
                  <el-form-item label="正则表达式">
                    <el-input v-model="batchRegex" placeholder="如: \\d+\.\\d+" />
                  </el-form-item>
                  <el-form-item label="替换 (可选)">
                    <el-input v-model="batchRegexReplace" placeholder="留空则只匹配显示" />
                  </el-form-item>
                </template>

                <!-- Case options -->
                <template v-if="batchOp === 'case'">
                  <el-form-item label="转换方式">
                    <el-select v-model="batchCaseType">
                      <el-option label="全部大写" value="upper" />
                      <el-option label="全部小写" value="lower" />
                      <el-option label="首字母大写" value="capitalize" />
                    </el-select>
                  </el-form-item>
                </template>

                <el-button type="primary" size="small" @click="runBatchOp" style="width:100%">
                  执行
                </el-button>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span>结果</span>
              </template>
              <el-input
                v-model="batchOutput"
                type="textarea"
                :rows="16"
                readonly
                placeholder="结果将显示在此处..."
              />
              <div style="margin-top:8px">
                <el-tag type="info" size="small" v-if="batchOutput">
                  字符: {{ batchOutput.length }} | 行: {{ batchOutput.split('\n').length }}
                </el-tag>
                <el-button size="small" style="margin-left:8px" @click="copyToClipboard(batchOutput)">
                  复制
                </el-button>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" v-if="batchOp === 'count' || batchOp === 'words'">
              <template #header>
                <span>统计信息</span>
              </template>
              <div v-if="batchCountInfo">
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item v-for="(val, key) in batchCountInfo" :key="key" :label="key">
                    {{ val }}
                  </el-descriptions-item>
                </el-descriptions>
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

// ============================================================
// State
// ============================================================
const activeTab = ref('csv')

// ============================================================
// CSV Viewer
// ============================================================
const csvInput = ref('')
const csvParsed = reactive({
  headers: [] as string[],
  rows: Array<Record<string, string | number>>()
})
const csvStats = ref<{ name: string; min: number; max: number; mean: number; count: number }[]>([])
const chartYColumn = ref(1)
const chartPadding = 50
const chartWidth = 600
const chartHeight = 250

const chartPointData = computed(() => {
  if (csvParsed.rows.length === 0 || csvParsed.headers.length < 2) return []
  const yCol = chartYColumn.value
  const xCol = 0
  const values = csvParsed.rows.map(row => ({
    x: Number(row[String(xCol)]),
    y: Number(row[String(yCol)])
  })).filter(p => !isNaN(p.x) && !isNaN(p.y))
  if (values.length === 0) return []
  const xMin = Math.min(...values.map(p => p.x))
  const xMax = Math.max(...values.map(p => p.x))
  const yMin = Math.min(...values.map(p => p.y))
  const yMax = Math.max(...values.map(p => p.y))
  const rangeX = xMax - xMin || 1
  const rangeY = yMax - yMin || 1
  const plotW = chartWidth - chartPadding * 2
  const plotH = chartHeight - chartPadding * 2
  return values.map(p => ({
    x: chartPadding + ((p.x - xMin) / rangeX) * plotW,
    y: chartPadding + plotH - ((p.y - yMin) / rangeY) * plotH
  }))
})

const chartPoints = computed(() =>
  chartPointData.value.map(p => `${p.x},${p.y}`).join(' ')
)

const yTicks = computed(() => {
  const pts = chartPointData.value
  if (pts.length === 0) return []
  const yCol = chartYColumn.value
  const values = csvParsed.rows.map(r => Number(r[String(yCol)])).filter(v => !isNaN(v))
  if (values.length === 0) return []
  const yMin = Math.min(...values)
  const yMax = Math.max(...values)
  const step = Math.max(1, Math.pow(10, Math.floor(Math.log10((yMax - yMin) / 5))))
  const ticks = []
  for (let v = Math.floor(yMin / step) * step; v <= yMax; v += step) {
    const ptIdx = pts.findIndex(p => Math.abs(p.y - yMin) < 0.001)
    const rangeY = yMax - yMin || 1
    ticks.push({
      label: v.toFixed(v < 1 ? 2 : 0),
      y: chartPadding + (1 - (v - yMin) / rangeY) * (chartHeight - chartPadding * 2)
    })
  }
  return ticks
})

const xTicks = computed(() => {
  const pts = chartPointData.value
  if (pts.length < 3) return pts.map((p, i) => ({ label: String(i), x: p.x }))
  const step = Math.max(1, Math.floor(pts.length / 6))
  const ticks = []
  for (let i = 0; i < pts.length; i += step) {
    ticks.push({ label: String(i), x: pts[i].x })
  }
  return ticks
})

function parseCSV() {
  const text = csvInput.value.trim()
  if (!text) return
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 1) return

  csvParsed.headers = lines[0].split(',').map(h => h.trim())
  csvParsed.rows = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim())
    if (parts.length !== csvParsed.headers.length) continue
    const row: Record<string, string | number> = {}
    for (let j = 0; j < parts.length; j++) {
      const num = parseFloat(parts[j])
      row[String(j)] = isNaN(num) ? parts[j] : num
    }
    csvParsed.rows.push(row)
  }

  computeCSVStats()
}

function computeCSVStats() {
  csvStats.value = []
  if (csvParsed.rows.length === 0) return

  for (let j = 0; j < csvParsed.headers.length; j++) {
    const vals = csvParsed.rows
      .map(r => Number(r[String(j)]))
      .filter(v => !isNaN(v))
    if (vals.length === 0) {
      csvStats.value.push({ name: csvParsed.headers[j], min: 0, max: 0, mean: 0, count: 0 })
      continue
    }
    csvStats.value.push({
      name: csvParsed.headers[j],
      min: Math.min(...vals),
      max: Math.max(...vals),
      mean: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length
    })
  }
}

function loadSampleCSV() {
  csvInput.value = `时间,温度,湿度,压力,风速
0,22.5,65,1013,2.1
1,23.1,63,1012,2.5
2,24.8,60,1011,3.0
3,26.2,58,1009,3.8
4,27.5,55,1008,4.2
5,28.0,53,1007,4.5
6,27.8,54,1007,4.3
7,26.5,56,1008,3.9
8,25.0,59,1009,3.2
9,23.8,62,1010,2.8
10,22.9,64,1011,2.3
11,22.0,66,1012,1.9
12,21.5,68,1013,1.6
13,22.2,65,1012,2.0
14,23.5,61,1011,2.7
15,25.0,58,1009,3.5
16,26.8,55,1008,4.0
17,27.2,54,1007,4.1
18,26.0,57,1008,3.6
19,24.5,60,1010,3.0
20,23.0,63,1011,2.4`
  parseCSV()
}

function clearCSV() {
  csvInput.value = ''
  csvParsed.headers = []
  csvParsed.rows = []
  csvStats.value = []
}

function exportCSV() {
  if (csvParsed.headers.length === 0) return
  const lines: string[] = [csvParsed.headers.join(',')]
  for (const row of csvParsed.rows) {
    const vals = csvParsed.headers.map((_, j) => String(row[String(j)]))
    lines.push(vals.join(','))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// Hex Viewer
// ============================================================
const hexInput = ref('')
const hexBytes = ref<number[]>([])
const hexSearch = ref('')
const hexSearchResults = ref<number[] | null>(null)

interface HexRow {
  offset: string
  bytes: number[]
  ascii: string
}

const hexRows = computed(() => {
  const rows: HexRow[] = []
  const bytes = hexBytes.value
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16)
    const offset = i.toString(16).padStart(8, '0')
    const ascii = chunk.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('')
    rows.push({ offset, bytes: chunk, ascii })
  }
  return rows
})

const searchMatches = ref<Set<number>>(new Set())

function parseHexInput() {
  const text = hexInput.value.trim()
  if (!text) return

  // Try to parse as hex bytes first
  const hexParts = text.split(/[\s,]+/).filter(s => s.length > 0)
  const isHex = hexParts.every(p => /^[0-9a-fA-F]{2}$/.test(p))

  if (isHex) {
    hexBytes.value = hexParts.map(p => parseInt(p, 16))
  } else {
    // Treat as text
    hexBytes.value = text.split('').map(c => c.charCodeAt(0))
  }
  hexSearchResults.value = null
  searchMatches.value = new Set()
}

function searchHex() {
  const pattern = hexSearch.value.trim()
  if (!pattern || hexBytes.value.length === 0) {
    hexSearchResults.value = null
    return
  }

  const patternBytes = pattern.split(/[\s,]+/).filter(s => s.length > 0).map(p => parseInt(p, 16))
  if (patternBytes.some(isNaN)) {
    hexSearchResults.value = []
    return
  }

  const matches: number[] = []
  for (let i = 0; i <= hexBytes.value.length - patternBytes.length; i++) {
    let match = true
    for (let j = 0; j < patternBytes.length; j++) {
      if (hexBytes.value[i + j] !== patternBytes[j]) {
        match = false
        break
      }
    }
    if (match) {
      for (let j = 0; j < patternBytes.length; j++) {
        matches.push(i + j)
      }
    }
  }
  hexSearchResults.value = matches.length > 0 ? [...new Set(matches)] : []
  searchMatches.value = new Set(matches)
}

function isSearchMatch(byteIndex: number): boolean {
  return searchMatches.value.has(byteIndex)
}

// ============================================================
// Checksum Calculator
// ============================================================
const csInput = ref('')
const csInputType = ref<'hex' | 'text'>('hex')
const csAlgorithm = ref('xor8')
const csExpected = ref('')
const csResult = ref<{ hex: string; dec: string; bin: string; dataLength: number } | null>(null)
const csVerifyResult = ref<boolean | null>(null)
const csSteps = ref<string[]>([])

const csAlgorithmLabel = computed(() => {
  const labels: Record<string, string> = {
    xor8: 'XOR 8-bit', xor16: 'XOR 16-bit',
    additive: '和校验 (Additive)',
    sumcomp: '求和补码 (Sum Complement)',
    crc8: 'CRC-8', crc16: 'CRC-16',
    crc16modbus: 'CRC-16 Modbus',
    sha256: 'SHA-256'
  }
  return labels[csAlgorithm.value] || csAlgorithm.value
})

function getCSBytes(): number[] {
  if (csInputType.value === 'hex') {
    const parts = csInput.value.trim().split(/[\s,]+/).filter(s => s.length > 0)
    return parts.map(p => parseInt(p, 16)).filter(v => !isNaN(v))
  } else {
    return csInput.value.split('').map(c => c.charCodeAt(0))
  }
}

async function calculateChecksum() {
  const bytes = getCSBytes()
  if (bytes.length === 0) return
  csSteps.value = []
  csVerifyResult.value = null

  const dataStr = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')
  csSteps.value.push(`数据 (${bytes.length} 字节): ${dataStr}`)

  let resultHex = ''
  let resultDec = ''
  let resultBin = ''

  switch (csAlgorithm.value) {
    case 'xor8': {
      let xor = 0
      for (const b of bytes) {
        xor ^= b
        csSteps.value.push(`XOR: ${xor.toString(16).padStart(2, '0')}`)
      }
      resultHex = '0x' + (xor & 0xFF).toString(16).padStart(2, '0')
      resultDec = String(xor & 0xFF)
      resultBin = ((xor & 0xFF) >>> 0).toString(2).padStart(8, '0')
      csSteps.value.push(`结果: ${resultHex}`)
      break
    }
    case 'xor16': {
      let xor = 0
      for (let i = 0; i < bytes.length; i += 2) {
        const word = (bytes[i] << 8) | (bytes[i + 1] || 0)
        xor ^= word
        csSteps.value.push(`XOR 16-bit word ${i / 2}: 0x${word.toString(16).padStart(4, '0')} -> 0x${xor.toString(16).padStart(4, '0')}`)
      }
      resultHex = '0x' + (xor & 0xFFFF).toString(16).padStart(4, '0')
      resultDec = String(xor & 0xFFFF)
      resultBin = ((xor & 0xFFFF) >>> 0).toString(2).padStart(16, '0')
      csSteps.value.push(`结果: ${resultHex}`)
      break
    }
    case 'additive': {
      let sum = 0
      for (const b of bytes) {
        sum += b
        csSteps.value.push(`加: sum = ${sum}`)
      }
      const result = sum & 0xFF
      resultHex = '0x' + result.toString(16).padStart(2, '0')
      resultDec = String(result)
      resultBin = result.toString(2).padStart(8, '0')
      csSteps.value.push(`求和: ${sum}, 取低8位: ${resultHex}`)
      break
    }
    case 'sumcomp': {
      let sum = 0
      for (const b of bytes) {
        sum += b
      }
      const comp = (~sum) & 0xFF
      resultHex = '0x' + comp.toString(16).padStart(2, '0')
      resultDec = String(comp)
      resultBin = comp.toString(2).padStart(8, '0')
      csSteps.value.push(`和: ${sum}`)
      csSteps.value.push(`按位取反: ~${sum} & 0xFF = ${comp} (${resultHex})`)
      break
    }
    case 'crc8': {
      let crc = 0x00
      for (const b of bytes) {
        crc ^= b
        for (let i = 0; i < 8; i++) {
          if (crc & 0x80) {
            crc = ((crc << 1) ^ 0x07) & 0xFF
          } else {
            crc = (crc << 1) & 0xFF
          }
        }
      }
      resultHex = '0x' + crc.toString(16).padStart(2, '0')
      resultDec = String(crc)
      resultBin = crc.toString(2).padStart(8, '0')
      csSteps.value.push(`CRC-8 结果: ${resultHex} (多项式: 0x07)`)
      break
    }
    case 'crc16': {
      let crc = 0xFFFF
      for (const b of bytes) {
        crc ^= b << 8
        for (let i = 0; i < 8; i++) {
          if (crc & 0x8000) {
            crc = ((crc << 1) ^ 0x8005) & 0xFFFF
          } else {
            crc = (crc << 1) & 0xFFFF
          }
        }
      }
      resultHex = '0x' + crc.toString(16).padStart(4, '0')
      resultDec = String(crc)
      resultBin = crc.toString(2).padStart(16, '0')
      csSteps.value.push(`CRC-16 结果: ${resultHex} (多项式: 0x8005)`)
      break
    }
    case 'crc16modbus': {
      let crc = 0xFFFF
      for (const b of bytes) {
        crc ^= b
        for (let i = 0; i < 8; i++) {
          if (crc & 0x0001) {
            crc = ((crc >> 1) ^ 0xA001) & 0xFFFF
          } else {
            crc = (crc >> 1) & 0xFFFF
          }
        }
      }
      resultHex = '0x' + crc.toString(16).padStart(4, '0')
      resultDec = String(crc)
      resultBin = crc.toString(2).padStart(16, '0')
      csSteps.value.push(`CRC-16 Modbus 结果: ${resultHex} (反射多项式: 0xA001)`)
      break
    }
    case 'sha256': {
      try {
        const encoder = new TextEncoder()
        const data = encoder.encode(csInput.value)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        resultHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        resultDec = hashArray.length + ' bytes'
        resultBin = 'N/A'
        csSteps.value.push(`SHA-256 摘要 (${hashArray.length} 字节): ${resultHex}`)
      } catch (e) {
        csSteps.value.push('SHA-256 计算失败: ' + String(e))
        return
      }
      break
    }
  }

  csResult.value = { hex: resultHex, dec: resultDec, bin: resultBin, dataLength: bytes.length }
}

function verifyChecksum() {
  if (!csResult.value) return
  const expected = csExpected.value.trim().toLowerCase().replace('0x', '')
  const actual = csResult.value.hex.toLowerCase().replace('0x', '')
  csVerifyResult.value = expected === actual
}

// ============================================================
// Batch Processing
// ============================================================
const batchOp = ref('count')
const batchInput = ref('')
const batchOutput = ref('')
const batchFind = ref('')
const batchReplace = ref('')
const batchColumn = ref(1)
const batchDelimiter = ref(',')
const batchRegex = ref('')
const batchRegexReplace = ref('')
const batchCaseType = ref('upper')
const batchCountInfo = ref<Record<string, string | number> | null>(null)

function runBatchOp() {
  batchOutput.value = ''
  batchCountInfo.value = null
  const text = batchInput.value
  const lines = text.split('\n')

  switch (batchOp.value) {
    case 'count': {
      const nonEmpty = lines.filter(l => l.trim()).length
      const words = text.split(/\s+/).filter(w => w.length > 0).length
      const chars = text.length
      const bytes = new TextEncoder().encode(text).length
      batchOutput.value = lines.map((l, i) => `${(i + 1).toString().padStart(4)}: ${l}`).join('\n')
      batchCountInfo.value = {
        '总行数': lines.length,
        '非空行': nonEmpty,
        '总词数': words,
        '总字符': chars,
        '总字节': bytes,
        '空行数': lines.length - nonEmpty
      }
      break
    }
    case 'words': {
      const wordCounts: Record<string, number> = {}
      text.split(/\s+/).filter(w => w.length > 0).forEach(w => {
        wordCounts[w] = (wordCounts[w] || 0) + 1
      })
      const sorted = Object.entries(wordCounts).sort((a, b) => b[1] - a[1])
      batchOutput.value = sorted.map(([w, c]) => `${w.padEnd(20)} ${c}`).join('\n')
      batchCountInfo.value = {
        '不同词数': Object.keys(wordCounts).length,
        '总词数': text.split(/\s+/).filter(w => w.length > 0).length,
        '最频繁词': sorted.length > 0 ? sorted[0][0] : 'N/A',
        '频率': sorted.length > 0 ? String(sorted[0][1]) : '0'
      }
      break
    }
    case 'replace': {
      if (!batchFind.value) {
        batchOutput.value = '请输入要查找的文本'
        return
      }
      batchOutput.value = text.split(batchFind.value).join(batchReplace.value)
      break
    }
    case 'sort': {
      batchOutput.value = [...lines].sort((a, b) => a.localeCompare(b)).join('\n')
      break
    }
    case 'sortdesc': {
      batchOutput.value = [...lines].sort((a, b) => b.localeCompare(a)).join('\n')
      break
    }
    case 'uniq': {
      const seen = new Set<string>()
      batchOutput.value = lines.filter(l => {
        if (seen.has(l)) return false
        seen.add(l)
        return true
      }).join('\n')
      batchCountInfo.value = {
        '原行数': lines.length,
        '去重后': seen.size,
        '移除': lines.length - seen.size
      }
      break
    }
    case 'extract': {
      const col = batchColumn.value - 1
      const delim = batchDelimiter.value || ','
      batchOutput.value = lines
        .map(l => {
          const parts = l.split(delim)
          return parts[col] || ''
        })
        .join('\n')
      break
    }
    case 'regex': {
      try {
        const re = new RegExp(batchRegex.value, 'g')
        if (batchRegexReplace.value) {
          batchOutput.value = text.replace(re, batchRegexReplace.value)
        } else {
          const matches: string[] = []
          let m: RegExpExecArray | null
          while ((m = re.exec(text)) !== null) {
            matches.push(`[${m.index}-${m.index + m[0].length}]: "${m[0]}"`)
          }
          batchOutput.value = matches.length > 0 ? matches.join('\n') : '未找到匹配'
          batchCountInfo.value = { '匹配数': matches.length }
        }
      } catch (e) {
        batchOutput.value = '正则表达式错误: ' + String(e)
      }
      break
    }
    case 'base64enc': {
      try {
        batchOutput.value = btoa(unescape(encodeURIComponent(text)))
      } catch (e) {
        batchOutput.value = '编码错误: ' + String(e)
      }
      break
    }
    case 'base64dec': {
      try {
        batchOutput.value = decodeURIComponent(escape(atob(text)))
      } catch (e) {
        batchOutput.value = '解码错误: ' + String(e)
      }
      break
    }
    case 'urlenc': {
      batchOutput.value = encodeURIComponent(text)
      break
    }
    case 'urldec': {
      try {
        batchOutput.value = decodeURIComponent(text)
      } catch (e) {
        batchOutput.value = '解码错误: ' + String(e)
      }
      break
    }
    case 'case': {
      if (batchCaseType.value === 'upper') {
        batchOutput.value = text.toUpperCase()
      } else if (batchCaseType.value === 'lower') {
        batchOutput.value = text.toLowerCase()
      } else if (batchCaseType.value === 'capitalize') {
        batchOutput.value = text.replace(/\b\w/g, c => c.toUpperCase())
      }
      break
    }
    case 'reverse': {
      batchOutput.value = [...lines].reverse().join('\n')
      break
    }
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
}
</script>

<style scoped>
.file-tools {
  padding: 4px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  overflow-x: auto;
  padding: 8px 0;
}

.hex-viewer-container {
  overflow-x: auto;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
}

.hex-viewer {
  min-width: 600px;
}

.hex-row {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.hex-row:nth-child(odd) {
  background: #fafafa;
}

.hex-offset {
  width: 80px;
  color: #909399;
  user-select: none;
}

.hex-separator {
  color: #c0c4cc;
  margin: 0 4px;
  user-select: none;
}

.hex-bytes {
  display: flex;
  gap: 4px;
  flex: 1;
  margin: 0 8px;
}

.hex-byte {
  min-width: 18px;
  text-align: center;
  color: #303133;
}

.hex-byte.search-match {
  background: #fef0f0;
  color: #f56c6c;
  font-weight: bold;
  border-radius: 2px;
  padding: 0 1px;
}

.hex-ascii {
  min-width: 160px;
  color: #606266;
}

.hex-info p {
  font-size: 13px;
  color: #606266;
  margin: 4px 0;
}

.cs-steps {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #606266;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
