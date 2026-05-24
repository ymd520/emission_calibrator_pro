<template>
  <div class="music-generator">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: Data Import -->
      <el-tab-pane label="数据导入" name="import">
        <div class="tab-content">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-card shadow="never">
                <template #header>
                  <span>手动录入</span>
                </template>
                <el-form :model="manualEntry" label-position="top" size="small">
                  <el-row :gutter="8">
                    <el-col :span="12">
                      <el-form-item label="NOx (ppm)">
                        <el-input-number v-model="manualEntry.nox" :min="0" :max="5000" :step="1" controls-position="right" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="CO₂ (%)">
                        <el-input-number v-model="manualEntry.co2" :min="0" :max="20" :step="0.1" :precision="1" controls-position="right" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="8">
                    <el-col :span="12">
                      <el-form-item label="RPM">
                        <el-input-number v-model="manualEntry.rpm" :min="0" :max="8000" :step="50" controls-position="right" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="温度 (°C)">
                        <el-input-number v-model="manualEntry.temp" :min="-40" :max="200" :step="1" controls-position="right" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="8">
                    <el-col :span="12">
                      <el-form-item label="FC (kg/h)">
                        <el-input-number v-model="manualEntry.fc" :min="0" :max="100" :step="0.1" :precision="1" controls-position="right" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="Lambda">
                        <el-input-number v-model="manualEntry.lambda" :min="0.5" :max="2.0" :step="0.01" :precision="2" controls-position="right" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-form-item label="车速 (km/h)">
                    <el-input-number v-model="manualEntry.speed" :min="0" :max="250" :step="1" controls-position="right" style="width:100%" />
                  </el-form-item>
                  <el-button type="primary" size="small" @click="addManualEntry" :disabled="!hasManualEntryData">
                    添加到数据表
                  </el-button>
                </el-form>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never">
                <template #header>
                  <span>样本数据 & CSV导入</span>
                </template>
                <el-button type="success" size="small" @click="generateSampleData" style="margin-bottom:12px">
                  生成样本数据 (WLTC-like)
                </el-button>
                <el-input
                  v-model="csvText"
                  type="textarea"
                  :rows="6"
                  placeholder="粘贴CSV数据，格式:&#10;时间,Nox,CO2,RPM,Temp,FC,Lambda,Speed&#10;0,120,14.2,800,30,2.1,1.02,0&#10;10,180,14.5,1200,45,3.2,0.98,20&#10;..."
                />
                <el-button type="warning" size="small" @click="parseCSV" style="margin-top:8px">
                  解析CSV
                </el-button>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never">
                <template #header>
                  <span>数据概况</span>
                </template>
                <div class="data-summary">
                  <p>数据点数: <strong>{{ emissionData.length }}</strong></p>
                  <p v-if="emissionData.length > 0">
                    时间范围: {{ emissionData[0].time }}s ~ {{ emissionData[emissionData.length - 1].time }}s<br>
                    NOx: {{ getStat('nox').min }} ~ {{ getStat('nox').max }} ppm<br>
                    RPM: {{ getStat('rpm').min }} ~ {{ getStat('rpm').max }}<br>
                    温度: {{ getStat('temp').min }} ~ {{ getStat('temp').max }} °C
                  </p>
                  <el-button type="danger" size="small" @click="clearAll" :disabled="emissionData.length === 0">
                    清空数据
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-card shadow="never" style="margin-top:16px">
            <template #header>
              <span>数据预览表</span>
            </template>
            <el-table
              :data="emissionData"
              height="250"
              border
              stripe
              size="small"
              style="width:100%"
              v-if="emissionData.length > 0"
            >
              <el-table-column prop="time" label="时间(s)" width="80" sortable />
              <el-table-column prop="nox" label="NOx(ppm)" width="90" />
              <el-table-column prop="co2" label="CO₂(%)" width="90" />
              <el-table-column prop="rpm" label="RPM" width="80" />
              <el-table-column prop="temp" label="温度(°C)" width="90" />
              <el-table-column prop="fc" label="FC(kg/h)" width="90" />
              <el-table-column prop="lambda" label="Lambda" width="80" />
              <el-table-column prop="speed" label="车速(km/h)" width="100" />
              <el-table-column label="操作" width="60" fixed="right">
                <template #default="{ $index }">
                  <el-button text size="small" type="danger" @click="removeDataPoint($index)">×</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无数据，请手动录入或导入CSV" />
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Mapping Rules -->
      <el-tab-pane label="映射规则" name="rules">
        <div class="tab-content">
          <el-row :gutter="16">
            <el-col :span="8" v-for="param in mappingParams" :key="param.key">
              <el-card shadow="never" class="mapping-card" :class="{ active: param.enabled }">
                <template #header>
                  <div class="mapping-card-header">
                    <el-switch v-model="param.enabled" size="small" />
                    <span class="param-name">{{ param.label }}</span>
                    <el-tag size="small" :type="param.enabled ? 'success' : 'info'" effect="plain">
                      {{ param.currentValue ?? '-' }}
                    </el-tag>
                  </div>
                </template>
                <div class="mapping-body">
                  <p class="mapped-to">→ {{ param.mappedElement }}</p>
                  <el-form size="small" label-position="top">
                    <el-row :gutter="8">
                      <el-col :span="12">
                        <el-form-item label="最小值">
                          <el-input-number v-model="param.min" :step="param.step || 1" :precision="param.precision || 0" controls-position="right" style="width:100%" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="最大值">
                          <el-input-number v-model="param.max" :step="param.step || 1" :precision="param.precision || 0" controls-position="right" style="width:100%" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                  <div class="mapped-preview">
                    <span class="preview-label">映射预览:</span>
                    <span class="preview-value">{{ getMappedPreview(param) }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- Tab 3: Instrument Selection -->
      <el-tab-pane label="音色选择" name="instruments">
        <div class="tab-content">
          <el-row :gutter="16">
            <el-col :span="8" v-for="inst in instruments" :key="inst.id">
              <el-card shadow="never" class="inst-card" :class="{ selected: inst.selected }">
                <template #header>
                  <div class="inst-header">
                    <el-checkbox v-model="inst.selected" :label="inst.name" />
                    <el-button size="small" circle @click="previewInstrument(inst.id)" title="预览音色">
                      <el-icon><svg viewBox="0 0 24 24" width="14" height="14"><polygon points="5,3 19,12 5,21" fill="currentColor"/></svg></el-icon>
                    </el-button>
                  </div>
                </template>
                <div class="inst-body">
                  <p class="inst-desc">{{ inst.description }}</p>
                  <p class="inst-type">Tone.js: {{ inst.engineName }}</p>
                  <div v-if="inst.params" class="inst-params">
                    <el-form size="small" label-position="top">
                      <el-form-item v-for="(val, key) in inst.params" :key="key" :label="key">
                        <el-slider v-model="inst.params[key]" :min="0" :max="1" :step="0.01" />
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-alert
            v-if="selectedInstruments.length === 0"
            title="请至少选择一种音色"
            type="warning"
            :closable="false"
            show-icon
            style="margin-top:12px"
          />
        </div>
      </el-tab-pane>

      <!-- Tab 4: Generation & Playback -->
      <el-tab-pane label="生成与播放" name="playback">
        <div class="tab-content">
          <el-row :gutter="16">
            <el-col :span="16">
              <el-card shadow="never">
                <template #header>
                  <div class="playback-header">
                    <span>播放控制</span>
                    <div class="playback-info">
                      <el-tag size="small" type="info" v-if="computedTempo">BPM: {{ computedTempo }}</el-tag>
                      <el-tag size="small" type="info" v-if="generatedNotes.length">音符数: {{ generatedNotes.length }}</el-tag>
                    </div>
                  </div>
                </template>
                <div class="playback-controls">
                  <el-button
                    type="primary"
                    @click="generateAndPlay"
                    :disabled="emissionData.length === 0 || selectedInstruments.length === 0"
                    :loading="isGenerating"
                  >
                    生成并播放
                  </el-button>
                  <el-button @click="togglePlayPause" :disabled="!hasGenerated" :type="isPlaying ? 'warning' : 'success'">
                    {{ isPlaying ? '暂停' : '播放' }}
                  </el-button>
                  <el-button @click="stopPlayback" :disabled="!hasGenerated" type="danger">
                    停止
                  </el-button>
                  <el-button @click="stopAllNow" type="info">
                    紧急停止
                  </el-button>
                </div>
                <div class="progress-section" v-if="hasGenerated">
                  <el-progress
                    :percentage="playbackProgress"
                    :stroke-width="12"
                    :format="() => `${formatTime(currentPlayTime)} / ${formatTime(totalDuration)}`"
                    status="success"
                    style="margin:16px 0"
                  />
                  <div class="time-display">
                    <span>当前: {{ formatTime(currentPlayTime) }}</span>
                    <span>总时长: {{ formatTime(totalDuration) }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never">
                <template #header>
                  <span>生成设置</span>
                </template>
                <el-form size="small" label-position="top">
                  <el-form-item label="播放速度">
                    <el-slider v-model="playbackSpeed" :min="0.25" :max="4" :step="0.25" show-input />
                  </el-form-item>
                  <el-form-item label="音符密度">
                    <el-slider v-model="noteDensity" :min="1" :max="10" :step="1" show-input />
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
          </el-row>
          <el-card shadow="never" style="margin-top:16px" v-if="generatedNotes.length > 0">
            <template #header>
              <span>音符事件预览 (前20条)</span>
            </template>
            <el-table :data="generatedNotes.slice(0, 20)" height="180" border size="small" style="width:100%">
              <el-table-column prop="time" label="时间(s)" width="80" :formatter="(r) => r.time.toFixed(2)" />
              <el-table-column prop="note" label="音符" width="80" />
              <el-table-column prop="duration" label="时值(s)" width="80" :formatter="(r) => r.duration.toFixed(2)" />
              <el-table-column prop="velocity" label="力度" width="70" :formatter="(r) => (r.velocity * 100).toFixed(0) + '%'" />
              <el-table-column prop="instrument" label="乐器" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Tab 5: Export -->
      <el-tab-pane label="导出" name="export">
        <div class="tab-content">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>
                  <span>导出 WAV</span>
                </template>
                <p style="margin-bottom:12px;color:#909399">使用 Tone.Offline 渲染为音频文件</p>
                <el-button
                  type="primary"
                  @click="exportWAV"
                  :disabled="generatedNotes.length === 0"
                  :loading="exportingWav"
                >
                  导出 WAV
                </el-button>
                <el-progress v-if="exportingWav" :percentage="wavExportProgress" style="margin-top:12px" />
                <el-alert
                  v-if="wavExportUrl"
                  title="WAV 导出成功"
                  type="success"
                  :closable="true"
                  show-icon
                  style="margin-top:12px"
                >
                  <template #default>
                    <a :href="wavExportUrl" download="emission_music.wav">下载 WAV 文件</a>
                  </template>
                </el-alert>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>
                  <span>导出 MIDI</span>
                </template>
                <p style="margin-bottom:12px;color:#909399">生成标准 MIDI 文件 (格式0)</p>
                <el-button
                  type="primary"
                  @click="exportMIDI"
                  :disabled="generatedNotes.length === 0"
                  :loading="exportingMidi"
                >
                  导出 MIDI
                </el-button>
                <el-alert
                  v-if="midiExportUrl"
                  title="MIDI 导出成功"
                  type="success"
                  :closable="true"
                  show-icon
                  style="margin-top:12px"
                >
                  <template #default>
                    <a :href="midiExportUrl" download="emission_music.mid">下载 MIDI 文件</a>
                  </template>
                </el-alert>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import * as Tone from 'tone'

// ============================================================
// Types
// ============================================================
interface EmissionDataPoint {
  time: number
  nox: number
  co2: number
  rpm: number
  temp: number
  fc: number
  lambda: number
  speed: number
}

interface NoteEvent {
  time: number
  note: string
  duration: number
  velocity: number
  instrument: string
}

interface MappingParam {
  key: string
  label: string
  mappedElement: string
  enabled: boolean
  min: number
  max: number
  step: number
  precision: number
  currentValue: number | null
  previewFn: (val: number) => string
}

interface InstrumentDef {
  id: string
  name: string
  description: string
  engineName: string
  selected: boolean
  params: Record<string, number>
}

// ============================================================
// State
// ============================================================
const activeTab = ref('import')
const emissionData = ref<EmissionDataPoint[]>([])
const csvText = ref('')
const generatedNotes = ref<NoteEvent[]>([])
const isGenerating = ref(false)
const isPlaying = ref(false)
const hasGenerated = ref(false)
const playbackProgress = ref(0)
const currentPlayTime = ref(0)
const totalDuration = ref(0)
const playbackSpeed = ref(1)
const noteDensity = ref(5)
const exportingWav = ref(false)
const exportingMidi = ref(false)
const wavExportProgress = ref(0)
const wavExportUrl = ref('')
const midiExportUrl = ref('')
const computedTempo = ref(0)

let toneSequence: Tone.Sequence | null = null
let tonePlayers: Tone.PolySynth[] = []
let currentSynths: Tone.PolySynth[] = []
let playbackInterval: ReturnType<typeof setInterval> | null = null
let isStopped = false

// Manual entry form
const manualEntry = reactive({
  nox: 120,
  co2: 14.2,
  rpm: 800,
  temp: 30,
  fc: 2.1,
  lambda: 1.02,
  speed: 0
})

const hasManualEntryData = computed(() => true)

// ============================================================
// Mapping Parameters
// ============================================================
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

function pitchToNote(pitch: number): string {
  const octave = Math.floor(pitch / 12) + 2
  const noteIdx = pitch % 12
  return `${NOTE_NAMES[noteIdx]}${Math.max(1, Math.min(8, octave))}`
}

function valueToNote(val: number, minIn: number, maxIn: number, minNote: number = 24, maxNote: number = 72): string {
  const t = maxIn === minIn ? 0 : (val - minIn) / (maxIn - minIn)
  const pitch = minNote + Math.round(t * (maxNote - minNote))
  return pitchToNote(Math.max(0, Math.min(88, pitch)))
}

function valueToBPM(val: number): number {
  return Math.round(60 + (val - 800) / (4000 - 800) * (180 - 60))
}

function valueToScale(val: number): string {
  return val > 1 ? '大调 (Major)' : val < 1 ? '小调 (Minor)' : '中调'
}

function mapFCtoVelocity(val: number): number {
  return Math.min(1, Math.max(0.1, val / 50))
}

const mappingParams = reactive<MappingParam[]>([
  {
    key: 'nox',
    label: 'NOx',
    mappedElement: '音高 (Pitch)',
    enabled: true,
    min: 0,
    max: 2000,
    step: 10,
    precision: 0,
    currentValue: null,
    previewFn: (v: number) => valueToNote(v, 0, 2000, 24, 72)
  },
  {
    key: 'co2',
    label: 'CO₂',
    mappedElement: '和声和谐度',
    enabled: true,
    min: 0,
    max: 20,
    step: 0.1,
    precision: 1,
    currentValue: null,
    previewFn: (v: number) => v > 15 ? '不和谐' : v > 10 ? '中性' : '和谐'
  },
  {
    key: 'rpm',
    label: 'RPM',
    mappedElement: '速度/节奏 (BPM)',
    enabled: true,
    min: 800,
    max: 4000,
    step: 50,
    precision: 0,
    currentValue: null,
    previewFn: (v: number) => `${valueToBPM(v)} BPM`
  },
  {
    key: 'temp',
    label: '温度',
    mappedElement: '音色 (Timbre)',
    enabled: true,
    min: -20,
    max: 120,
    step: 5,
    precision: 0,
    currentValue: null,
    previewFn: (v: number) => v < 30 ? '温暖 (钢琴类)' : v < 70 ? '中性' : '明亮 (合成器类)'
  },
  {
    key: 'fc',
    label: 'FC (油耗)',
    mappedElement: '力度/音量',
    enabled: true,
    min: 0,
    max: 50,
    step: 1,
    precision: 1,
    currentValue: null,
    previewFn: (v: number) => `${(mapFCtoVelocity(v) * 100).toFixed(0)}%`
  },
  {
    key: 'lambda',
    label: 'Lambda',
    mappedElement: '音阶模式',
    enabled: true,
    min: 0.7,
    max: 1.5,
    step: 0.01,
    precision: 2,
    currentValue: null,
    previewFn: (v: number) => valueToScale(v)
  }
])

// ============================================================
// Instruments
// ============================================================
const instruments = reactive<InstrumentDef[]>([
  {
    id: 'piano',
    name: '钢琴 (Piano)',
    description: '温暖饱满的音色，适合旋律线',
    engineName: 'Tone.PolySynth(Tone.Synth)',
    selected: true,
    params: { volume: 0.8, attack: 0.02, release: 0.8 }
  },
  {
    id: 'strings',
    name: '弦乐 (Strings)',
    description: '柔和的铺底音色，适合背景和声',
    engineName: 'Tone.FMSynth',
    selected: false,
    params: { volume: 0.7, modulationIndex: 0.5 }
  },
  {
    id: 'flute',
    name: '长笛 (Flute)',
    description: '通透纯净的音色，适合主旋律',
    engineName: 'Tone.Synth with Filter',
    selected: false,
    params: { volume: 0.7, filter: 0.6 }
  },
  {
    id: 'synth',
    name: '合成器 (Synth Lead)',
    description: '明亮的电子音色，适合节奏段落',
    engineName: 'Tone.MonoSynth',
    selected: false,
    params: { volume: 0.8, filterQ: 0.5 }
  },
  {
    id: 'bass',
    name: '贝斯 (Bass)',
    description: '低沉有力的低音线条',
    engineName: 'Tone.AMSynth',
    selected: false,
    params: { volume: 0.9, carrier: 0.5 }
  },
  {
    id: 'percussion',
    name: '打击乐 (Percussion)',
    description: '节奏型打击音色组合',
    engineName: 'MembraneSynth + MetalSynth',
    selected: false,
    params: { volume: 0.75, decay: 0.3 }
  }
])

const selectedInstruments = computed(() => instruments.filter(i => i.selected))

// ============================================================
// Data Methods
// ============================================================
function addManualEntry() {
  const lastTime = emissionData.value.length > 0
    ? emissionData.value[emissionData.value.length - 1].time
    : -1
  emissionData.value.push({
    time: lastTime + 1,
    nox: manualEntry.nox,
    co2: manualEntry.co2,
    rpm: manualEntry.rpm,
    temp: manualEntry.temp,
    fc: manualEntry.fc,
    lambda: manualEntry.lambda,
    speed: manualEntry.speed
  })
}

function removeDataPoint(index: number) {
  emissionData.value.splice(index, 1)
}

function clearAll() {
  emissionData.value = []
  generatedNotes.value = []
  hasGenerated.value = false
  stopPlayback()
}

function getStat(key: keyof EmissionDataPoint) {
  const vals = emissionData.value.map(d => d[key] as number)
  return {
    min: Math.min(...vals),
    max: Math.max(...vals),
    avg: vals.reduce((a, b) => a + b, 0) / vals.length
  }
}

function generateSampleData() {
  emissionData.value = []
  // Generate WLTC-like emission data (about 180 points over 1800 seconds)
  const phases = [
    { dur: 600, rpmBase: 900, rpmVar: 200, speedBase: 15, speedVar: 10, load: 'low' },
    { dur: 300, rpmBase: 1500, rpmVar: 400, speedBase: 40, speedVar: 20, load: 'medium' },
    { dur: 450, rpmBase: 2200, rpmVar: 600, speedBase: 60, speedVar: 25, load: 'high' },
    { dur: 150, rpmBase: 1200, rpmVar: 300, speedBase: 25, speedVar: 15, load: 'low' },
    { dur: 300, rpmBase: 2800, rpmVar: 800, speedBase: 80, speedVar: 30, load: 'extra' }
  ]
  let t = 0
  for (const phase of phases) {
    const steps = Math.floor(phase.dur / (10 / noteDensity.value))
    for (let i = 0; i < steps; i++) {
      const p = i / steps
      const rpm = phase.rpmBase + Math.sin(p * Math.PI * 4) * phase.rpmVar + (Math.random() - 0.5) * 100
      const speed = phase.speedBase + Math.sin(p * Math.PI * 3) * phase.speedVar + Math.random() * 5
      const loadFactor = rpm / 4000
      emissionData.value.push({
        time: Math.round(t * 10) / 10,
        nox: 50 + loadFactor * 400 + Math.random() * 80,
        co2: 5 + loadFactor * 12 + Math.random() * 2,
        rpm: Math.round(rpm / 10) * 10,
        temp: 20 + loadFactor * 100 + Math.random() * 10,
        fc: 0.5 + loadFactor * 6 + Math.random(),
        lambda: 0.85 + loadFactor * 0.3 + (Math.random() - 0.5) * 0.1,
        speed: Math.round(speed)
      })
      t += phase.dur / steps
    }
  }
}

function parseCSV() {
  if (!csvText.value.trim()) return
  const lines = csvText.value.trim().split('\n')
  if (lines.length < 2) return
  emissionData.value = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim())
    if (parts.length < 8) continue
    const [time, nox, co2, rpm, temp, fc, lambda, speed] = parts.map(Number)
    if ([time, nox, co2, rpm, temp, fc, lambda, speed].some(isNaN)) continue
    emissionData.value.push({ time, nox, co2, rpm, temp, fc, lambda, speed })
  }
}

// ============================================================
// Mapping Preview
// ============================================================
function getMappedPreview(param: MappingParam): string {
  if (param.currentValue === null) return '暂无数据'
  return param.previewFn(param.currentValue)
}

// Update mapping current values when data changes
function updateMappingCurrentValues(data: EmissionDataPoint[]) {
  if (data.length === 0) return
  const avg = (key: keyof EmissionDataPoint) =>
    data.reduce((s, d) => s + (d[key] as number), 0) / data.length
  for (const param of mappingParams) {
    if (param.key === 'nox') param.currentValue = Math.round(avg('nox'))
    else if (param.key === 'co2') param.currentValue = Math.round(avg('co2') * 10) / 10
    else if (param.key === 'rpm') param.currentValue = Math.round(avg('rpm'))
    else if (param.key === 'temp') param.currentValue = Math.round(avg('temp'))
    else if (param.key === 'fc') param.currentValue = Math.round(avg('fc') * 10) / 10
    else if (param.key === 'lambda') param.currentValue = Math.round(avg('lambda') * 100) / 100
  }
}

// ============================================================
// Music Generation Logic
// ============================================================
function noteNameToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(\d+)$/)
  if (!match) return 60
  const noteIndex = NOTE_NAMES.indexOf(match[1])
  const octave = parseInt(match[2])
  return (octave + 1) * 12 + noteIndex
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const noteIdx = midi % 12
  return `${NOTE_NAMES[noteIdx]}${Math.max(0, octave)}`
}

function linearMap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = inMax === inMin ? 0.5 : (value - inMin) / (inMax - inMin)
  return outMin + Math.max(0, Math.min(1, t)) * (outMax - outMin)
}

function getCO2Chord(co2: number): string[] {
  const lowChord = ['C3', 'E3', 'G3']
  const midChord = ['C4', 'Eb4', 'G4']
  const highChord = ['C5', 'Eb5', 'Gb5', 'Bb5']
  if (co2 <= 8) return lowChord
  if (co2 <= 14) return midChord
  return highChord
}

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]

function scaleNote(root: number, index: number, isMajor: boolean): number {
  const scale = isMajor ? MAJOR_SCALE : MINOR_SCALE
  const octave = Math.floor(index / 7)
  const degree = index % 7
  return root + octave * 12 + scale[degree]
}

function generateNotes(data: EmissionDataPoint[], rules: MappingParam[], density: number): NoteEvent[] {
  const notes: NoteEvent[] = []
  const instNames = selectedInstruments.value
  if (instNames.length === 0) return notes

  const avgRPM = data.reduce((s, d) => s + d.rpm, 0) / data.length
  const bpm = valueToBPM(avgRPM)
  computedTempo.value = bpm
  const beatDuration = 60 / bpm
  const stepDuration = beatDuration * density

  const noxRule = rules.find(r => r.key === 'nox')!
  const co2Rule = rules.find(r => r.key === 'co2')!
  const rpmRule = rules.find(r => r.key === 'rpm')!
  const fcRule = rules.find(r => r.key === 'fc')!
  const lambdaRule = rules.find(r => r.key === 'lambda')!

  for (let i = 0; i < data.length; i++) {
    const dp = data[i]
    const time = dp.time * (60 / bpm) * 0.5 / density

    // Map NOx to pitch
    const noteMidi = Math.round(linearMap(dp.nox, noxRule.min, noxRule.max, 48, 84))
    const noteName = midiToNoteName(noteMidi)

    // Map FC to velocity
    const velocity = mapFCtoVelocity(dp.fc)

    // Scale mode based on lambda
    const isMajor = dp.lambda >= 1
    const rootNote = Math.round(linearMap(dp.nox, noxRule.min, noxRule.max, 36, 60))
    const scaleNoteIdx = Math.round(linearMap(i, 0, data.length, 0, 28))
    const scaledPitch = scaleNote(rootNote, scaleNoteIdx % 28, isMajor)
    const scaledNote = midiToNoteName(scaledPitch)

    // Generate notes for each selected instrument
    const noteDuration = stepDuration * (0.25 + Math.random() * 0.5)

    for (let instIdx = 0; instIdx < instNames.length; instIdx++) {
      const inst = instNames[instIdx]
      if (inst.id === 'percussion') {
        // Percussion: rhythmic hits
        if (i % 4 < 2) {
          notes.push({
            time,
            note: i % 4 === 0 ? 'C3' : 'G2',
            duration: noteDuration * 0.5,
            velocity: 0.6 + (dp.speed / 200) * 0.4,
            instrument: inst.id
          })
        }
        continue
      }
      if (inst.id === 'bass' && i % 2 === 0) {
        notes.push({
          time,
          note: midiToNoteName(rootNote - 12),
          duration: noteDuration * 1.5,
          velocity: velocity * 0.8,
          instrument: inst.id
        })
        continue
      }
      if (inst.id === 'strings' && i % 3 === 0) {
        // Chord from CO2
        const chordNotes = getCO2Chord(dp.co2)
        for (const cn of chordNotes) {
          notes.push({
            time,
            note: cn,
            duration: noteDuration * 2,
            velocity: velocity * 0.6,
            instrument: inst.id
          })
        }
        continue
      }

      // Default: melodic note
      notes.push({
        time,
        note: scaledNote,
        duration: noteDuration,
        velocity,
        instrument: inst.id
      })
    }
  }

  // Sort by time
  notes.sort((a, b) => a.time - b.time)
  return notes
}

// ============================================================
// Playback
// ============================================================
async function generateAndPlay() {
  if (isGenerating.value) return
  isGenerating.value = true
  stopPlayback()

  updateMappingCurrentValues(emissionData.value)
  generatedNotes.value = generateNotes(emissionData.value, mappingParams, noteDensity.value)

  if (generatedNotes.value.length === 0) {
    isGenerating.value = false
    return
  }

  totalDuration.value = generatedNotes.value[generatedNotes.value.length - 1].time +
    generatedNotes.value[generatedNotes.value.length - 1].duration + 1

  await startPlayback()
  isGenerating.value = false
  hasGenerated.value = true
}

function createSynthForInstrument(instId: string): Tone.PolySynth | null {
  switch (instId) {
    case 'piano':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.2 }
      }).toDestination()
    case 'strings':
      return new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2.5,
        modulationIndex: 0.6,
        carrier: { type: 'sine' },
        modulator: { type: 'sine' }
      }).toDestination()
    case 'flute':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 },
        filter: { Q: 1, frequency: 1200 }
      }).toDestination()
    case 'synth':
      return new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'sawtooth' },
        filter: { Q: 6, frequency: 800 },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.8 },
        filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 200, octaves: 4 }
      }).toDestination()
    case 'bass':
      return new Tone.PolySynth(Tone.AMSynth, {
        carrier: { type: 'square' },
        modulator: { type: 'sine' },
        harmonicity: 0.5
      }).toDestination()
    case 'percussion': {
      const membrane = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).toDestination()
      const metal = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0.001, release: 0.3 },
        harmonicity: 8.5,
        modulationIndex: 40,
        resonance: 800
      }).toDestination()
      const ps = new Tone.PolySynth(Tone.Synth)
      // We'll use membrane and metal directly via triggerAttackRelease
      return null
    }
    default:
      return new Tone.PolySynth(Tone.Synth).toDestination()
  }
}

let membraneSynth: Tone.MembraneSynth | null = null
let metalSynth: Tone.MetalSynth | null = null

async function startPlayback() {
  await Tone.start()
  const now = Tone.now()

  // Create synths
  currentSynths = []
  membraneSynth = null
  metalSynth = null

  for (const inst of selectedInstruments.value) {
    if (inst.id === 'percussion') {
      membraneSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).toDestination()
      metalSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0.001, release: 0.3 },
        harmonicity: 8.5,
        modulationIndex: 40,
        resonance: 800
      }).toDestination()
    } else {
      const synth = createSynthForInstrument(inst.id)
      if (synth) {
        synth.set({ volume: (inst.params.volume - 0.5) * 20 })
        currentSynths.push(synth)
      }
    }
  }

  isStopped = false

  // Schedule all notes grouped by instrument
  const scheduleTime = now + 0.1
  for (const note of generatedNotes.value) {
    if (isStopped) break
    const t = scheduleTime + note.time / playbackSpeed.value
    const dur = note.duration / playbackSpeed.value

    if (note.instrument === 'percussion') {
      if (membraneSynth) {
        membraneSynth.triggerAttackRelease(note.note, dur, t, note.velocity)
      }
      if (metalSynth) {
        metalSynth.triggerAttackRelease(note.note, dur, t, note.velocity * 0.5)
      }
    } else {
      const idx = selectedInstruments.value.findIndex(i => i.id === note.instrument)
      if (idx >= 0 && !note.instrument.includes('percussion')) {
        // Map index to synth in currentSynths (minus percussion)
        let synthIdx = 0
        for (let si = 0; si < selectedInstruments.value.length; si++) {
          if (selectedInstruments.value[si].id === note.instrument) {
            if (selectedInstruments.value[si].id !== 'percussion') {
              break
            }
          }
          if (selectedInstruments.value[si].id !== 'percussion') {
            synthIdx++
          }
        }
        if (synthIdx < currentSynths.length) {
          currentSynths[synthIdx].triggerAttackRelease(note.note, dur, t, note.velocity)
        }
      }
    }
  }

  isPlaying.value = true
  playbackProgress.value = 0
  currentPlayTime.value = 0

  // Progress tracking
  playbackInterval = setInterval(() => {
    if (isStopped) return
    const elapsed = Tone.now() - scheduleTime
    currentPlayTime.value = Math.max(0, elapsed * playbackSpeed.value)
    playbackProgress.value = Math.min(100, (currentPlayTime.value / totalDuration.value) * 100)

    if (playbackProgress.value >= 100 || isStopped) {
      clearInterval(playbackInterval!)
      playbackInterval = null
      isPlaying.value = false
      playbackProgress.value = 100
    }
  }, 100)
}

function togglePlayPause() {
  if (isPlaying.value) {
    Tone.getTransport().pause()
    isPlaying.value = false
    if (playbackInterval) {
      clearInterval(playbackInterval)
      playbackInterval = null
    }
  } else {
    Tone.getTransport().start()
    isPlaying.value = true
    playbackInterval = setInterval(() => {
      if (isStopped) return
      currentPlayTime.value += 0.1
      playbackProgress.value = Math.min(100, (currentPlayTime.value / totalDuration.value) * 100)
      if (playbackProgress.value >= 100) {
        clearInterval(playbackInterval!)
        playbackInterval = null
        isPlaying.value = false
      }
    }, 100)
  }
}

function stopPlayback() {
  isStopped = true
  Tone.getTransport().stop()
  Tone.getTransport().cancel()
  isPlaying.value = false
  playbackProgress.value = 0
  currentPlayTime.value = 0

  // Dispose synths
  for (const synth of currentSynths) {
    try { synth.dispose() } catch {}
  }
  currentSynths = []
  if (membraneSynth) { try { membraneSynth.dispose() } catch {}; membraneSynth = null }
  if (metalSynth) { try { metalSynth.dispose() } catch {}; metalSynth = null }

  if (playbackInterval) {
    clearInterval(playbackInterval)
    playbackInterval = null
  }
}

function stopAllNow() {
  Tone.getDestination().silence()
  stopPlayback()
}

// ============================================================
// Instrument Preview
// ============================================================
async function previewInstrument(instId: string) {
  await Tone.start()

  if (instId === 'percussion') {
    const mem = new Tone.MembraneSynth().toDestination()
    const met = new Tone.MetalSynth().toDestination()
    const now = Tone.now()
    mem.triggerAttackRelease('C2', '8n', now)
    met.triggerAttackRelease('C3', '16n', now + 0.15)
    mem.triggerAttackRelease('E2', '8n', now + 0.3)
    met.triggerAttackRelease('E3', '16n', now + 0.45)
    mem.triggerAttackRelease('G2', '4n', now + 0.6)
    setTimeout(() => { try { mem.dispose(); met.dispose() } catch {} }, 2000)
    return
  }

  const synth = createSynthForInstrument(instId)
  if (!synth) return
  const now = Tone.now()
  const notes = ['C4', 'D4', 'E4', 'G4', 'C5']
  notes.forEach((n, i) => {
    synth.triggerAttackRelease(n, '8n', now + i * 0.2, 0.7)
  })
  setTimeout(() => { try { synth.dispose() } catch {} }, 3000)
}

// ============================================================
// Export
// ============================================================
async function exportWAV() {
  if (exportingWav.value) return
  exportingWav.value = true
  wavExportProgress.value = 0

  try {
    await Tone.start()
    const duration = totalDuration.value || 5

    const offlineBuffer = await Tone.Offline(({ transport, context }) => {
      const exportedSynths: Tone.PolySynth[] = []
      let exportMembrane: Tone.MembraneSynth | null = null
      let exportMetal: Tone.MetalSynth | null = null

      for (const inst of selectedInstruments.value) {
        if (inst.id === 'percussion') {
          exportMembrane = new Tone.MembraneSynth({
            pitchDecay: 0.05, octaves: 5,
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
          }).toDestination()
          exportMetal = new Tone.MetalSynth({
            frequency: 200,
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.001, release: 0.3 },
            harmonicity: 8.5, modulationIndex: 40, resonance: 800
          }).toDestination()
        } else {
          const s = createSynthForInstrument(inst.id)
          if (s) exportedSynths.push(s)
        }
      }

      for (const note of generatedNotes.value) {
        const t = note.time / playbackSpeed.value
        const dur = note.duration / playbackSpeed.value

        if (note.instrument === 'percussion') {
          if (exportMembrane) exportMembrane.triggerAttackRelease(note.note, dur, t, note.velocity)
          if (exportMetal) exportMetal.triggerAttackRelease(note.note, dur, t, note.velocity * 0.5)
        } else {
          let synthIdx = 0
          for (const inst of selectedInstruments.value) {
            if (inst.id === 'percussion') continue
            if (inst.id === note.instrument) break
            synthIdx++
          }
          if (synthIdx < exportedSynths.length) {
            exportedSynths[synthIdx].triggerAttackRelease(note.note, dur, t, note.velocity)
          }
        }
      }

      transport.start()
      // Process wavExportProgress from outside
    }, duration + 1, 44100, 2)

    wavExportProgress.value = 50

    // Convert AudioBuffer to WAV Blob
    const wavBlob = audioBufferToWav(offlineBuffer)
    wavExportProgress.value = 90

    if (wavExportUrl.value) URL.revokeObjectURL(wavExportUrl.value)
    wavExportUrl.value = URL.createObjectURL(wavBlob)
    wavExportProgress.value = 100

  } catch (err) {
    console.error('WAV export error:', err)
  } finally {
    exportingWav.value = false
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const data = []
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = buffer.getChannelData(ch)[i]
      sample = Math.max(-1, Math.min(1, sample))
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      data.push(int16 & 0xFF)
      data.push((int16 >> 8) & 0xFF)
    }
  }

  const dataLength = data.length
  const headerLength = 44
  const totalLength = headerLength + dataLength

  const header = new Uint8Array(headerLength)
  const view = new DataView(header.buffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalLength - 8, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  const blob = new Blob([header, new Uint8Array(data)], { type: 'audio/wav' })
  return blob
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function exportMIDI() {
  if (exportingMidi.value) return
  exportingMidi.value = true

  try {
    const midiBytes = generateMIDI(generatedNotes.value)
    const blob = new Blob([midiBytes], { type: 'audio/midi' })
    if (midiExportUrl.value) URL.revokeObjectURL(midiExportUrl.value)
    midiExportUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    console.error('MIDI export error:', err)
  } finally {
    exportingMidi.value = false
  }
}

function generateMIDI(notes: NoteEvent[]): Uint8Array {
  // MIDI file format: header (14 bytes) + track data
  const ticksPerQuarterNote = 480
  const bpm = computedTempo.value || 120
  const tempoUSec = Math.round(60000000 / bpm)

  // Sort notes by time
  const sortedNotes = [...notes].sort((a, b) => a.time - b.time)
  if (sortedNotes.length === 0) return new Uint8Array(0)

  // Convert time to ticks
  const secondsPerTick = (tempoUSec / 1000000) / ticksPerQuarterNote
  const timeToTicks = (t: number) => Math.round(t / secondsPerTick)

  // Build track events
  const trackEvents: number[][] = []

  // Tempo event
  trackEvents.push([0, 0xFF, 0x51, 0x03, (tempoUSec >> 16) & 0xFF, (tempoUSec >> 8) & 0xFF, tempoUSec & 0xFF])

  // Track name
  const trackName = 'Emission Music'
  trackEvents.push([0, 0xFF, 0x03, trackName.length, ...trackName.split('').map(c => c.charCodeAt(0))])

  // Instrument names
  for (const inst of selectedInstruments.value) {
    const name = inst.name
    trackEvents.push([0, 0xFF, 0x04, name.length, ...name.split('').map(c => c.charCodeAt(0))])
    // Program change (rough mapping)
    const program = inst.id === 'piano' ? 0 : inst.id === 'strings' ? 48 : inst.id === 'flute' ? 73 : inst.id === 'synth' ? 80 : inst.id === 'bass' ? 32 : 114
    trackEvents.push([0, 0xC0, program])
  }

  // Note events
  let lastTicks = 0
  for (const note of sortedNotes) {
    const startTicks = timeToTicks(note.time)
    const durTicks = Math.max(1, timeToTicks(note.duration))
    const midiNote = noteNameToMidi(note.note)
    const velocity = Math.round(note.velocity * 127)
    const delta = Math.max(0, startTicks - lastTicks)

    // Note on
    trackEvents.push([delta, 0x90, midiNote, velocity])
    // Note off (immediately after)
    trackEvents.push([durTicks, 0x80, midiNote, 0])

    lastTicks = startTicks
  }

  // End of track
  trackEvents.push([0, 0xFF, 0x2F, 0x00])

  // Encode track events
  const trackData: number[] = []
  for (const event of trackEvents) {
    const delta = event[0]
    // Variable length delta
    let v = delta
    const vlq: number[] = []
    if (v === 0) {
      vlq.push(0)
    } else {
      while (v > 0) {
        vlq.unshift(v & 0x7F)
        v >>= 7
      }
      for (let i = 0; i < vlq.length - 1; i++) {
        vlq[i] |= 0x80
      }
    }
    trackData.push(...vlq)
    for (let i = 1; i < event.length; i++) {
      trackData.push(event[i])
    }
  }

  // Build MIDI file
  const trackLength = trackData.length
  const fileSize = 14 + 8 + trackLength

  const midi = new Uint8Array(fileSize)
  let offset = 0

  // Header chunk
  midi[offset++] = 0x4D; midi[offset++] = 0x54; midi[offset++] = 0x68; midi[offset++] = 0x64 // MThd
  midi[offset++] = 0; midi[offset++] = 0; midi[offset++] = 0; midi[offset++] = 6 // chunk length
  midi[offset++] = 0; midi[offset++] = 0 // format 0
  midi[offset++] = 0; midi[offset++] = 1 // 1 track
  midi[offset++] = (ticksPerQuarterNote >> 8) & 0xFF; midi[offset++] = ticksPerQuarterNote & 0xFF

  // Track chunk
  midi[offset++] = 0x4D; midi[offset++] = 0x54; midi[offset++] = 0x72; midi[offset++] = 0x6B // MTrk
  midi[offset++] = (trackLength >> 24) & 0xFF; midi[offset++] = (trackLength >> 16) & 0xFF
  midi[offset++] = (trackLength >> 8) & 0xFF; midi[offset++] = trackLength & 0xFF

  for (const b of trackData) {
    midi[offset++] = b
  }

  return midi
}

// ============================================================
// Utilities
// ============================================================
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ============================================================
// Cleanup
// ============================================================
onBeforeUnmount(() => {
  stopPlayback()
  Tone.getTransport().dispose()
  if (wavExportUrl.value) URL.revokeObjectURL(wavExportUrl.value)
  if (midiExportUrl.value) URL.revokeObjectURL(midiExportUrl.value)
})
</script>

<style scoped>
.music-generator {
  padding: 4px;
}

.tab-content {
  min-height: 300px;
}

.mapping-card {
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}
.mapping-card.active {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.15);
}
.mapping-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.param-name {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}
.mapping-body {
  padding: 4px 0;
}
.mapped-to {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  border-left: 3px solid #409eff;
  padding-left: 8px;
}
.mapped-preview {
  margin-top: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
}
.preview-label {
  font-size: 12px;
  color: #909399;
}
.preview-value {
  font-weight: 600;
  color: #409eff;
}

.inst-card {
  margin-bottom: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}
.inst-card.selected {
  border-color: #67c23a;
  box-shadow: 0 2px 8px rgba(103,194,58,0.2);
}
.inst-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.inst-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.inst-type {
  font-size: 11px;
  color: #c0c4cc;
  font-family: monospace;
  margin-bottom: 8px;
}
.inst-params {
  margin-top: 8px;
}

.playback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.playback-info {
  display: flex;
  gap: 8px;
}
.playback-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.progress-section {
  margin-top: 8px;
}
.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.data-summary p {
  font-size: 13px;
  line-height: 1.8;
  color: #606266;
}
</style>
