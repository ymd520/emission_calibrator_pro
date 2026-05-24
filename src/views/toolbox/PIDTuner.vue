<template>
  <div class="pid-tuner">
    <div class="page-header">
      <h1>PID 调参工具箱</h1>
      <p class="page-desc">参数转换 · 整定方法 · 仿真模拟 · 发动机场景库 · 知识库</p>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="pid-tabs">
      <!-- ==================== TAB 1: PID 参数转换 ==================== -->
      <el-tab-pane label="PID 参数转换" name="tab1">
        <div class="tab-content">
          <div class="converter-layout">
            <el-card class="converter-card">
              <template #header>
                <span class="card-title">形式一：Ideal / Parallel (Kp, Ki, Kd)</span>
              </template>
              <el-form label-width="100px" label-position="left" size="small">
                <el-form-item label="Kp (比例增益)">
                  <el-input-number v-model="convForm1.Kp" :min="0" :max="99999" :step="0.1" :precision="4" controls-position="right" @change="onForm1Change" style="width:100%" />
                </el-form-item>
                <el-form-item label="Ki (积分增益)">
                  <el-input-number v-model="convForm1.Ki" :min="0" :max="99999" :step="0.01" :precision="4" controls-position="right" @change="onForm1Change" style="width:100%" />
                </el-form-item>
                <el-form-item label="Kd (微分增益)">
                  <el-input-number v-model="convForm1.Kd" :min="0" :max="99999" :step="0.01" :precision="4" controls-position="right" @change="onForm1Change" style="width:100%" />
                </el-form-item>
              </el-form>
            </el-card>

            <div class="converter-arrows">
              <span class="arrow-icon">&#8652;</span>
              <el-button type="primary" size="small" @click="swapConversion">&#8593;&#8595; 互换</el-button>
            </div>

            <el-card class="converter-card">
              <template #header>
                <span class="card-title">形式二：Standard / Series (K, Ti, Td)</span>
              </template>
              <el-form label-width="100px" label-position="left" size="small">
                <el-form-item label="K (G)">
                  <el-input-number v-model="convForm2.K" :min="0" :max="99999" :step="0.1" :precision="4" controls-position="right" @change="onForm2Change" style="width:100%" />
                </el-form-item>
                <el-form-item label="Ti (TI)">
                  <el-input-number v-model="convForm2.Ti" :min="0" :max="99999" :step="0.1" :precision="4" controls-position="right" @change="onForm2Change" style="width:100%" />
                </el-form-item>
                <el-form-item label="Td (TD)">
                  <el-input-number v-model="convForm2.Td" :min="0" :max="99999" :step="0.01" :precision="4" controls-position="right" @change="onForm2Change" style="width:100%" />
                </el-form-item>
              </el-form>
            </el-card>
          </div>

          <el-card class="converter-card" style="margin-top: 16px;">
            <template #header>
              <span class="card-title">滤波器时间常数</span>
            </template>
            <el-form label-width="160px" label-position="left" size="small" inline>
              <el-form-item label="Tf = &alpha; &times; Td">
                <el-input-number v-model="convAlpha" :min="0.01" :max="1" :step="0.01" :precision="3" controls-position="right" style="width:120px" />
                <span class="conv-result"> Tf = {{ convTf.toFixed(6) }} s</span>
              </el-form-item>
            </el-form>
          </el-card>

          <div v-if="convError" class="conv-error">
            <el-alert :title="convError" type="error" show-icon :closable="false" />
          </div>

          <el-card class="converter-card" style="margin-top: 12px;">
            <template #header>
              <span class="card-title">转换公式</span>
            </template>
            <div class="formula-grid">
              <div class="formula-item">
                <code>K → Kp</code>
                <span>Kp = K</span>
              </div>
              <div class="formula-item">
                <code>Kp → K</code>
                <span>K = Kp</span>
              </div>
              <div class="formula-item">
                <code>Ti → Ki</code>
                <span>Ki = K / Ti</span>
              </div>
              <div class="formula-item">
                <code>Ki → Ti</code>
                <span>Ti = Kp / Ki</span>
              </div>
              <div class="formula-item">
                <code>Td → Kd</code>
                <span>Kd = K * Td</span>
              </div>
              <div class="formula-item">
                <code>Kd → Td</code>
                <span>Td = Kd / Kp</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ==================== TAB 2: PID 整定方法向导 ==================== -->
      <el-tab-pane label="PID 整定方法向导" name="tab2">
        <div class="tab-content">
          <el-radio-group v-model="tuningMethod" class="method-selector">
            <el-radio-button value="zn">Ziegler-Nichols 临界比例带法</el-radio-button>
            <el-radio-button value="cohen">Cohen-Coon 法</el-radio-button>
            <el-radio-button value="relay">继电器自整定</el-radio-button>
          </el-radio-group>

          <!-- Ziegler-Nichols -->
          <div v-if="tuningMethod === 'zn'" class="method-panel">
            <div class="steps-guide">
              <h3 class="section-title">操作步骤</h3>
              <el-steps :active="znStep" align-center class="zn-steps">
                <el-step title="Ki=0, Kd=0" description="将积分和微分置零" />
                <el-step title="增大 Kp" description="直到出现等幅振荡" />
                <el-step title="记录 Kcu, Tu" description="临界增益和振荡周期" />
                <el-step title="计算参数" description="查表得到 PID 参数" />
              </el-steps>
              <div class="step-controls">
                <el-button v-if="znStep > 1" @click="znStep--" size="small">上一步</el-button>
                <el-button v-if="znStep < 4" type="primary" @click="znStep++" size="small">下一步</el-button>
              </div>
            </div>

            <el-card class="method-card" style="margin-top: 16px;">
              <template #header>
                <span class="card-title">Ziegler-Nichols 参数计算</span>
              </template>
              <el-form label-width="140px" size="small" inline>
                <el-form-item label="临界增益 Kcu">
                  <el-input-number v-model="znKcu" :min="0.001" :max="99999" :step="0.1" :precision="4" controls-position="right" style="width:140px" />
                </el-form-item>
                <el-form-item label="振荡周期 Tu (s)">
                  <el-input-number v-model="znTu" :min="0.001" :max="99999" :step="0.1" :precision="4" controls-position="right" style="width:140px" />
                </el-form-item>
              </el-form>

              <el-table :data="znResults" border size="small" style="width:100%;margin-top:12px;">
                <el-table-column prop="type" label="控制器类型" width="120" />
                <el-table-column prop="Kp" label="Kp" width="120">
                  <template #default="{ row }">
                    <span>{{ row.Kp.toFixed(4) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="Ti" label="Ti" width="120">
                  <template #default="{ row }">
                    <span v-if="row.Ti === '-'">-</span>
                    <span v-else>{{ row.Ti.toFixed(4) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="Td" label="Td" width="120">
                  <template #default="{ row }">
                    <span v-if="row.Td === '-'">-</span>
                    <span v-else>{{ row.Td.toFixed(4) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="KpVal" label="Kp (形式一)" min-width="140">
                  <template #default="{ row }">
                    <span v-if="row.KpVal === '-'">-</span>
                    <span v-else>{{ row.KpVal.toFixed(4) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="KiVal" label="Ki" width="120">
                  <template #default="{ row }">
                    <span>{{ row.Ki.toFixed(4) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="KdVal" label="Kd" width="120">
                  <template #default="{ row }">
                    <span>{{ row.Kd.toFixed(4) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>

          <!-- Cohen-Coon -->
          <div v-if="tuningMethod === 'cohen'" class="method-panel">
            <el-card class="method-card">
              <template #header>
                <span class="card-title">Cohen-Coon 整定法 (FOPDT 系统)</span>
              </template>
              <div class="method-desc">
                适用于自衡过程的 FOPDT 模型 G(s) = K &middot; e<sup>-&theta;s</sup> / (&tau;s + 1)
              </div>
              <el-form label-width="120px" size="small" inline style="margin-top:16px;">
                <el-form-item label="过程增益 K">
                  <el-input-number v-model="ccK" :min="0.001" :max="99999" :step="0.1" :precision="4" controls-position="right" style="width:130px" />
                </el-form-item>
                <el-form-item label="时间常数 &tau;">
                  <el-input-number v-model="ccTau" :min="0.001" :max="99999" :step="0.1" :precision="4" controls-position="right" style="width:130px" />
                </el-form-item>
                <el-form-item label="纯迟延 &theta;">
                  <el-input-number v-model="ccTheta" :min="0" :max="99999" :step="0.05" :precision="4" controls-position="right" style="width:130px" />
                </el-form-item>
              </el-form>

              <el-table :data="cohenResults" border size="small" style="width:100%;margin-top:12px;">
                <el-table-column prop="type" label="控制器" width="100" />
                <el-table-column prop="Kp" label="Kp" width="120">
                  <template #default="{ row }">{{ row.Kp.toFixed(4) }}</template>
                </el-table-column>
                <el-table-column prop="Ti" label="Ti" width="120">
                  <template #default="{ row }">{{ row.Ti.toFixed(4) }}</template>
                </el-table-column>
                <el-table-column prop="Td" label="Td" width="120">
                  <template #default="{ row }">{{ row.Td.toFixed(4) }}</template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>

          <!-- Relay Auto-Tune -->
          <div v-if="tuningMethod === 'relay'" class="method-panel">
            <el-card class="method-card">
              <template #header>
                <span class="card-title">继电器自整定 (Relay Auto-Tune)</span>
              </template>
              <div class="method-desc">
                Astr&ouml;m &amp; H&auml;gglund 继电反馈法。通过继电反馈使系统产生等幅振荡，利用振荡信息计算 PID 参数。
              </div>
              <el-form label-width="160px" size="small" inline style="margin-top:16px;">
                <el-form-item label="继电器幅值 d">
                  <el-input-number v-model="relayD" :min="0.001" :max="999" :step="0.1" :precision="4" controls-position="right" style="width:130px" />
                </el-form-item>
                <el-form-item label="振荡周期 Tu (s)">
                  <el-input-number v-model="relayTu" :min="0.001" :max="99999" :step="0.1" :precision="4" controls-position="right" style="width:130px" />
                </el-form-item>
                <el-form-item label="振荡幅值 a">
                  <el-input-number v-model="relayA" :min="0.001" :max="999" :step="0.01" :precision="4" controls-position="right" style="width:130px" />
                </el-form-item>
              </el-form>

              <div v-if="relayTu > 0 && relayD > 0 && relayA > 0" class="relay-results">
                <el-tag type="info">临界增益 Kcu = {{ relayKcu.toFixed(4) }}</el-tag>
                <el-table :data="relayPIDResults" border size="small" style="width:100%;margin-top:12px;">
                  <el-table-column prop="type" label="控制器" width="100" />
                  <el-table-column prop="Kp" label="Kp" width="130">
                    <template #default="{ row }">{{ row.Kp.toFixed(4) }}</template>
                  </el-table-column>
                  <el-table-column prop="Ki" label="Ki" width="130">
                    <template #default="{ row }">{{ row.Ki.toFixed(4) }}</template>
                  </el-table-column>
                  <el-table-column prop="Kd" label="Kd" width="130">
                    <template #default="{ row }">{{ row.Kd.toFixed(4) }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- ==================== TAB 3: PID 仿真模拟器 (CORE) ==================== -->
      <el-tab-pane label="PID 仿真模拟器" name="tab3">
        <div class="tab-content simulator-tab">
          <div class="simulator-layout">
            <!-- Left: Chart -->
            <div class="sim-chart-area">
              <el-card class="chart-card">
                <template #header>
                  <div class="chart-header">
                    <span class="card-title">PID 响应曲线</span>
                    <div class="chart-legend">
                      <span class="legend-item"><span class="legend-dot sp-dot"></span> SP (设定值)</span>
                      <span class="legend-item"><span class="legend-dot pv-dot"></span> PV (过程值)</span>
                      <span class="legend-item"><span class="legend-dot mv-dot"></span> MV (控制量)</span>
                    </div>
                  </div>
                </template>
                <div class="chart-container" ref="chartContainerRef">
                  <svg v-if="simData.time.length > 0" :viewBox="`0 0 ${chartW} ${chartH}`" class="sim-svg" preserveAspectRatio="xMidYMid meet">
                    <!-- Grid -->
                    <g class="chart-grid">
                      <line v-for="(y, yi) in yGridLines" :key="'yg'+yi" :x1="padL" :y1="y" :x2="chartW - padR" :y2="y" class="grid-line" />
                      <line v-for="(x, xi) in xGridLines" :key="'xg'+xi" :x1="x" :y1="padT" :x2="x" :y2="chartH - padB" class="grid-line" />
                    </g>
                    <!-- Axes -->
                    <g class="chart-axes">
                      <line :x1="padL" :y1="chartH - padB" :x2="chartW - padR" :y2="chartH - padB" stroke="#555" stroke-width="1" />
                      <line :x1="padL" :y1="padT" :x2="padL" :y2="chartH - padB" stroke="#555" stroke-width="1" />
                    </g>
                    <!-- Y axis labels -->
                    <g class="y-labels">
                      <text v-for="(item, yi) in yLabels" :key="'yl'+yi" :x="padL - 8" :y="item.y + 4" text-anchor="end" class="axis-label">{{ item.label }}</text>
                    </g>
                    <!-- X axis labels -->
                    <g class="x-labels">
                      <text v-for="(item, xi) in xLabels" :key="'xl'+xi" :x="item.x" :y="chartH - padB + 16" text-anchor="middle" class="axis-label">{{ item.label }}</text>
                    </g>
                    <text :x="(chartW - padR + padL) / 2" :y="chartH - 2" text-anchor="middle" class="axis-label">Time (s)</text>
                    <!-- SP Line -->
                    <polyline v-if="spPath" :points="spPath" fill="none" class="chart-line sp-line" stroke-dasharray="6,3" />
                    <!-- PV Line -->
                    <polyline v-if="pvPath" :points="pvPath" fill="none" class="chart-line pv-line" />
                    <!-- MV Line -->
                    <polyline v-if="mvPath" :points="mvPath" fill="none" class="chart-line mv-line" />
                  </svg>
                  <div v-else class="chart-empty">
                    <p>配置参数后点击「运行仿真」或拖动 PID 滑块</p>
                  </div>
                </div>
              </el-card>

              <!-- Metrics -->
              <el-card class="metrics-card" v-if="simMetrics">
                <template #header><span class="card-title">动态性能指标</span></template>
                <div class="metrics-grid">
                  <div class="metric-item">
                    <span class="metric-label">tr (上升时间)</span>
                    <span class="metric-value">{{ simMetrics.tr.toFixed(3) }}s</span>
                    <span class="metric-unit">10% → 90%</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">tp (峰值时间)</span>
                    <span class="metric-value">{{ simMetrics.tp.toFixed(3) }}s</span>
                    <span class="metric-unit">首次峰值</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">OS (超调量)</span>
                    <span class="metric-value" :class="{ 'metric-bad': simMetrics.overshoot > 20 }">{{ simMetrics.overshoot.toFixed(2) }}%</span>
                    <span class="metric-unit">相对设定值</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">ts@2% (调节时间)</span>
                    <span class="metric-value">{{ simMetrics.ts2.toFixed(3) }}s</span>
                    <span class="metric-unit">&plusmn;2% 稳态</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">ts@5% (调节时间)</span>
                    <span class="metric-value">{{ simMetrics.ts5.toFixed(3) }}s</span>
                    <span class="metric-unit">&plusmn;5% 稳态</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">ess (稳态误差)</span>
                    <span class="metric-value">{{ simMetrics.ess.toFixed(4) }}</span>
                    <span class="metric-unit">最终偏差</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">ITAE</span>
                    <span class="metric-value">{{ simMetrics.itae.toFixed(2) }}</span>
                    <span class="metric-unit">&int;t|e|dt</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">IAE</span>
                    <span class="metric-value">{{ simMetrics.iae.toFixed(2) }}</span>
                    <span class="metric-unit">&int;|e|dt</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">ISE</span>
                    <span class="metric-value">{{ simMetrics.ise.toFixed(2) }}</span>
                    <span class="metric-unit">&int;e&sup2;dt</span>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- Right: Control Panel -->
            <div class="sim-controls">
              <!-- Model -->
              <el-card class="control-card">
                <template #header><span class="card-title">系统模型 (FOPDT)</span></template>
                <div class="model-formula">G(s) = K &middot; e<sup>-&theta;s</sup> / (&tau;s + 1)</div>
                <el-form label-width="60px" size="small">
                  <el-form-item label="K"><el-input-number v-model="modelK" :min="0.001" :max="999" :step="0.1" :precision="3" controls-position="right" style="width:100%" /></el-form-item>
                  <el-form-item label="&tau;"><el-input-number v-model="modelTau" :min="0.001" :max="999" :step="0.1" :precision="3" controls-position="right" style="width:100%" /></el-form-item>
                  <el-form-item label="&theta;"><el-input-number v-model="modelTheta" :min="0" :max="999" :step="0.05" :precision="3" controls-position="right" style="width:100%" /></el-form-item>
                  <el-form-item label="SP"><el-input-number v-model="modelSP" :min="-999" :max="999" :step="1" :precision="2" controls-position="right" style="width:100%" /></el-form-item>
                </el-form>
              </el-card>

              <!-- PID -->
              <el-card class="control-card">
                <template #header><span class="card-title">PID 参数</span></template>
                <el-form label-width="60px" size="small">
                  <el-form-item label="Kp">
                    <el-slider v-model="pidKp" :min="0" :max="50" :step="0.01" style="flex:1;margin:0 8px" @input="scheduleSimulation" />
                    <el-input-number v-model="pidKp" :min="0" :max="999" :step="0.01" :precision="3" controls-position="right" style="width:80px" size="small" @change="runSimulation" />
                  </el-form-item>
                  <el-form-item label="Ki">
                    <el-slider v-model="pidKi" :min="0" :max="50" :step="0.01" style="flex:1;margin:0 8px" @input="scheduleSimulation" />
                    <el-input-number v-model="pidKi" :min="0" :max="999" :step="0.01" :precision="3" controls-position="right" style="width:80px" size="small" @change="runSimulation" />
                  </el-form-item>
                  <el-form-item label="Kd">
                    <el-slider v-model="pidKd" :min="0" :max="50" :step="0.01" style="flex:1;margin:0 8px" @input="scheduleSimulation" />
                    <el-input-number v-model="pidKd" :min="0" :max="999" :step="0.01" :precision="3" controls-position="right" style="width:80px" size="small" @change="runSimulation" />
                  </el-form-item>
                </el-form>
              </el-card>

              <!-- Simulation Settings -->
              <el-card class="control-card">
                <template #header><span class="card-title">仿真设置</span></template>
                <el-form label-width="80px" size="small">
                  <el-form-item label="仿真时间">
                    <el-input-number v-model="simTime" :min="1" :max="300" :step="1" controls-position="right" style="width:100%" />
                  </el-form-item>
                  <el-form-item label="采样时间 Ts">
                    <el-input-number v-model="simTs" :min="0.001" :max="1" :step="0.001" :precision="3" controls-position="right" style="width:100%" />
                  </el-form-item>
                  <el-form-item label="输出下限">
                    <el-input-number v-model="simOutMin" :min="-999" :max="999" :step="1" controls-position="right" style="width:100%" />
                  </el-form-item>
                  <el-form-item label="输出上限">
                    <el-input-number v-model="simOutMax" :min="-999" :max="999" :step="1" controls-position="right" style="width:100%" />
                  </el-form-item>
                  <el-form-item label="测试信号">
                    <el-select v-model="signalType" style="width:100%">
                      <el-option label="阶跃 (Step)" value="step" />
                      <el-option label="脉冲 (Pulse)" value="pulse" />
                      <el-option label="正弦 (Sine)" value="sine" />
                      <el-option label="随机噪声" value="noise" />
                    </el-select>
                  </el-form-item>
                  <el-form-item v-if="signalType === 'sine'" label="正弦频率">
                    <el-input-number v-model="sineFreq" :min="0.05" :max="20" :step="0.05" :precision="3" controls-position="right" style="width:100%" />
                  </el-form-item>
                </el-form>
                <div class="sim-actions">
                  <el-button type="primary" @click="runSimulation" :icon="'&#9654;'">运行仿真</el-button>
                  <el-button @click="resetSimulation">重置</el-button>
                  <el-button @click="applyToConverter" size="small">应用参数到转换器</el-button>
                </div>
              </el-card>

              <!-- Quick Load -->
              <el-card class="control-card">
                <template #header><span class="card-title">快速加载示例</span></template>
                <div class="quick-load-grid">
                  <el-button v-for="ex in quickExamples" :key="ex.name" size="small" class="quick-btn" @click="loadExample(ex)">
                    {{ ex.name }}
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ==================== TAB 4: 发动机场景库 ==================== -->
      <el-tab-pane label="发动机场景库" name="tab4">
        <div class="tab-content">
          <el-table :data="engineScenarios" border stripe size="small" style="width:100%" @row-click="selectScenario">
            <el-table-column prop="name" label="场景名称" width="160" />
            <el-table-column prop="process" label="被控量" width="140" />
            <el-table-column prop="actuator" label="执行器" width="160" />
            <el-table-column prop="difficulty" label="难度" width="80">
              <template #default="{ row }">
                <el-tag :type="row.difficulty === 'Easy' ? 'success' : row.difficulty === 'Medium' ? 'warning' : 'danger'" size="small">
                  {{ { Easy: '简单', Medium: '中等', Hard: '困难' }[row.difficulty] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="defaultKpRange" label="Kp 参考范围" width="130" />
            <el-table-column prop="modelDesc" label="模型描述" min-width="200" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click.stop="loadScenario(row)">加载到仿真器</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- Scenario Detail -->
          <transition name="el-fade-in">
            <el-card v-if="selectedScenario" class="scenario-detail" style="margin-top:16px;">
              <template #header>
                <div class="scenario-detail-header">
                  <span class="card-title">{{ selectedScenario.name }}</span>
                  <el-tag :type="selectedScenario.difficulty === 'Easy' ? 'success' : selectedScenario.difficulty === 'Medium' ? 'warning' : 'danger'" size="small">
                    {{ { Easy: '简单', Medium: '中等', Hard: '困难' }[selectedScenario.difficulty] }}
                  </el-tag>
                </div>
              </template>
              <div class="scenario-detail-body">
                <div class="detail-section">
                  <h4>控制描述</h4>
                  <p>{{ selectedScenario.desc }}</p>
                </div>
                <div class="detail-section">
                  <h4>过程参数</h4>
                  <p>被控量: {{ selectedScenario.process }} | 执行器: {{ selectedScenario.actuator }}</p>
                  <p>模型: G(s) = {{ selectedScenario.modelK }} &middot; e<sup>-{{ selectedScenario.modelTheta }}s</sup> / ({{ selectedScenario.modelTau }}s + 1)</p>
                </div>
                <div class="detail-section">
                  <h4>初始 PID 建议</h4>
                  <p>Kp = {{ selectedScenario.suggestKp }}, Ki = {{ selectedScenario.suggestKi }}, Kd = {{ selectedScenario.suggestKd }}</p>
                  <p>Kp 调节范围: {{ selectedScenario.defaultKpRange }}</p>
                </div>
                <div class="detail-section">
                  <h4>工程注意事项</h4>
                  <p>{{ selectedScenario.notes }}</p>
                </div>
              </div>
            </el-card>
          </transition>
        </div>
      </el-tab-pane>

      <!-- ==================== TAB 5: PID 调参知识库 ==================== -->
      <el-tab-pane label="PID 调参知识库" name="tab5">
        <div class="tab-content">
          <el-collapse v-model="kbActiveSections" class="kb-collapse">
            <!-- PID Basics -->
            <el-collapse-item title="PID 控制基础" name="kb1">
              <div class="kb-section">
                <h4>PID 控制器传递函数</h4>
                <div class="kb-formula">G<sub>c</sub>(s) = K<sub>p</sub> + K<sub>i</sub>/s + K<sub>d</sub>s</div>
                <div class="kb-grid">
                  <div class="kb-card mini">
                    <div class="kb-card-title">比例 (P)</div>
                    <p>G<sub>p</sub>(s) = K<sub>p</sub></p>
                    <ul>
                      <li>减小上升时间</li>
                      <li>减小稳态误差</li>
                      <li>增加超调量</li>
                      <li>Kp 过大会导致振荡</li>
                    </ul>
                  </div>
                  <div class="kb-card mini">
                    <div class="kb-card-title">积分 (I)</div>
                    <p>G<sub>i</sub>(s) = K<sub>i</sub>/s</p>
                    <ul>
                      <li>消除稳态误差</li>
                      <li>降低响应速度</li>
                      <li>增加超调</li>
                      <li>可能导致积分饱和</li>
                    </ul>
                  </div>
                  <div class="kb-card mini">
                    <div class="kb-card-title">微分 (D)</div>
                    <p>G<sub>d</sub>(s) = K<sub>d</sub>s</p>
                    <ul>
                      <li>改善动态响应</li>
                      <li>减小超调</li>
                      <li>对噪声敏感</li>
                      <li>不能单独使用</li>
                    </ul>
                  </div>
                </div>
              </div>
            </el-collapse-item>

            <!-- Anti-Windup -->
            <el-collapse-item title="抗积分饱和 (Anti-Windup)" name="kb2">
              <div class="kb-section">
                <p>当控制器输出达到物理限幅时，积分项继续累积会导致"积分饱和"现象，使系统响应变差。</p>
                <h4>常用抗饱和方法</h4>
                <el-table :data="antiWindupMethods" border size="small" style="width:100%;margin-top:12px;">
                  <el-table-column prop="name" label="方法" width="140" />
                  <el-table-column prop="desc" label="描述" min-width="200" />
                  <el-table-column prop="pros" label="优点" width="160" />
                  <el-table-column prop="cons" label="缺点" width="160" />
                </el-table>
              </div>
            </el-collapse-item>

            <!-- Advanced PID -->
            <el-collapse-item title="高级 PID 控制策略" name="kb3">
              <div class="kb-section">
                <el-table :data="advancedPIDMethods" border size="small" style="width:100%">
                  <el-table-column prop="name" label="策略" width="140" />
                  <el-table-column prop="desc" label="描述" min-width="200" />
                  <el-table-column prop="application" label="适用场景" width="200" />
                </el-table>
              </div>
            </el-collapse-item>

            <!-- Troubleshooting -->
            <el-collapse-item title="故障诊断指南" name="kb4">
              <div class="kb-section">
                <el-table :data="troubleshooting" border size="small" style="width:100%">
                  <el-table-column prop="symptom" label="现象" width="160" />
                  <el-table-column prop="cause" label="可能原因" width="160" />
                  <el-table-column prop="solution" label="解决方案" min-width="200" />
                  <el-table-column prop="param" label="调节参数" width="120" />
                </el-table>
              </div>
            </el-collapse-item>

            <!-- Rule of Thumb -->
            <el-collapse-item title="经验调参准则" name="kb5">
              <div class="kb-section">
                <h4>PID 参数整定口诀</h4>
                <div class="kb-mnemonic">
                  <p>参数整定找最佳，从小到大顺序查</p>
                  <p>先是比例后积分，最后再把微分加</p>
                  <p>曲线振荡频率快，先把微分降下来</p>
                  <p>曲线偏离回复慢，再把积分往下降</p>
                  <p>曲线振荡频率慢，先把积分升一点</p>
                  <p>曲线波动周期长，再把比例来加强</p>
                </div>
                <h4 style="margin-top:20px;">经验调节规则表</h4>
                <el-table :data="ruleOfThumb" border size="small" style="width:100%;margin-top:12px;">
                  <el-table-column prop="situation" label="系统表现" width="160" />
                  <el-table-column prop="kp" label="Kp" width="100" />
                  <el-table-column prop="ki" label="Ki" width="100" />
                  <el-table-column prop="kd" label="Kd" width="100" />
                  <el-table-column prop="explanation" label="说明" min-width="200" />
                </el-table>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'

// ============================================================
// TAB 1: PID Parameter Converter
// ============================================================
interface Form1 { Kp: number; Ki: number; Kd: number }
interface Form2 { K: number; Ti: number; Td: number }

const activeTab = ref('tab1')
const convForm1 = reactive<Form1>({ Kp: 1, Ki: 0.5, Kd: 0.2 })
const convForm2 = reactive<Form2>({ K: 1, Ti: 2, Td: 0.2 })
const convAlpha = ref(0.1)
const convError = ref('')

const convTf = computed(() => convAlpha.value * convForm2.Td)

let convUpdating = false

function onForm1Change() {
  if (convUpdating) return
  convUpdating = true
  const { Kp, Ki, Kd } = convForm1
  if (Kp <= 0) {
    convError.value = 'Kp 必须大于 0 才能进行转换'
    convUpdating = false
    return
  }
  convError.value = ''
  convForm2.K = Kp
  convForm2.Ti = Ki > 0 ? Kp / Ki : 99999
  convForm2.Td = Kp > 0 ? Kd / Kp : 0
  convUpdating = false
}

function onForm2Change() {
  if (convUpdating) return
  convUpdating = true
  const { K, Ti, Td } = convForm2
  convForm1.Kp = K
  if (Ti <= 0) {
    convError.value = 'Ti 必须大于 0 才能计算 Ki'
    convUpdating = false
    return
  }
  convError.value = ''
  convForm1.Ki = K / Ti
  convForm1.Kd = K * Td
  convUpdating = false
}

function swapConversion() {
  const tmp = { ...convForm1 }
  convForm1.Kp = convForm2.K
  convForm1.Ki = convForm2.K / (convForm2.Ti || 1)
  convForm1.Kd = convForm2.K * convForm2.Td
  convForm2.K = tmp.Kp
  convForm2.Ti = tmp.Ki > 0 ? tmp.Kp / tmp.Ki : 99999
  convForm2.Td = tmp.Kd / (tmp.Kp || 1)
}

// ============================================================
// TAB 2: Tuning Method Wizard
// ============================================================
const tuningMethod = ref('zn')
const znStep = ref(1)
const znKcu = ref(4)
const znTu = ref(2)

const znResults = computed(() => {
  const Kcu = znKcu.value
  const Tu = znTu.value
  if (Kcu <= 0 || Tu <= 0) return []
  return [
    {
      type: 'P',
      Kp: 0.5 * Kcu,
      Ti: '-' as const,
      Td: '-' as const,
      KpVal: 0.5 * Kcu,
      Ki: 0,
      Kd: 0
    },
    {
      type: 'PI',
      Kp: 0.45 * Kcu,
      Ti: 0.83 * Tu,
      Td: '-' as const,
      KpVal: 0.45 * Kcu,
      Ki: (0.45 * Kcu) / (0.83 * Tu),
      Kd: 0
    },
    {
      type: 'PID',
      Kp: 0.6 * Kcu,
      Ti: 0.5 * Tu,
      Td: 0.125 * Tu,
      KpVal: 0.6 * Kcu,
      Ki: (0.6 * Kcu) / (0.5 * Tu),
      Kd: 0.6 * Kcu * 0.125 * Tu
    }
  ]
})

// Cohen-Coon
const ccK = ref(1)
const ccTau = ref(3)
const ccTheta = ref(0.5)

const cohenResults = computed(() => {
  const K = ccK.value
  const tau = ccTau.value
  const theta = ccTheta.value
  if (K <= 0 || tau <= 0 || theta <= 0) return []
  const r = theta / tau
  return [
    {
      type: 'P',
      Kp: (1 / K) * (tau / theta) * (1 + r / 3)
    },
    {
      type: 'PI',
      Kp: (1 / K) * (tau / theta) * (0.9 + r / 12),
      Ti: theta * (30 + 3 * r) / (9 + 20 * r)
    },
    {
      type: 'PID',
      Kp: (1 / K) * (tau / theta) * (4 / 3 + r / 4),
      Ti: theta * (32 + 6 * r) / (13 + 8 * r),
      Td: theta * 4 / (11 + 2 * r)
    }
  ]
})

// Relay Auto-Tune
const relayD = ref(1)
const relayTu = ref(2)
const relayA = ref(0.5)

const relayKcu = computed(() => {
  if (relayA.value <= 0) return 0
  return (4 * relayD.value) / (Math.PI * relayA.value)
})

const relayPIDResults = computed(() => {
  const Kcu = relayKcu.value
  const Tu = relayTu.value
  if (Kcu <= 0 || Tu <= 0) return []
  return [
    { type: 'P', Kp: 0.5 * Kcu, Ki: 0, Kd: 0 },
    { type: 'PI', Kp: 0.45 * Kcu, Ki: (0.45 * Kcu) / (0.83 * Tu), Kd: 0 },
    { type: 'PID', Kp: 0.6 * Kcu, Ki: (0.6 * Kcu) / (0.5 * Tu), Kd: 0.6 * Kcu * 0.125 * Tu }
  ]
})

// ============================================================
// TAB 3: PID Simulator
// ============================================================

// Model parameters
const modelK = ref(1)
const modelTau = ref(3)
const modelTheta = ref(0.5)
const modelSP = ref(100)

// PID parameters
const pidKp = ref(2)
const pidKi = ref(0.5)
const pidKd = ref(0.2)

// Simulation settings
const simTime = ref(20)
const simTs = ref(0.02)
const simOutMin = ref(0)
const simOutMax = ref(150)
const signalType = ref<'step' | 'pulse' | 'sine' | 'noise'>('step')
const sineFreq = ref(0.5)

// Simulation data
interface SimData {
  time: number[]
  sp: number[]
  pv: number[]
  mv: number[]
}
const simData = reactive<SimData>({ time: [], sp: [], pv: [], mv: [] })

interface SimMetrics {
  tr: number
  tp: number
  overshoot: number
  ts2: number
  ts5: number
  ess: number
  itae: number
  iae: number
  ise: number
}
const simMetrics = ref<SimMetrics | null>(null)

// Chart parameters
const chartW = 800
const chartH = 350
const padL = 55
const padR = 20
const padT = 25
const padB = 35

// SVG path data
const spPath = ref('')
const pvPath = ref('')
const mvPath = ref('')
const chartContainerRef = ref<HTMLElement | null>(null)

// Grid and axis labels
const yGridLines = computed(() => {
  const lines: number[] = []
  const steps = 5
  for (let i = 0; i <= steps; i++) {
    lines.push(padT + (chartH - padB - padT) * i / steps)
  }
  return lines
})

const xGridLines = computed(() => {
  const lines: number[] = []
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    lines.push(padL + (chartW - padL - padR) * i / steps)
  }
  return lines
})

const yLabels = computed(() => {
  if (simData.pv.length === 0) return []
  const allVals = [...simData.sp, ...simData.pv, ...simData.mv]
  const yMin = Math.min(...allVals, 0)
  const yMax = Math.max(...allVals)
  const range = yMax - yMin || 1
  const steps = 5
  const labels: { y: number; label: string }[] = []
  for (let i = 0; i <= steps; i++) {
    const val = yMin + range * (steps - i) / steps
    const yPos = padT + (chartH - padB - padT) * i / steps
    labels.push({ y: yPos, label: val.toFixed(1) })
  }
  return labels
})

const xLabels = computed(() => {
  const steps = 8
  const labels: { x: number; label: string }[] = []
  for (let i = 0; i <= steps; i++) {
    const val = simTime.value * i / steps
    const xPos = padL + (chartW - padL - padR) * i / steps
    labels.push({ x: xPos, label: val.toFixed(1) })
  }
  return labels
})

function getScale(data: number[]): { scale: (v: number) => number; min: number; max: number } {
  const allVals = [...simData.sp, ...simData.pv, ...simData.mv]
  if (allVals.length === 0) return { scale: () => 0, min: 0, max: 1 }
  let yMin = Math.min(...allVals, 0)
  let yMax = Math.max(...allVals)
  if (yMax - yMin < 0.001) { yMax = yMin + 1 }
  const range = yMax - yMin
  const plotH = chartH - padB - padT
  return {
    scale: (v: number) => padT + plotH - ((v - yMin) / range) * plotH,
    min: yMin,
    max: yMax
  }
}

function buildPath(data: number[], scale: (v: number) => number): string {
  if (data.length < 2) return ''
  const plotW = chartW - padL - padR
  const N = data.length
  const points: string[] = []
  for (let i = 0; i < N; i++) {
    const x = padL + (i / (N - 1)) * plotW
    const y = scale(data[i])
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return points.join(' ')
}

function buildChartPaths() {
  if (simData.time.length < 2) {
    spPath.value = ''
    pvPath.value = ''
    mvPath.value = ''
    return
  }
  const { scale } = getScale(simData.pv)
  spPath.value = buildPath(simData.sp, scale)
  pvPath.value = buildPath(simData.pv, scale)
  mvPath.value = buildPath(simData.mv, scale)
}

// Core simulation engine
function runSimulation() {
  const K = modelK.value
  const tau = modelTau.value
  const theta = modelTheta.value
  const SP = modelSP.value
  const Kp = pidKp.value
  const Ki = pidKi.value
  const Kd = pidKd.value
  const totalTime = simTime.value
  const Ts = simTs.value
  const outMin = simOutMin.value
  const outMax = simOutMax.value
  const signal = signalType.value

  if (tau <= 0 || K <= 0 || Ts <= 0) return

  const N = Math.floor(totalTime / Ts)
  const time = new Array(N)
  const sp = new Array(N)
  const pv = new Array(N)
  const mv = new Array(N)

  // Dead time buffer (circular)
  const delaySamples = Math.max(1, Math.round(theta / Ts))
  const delayBuffer = new Float64Array(delaySamples)
  let delayIdx = 0

  // FOPDT coefficients (first-order lag, no dead time)
  const a = Math.exp(-Ts / tau)
  const b = K * (1 - a)

  // PID state
  let integral = 0
  let prevError = 0
  let prevPv = 0

  for (let k = 0; k < N; k++) {
    const t = k * Ts
    time[k] = t

    // Setpoint based on signal type
    switch (signal) {
      case 'step':
        sp[k] = SP
        break
      case 'pulse':
        sp[k] = t < 1 ? SP : 0
        break
      case 'sine':
        sp[k] = SP * 0.5 * (1 + Math.sin(2 * Math.PI * sineFreq.value * t))
        break
      case 'noise':
        sp[k] = SP + (Math.random() - 0.5) * SP * 0.1
        break
      default:
        sp[k] = SP
    }

    // Error = SP - PV (using previous PV for causality)
    const error = sp[k] - prevPv

    // PID computation (positional form)
    const pTerm = Kp * error
    integral += Ki * Ts * error
    const dTerm = Ts > 0 ? Kd * (error - prevError) / Ts : 0
    let output = pTerm + integral + dTerm

    // Output clamping with anti-windup (back-calculation)
    if (output > outMax) {
      output = outMax
      integral = outMax - pTerm - dTerm
    } else if (output < outMin) {
      output = outMin
      integral = outMin - pTerm - dTerm
    }

    mv[k] = output

    // Dead time shift register
    const delayed = delayBuffer[delayIdx]
    delayBuffer[delayIdx] = output
    delayIdx = (delayIdx + 1) % delaySamples

    // FOPDT: first-order lag
    if (k === 0) {
      pv[k] = 0
    } else {
      pv[k] = a * pv[k - 1] + b * delayed
    }

    prevPv = pv[k]
    prevError = error
  }

  simData.time = time
  simData.sp = sp
  simData.pv = pv
  simData.mv = mv

  // Calculate metrics
  simMetrics.value = calculateMetrics(time, sp, pv, mv, Ts, SP)

  // Build chart SVG paths
  buildChartPaths()
}

function calculateMetrics(
  time: number[],
  sp: number[],
  pv: number[],
  mv: number[],
  Ts: number,
  SP: number
): SimMetrics {
  const N = time.length
  const finalPv = pv[N - 1]
  const steadyStart = Math.max(0, N - Math.floor(2 / Ts))
  const steadyLen = N - steadyStart
  const steadyPv = steadyLen > 0 ? pv.slice(steadyStart).reduce((a, b) => a + b, 0) / steadyLen : (pv.length > 0 ? pv[N - 1] : 0)
  const ess = Math.abs(SP - steadyPv)

  // Rise time: 10% to 90% of SP
  let tr = time[N - 1]
  const pv10 = SP * 0.1
  const pv90 = SP * 0.9
  let t10 = -1
  let t90 = -1
  for (let i = 0; i < N; i++) {
    if (t10 < 0 && pv[i] >= pv10) t10 = time[i]
    if (t90 < 0 && pv[i] >= pv90) { t90 = time[i]; break }
  }
  if (t10 >= 0 && t90 >= 0 && t90 > t10) tr = t90 - t10

  // Peak time and overshoot
  let tp = 0
  let peakVal = 0
  for (let i = 0; i < N; i++) {
    if (pv[i] > peakVal) {
      peakVal = pv[i]
      tp = time[i]
    }
  }
  const overshoot = SP > 0 ? Math.max(0, ((peakVal - SP) / SP) * 100) : 0

  // Settling time @ 2% and 5%
  const band2 = 0.02 * SP
  const band5 = 0.05 * SP
  let ts2 = time[N - 1]
  let ts5 = time[N - 1]
  for (let i = N - 1; i >= 0; i--) {
    const dev = Math.abs(pv[i] - steadyPv)
    if (dev > band2 && ts2 === time[N - 1]) ts2 = i < N - 1 ? time[i + 1] : time[i]
    if (dev > band5 && ts5 === time[N - 1]) ts5 = i < N - 1 ? time[i + 1] : time[i]
  }

  // Integral criteria
  let itae = 0
  let iae = 0
  let ise = 0
  for (let i = 0; i < N; i++) {
    const e = Math.abs(sp[i] - pv[i])
    itae += time[i] * e * Ts
    iae += e * Ts
    ise += e * e * Ts
  }

  return { tr, tp, overshoot, ts2, ts5, ess, itae, iae, ise }
}

// Debounced simulation for slider drag
let simTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSimulation() {
  if (simTimer) clearTimeout(simTimer)
  simTimer = setTimeout(() => { runSimulation() }, 150)
}

function resetSimulation() {
  simData.time = []
  simData.sp = []
  simData.pv = []
  simData.mv = []
  simMetrics.value = null
  spPath.value = ''
  pvPath.value = ''
  mvPath.value = ''
}

function applyToConverter() {
  convForm1.Kp = pidKp.value
  convForm1.Ki = pidKi.value
  convForm1.Kd = pidKd.value
  activeTab.value = 'tab1'
}

// Quick load examples
interface QuickExample {
  name: string
  K: number
  tau: number
  theta: number
  SP: number
  Kp: number
  Ki: number
  Kd: number
}

const quickExamples: QuickExample[] = [
  { name: '温度控制', K: 1, tau: 5, theta: 1, SP: 100, Kp: 3, Ki: 0.3, Kd: 0.5 },
  { name: '液位控制', K: 1.5, tau: 8, theta: 0.5, SP: 80, Kp: 2, Ki: 0.2, Kd: 0.3 },
  { name: '流量控制', K: 0.8, tau: 2, theta: 0.3, SP: 60, Kp: 1.5, Ki: 0.8, Kd: 0.1 },
  { name: '速度控制', K: 2, tau: 4, theta: 0.2, SP: 120, Kp: 4, Ki: 0.5, Kd: 0.4 },
  { name: '压力控制', K: 1.2, tau: 3, theta: 0.8, SP: 90, Kp: 2.5, Ki: 0.4, Kd: 0.2 }
]

function loadExample(ex: QuickExample) {
  modelK.value = ex.K
  modelTau.value = ex.tau
  modelTheta.value = ex.theta
  modelSP.value = ex.SP
  pidKp.value = ex.Kp
  pidKi.value = ex.Ki
  pidKd.value = ex.Kd
  nextTick(() => runSimulation())
}

// ============================================================
// TAB 4: Engine Scenarios
// ============================================================
interface EngineScenario {
  name: string
  process: string
  actuator: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  defaultKpRange: string
  modelDesc: string
  modelK: number
  modelTau: number
  modelTheta: number
  suggestKp: number
  suggestKi: number
  suggestKd: number
  desc: string
  notes: string
}

const engineScenarios: EngineScenario[] = [
  {
    name: '燃油轨压控制',
    process: '实际轨压 (Rail Pressure)',
    actuator: '进油计量阀 (IMV)',
    difficulty: 'Medium',
    defaultKpRange: '0.5 - 2.0',
    modelDesc: '高压共轨系统压力响应',
    modelK: 1.2, modelTau: 0.8, modelTheta: 0.15,
    suggestKp: 1.2, suggestKi: 0.6, suggestKd: 0.1,
    desc: '高压共轨燃油系统的轨压控制是柴油机 ECU 的核心功能。IMV 控制进入高压油泵的燃油量，从而调节轨压。系统具有响应快、死区时间短的特点。轨压波动直接影响喷油量和喷油正时。',
    notes: '轨压传感器响应快，但高压油泵的机械惯性会引入滞后。注意 IMV 的 PWM 驱动频率和油泵柱塞泵油频率的干扰。常用前馈 + PID 复合控制策略。'
  },
  {
    name: '空燃比控制 (Lambda)',
    process: 'λ 传感器信号',
    actuator: '喷油脉宽 (Injection Pulse)',
    difficulty: 'Hard',
    defaultKpRange: '0.1 - 0.5',
    modelDesc: '空燃比闭环调节',
    modelK: 0.3, modelTau: 0.4, modelTheta: 0.25,
    suggestKp: 0.25, suggestKi: 0.15, suggestKd: 0.02,
    desc: '空燃比控制是排放控制的关键，直接影响 NOx 和 PM 的生成。Lambda 传感器(宽带/UEGO)安装在排气管中，测量排气中的氧含量。从喷油到传感器响应存在较大的传输延迟。',
    notes: '传输延迟大，纯滞后时间长，需要 Smith 预估器或高级策略。不同工况(怠速/部分负荷/全负荷)需要不同的 PID 参数映射。过渡工况需加 transient fuel 补偿。'
  },
  {
    name: '增压压力控制 (VGT)',
    process: 'MAP 传感器 (进气压力)',
    actuator: 'VGT 喷嘴环位置',
    difficulty: 'Hard',
    defaultKpRange: '0.3 - 1.0',
    modelDesc: '可变几何涡轮增压',
    modelK: 0.6, modelTau: 1.5, modelTheta: 0.4,
    suggestKp: 0.5, suggestKi: 0.2, suggestKd: 0.08,
    desc: 'VGT 通过调节涡轮侧喷嘴环的开度来控制增压压力。系统具有很强的非线性和较大的滞后。喷嘴环位置影响涡轮效率和排气背压，进而影响 EGR 率。',
    notes: 'VGT 和 EGR 存在强耦合，需要解耦控制。低转速下响应慢，高转速下响应快但容易超调。注意执行器黏滞和积碳问题。建议对 MAP 信号进行低通滤波。'
  },
  {
    name: 'EGR 率控制',
    process: 'EGR 阀位置/进气氧浓度',
    actuator: 'EGR 步进电机',
    difficulty: 'Medium',
    defaultKpRange: '0.2 - 0.8',
    modelDesc: '废气再循环控制系统',
    modelK: 0.8, modelTau: 0.6, modelTheta: 0.1,
    suggestKp: 0.6, suggestKi: 0.4, suggestKd: 0.05,
    desc: 'EGR 系统将部分废气引入进气管，降低燃烧温度以抑制 NOx 生成。EGR 阀的位置控制直接影响废气再循环量，需要精确定位。',
    notes: 'EGR 阀容易积碳导致响应变慢和卡滞。低温工况下废气流量小。与 VGT 存在耦合，需要协调控制。进气氧浓度传感器 (Lambda) 可作为 EGR 率的间接反馈。'
  },
  {
    name: 'SCR 尿素计量控制',
    process: 'NOx 传感器信号',
    actuator: '尿素计量喷射阀',
    difficulty: 'Hard',
    defaultKpRange: '0.05 - 0.3',
    modelDesc: 'SCR 后处理系统',
    modelK: 0.15, modelTau: 3, modelTheta: 2,
    suggestKp: 0.12, suggestKi: 0.02, suggestKd: 0.01,
    desc: 'SCR 系统通过喷射尿素水溶液到排气管中，在催化剂作用下将 NOx 还原为 N₂。该系统具有极大的滞后时间(数秒)，且 NOx 传感器动态响应慢。',
    notes: '大滞后系统，PID 效果有限，建议配合前馈控制。urea-to-NOx 比需要在 0.8-1.2 之间精确控制。低温(<180°C)下催化效率急剧下降。排温传感器和 NOx 传感器动态需补偿。'
  },
  {
    name: 'DPF 再生温度控制',
    process: 'DPF 入口温度',
    actuator: '后喷 (Post-Injection)',
    difficulty: 'Hard',
    defaultKpRange: '0.1 - 0.4',
    modelDesc: 'DPF 主动再生温度控制',
    modelK: 0.35, modelTau: 2, modelTheta: 0.8,
    suggestKp: 0.2, suggestKi: 0.05, suggestKd: 0.03,
    desc: 'DPF 主动再生时需要精确控制排温至 550-650°C 范围。通过后喷(Post-Injection)在 DOC 中氧化放热提升排气温度。温度过高会导致 DPF 烧毁。',
    notes: '温度控制精度要求在 ±25°C 以内。后喷量过大会导致机油稀释。排气流量变化会显著影响温升速率。建议限制积分项的累积速度以防止 overshoot。需要监控 DPF 压差防止过热。'
  },
  {
    name: '怠速转速控制',
    process: '发动机转速 (RPM)',
    actuator: '怠速空气执行器 (IAC)',
    difficulty: 'Easy',
    defaultKpRange: '1.0 - 5.0',
    modelDesc: '发动机怠速控制系统',
    modelK: 2.5, modelTau: 0.3, modelTheta: 0.05,
    suggestKp: 3.5, suggestKi: 1.5, suggestKd: 0.15,
    desc: '发动机怠速控制是经典的 PID 应用场景。通过调节怠速空气执行器控制旁通进气量，维持目标怠速转速。系统响应快，负载扰动(如空调、发电机)需要快速补偿。',
    notes: '负载变化(空调、风扇、发电机)会引入阶跃扰动。发动机摩擦随水温变化，需要参数自适应。注意不同档位(空档/驱动档)目标转速不同。建议加负载前馈补偿。'
  },
  {
    name: '电子节气门控制',
    process: '节气门位置传感器',
    actuator: '节气门直流电机',
    difficulty: 'Easy',
    defaultKpRange: '2.0 - 8.0',
    modelDesc: '电子节气门 (ETC)',
    modelK: 5, modelTau: 0.15, modelTheta: 0.02,
    suggestKp: 5, suggestKi: 2, suggestKd: 0.3,
    desc: '电子节气门(线控驱动)通过直流电机驱动节气门片旋转，控制进气量。系统响应快、死区小，但对定位精度要求高。摩擦和回位弹簧是主要的非线性因素。',
    notes: '回位弹簧造成非线性扭矩。节气门片积碳会导致响应变慢和卡滞。电机 PWM 频率需要避开共振点。注意 limp-home 模式的故障安全策略。建议加 dither 信号减小静摩擦。'
  }
]

const selectedScenario = ref<EngineScenario | null>(null)

function selectScenario(row: EngineScenario) {
  selectedScenario.value = row
}

function loadScenario(scenario: EngineScenario) {
  modelK.value = scenario.modelK
  modelTau.value = scenario.modelTau
  modelTheta.value = scenario.modelTheta
  modelSP.value = 100
  pidKp.value = scenario.suggestKp
  pidKi.value = scenario.suggestKi
  pidKd.value = scenario.suggestKd
  signalType.value = 'step'
  activeTab.value = 'tab3'
  nextTick(() => runSimulation())
}

// ============================================================
// TAB 5: PID Knowledge Base
// ============================================================
const kbActiveSections = ref(['kb1'])

const antiWindupMethods = [
  { name: '积分钳位 (Clamping)', desc: '当控制器输出达到限幅时，停止积分累积', pros: '实现简单', cons: '响应可能变慢' },
  { name: '条件积分 (Conditional Integration)', desc: '仅在特定条件(如误差在带内)时才进行积分', pros: '灵活可配置', cons: '条件参数需调试' },
  { name: '反向计算 (Back-Calculation)', desc: '将超出的输出量按增益 Kb 反馈到积分项', pros: '平滑退饱和', cons: '需要调节 Kb 参数' },
  { name: '积分限幅', desc: '对积分项的输出单独设置上下限', pros: '防止积分过大', cons: '限幅值难确定' }
]

const advancedPIDMethods = [
  { name: '前馈控制 (Feedforward)', desc: '基于扰动或设定值变化直接计算补偿量，叠加到 PID 输出上', application: '已知扰动可测的系统，如发动机轨压控制' },
  { name: '串级控制 (Cascade)', desc: '主回路 PID 的输出作为副回路 PID 的设定值，形成内外环', application: '温度+流量串级、位置+速度串级' },
  { name: '自适应 PID', desc: '根据工况在线调整 PID 参数，常用增益调度或 Model Reference 方法', application: '发动机全工况 MAP 控制' },
  { name: '模糊 PID', desc: '用模糊逻辑规则在线调整 Kp/Ki/Kd 参数', application: '非线性系统、模型不确定系统' },
  { name: 'Smith 预估器', desc: '对大滞后系统加入纯滞后补偿，消除滞后对稳定性的影响', application: 'SCR 尿素计量、空燃比控制' },
  { name: '内模控制 (IMC)', desc: '基于过程模型的控制器设计方法，与 PID 参数有明确对应关系', application: '需要鲁棒性的过程控制' }
]

const troubleshooting = [
  { symptom: '系统持续振荡', cause: 'Kp 太大 或 Kd 太小', solution: '减小 Kp 或增大 Kd', param: '&darr;Kp / &uarr;Kd' },
  { symptom: '响应过慢', cause: 'Kp 太小 或 Ki 太小', solution: '增大 Kp 或增大 Ki', param: '&uarr;Kp / &uarr;Ki' },
  { symptom: '稳态误差大', cause: 'Ki 太小', solution: '增大 Ki 或检查积分是否饱和', param: '&uarr;Ki' },
  { symptom: '超调过大', cause: 'Kp 太大 或 Kd 太小', solution: '减小 Kp 或增大 Kd, 减小 Ki', param: '&darr;Kp / &uarr;Kd' },
  { symptom: '输出抖动/噪声', cause: 'Kd 太大 或测量噪声', solution: '减小 Kd, 增加测量滤波', param: '&darr;Kd' },
  { symptom: '积分饱和', cause: '执行器限幅后积分继续累积', solution: '启用 anti-windup 策略', param: '抗饱和' },
  { symptom: '设定值跟踪慢', cause: '比例带太宽', solution: '减小比例带/增大 Kp', param: '&uarr;Kp' },
  { symptom: '对扰动不敏感', cause: 'Ki 太小', solution: '增大 Ki 或加前馈', param: '&uarr;Ki' }
]

const ruleOfThumb = [
  { situation: '快速跟踪设定值', kp: '增大 Kp', ki: '减小 Ki', kd: '增大 Kd', explanation: '提高响应速度同时保持稳定性' },
  { situation: '抑制低频扰动', kp: '不变', ki: '增大 Ki', kd: '不变', explanation: '积分项消除低频扰动' },
  { situation: '抑制高频噪声', kp: '不变或略减', ki: '不变', kd: '减小 Kd', explanation: '微分对高频噪声敏感' },
  { situation: '减小超调', kp: '减小 Kp', ki: '增大 Ki', kd: '增大 Kd', explanation: '降低比例增益，加强微分' },
  { situation: '消除稳态误差', kp: '增大 Kp', ki: '增大 Ki', kd: '不变', explanation: '比例和积分共同作用' },
  { situation: '系统响应太慢', kp: '增大 Kp', ki: '减小 Ki', kd: '略增 Kd', explanation: '加快系统响应' }
]

// ============================================================
// Lifecycle
// ============================================================
onMounted(() => {
  runSimulation()
})
</script>

<style scoped lang="scss">
// ---- Asiimov Theme Variables ----
$asiimov-white: #F5F5F0;
$asiimov-orange: #FF8800;
$asiimov-orange-light: #FF9A2E;
$asiimov-black: #1A1A1A;
$asiimov-gray: #2D2D2D;
$asiimov-gray-light: #3A3A3A;
$asiimov-text: #E0E0E0;
$asiimov-text-muted: #888;
$asiimov-bg-card: #222;
$asiimov-border: #333;

.pid-tuner {
  color: $asiimov-text;
  max-width: 1400px;

  .page-header {
    margin-bottom: 20px;

    h1 {
      font-size: 22px;
      color: white;
      margin-bottom: 4px;
    }

    .page-desc {
      font-size: 12px;
      color: $asiimov-text-muted;
    }
  }
}

// ---- Tabs ----
.pid-tabs {
  :deep(.el-tabs__header) {
    background: $asiimov-black;
    border-bottom: 1px solid $asiimov-border;
  }

  :deep(.el-tabs__nav-wrap::after) {
    background: $asiimov-border;
  }

  :deep(.el-tabs__item) {
    color: $asiimov-text-muted;
    font-size: 13px;

    &:hover {
      color: $asiimov-orange;
    }

    &.is-active {
      color: $asiimov-orange;
    }
  }

  :deep(.el-tabs__active-bar) {
    background: $asiimov-orange;
  }

  :deep(.el-tabs__content) {
    background: darken($asiimov-black, 2%);
    padding: 16px;
    border: 1px solid $asiimov-border;
    border-top: none;
    border-radius: 0 0 8px 8px;
  }
}

.tab-content {
  min-height: 400px;
}

// ---- Card styling ----
:deep(.el-card) {
  background: $asiimov-bg-card;
  border: 1px solid $asiimov-border;
  color: $asiimov-text;

  .el-card__header {
    border-bottom: 1px solid $asiimov-border;
    padding: 12px 16px;
  }

  .el-card__body {
    padding: 16px;
  }
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: $asiimov-orange;
}

.section-title {
  font-size: 15px;
  color: white;
  margin-bottom: 12px;
}

// ============================================================
// TAB 1: Converter
// ============================================================
.converter-layout {
  display: flex;
  align-items: flex-start;
  gap: 16px;

  .converter-card {
    flex: 1;
  }

  .converter-arrows {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 60px;
    min-width: 60px;

    .arrow-icon {
      font-size: 28px;
      color: $asiimov-orange;
    }
  }
}

.conv-result {
  margin-left: 12px;
  color: $asiimov-orange;
  font-size: 13px;
}

.conv-error {
  margin-top: 12px;
}

.formula-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  .formula-item {
    background: $asiimov-gray;
    padding: 10px 12px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    code {
      font-size: 12px;
      color: $asiimov-orange;
    }

    span {
      font-size: 12px;
      color: $asiimov-text-muted;
    }
  }
}

// ============================================================
// TAB 2: Tuning Methods
// ============================================================
.method-selector {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;

  :deep(.el-radio-button__inner) {
    background: $asiimov-gray;
    border-color: $asiimov-border;
    color: $asiimov-text-muted;
    font-size: 12px;
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: $asiimov-orange;
    border-color: $asiimov-orange;
    color: white;
    box-shadow: none;
  }
}

.zn-steps {
  margin: 16px 0;

  :deep(.el-step__title) {
    font-size: 12px;
    color: $asiimov-text-muted;
  }

  :deep(.el-step.is-process .el-step__title) {
    color: $asiimov-orange;
  }

  :deep(.el-step.is-finish .el-step__title) {
    color: $asiimov-text;
  }
}

.step-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

.method-desc {
  font-size: 13px;
  color: $asiimov-text-muted;
  padding: 8px 12px;
  background: $asiimov-gray;
  border-radius: 6px;
}

.relay-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ============================================================
// TAB 3: Simulator
// ============================================================
.simulator-tab {
  min-height: 700px;
}

.simulator-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;

  .sim-chart-area {
    flex: 1;
    min-width: 0;
  }

  .sim-controls {
    width: 340px;
    flex-shrink: 0;
  }
}

.chart-card {
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.chart-legend {
  display: flex;
  gap: 14px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: $asiimov-text-muted;
  }

  .legend-dot {
    width: 14px;
    height: 3px;
    border-radius: 2px;

    &.sp-dot { background: #4A9EFF; }
    &.pv-dot { background: $asiimov-orange; }
    &.mv-dot { background: #4CAF50; }
  }
}

.chart-container {
  width: 100%;
  height: 350px;
  position: relative;
  background: darken($asiimov-black, 3%);
  border-radius: 4px;
  overflow: hidden;

  .sim-svg {
    width: 100%;
    height: 100%;
  }

  .chart-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $asiimov-text-muted;
    font-size: 14px;
  }
}

.chart-line {
  stroke-width: 2;
  fill: none;
  vector-effect: non-scaling-stroke;

  &.sp-line {
    stroke: #4A9EFF;
    stroke-dasharray: 6, 3;
  }

  &.pv-line {
    stroke: $asiimov-orange;
  }

  &.mv-line {
    stroke: #4CAF50;
  }
}

.grid-line {
  stroke: $asiimov-border;
  stroke-width: 0.5;
}

.axis-label {
  font-size: 10px;
  fill: $asiimov-text-muted;
}

.axis-title {
  font-size: 11px;
  fill: $asiimov-text-muted;
}

.metrics-card {
  margin-top: 12px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  .metric-item {
    background: $asiimov-gray;
    padding: 10px;
    border-radius: 6px;
    text-align: center;

    .metric-label {
      display: block;
      font-size: 11px;
      color: $asiimov-text-muted;
      margin-bottom: 4px;
    }

    .metric-value {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: white;
      font-variant-numeric: tabular-nums;

      &.metric-bad {
        color: #FF5252;
      }
    }

    .metric-unit {
      display: block;
      font-size: 10px;
      color: $asiimov-text-muted;
      margin-top: 2px;
    }
  }
}

.control-card {
  margin-bottom: 12px;

  .model-formula {
    font-size: 12px;
    color: $asiimov-text-muted;
    text-align: center;
    padding: 4px;
    margin-bottom: 8px;
    background: $asiimov-gray;
    border-radius: 4px;
    font-style: italic;
  }

  :deep(.el-slider__runway) {
    background: $asiimov-gray-light;
  }

  :deep(.el-slider__bar) {
    background: $asiimov-orange;
  }

  :deep(.el-slider__button) {
    border-color: $asiimov-orange;
    background: white;
  }
}

.sim-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.quick-load-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;

  .quick-btn {
    width: 100%;
    font-size: 11px;
  }
}

// ============================================================
// TAB 4: Engine Scenarios
// ============================================================
.scenario-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.scenario-detail-body {
  .detail-section {
    margin-bottom: 16px;

    h4 {
      font-size: 13px;
      color: $asiimov-orange;
      margin-bottom: 6px;
    }

    p {
      font-size: 13px;
      color: $asiimov-text;
      line-height: 1.6;
    }
  }
}

// ============================================================
// TAB 5: Knowledge Base
// ============================================================
.kb-collapse {
  :deep(.el-collapse-item__header) {
    background: $asiimov-bg-card;
    color: $asiimov-text;
    font-size: 14px;
    font-weight: 600;
    border-color: $asiimov-border;
    padding-left: 12px;
  }

  :deep(.el-collapse-item__wrap) {
    background: darken($asiimov-black, 1%);
    border-color: $asiimov-border;
  }

  :deep(.el-collapse-item__content) {
    padding: 16px;
    color: $asiimov-text;
    font-size: 13px;
  }
}

.kb-section {
  h4 {
    font-size: 14px;
    color: $asiimov-orange;
    margin-bottom: 10px;
  }

  p {
    line-height: 1.7;
    margin-bottom: 8px;
  }
}

.kb-formula {
  text-align: center;
  padding: 12px;
  background: $asiimov-gray;
  border-radius: 6px;
  font-size: 16px;
  color: white;
  margin-bottom: 16px;
  font-family: 'Courier New', monospace;
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.kb-card.mini {
  background: $asiimov-gray;
  border: 1px solid $asiimov-border;
  border-radius: 8px;
  padding: 14px;

  .kb-card-title {
    font-size: 14px;
    font-weight: 600;
    color: $asiimov-orange;
    margin-bottom: 8px;
  }

  p {
    font-size: 12px;
    color: $asiimov-text-muted;
    font-family: 'Courier New', monospace;
    margin-bottom: 8px;
  }

  ul {
    padding-left: 16px;
    font-size: 12px;
    color: $asiimov-text;
    line-height: 1.8;
  }
}

.kb-mnemonic {
  background: $asiimov-gray;
  border: 1px solid $asiimov-border;
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  p {
    font-size: 14px;
    color: $asiimov-text;
    margin-bottom: 4px;
    line-height: 2;
  }
}

// ============================================================
// Element Plus overrides for Asiimov theme
// ============================================================
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: $asiimov-gray-light;
  color: $asiimov-text;

  &:hover {
    background: $asiimov-orange;
    color: white;
  }
}

:deep(.el-input__wrapper) {
  background: $asiimov-gray;
  border-color: $asiimov-border;
  box-shadow: none !important;

  .el-input__inner {
    color: $asiimov-text;
  }
}

:deep(.el-input-number.is-controls-right .el-input-number__decrease),
:deep(.el-input-number.is-controls-right .el-input-number__increase) {
  background: $asiimov-gray-light;
  color: $asiimov-text;
  border-color: $asiimov-border;
}

:deep(.el-table) {
  background: $asiimov-bg-card;
  color: $asiimov-text;
  border-color: $asiimov-border;

  th.el-table__cell {
    background: $asiimov-gray;
    color: $asiimov-orange;
    border-color: $asiimov-border;
  }

  td.el-table__cell {
    border-color: $asiimov-border;
  }

  .el-table__row {
    background: $asiimov-bg-card;
    color: $asiimov-text;

    &:hover > td {
      background: $asiimov-gray;
    }
  }

  &.el-table--striped .el-table__body tr.el-table__row--striped td {
    background: lighten($asiimov-bg-card, 3%);
  }
}

:deep(.el-tag) {
  &.el-tag--success { background: rgba(76, 175, 80, 0.2); border-color: #4CAF50; color: #81C784; }
  &.el-tag--warning { background: rgba(255, 152, 0, 0.2); border-color: #FF9800; color: #FFB74D; }
  &.el-tag--danger { background: rgba(244, 67, 54, 0.2); border-color: #F44336; color: #E57373; }
}

:deep(.el-alert--error) {
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #E57373;
}

:deep(.el-select) {
  .el-input__wrapper {
    background: $asiimov-gray;
  }
}

:deep(.el-form-item__label) {
  color: $asiimov-text-muted;
  font-size: 12px;
}

:deep(.el-steps) {
  .el-step.is-process .el-step__icon-inner {
    color: white;
  }

  .el-step.is-process .el-step__icon {
    background: $asiimov-orange;
    border-color: $asiimov-orange;
  }

  .el-step.is-finish .el-step__icon {
    background: transparent;
    border-color: $asiimov-orange;
  }

  .el-step.is-finish .el-step__icon-inner {
    color: $asiimov-orange;
  }

  .el-step.is-finish .el-step__line {
    background: $asiimov-orange;
  }

  .el-step__description {
    font-size: 11px;
  }
}

:deep(.el-button--primary) {
  background: $asiimov-orange;
  border-color: $asiimov-orange;
  color: white;

  &:hover {
    background: $asiimov-orange-light;
    border-color: $asiimov-orange-light;
  }
}

:deep(.el-button--default) {
  background: $asiimov-gray;
  border-color: $asiimov-border;
  color: $asiimov-text;

  &:hover {
    background: $asiimov-gray-light;
    border-color: $asiimov-orange;
    color: $asiimov-orange;
  }
}

:deep(.el-collapse-item__arrow) {
  color: $asiimov-text-muted;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-left-color: $asiimov-border;
}

// Responsive adjustments
@media (max-width: 1100px) {
  .simulator-layout {
    flex-direction: column;

    .sim-controls {
      width: 100%;
    }
  }

  .converter-layout {
    flex-direction: column;

    .converter-arrows {
      flex-direction: row;
      padding-top: 0;
    }
  }

  .kb-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .formula-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
