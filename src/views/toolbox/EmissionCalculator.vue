<template>
  <div class="emission-calculator">
    <!-- Header -->
    <div class="calc-header">
      <h1 class="calc-title">
        <el-icon class="title-icon"><Monitor /></el-icon>
        排放计算器
      </h1>
      <span class="calc-subtitle">Emission Calculator</span>
    </div>

    <!-- Tabs -->
    <el-tabs
      v-model="activeTab"
      type="border-card"
      class="calc-tabs"
      @tab-click="handleTabClick"
    >
      <!-- ==================== Tab 1: Concentration Conversion ==================== -->
      <el-tab-pane label="排放浓度换算" name="conversion">
        <div class="tab-content">
          <div class="tab-intro">
            <p>实现 ppm 与 mg/m³ 之间的双向换算，支持标准状态（0°C, 101.325 kPa）与实际工况修正。</p>
          </div>

          <el-row :gutter="24">
            <el-col :span="14">
              <el-card shadow="never" class="form-card">
                <template #header>
                  <span class="card-title">输入参数</span>
                </template>
                <el-form
                  ref="conversionFormRef"
                  :model="conversion"
                  label-width="140px"
                  label-position="left"
                  size="default"
                >
                  <el-form-item label="气体种类">
                    <el-select
                      v-model="conversion.selectedGas"
                      filterable
                      style="width: 100%"
                      @change="recalcConversion"
                    >
                      <el-option
                        v-for="g in gases"
                        :key="g.value"
                        :label="g.label + ' (M=' + g.molecularWeight + ')'"
                        :value="g.value"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="ppm 值">
                    <el-input-number
                      v-model="conversion.ppm"
                      :min="0"
                      :max="1000000"
                      :precision="2"
                      style="width: 100%"
                      @change="onPpmChange"
                    />
                  </el-form-item>

                  <el-form-item label="mg/m³ 值">
                    <el-input-number
                      v-model="conversion.mgm3"
                      :min="0"
                      :max="1000000"
                      :precision="4"
                      style="width: 100%"
                      @change="onMgm3Change"
                    />
                  </el-form-item>

                  <el-divider />

                  <el-form-item label="温度 (°C)">
                    <el-input-number
                      v-model="conversion.temperature"
                      :min="-50"
                      :max="200"
                      :precision="1"
                      style="width: 100%"
                      @change="recalcConversion"
                    />
                  </el-form-item>

                  <el-form-item label="压力 (kPa)">
                    <el-input-number
                      v-model="conversion.pressure"
                      :min="50"
                      :max="200"
                      :precision="2"
                      :step="0.5"
                      style="width: 100%"
                      @change="recalcConversion"
                    />
                  </el-form-item>

                  <el-form-item label=" ">
                    <div class="btn-group">
                      <el-button
                        type="primary"
                        size="small"
                        @click="resetConversion"
                      >
                        重置
                      </el-button>
                      <el-button
                        size="small"
                        @click="setDefaultConversion"
                      >
                        常用值 (100 ppm)
                      </el-button>
                    </div>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>

            <el-col :span="10">
              <el-card shadow="never" class="result-card">
                <template #header>
                  <span class="card-title">计算结果</span>
                </template>

                <div class="result-value-lg">
                  <div class="result-row">
                    <span class="result-label">{{ conversion.selectedGasLabel }} 浓度</span>
                    <span v-if="lastCalcIsPpm" class="result-number">{{ formattedMgm3 }}</span>
                    <span v-else class="result-number">{{ formattedPpm }}</span>
                  </div>
                  <div class="result-unit">
                    {{ lastCalcIsPpm ? 'mg/m³' : 'ppm' }}
                  </div>
                </div>

                <el-divider />

                <div class="formula-box">
                  <div class="formula-title">计算公式</div>
                  <div class="formula">mg/m³ = ppm × M ÷ 22.4</div>
                  <div class="formula">× 273.15 / (273.15 + T) × P / 101.325</div>
                </div>

                <el-divider />

                <div class="calc-steps">
                  <div class="steps-title">计算步骤</div>
                  <div
                    v-for="(step, idx) in conversionSteps"
                    :key="idx"
                    class="step-item"
                  >
                    <span class="step-num">{{ idx + 1 }}.</span>
                    <span class="step-text">{{ step }}</span>
                  </div>
                </div>

                <el-divider />

                <el-button
                  size="small"
                  class="copy-btn"
                  @click="copyResult(conversionResultText)"
                >
                  <el-icon><CopyDocument /></el-icon> 复制结果
                </el-button>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- ==================== Tab 2: Specific Emission ==================== -->
      <el-tab-pane label="比排放量计算" name="specific">
        <div class="tab-content">
          <div class="tab-intro">
            <p>计算 g/kWh、g/s、g/km 等比排放量指标。支持基于质量流量或浓度的两种输入模式。</p>
          </div>

          <el-row :gutter="24">
            <el-col :span="14">
              <el-card shadow="never" class="form-card">
                <template #header>
                  <span class="card-title">输入参数</span>
                </template>

                <el-form
                  :model="specific"
                  label-width="150px"
                  label-position="left"
                  size="default"
                >
                  <el-form-item label="组分选择">
                    <el-select
                      v-model="specific.component"
                      style="width: 100%"
                      @change="recalcSpecific"
                    >
                      <el-option label="CO₂" value="CO₂" />
                      <el-option label="CO" value="CO" />
                      <el-option label="NOx" value="NOx" />
                      <el-option label="HC" value="HC" />
                      <el-option label="燃油消耗 (BSFC)" value="Fuel" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="输入模式">
                    <el-radio-group
                      v-model="specific.inputMode"
                      @change="recalcSpecific"
                    >
                      <el-radio value="massflow">质量流量</el-radio>
                      <el-radio value="concentration">浓度</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <template v-if="specific.inputMode === 'massflow'">
                    <el-form-item label="质量流量 (g/h)">
                      <el-input-number
                        v-model="specific.massFlowRate"
                        :min="0"
                        :max="1e7"
                        :precision="2"
                        style="width: 100%"
                        @change="recalcSpecific"
                      />
                    </el-form-item>
                  </template>

                  <template v-else>
                    <el-form-item label="浓度 (ppm)">
                      <el-input-number
                        v-model="specific.concentration"
                        :min="0"
                        :max="1e6"
                        :precision="2"
                        style="width: 100%"
                        @change="recalcSpecific"
                      />
                    </el-form-item>
                    <el-form-item label="排气流量 (kg/h)">
                      <el-input-number
                        v-model="specific.exhaustFlow"
                        :min="0"
                        :max="1e6"
                        :precision="2"
                        style="width: 100%"
                        @change="recalcSpecific"
                      />
                    </el-form-item>
                    <el-form-item label="排气摩尔质量 (g/mol)">
                      <el-input-number
                        v-model="specific.exhaustMolarMass"
                        :min="10"
                        :max="50"
                        :precision="2"
                        :step="0.1"
                        style="width: 100%"
                        @change="recalcSpecific"
                      />
                      <div class="form-help">干空气 ≈ 28.97 g/mol</div>
                    </el-form-item>
                  </template>

                  <el-divider />

                  <el-form-item label="发动机功率 (kW)">
                    <el-input-number
                      v-model="specific.enginePower"
                      :min="0"
                      :max="100000"
                      :precision="2"
                      style="width: 100%"
                      @change="recalcSpecific"
                    />
                  </el-form-item>

                  <el-form-item label="车速 (km/h)">
                    <el-input-number
                      v-model="specific.vehicleSpeed"
                      :min="0"
                      :max="500"
                      :precision="1"
                      style="width: 100%"
                      @change="recalcSpecific"
                    />
                    <div class="form-help">填车速可额外计算 g/km 结果</div>
                  </el-form-item>

                  <el-form-item label=" ">
                    <el-button
                      type="primary"
                      size="small"
                      @click="resetSpecific"
                    >
                      重置
                    </el-button>
                    <el-button
                      size="small"
                      style="margin-left: 8px"
                      @click="setDefaultSpecific"
                    >
                      示例数据
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>

            <el-col :span="10">
              <el-card shadow="never" class="result-card">
                <template #header>
                  <span class="card-title">计算结果</span>
                </template>

                <div class="result-grid">
                  <div class="result-item">
                    <div class="ri-label">BS{{ specific.component }}</div>
                    <div class="ri-value">{{ specificResult.bs }} g/kWh</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">排放率</div>
                    <div class="ri-value">{{ specificResult.rate }} g/s</div>
                  </div>
                  <div class="result-item" v-if="specific.vehicleSpeed && specific.vehicleSpeed > 0">
                    <div class="ri-label">排放因子</div>
                    <div class="ri-value">{{ specificResult.factor }} g/km</div>
                  </div>
                </div>

                <el-divider />

                <div class="formula-box">
                  <div class="formula-title">核心公式</div>
                  <div class="formula">g/kWh = 质量流量 (g/h) / 功率 (kW)</div>
                  <div class="formula">g/s = g/kWh × 功率 / 3600</div>
                  <div class="formula" v-if="specific.vehicleSpeed && specific.vehicleSpeed > 0">
                    g/km = g/s × 3.6 / 车速
                  </div>
                </div>

                <el-divider />

                <div class="calc-steps">
                  <div class="steps-title">计算步骤</div>
                  <div
                    v-for="(step, idx) in specificSteps"
                    :key="idx"
                    class="step-item"
                  >
                    <span class="step-num">{{ idx + 1 }}.</span>
                    <span class="step-text">{{ step }}</span>
                  </div>
                </div>

                <el-divider />

                <el-button
                  size="small"
                  class="copy-btn"
                  @click="copyResult(specificResultText)"
                >
                  <el-icon><CopyDocument /></el-icon> 复制结果
                </el-button>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- ==================== Tab 3: Wet/Dry Correction ==================== -->
      <el-tab-pane label="湿干基修正" name="wetdry">
        <div class="tab-content">
          <div class="tab-intro">
            <p>将湿基测量浓度修正为干基浓度。由于排气中水蒸气稀释作用，湿基浓度低于干基浓度，修正后可得到真实浓度值。</p>
          </div>

          <el-row :gutter="24">
            <el-col :span="14">
              <el-card shadow="never" class="form-card">
                <template #header>
                  <span class="card-title">输入参数</span>
                </template>
                <el-form
                  :model="wetDry"
                  label-width="140px"
                  label-position="left"
                  size="default"
                >
                  <el-form-item label="湿基浓度 (ppm)">
                    <el-input-number
                      v-model="wetDry.wetConcentration"
                      :min="0"
                      :max="1e6"
                      :precision="2"
                      style="width: 100%"
                      @change="recalcWetDry"
                    />
                  </el-form-item>

                  <el-form-item label="H/C 比">
                    <el-input-number
                      v-model="wetDry.hcRatio"
                      :min="0.1"
                      :max="10"
                      :precision="3"
                      :step="0.01"
                      style="width: 100%"
                      @change="recalcWetDry"
                    />
                  </el-form-item>

                  <el-form-item label="燃料类型预设">
                    <el-select
                      v-model="wetDry.fuelType"
                      style="width: 100%"
                      @change="onFuelTypeChange"
                    >
                      <el-option label="汽油 (H/C=1.85)" value="gasoline" />
                      <el-option label="柴油 (H/C=1.86)" value="diesel" />
                      <el-option label="LPG (H/C=2.60)" value="lpg" />
                      <el-option label="CNG (H/C=4.00)" value="cng" />
                      <el-option label="甲醇 (H/C=4.00)" value="methanol" />
                      <el-option label="乙醇 (H/C=3.00)" value="ethanol" />
                      <el-option label="自定义" value="custom" />
                    </el-select>
                  </el-form-item>

                  <el-form-item v-if="wetDry.fuelType === 'custom'" label="自定义 H/C">
                    <el-input-number
                      v-model="wetDry.customHcRatio"
                      :min="0.1"
                      :max="10"
                      :precision="3"
                      :step="0.01"
                      style="width: 100%"
                      @change="recalcWetDry"
                    />
                  </el-form-item>

                  <el-form-item label=" ">
                    <el-button
                      type="primary"
                      size="small"
                      @click="resetWetDry"
                    >
                      重置
                    </el-button>
                    <el-button
                      size="small"
                      style="margin-left: 8px"
                      @click="setDefaultWetDry"
                    >
                      示例数据
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>

            <el-col :span="10">
              <el-card shadow="never" class="result-card">
                <template #header>
                  <span class="card-title">修正结果</span>
                </template>

                <div class="result-value-lg">
                  <div class="result-row">
                    <span class="result-label">干基浓度</span>
                    <span class="result-number">{{ wetDryResult.dryConcentration }}</span>
                  </div>
                  <div class="result-unit">ppm</div>
                </div>

                <el-divider />

                <div class="result-grid" style="grid-template-columns: 1fr 1fr">
                  <div class="result-item">
                    <div class="ri-label">湿基</div>
                    <div class="ri-value">{{ wetDryResult.wetDisplay }} ppm</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">干基修正系数 K<sub>w</sub></div>
                    <div class="ri-value">{{ wetDryResult.kw }}</div>
                  </div>
                </div>

                <el-divider />

                <div class="formula-box">
                  <div class="formula-title">计算公式</div>
                  <div class="formula">C<sub>dry</sub> = C<sub>wet</sub> × (1 + K<sub>w</sub>)</div>
                  <div class="formula">K<sub>w</sub> = 1.88 × 0.05 × (H/C)</div>
                </div>

                <el-divider />

                <div class="explanation-box">
                  <div class="explanation-title">为什么需要湿干基修正？</div>
                  <p>
                    发动机排气中含有水蒸气（燃烧产物），水蒸气会稀释其他气体成分，
                    导致湿基测量值偏低。干基修正通过去除水蒸气的影响，
                    得到真实的干基浓度值，以保证不同条件/不同燃料下测量结果的可比性。
                  </p>
                  <p>
                    燃料的 H/C 比越高，燃烧生成的水蒸气越多，修正幅度越大（如 CNG 的 H/C=4.0，
                    修正系数最大）。
                  </p>
                </div>

                <el-divider />

                <el-button
                  size="small"
                  class="copy-btn"
                  @click="copyResult(wetDryResultText)"
                >
                  <el-icon><CopyDocument /></el-icon> 复制结果
                </el-button>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- ==================== Tab 4: Carbon Balance ==================== -->
      <el-tab-pane label="碳平衡法 ★" name="carbon">
        <div class="tab-content">
          <div class="tab-intro">
            <p>
              基于碳平衡原理计算燃油消耗量。排气中的碳全部来自燃料，
              通过测量排气中 CO₂、CO、HC 的含碳量反推燃油消耗。
              <el-tag type="warning" size="small" style="margin-left: 8px">核心功能</el-tag>
            </p>
          </div>

          <el-row :gutter="24">
            <el-col :span="14">
              <el-card shadow="never" class="form-card">
                <template #header>
                  <span class="card-title">
                    <el-icon><Setting /></el-icon>
                    输入参数
                    <el-tag
                      size="small"
                      :type="carbon.mode === 'single' ? 'primary' : 'success'"
                      style="margin-left: 12px"
                    >
                      {{ carbon.mode === 'single' ? '单点模式' : '多点模式' }}
                    </el-tag>
                  </span>
                </template>

                <el-form
                  :model="carbon"
                  label-width="150px"
                  label-position="left"
                  size="default"
                >
                  <el-form-item label="计算模式">
                    <el-radio-group
                      v-model="carbon.mode"
                      @change="onCarbonModeChange"
                    >
                      <el-radio value="single">单点 (稳态)</el-radio>
                      <el-radio value="multi">多点 (瞬态循环)</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <!-- Single point mode -->
                  <template v-if="carbon.mode === 'single'">
                    <el-form-item label="CO₂ 浓度 (%)">
                      <el-input-number
                        v-model="carbon.co2"
                        :min="0"
                        :max="25"
                        :precision="2"
                        :step="0.1"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                    </el-form-item>
                    <el-form-item label="CO 浓度 (%)">
                      <el-input-number
                        v-model="carbon.co"
                        :min="0"
                        :max="10"
                        :precision="2"
                        :step="0.01"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                    </el-form-item>
                    <el-form-item label="HC 浓度 (ppm)">
                      <el-input-number
                        v-model="carbon.hc"
                        :min="0"
                        :max="50000"
                        :precision="1"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                    </el-form-item>
                    <el-form-item label="排气流量 (kg/h)">
                      <el-input-number
                        v-model="carbon.exhaustFlow"
                        :min="0"
                        :max="1e6"
                        :precision="2"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                    </el-form-item>
                    <el-form-item label="燃料密度 (kg/L)">
                      <el-input-number
                        v-model="carbon.fuelDensity"
                        :min="0.5"
                        :max="1"
                        :precision="3"
                        :step="0.005"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                    </el-form-item>
                    <el-form-item label="燃料含碳量 (质量分数)">
                      <el-input-number
                        v-model="carbon.carbonFraction"
                        :min="0.7"
                        :max="0.9"
                        :precision="4"
                        :step="0.005"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                      <div class="form-help">汽油 ≈ 0.855, 柴油 ≈ 0.865</div>
                    </el-form-item>
                  </template>

                  <!-- Multi point mode -->
                  <template v-else>
                    <el-alert
                      title="多点模式说明"
                      type="info"
                      :closable="false"
                      show-icon
                      style="margin-bottom: 16px"
                    >
                      <template #default>
                        <p>逐点输入瞬态循环中各工况点的排气数据，系统将自动累计总油耗。</p>
                      </template>
                    </el-alert>

                    <el-table
                      :data="carbon.multiPoints"
                      border
                      size="small"
                      max-height="300"
                      style="width: 100%; margin-bottom: 12px"
                    >
                      <el-table-column type="index" label="#" width="40" />
                      <el-table-column label="CO₂ (%)" width="80">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.co2"
                            size="small"
                            :min="0"
                            :max="25"
                            :precision="2"
                            controls-position="right"
                            style="width: 75px"
                            @change="recalcCarbon"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="CO (%)" width="70">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.co"
                            size="small"
                            :min="0"
                            :max="10"
                            :precision="2"
                            controls-position="right"
                            style="width: 65px"
                            @change="recalcCarbon"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="HC (ppm)" width="80">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.hc"
                            size="small"
                            :min="0"
                            :max="50000"
                            :precision="1"
                            controls-position="right"
                            style="width: 75px"
                            @change="recalcCarbon"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="排气流量" width="90">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.flow"
                            size="small"
                            :min="0"
                            :max="1e6"
                            :precision="1"
                            controls-position="right"
                            style="width: 85px"
                            @change="recalcCarbon"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="权重" width="70">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.weight"
                            size="small"
                            :min="0"
                            :max="1"
                            :precision="3"
                            :step="0.1"
                            controls-position="right"
                            style="width: 65px"
                            @change="recalcCarbon"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="50">
                        <template #default="{ $index }">
                          <el-button
                            text
                            type="danger"
                            size="small"
                            :disabled="carbon.multiPoints.length <= 1"
                            @click="removeCarbonPoint($index)"
                          >
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>

                    <el-button
                      size="small"
                      @click="addCarbonPoint"
                    >
                      <el-icon><Plus /></el-icon> 添加工况点
                    </el-button>

                    <el-divider />

                    <el-form-item label="燃料密度 (kg/L)">
                      <el-input-number
                        v-model="carbon.fuelDensity"
                        :min="0.5"
                        :max="1"
                        :precision="3"
                        :step="0.005"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                    </el-form-item>
                    <el-form-item label="燃料含碳量">
                      <el-input-number
                        v-model="carbon.carbonFraction"
                        :min="0.7"
                        :max="0.9"
                        :precision="4"
                        :step="0.005"
                        style="width: 100%"
                        @change="recalcCarbon"
                      />
                    </el-form-item>
                  </template>

                  <el-divider />

                  <el-form-item label=" ">
                    <div class="btn-group">
                      <el-button
                        type="primary"
                        size="small"
                        @click="resetCarbon"
                      >
                        重置
                      </el-button>
                      <el-button
                        size="small"
                        @click="setDefaultCarbon"
                      >
                        示例数据
                      </el-button>
                      <el-button
                        size="small"
                        type="success"
                        :disabled="!carbonResult.fc"
                        @click="saveCarbonResult"
                      >
                        <el-icon><FolderAdd /></el-icon> 保存结果
                      </el-button>
                    </div>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>

            <el-col :span="10">
              <el-card shadow="never" class="result-card">
                <template #header>
                  <span class="card-title">碳平衡计算结果</span>
                </template>

                <div class="result-grid">
                  <div class="result-item highlight-item">
                    <div class="ri-label">燃油消耗量 (FC)</div>
                    <div class="ri-value-lg">{{ carbonResult.fc }}</div>
                    <div class="ri-unit">{{ carbon.mode === 'multi' ? 'kg (累计)' : 'kg/h' }}</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">体积油耗</div>
                    <div class="ri-value">{{ carbonResult.fcVol }}</div>
                    <div class="ri-unit">{{ carbon.mode === 'multi' ? 'L (累计)' : 'L/h' }}</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">CO₂ 碳质量</div>
                    <div class="ri-value">{{ carbonResult.co2Carbon }}</div>
                    <div class="ri-unit">kg/h</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">CO 碳质量</div>
                    <div class="ri-value">{{ carbonResult.coCarbon }}</div>
                    <div class="ri-unit">kg/h</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">HC 碳质量</div>
                    <div class="ri-value">{{ carbonResult.hcCarbon }}</div>
                    <div class="ri-unit">kg/h</div>
                  </div>
                </div>

                <el-divider />

                <!-- Carbon recovery rate -->
                <div class="recovery-section">
                  <div class="recovery-header">
                    <span>碳回收率</span>
                    <el-tag
                      :type="carbonRecoveryStatus"
                      size="small"
                      effect="dark"
                    >
                      {{ carbonResult.recoveryRate }}
                    </el-tag>
                  </div>
                  <el-progress
                    :percentage="carbonResult.recoveryPercent"
                    :color="carbonRecoveryColor"
                    :stroke-width="16"
                    :format="() => carbonResult.recoveryRate"
                  />
                  <div class="recovery-tip">
                    正常范围: 96% ~ 104% | {{ carbonResult.recoveryStatus }}
                  </div>
                </div>

                <el-divider />

                <div class="formula-box">
                  <div class="formula-title">碳平衡公式</div>
                  <div class="formula">FC = (0.273 × CO₂ + 0.429 × CO + 0.866 × HC) × Q / ρ</div>
                  <div class="formula-note">
                    0.273 = 12/44 (CO₂中碳质量分数)<br />
                    0.429 = 12/28 (CO中碳质量分数)<br />
                    0.866 ≈ 12/13.85 (HC中碳质量分数, 假设H/C=1.85)
                  </div>
                </div>

                <el-divider />

                <div class="calc-steps">
                  <div class="steps-title">计算步骤</div>
                  <div
                    v-for="(step, idx) in carbonSteps"
                    :key="idx"
                    class="step-item"
                  >
                    <span class="step-num">{{ idx + 1 }}.</span>
                    <span class="step-text">{{ step }}</span>
                  </div>
                </div>

                <el-divider />

                <el-button
                  size="small"
                  class="copy-btn"
                  @click="copyResult(carbonResultText)"
                >
                  <el-icon><CopyDocument /></el-icon> 复制结果
                </el-button>
              </el-card>
            </el-col>
          </el-row>

          <!-- Saved results table -->
          <el-card
            v-if="carbonSavedResults.length > 0"
            shadow="never"
            class="saved-results-card"
            style="margin-top: 16px"
          >
            <template #header>
              <span class="card-title">已保存的计算结果</span>
            </template>
            <el-table :data="carbonSavedResults" border size="small" max-height="250">
              <el-table-column type="index" label="序号" width="50" />
              <el-table-column prop="timestamp" label="保存时间" width="160">
                <template #default="{ row }">
                  {{ formatTimestamp(row.timestamp) }}
                </template>
              </el-table-column>
              <el-table-column prop="mode" label="模式" width="80" />
              <el-table-column prop="fc" label="油耗 (kg/h)" width="120" />
              <el-table-column prop="fcVol" label="体积油耗 (L/h)" width="120" />
              <el-table-column prop="recoveryRate" label="碳回收率" width="110" />
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button
                    text
                    type="danger"
                    size="small"
                    @click="removeSavedCarbon($index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ==================== Tab 5: O2 Reference Correction ==================== -->
      <el-tab-pane label="氧含量基准修正" name="o2ref">
        <div class="tab-content">
          <div class="tab-intro">
            <p>
              将实测浓度修正到指定氧含量基准下的浓度值。不同排放标准/不同燃料类型有各自的氧含量基准值。
            </p>
          </div>

          <el-row :gutter="24">
            <el-col :span="14">
              <el-card shadow="never" class="form-card">
                <template #header>
                  <span class="card-title">输入参数</span>
                </template>
                <el-form
                  :model="o2Ref"
                  label-width="160px"
                  label-position="left"
                  size="default"
                >
                  <el-form-item label="实测浓度 (ppm)">
                    <el-input-number
                      v-model="o2Ref.measuredConcentration"
                      :min="0"
                      :max="1e6"
                      :precision="2"
                      style="width: 100%"
                      @change="recalcO2Ref"
                    />
                  </el-form-item>

                  <el-form-item label="实测 O₂ 浓度 (%)">
                    <el-input-number
                      v-model="o2Ref.measuredO2"
                      :min="0"
                      :max="21"
                      :precision="2"
                      :step="0.1"
                      style="width: 100%"
                      @change="recalcO2Ref"
                    />
                  </el-form-item>

                  <el-form-item label="基准氧含量选择">
                    <el-select
                      v-model="o2Ref.referencePreset"
                      style="width: 100%"
                      @change="onO2RefPresetChange"
                    >
                      <el-option label="柴油机 15% O₂" value="diesel" />
                      <el-option label="汽油机 13% O₂" value="gasoline" />
                      <el-option label="燃气轮机 3% O₂" value="gasTurbine" />
                      <el-option label="富氧燃烧 6% O₂" value="oxyfuel" />
                      <el-option label="无氧基准 0% O₂" value="oxygenFree" />
                      <el-option label="自定义" value="custom" />
                    </el-select>
                  </el-form-item>

                  <el-form-item v-if="o2Ref.referencePreset === 'custom'" label="自定义 O₂ ref (%)">
                    <el-input-number
                      v-model="o2Ref.customReferenceO2"
                      :min="0"
                      :max="21"
                      :precision="2"
                      :step="0.1"
                      style="width: 100%"
                      @change="recalcO2Ref"
                    />
                  </el-form-item>

                  <el-divider />

                  <el-form-item label=" ">
                    <el-button
                      type="primary"
                      size="small"
                      @click="resetO2Ref"
                    >
                      重置
                    </el-button>
                    <el-button
                      size="small"
                      style="margin-left: 8px"
                      @click="setDefaultO2Ref"
                    >
                      示例数据
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>

            <el-col :span="10">
              <el-card shadow="never" class="result-card">
                <template #header>
                  <span class="card-title">修正结果</span>
                </template>

                <div class="result-value-lg">
                  <div class="result-row">
                    <span class="result-label">修正后浓度</span>
                    <span class="result-number">{{ o2RefResult.corrected }}</span>
                  </div>
                  <div class="result-unit">ppm</div>
                </div>

                <el-divider />

                <div class="result-grid" style="grid-template-columns: 1fr 1fr">
                  <div class="result-item">
                    <div class="ri-label">实测值</div>
                    <div class="ri-value">{{ o2RefResult.measuredDisplay }} ppm</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">O₂ 参考值</div>
                    <div class="ri-value">{{ o2RefResult.referenceO2 }} %</div>
                  </div>
                  <div class="result-item">
                    <div class="ri-label">稀释/浓缩因子</div>
                    <div class="ri-value">{{ o2RefResult.factor }}</div>
                  </div>
                </div>

                <el-divider />

                <div class="formula-box">
                  <div class="formula-title">计算公式</div>
                  <div class="formula">C<sub>ref</sub> = C<sub>measured</sub></div>
                  <div class="formula">× (21 - O₂<sub>ref</sub>) / (21 - O₂<sub>measured</sub>)</div>
                </div>

                <el-divider />

                <div class="calc-steps">
                  <div class="steps-title">计算步骤</div>
                  <div
                    v-for="(step, idx) in o2RefSteps"
                    :key="idx"
                    class="step-item"
                  >
                    <span class="step-num">{{ idx + 1 }}.</span>
                    <span class="step-text">{{ step }}</span>
                  </div>
                </div>

                <el-divider />

                <el-button
                  size="small"
                  class="copy-btn"
                  @click="copyResult(o2RefResultText)"
                >
                  <el-icon><CopyDocument /></el-icon> 复制结果
                </el-button>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Footer status bar -->
    <div class="calc-footer">
      <span>排放计算器 v1.0 | Asiimov Theme</span>
      <span style="margin-left: auto">
        <el-icon><InfoFilled /></el-icon>
        所有计算结果仅供参考，请以实验室实测数据为准
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor,
  CopyDocument,
  Setting,
  Delete,
  Plus,
  FolderAdd,
  InfoFilled,
} from '@element-plus/icons-vue'
import type { TabsPaneContext } from 'element-plus'

// ================================================================
// Types
// ================================================================

interface Gas {
  label: string
  value: string
  molecularWeight: number
}

interface CarbonPoint {
  co2: number
  co: number
  hc: number
  flow: number
  weight: number
}

interface SavedCarbonResult {
  timestamp: number
  mode: string
  fc: string
  fcVol: string
  recoveryRate: string
  data: string
}

// ================================================================
// Molecular weight data
// ================================================================

const gases: Gas[] = [
  { label: 'CO₂', value: 'CO2', molecularWeight: 44.01 },
  { label: 'CO', value: 'CO', molecularWeight: 28.01 },
  { label: 'NO', value: 'NO', molecularWeight: 30.01 },
  { label: 'NO₂', value: 'NO2', molecularWeight: 46.01 },
  { label: 'SO₂', value: 'SO2', molecularWeight: 64.06 },
  { label: 'O₂', value: 'O2', molecularWeight: 32.00 },
  { label: 'CH₄', value: 'CH4', molecularWeight: 16.04 },
  { label: 'C₃H₈', value: 'C3H8', molecularWeight: 44.10 },
  { label: '空气 (Air)', value: 'air', molecularWeight: 28.97 },
]

const fuelPresets: Record<string, number> = {
  gasoline: 1.85,
  diesel: 1.86,
  lpg: 2.60,
  cng: 4.00,
  methanol: 4.00,
  ethanol: 3.00,
}

const o2Presets: Record<string, number> = {
  diesel: 15,
  gasoline: 13,
  gasTurbine: 3,
  oxyfuel: 6,
  oxygenFree: 0,
}

// ================================================================
// Reactive state
// ================================================================

const activeTab = ref('conversion')

// --- Tab 1: Conversion ---
const conversion = reactive({
  selectedGas: 'CO2',
  ppm: 100 as number | null,
  mgm3: null as number | null,
  temperature: 25,
  pressure: 101.325,
  lastChanged: 'ppm' as 'ppm' | 'mgm3',
})
const conversionSteps = ref<string[]>([])
const lastCalcIsPpm = ref(true)

// --- Tab 2: Specific Emission ---
const specific = reactive({
  component: 'CO₂',
  inputMode: 'massflow' as 'massflow' | 'concentration',
  massFlowRate: 5000 as number | null,
  concentration: 500 as number | null,
  exhaustFlow: 1000 as number | null,
  exhaustMolarMass: 28.97,
  enginePower: 100 as number | null,
  vehicleSpeed: null as number | null,
})
const specificSteps = ref<string[]>([])
const specificResult = reactive({
  bs: '--',
  rate: '--',
  factor: '--',
})

// --- Tab 3: Wet/Dry ---
const wetDry = reactive({
  wetConcentration: 1000 as number | null,
  hcRatio: 1.85,
  fuelType: 'gasoline',
  customHcRatio: 2.0,
})
const wetDryResult = reactive({
  dryConcentration: '--',
  wetDisplay: '--',
  kw: '--',
})

// --- Tab 4: Carbon Balance ---
const carbon = reactive({
  mode: 'single' as 'single' | 'multi',
  co2: 10.5 as number | null,
  co: 0.5 as number | null,
  hc: 200 as number | null,
  exhaustFlow: 500 as number | null,
  fuelDensity: 0.835,
  carbonFraction: 0.855,
  multiPoints: [] as CarbonPoint[],
})
const carbonSteps = ref<string[]>([])
const carbonResult = reactive({
  fc: '--',
  fcVol: '--',
  co2Carbon: '--',
  coCarbon: '--',
  hcCarbon: '--',
  recoveryRate: '--',
  recoveryPercent: 0,
  recoveryStatus: '--',
})
const carbonSavedResults = ref<SavedCarbonResult[]>([])

// --- Tab 5: O2 Reference ---
const o2Ref = reactive({
  measuredConcentration: 500 as number | null,
  measuredO2: 15 as number | null,
  referencePreset: 'diesel',
  customReferenceO2: 10,
})
const o2RefSteps = ref<string[]>([])
const o2RefResult = reactive({
  corrected: '--',
  measuredDisplay: '--',
  referenceO2: '--',
  factor: '--',
})

// ================================================================
// Computed
// ================================================================

const selectedGasObj = computed(() => {
  return gases.find((g) => g.value === conversion.selectedGas) || gases[0]
})

const conversionResultText = computed(() => {
  return `气体: ${selectedGasObj.value.label}\n` +
    `ppm: ${conversion.ppm ?? '--'}\n` +
    `mg/m³: ${conversion.mgm3 ?? '--'}\n` +
    `温度: ${conversion.temperature}°C\n` +
    `压力: ${conversion.pressure} kPa`
})

const specificResultText = computed(() => {
  return `组分: ${specific.component}\n` +
    `BS${specific.component}: ${specificResult.bs} g/kWh\n` +
    `排放率: ${specificResult.rate} g/s\n` +
    (specific.vehicleSpeed ? `排放因子: ${specificResult.factor} g/km\n` : '')
})

const wetDryResultText = computed(() => {
  return `湿基浓度: ${wetDryResult.wetDisplay} ppm\n` +
    `干基浓度: ${wetDryResult.dryConcentration} ppm\n` +
    `修正系数 Kw: ${wetDryResult.kw}\n` +
    `H/C 比: ${wetDry.hcRatio}`
})

const carbonResultText = computed(() => {
  return `燃油消耗量 FC: ${carbonResult.fc} ${carbon.mode === 'multi' ? 'kg' : 'kg/h'}\n` +
    `体积油耗: ${carbonResult.fcVol} ${carbon.mode === 'multi' ? 'L' : 'L/h'}\n` +
    `碳回收率: ${carbonResult.recoveryRate}\n` +
    `CO₂含碳量: ${carbonResult.co2Carbon} kg/h\n` +
    `CO含碳量: ${carbonResult.coCarbon} kg/h\n` +
    `HC含碳量: ${carbonResult.hcCarbon} kg/h`
})

const o2RefResultText = computed(() => {
  return `实测浓度: ${o2RefResult.measuredDisplay} ppm\n` +
    `实测 O₂: ${o2Ref.measuredO2}%\n` +
    `基准 O₂: ${o2RefResult.referenceO2}%\n` +
    `修正后浓度: ${o2RefResult.corrected} ppm\n` +
    `修正因子: ${o2RefResult.factor}`
})

// For template access of formatted values
const formattedMgm3 = computed(() => {
  return conversion.mgm3 !== null ? conversion.mgm3.toFixed(4) : '--'
})

const formattedPpm = computed(() => {
  return conversion.ppm !== null ? conversion.ppm.toFixed(2) : '--'
})

const carbonRecoveryStatus = computed(() => {
  const pct = carbonResult.recoveryPercent
  if (pct >= 96 && pct <= 104) return 'success'
  if (pct >= 90 && pct <= 110) return 'warning'
  return 'danger'
})

const carbonRecoveryColor = computed(() => {
  const pct = carbonResult.recoveryPercent
  if (pct >= 96 && pct <= 104) return '#67C23A'
  if (pct >= 90 && pct <= 110) return '#E6A23C'
  return '#F56C6C'
})

// ================================================================
// Tab 1: Concentration Conversion
// ================================================================

function onPpmChange(val: number | null) {
  if (val === null || val < 0) return
  conversion.lastChanged = 'ppm'
  recalcConversion()
}

function onMgm3Change(val: number | null) {
  if (val === null || val < 0) return
  conversion.lastChanged = 'mgm3'
  recalcConversion()
}

function recalcConversion() {
  const gas = selectedGasObj.value
  const T = conversion.temperature
  const P = conversion.pressure
  const steps: string[] = []

  if (conversion.lastChanged === 'ppm' && conversion.ppm !== null && conversion.ppm >= 0) {
    // ppm -> mg/m³
    const ppm = conversion.ppm
    const std = (ppm * gas.molecularWeight) / 22.4
    const tempCorr = 273.15 / (273.15 + T)
    const pressCorr = P / 101.325
    const mgm3 = std * tempCorr * pressCorr

    conversion.mgm3 = parseFloat(mgm3.toFixed(4))
    lastCalcIsPpm.value = true

    steps.push(`选择气体: ${gas.label}, 摩尔质量 M = ${gas.molecularWeight} g/mol`)
    steps.push(`标准状态浓度 = ${ppm} × ${gas.molecularWeight} / 22.4 = ${std.toFixed(4)} mg/m³`)
    steps.push(`温度修正系数 = 273.15 / (273.15 + ${T}) = ${tempCorr.toFixed(6)}`)
    steps.push(`压力修正系数 = ${P} / 101.325 = ${pressCorr.toFixed(6)}`)
    steps.push(`最终结果 = ${std.toFixed(4)} × ${tempCorr.toFixed(6)} × ${pressCorr.toFixed(6)} = ${mgm3.toFixed(4)} mg/m³`)
  } else if (conversion.mgm3 !== null && conversion.mgm3 >= 0) {
    // mg/m³ -> ppm
    const mgm3 = conversion.mgm3
    const tempCorr = 273.15 / (273.15 + T)
    const pressCorr = P / 101.325
    const std = mgm3 / tempCorr / pressCorr
    const ppm = std * 22.4 / gas.molecularWeight

    conversion.ppm = parseFloat(ppm.toFixed(2))
    lastCalcIsPpm.value = false

    steps.push(`选择气体: ${gas.label}, 摩尔质量 M = ${gas.molecularWeight} g/mol`)
    steps.push(`温度修正系数 = 273.15 / (273.15 + ${T}) = ${tempCorr.toFixed(6)}`)
    steps.push(`压力修正系数 = ${P} / 101.325 = ${pressCorr.toFixed(6)}`)
    steps.push(`标准状态浓度 = ${mgm3} / ${tempCorr.toFixed(6)} / ${pressCorr.toFixed(6)} = ${std.toFixed(4)} mg/m³`)
    steps.push(`最终结果 = ${std.toFixed(4)} × 22.4 / ${gas.molecularWeight} = ${ppm.toFixed(2)} ppm`)
  } else {
    conversion.mgm3 = null
    conversion.ppm = null
    steps.push('请输入有效的浓度值')
  }

  conversionSteps.value = steps
}

function resetConversion() {
  conversion.selectedGas = 'CO2'
  conversion.ppm = 100
  conversion.mgm3 = null
  conversion.temperature = 25
  conversion.pressure = 101.325
  conversion.lastChanged = 'ppm'
  conversionSteps.value = []
  recalcConversion()
}

function setDefaultConversion() {
  conversion.selectedGas = 'CO2'
  conversion.ppm = 100
  conversion.temperature = 25
  conversion.pressure = 101.325
  conversion.lastChanged = 'ppm'
  recalcConversion()
}

// ================================================================
// Tab 2: Specific Emission
// ================================================================

function recalcSpecific() {
  const steps: string[] = []
  let massFlowGperH = 0

  if (specific.inputMode === 'massflow') {
    if (specific.massFlowRate === null || specific.massFlowRate < 0) {
      resetSpecificResult()
      specificSteps.value = ['请输入有效的质量流量']
      return
    }
    massFlowGperH = specific.massFlowRate
    steps.push(`质量流量输入: ${massFlowGperH} g/h`)
  } else {
    if (
      specific.concentration === null ||
      specific.exhaustFlow === null ||
      specific.concentration < 0 ||
      specific.exhaustFlow < 0
    ) {
      resetSpecificResult()
      specificSteps.value = ['请填写浓度和排气流量']
      return
    }
    // Convert concentration (ppm) and exhaust flow (kg/h) to mass flow (g/h)
    // mass_flow(g/h) = conc(ppm) / 1e6 * exhaustFlow(kg/h) * 1000 * (M_gas / M_exhaust)
    const M_gas = getComponentMolarMass(specific.component)
    const M_exh = specific.exhaustMolarMass
    const conc_frac = specific.concentration / 1_000_000
    massFlowGperH = conc_frac * specific.exhaustFlow * 1000 * (M_gas / M_exh)
    steps.push(`浓度输入: ${specific.concentration} ppm = ${conc_frac.toExponential(4)} 体积分数`)
    steps.push(`组分摩尔质量: ${M_gas} g/mol, 排气摩尔质量: ${M_exh} g/mol`)
    steps.push(`质量流量 = ${conc_frac.toExponential(4)} × ${specific.exhaustFlow} × 1000 × ${(M_gas / M_exh).toFixed(4)} = ${massFlowGperH.toFixed(2)} g/h`)
  }

  if (specific.enginePower === null || specific.enginePower <= 0) {
    resetSpecificResult()
    specificSteps.value = ['请输入有效的发动机功率']
    return
  }

  const power = specific.enginePower
  const bs = massFlowGperH / power
  const rate = bs * power / 3600

  steps.push(`发动机功率: ${power} kW`)
  steps.push(`BS${specific.component} = ${massFlowGperH.toFixed(2)} g/h / ${power} kW = ${bs.toFixed(4)} g/kWh`)
  steps.push(`排放率 = ${bs.toFixed(4)} × ${power} / 3600 = ${rate.toFixed(4)} g/s`)

  specificResult.bs = bs.toFixed(4)
  specificResult.rate = rate.toFixed(4)

  if (specific.vehicleSpeed && specific.vehicleSpeed > 0) {
    const speed = specific.vehicleSpeed
    const factor = rate * 3.6 / speed
    specificResult.factor = factor.toFixed(4)
    steps.push(`排放因子 = ${rate.toFixed(4)} × 3.6 / ${speed} = ${factor.toFixed(4)} g/km`)
  } else {
    specificResult.factor = '--'
  }

  specificSteps.value = steps
}

function getComponentMolarMass(comp: string): number {
  const map: Record<string, number> = {
    'CO₂': 44.01,
    'CO': 28.01,
    'NOx': 30.01, // approximate as NO
    'HC': 13.85,  // approximate as CH1.85
    'Fuel': 170,  // approximate for diesel-like fuel
  }
  return map[comp] || 28.97
}

function resetSpecificResult() {
  specificResult.bs = '--'
  specificResult.rate = '--'
  specificResult.factor = '--'
}

function resetSpecific() {
  specific.component = 'CO₂'
  specific.inputMode = 'massflow'
  specific.massFlowRate = 5000
  specific.concentration = 500
  specific.exhaustFlow = 1000
  specific.exhaustMolarMass = 28.97
  specific.enginePower = 100
  specific.vehicleSpeed = null
  resetSpecificResult()
  specificSteps.value = []
  recalcSpecific()
}

function setDefaultSpecific() {
  specific.component = 'CO₂'
  specific.inputMode = 'massflow'
  specific.massFlowRate = 5000
  specific.enginePower = 100
  specific.vehicleSpeed = 60
  recalcSpecific()
}

// ================================================================
// Tab 3: Wet/Dry Correction
// ================================================================

function onFuelTypeChange(val: string) {
  if (val !== 'custom' && fuelPresets[val] !== undefined) {
    wetDry.hcRatio = fuelPresets[val]
  }
  recalcWetDry()
}

function recalcWetDry() {
  const hc = wetDry.fuelType === 'custom' ? wetDry.customHcRatio : wetDry.hcRatio
  wetDry.hcRatio = hc

  const kw = 1.88 * 0.05 * hc

  wetDryResult.kw = kw.toFixed(6)

  if (wetDry.wetConcentration !== null && wetDry.wetConcentration >= 0) {
    const dry = wetDry.wetConcentration * (1 + kw)
    wetDryResult.dryConcentration = dry.toFixed(4)
    wetDryResult.wetDisplay = wetDry.wetConcentration.toFixed(2)
  } else {
    wetDryResult.dryConcentration = '--'
    wetDryResult.wetDisplay = '--'
  }
}

function resetWetDry() {
  wetDry.wetConcentration = 1000
  wetDry.hcRatio = 1.85
  wetDry.fuelType = 'gasoline'
  wetDry.customHcRatio = 2.0
  recalcWetDry()
}

function setDefaultWetDry() {
  wetDry.wetConcentration = 1000
  wetDry.fuelType = 'diesel'
  wetDry.hcRatio = 1.86
  recalcWetDry()
}

// ================================================================
// Tab 4: Carbon Balance
// ================================================================

function onCarbonModeChange(val: 'single' | 'multi') {
  if (val === 'multi' && carbon.multiPoints.length === 0) {
    // Initialize with 3 default points
    carbon.multiPoints = [
      { co2: 10.5, co: 0.5, hc: 200, flow: 500, weight: 0.3 },
      { co2: 8.0, co: 0.3, hc: 150, flow: 450, weight: 0.4 },
      { co2: 6.0, co: 0.1, hc: 100, flow: 400, weight: 0.3 },
    ]
  }
  recalcCarbon()
}

function addCarbonPoint() {
  carbon.multiPoints.push({
    co2: 0,
    co: 0,
    hc: 0,
    flow: 0,
    weight: 0.1,
  })
}

function removeCarbonPoint(index: number) {
  if (carbon.multiPoints.length > 1) {
    carbon.multiPoints.splice(index, 1)
    recalcCarbon()
  }
}

function recalcCarbon() {
  const steps: string[] = []

  if (carbon.mode === 'single') {
    calcCarbonSingle(steps)
  } else {
    calcCarbonMulti(steps)
  }

  carbonSteps.value = steps
}

function calcCarbonSingle(steps: string[]) {
  if (
    carbon.co2 === null || carbon.co === null || carbon.hc === null ||
    carbon.exhaustFlow === null || carbon.exhaustFlow <= 0 ||
    carbon.fuelDensity <= 0 || carbon.carbonFraction <= 0
  ) {
    resetCarbonResult()
    steps.push('请填写所有必填参数')
    return
  }

  const co2 = carbon.co2
  const co = carbon.co
  const hc = carbon.hc
  const Q = carbon.exhaustFlow
  const rho = carbon.fuelDensity
  const cf = carbon.carbonFraction

  // Carbon mass flow rates (kg/h)
  // CO₂: 12/44 = 0.2727, CO: 12/28 = 0.4286, HC: 12/13.85 ≈ 0.8664 (assuming HC ratio ~ CH1.85)
  const kCO2 = 12 / 44.01
  const kCO = 12 / 28.01
  const kHC = 12 / 13.85

  // concentration in % to fraction, ppm to fraction
  // CO₂ and CO are in %, HC is in ppm
  // For exhaust flow in kg/h:
  // Carbon mass from CO₂ (kg/h) = CO₂(%) / 100 * exhaust(kg/h) * kCO2
  // But the standard formula: FC = (0.273*CO₂ + 0.429*CO + 0.866*HC) * Q / ρ
  // where 0.273 = 12/44 ≈ 0.2727
  // This formula assumes CO₂, CO in %, HC in ppm (converted to % internally)
  // and Q in kg/h and ρ in kg/L, giving FC in kg/h

  const co2Mass = kCO2 * co2 * Q / 100
  const coMass = kCO * co * Q / 100
  const hcMass = kHC * (hc / 10000) * Q / 100

  const totalCarbonMass = co2Mass + coMass + hcMass

  // Fuel consumption: FC = Total Carbon Mass / Carbon Fraction
  const fc = totalCarbonMass / cf
  const fcVol = fc / rho

  // Carbon recovery rate
  // Carbon in fuel: fc * cf
  // Carbon in exhaust: totalCarbonMass
  const recoveryPct = fc > 0 ? (totalCarbonMass / (fc * cf)) * 100 : 0

  carbonResult.co2Carbon = co2Mass.toFixed(4)
  carbonResult.coCarbon = coMass.toFixed(6)
  carbonResult.hcCarbon = hcMass.toFixed(6)
  carbonResult.fc = fc.toFixed(4)
  carbonResult.fcVol = fcVol.toFixed(4)
  carbonResult.recoveryPercent = parseFloat(recoveryPct.toFixed(2))
  carbonResult.recoveryRate = recoveryPct.toFixed(2) + '%'
  carbonResult.recoveryStatus = getRecoveryStatus(recoveryPct)

  steps.push(`CO₂含碳系数: 12/44.01 = ${kCO2.toFixed(4)}`)
  steps.push(`CO₂碳质量 = ${kCO2.toFixed(4)} × ${co2}% × ${Q} kg/h / 100 = ${co2Mass.toFixed(4)} kg/h`)
  steps.push(`CO含碳系数: 12/28.01 = ${kCO.toFixed(4)}`)
  steps.push(`CO碳质量 = ${kCO.toFixed(4)} × ${co}% × ${Q} kg/h / 100 = ${coMass.toFixed(6)} kg/h`)
  steps.push(`HC含碳系数: 12/13.85 = ${kHC.toFixed(4)}`)
  steps.push(`HC碳质量 = ${kHC.toFixed(4)} × ${hc}ppm × ${Q} kg/h / 1e6 = ${hcMass.toFixed(6)} kg/h`)
  steps.push(`总碳质量 = ${co2Mass.toFixed(4)} + ${coMass.toFixed(6)} + ${hcMass.toFixed(6)} = ${totalCarbonMass.toFixed(4)} kg/h`)
  steps.push(`燃油消耗 FC = ${totalCarbonMass.toFixed(4)} / ${cf} = ${fc.toFixed(4)} kg/h`)
  steps.push(`体积油耗 = ${fc.toFixed(4)} / ${rho} = ${fcVol.toFixed(4)} L/h`)
  steps.push(`碳平衡校验: 碳回收率 = ${recoveryPct.toFixed(2)}% ${carbonResult.recoveryStatus}`)
}

function calcCarbonMulti(steps: string[]) {
  if (carbon.multiPoints.length === 0) {
    resetCarbonResult()
    steps.push('请添加至少一个工况点')
    return
  }

  const rho = carbon.fuelDensity
  const cf = carbon.carbonFraction

  const kCO2 = 12 / 44.01
  const kCO = 12 / 28.01
  const kHC = 12 / 13.85

  let totalCO2Carbon = 0
  let totalCOCarbon = 0
  let totalHCCarbon = 0
  let totalWeight = 0

  steps.push(`多点碳平衡计算 (${carbon.multiPoints.length} 个工况点):`)

  for (let i = 0; i < carbon.multiPoints.length; i++) {
    const pt = carbon.multiPoints[i]
    const co2MassPt = kCO2 * (pt.co2 / 100) * pt.flow
    const coMassPt = kCO * (pt.co / 100) * pt.flow
    const hcMassPt = kHC * (pt.hc / 1_000_000) * pt.flow

    totalCO2Carbon += co2MassPt * pt.weight
    totalCOCarbon += coMassPt * pt.weight
    totalHCCarbon += hcMassPt * pt.weight
    totalWeight += pt.weight

    steps.push(`  点${i + 1}: CO₂碳=${co2MassPt.toFixed(4)}×${pt.weight}, CO碳=${coMassPt.toFixed(6)}×${pt.weight}, HC碳=${hcMassPt.toFixed(6)}×${pt.weight}`)
  }

  if (totalWeight > 0) {
    totalCO2Carbon /= totalWeight
    totalCOCarbon /= totalWeight
    totalHCCarbon /= totalWeight
  }

  const totalCarbonMass = totalCO2Carbon + totalCOCarbon + totalHCCarbon
  const fc = totalCarbonMass / cf
  const fcVol = fc / rho

  const recoveryPct = fc > 0 ? (totalCarbonMass / (fc * cf)) * 100 : 0

  carbonResult.co2Carbon = (totalCO2Carbon * (carbon.multiPoints.length > 1 ? 1 : 0)).toFixed(4)
  carbonResult.coCarbon = (totalCOCarbon * (carbon.multiPoints.length > 1 ? 1 : 0)).toFixed(6)
  carbonResult.hcCarbon = (totalHCCarbon * (carbon.multiPoints.length > 1 ? 1 : 0)).toFixed(6)
  carbonResult.fc = fc.toFixed(4)
  carbonResult.fcVol = fcVol.toFixed(4)
  carbonResult.recoveryPercent = parseFloat(recoveryPct.toFixed(2))
  carbonResult.recoveryRate = recoveryPct.toFixed(2) + '%'
  carbonResult.recoveryStatus = getRecoveryStatus(recoveryPct)

  steps.push(`加权平均总碳质量 = ${totalCarbonMass.toFixed(4)} kg`)
  steps.push(`累计燃油消耗 FC = ${totalCarbonMass.toFixed(4)} / ${cf} = ${fc.toFixed(4)} kg`)
  steps.push(`累计体积油耗 = ${fc.toFixed(4)} / ${rho} = ${fcVol.toFixed(4)} L`)
  steps.push(`碳平衡校验: 碳回收率 = ${recoveryPct.toFixed(2)}% ${carbonResult.recoveryStatus}`)
}

function getRecoveryStatus(pct: number): string {
  if (pct >= 96 && pct <= 104) return '(正常范围)'
  if (pct >= 90 && pct <= 110) return '(注意: 偏离正常范围)'
  return '(异常: 请检查输入数据)'
}

function resetCarbonResult() {
  carbonResult.fc = '--'
  carbonResult.fcVol = '--'
  carbonResult.co2Carbon = '--'
  carbonResult.coCarbon = '--'
  carbonResult.hcCarbon = '--'
  carbonResult.recoveryRate = '--'
  carbonResult.recoveryPercent = 0
  carbonResult.recoveryStatus = '--'
}

function resetCarbon() {
  carbon.mode = 'single'
  carbon.co2 = 10.5
  carbon.co = 0.5
  carbon.hc = 200
  carbon.exhaustFlow = 500
  carbon.fuelDensity = 0.835
  carbon.carbonFraction = 0.855
  carbon.multiPoints = []
  resetCarbonResult()
  carbonSteps.value = []
  recalcCarbon()
}

function setDefaultCarbon() {
  carbon.mode = 'single'
  carbon.co2 = 10.5
  carbon.co = 0.5
  carbon.hc = 200
  carbon.exhaustFlow = 500
  carbon.fuelDensity = 0.835
  carbon.carbonFraction = 0.855
  recalcCarbon()
}

function saveCarbonResult() {
  if (carbonResult.fc === '--') {
    ElMessage.warning('没有可保存的计算结果')
    return
  }

  const entry: SavedCarbonResult = {
    timestamp: Date.now(),
    mode: carbon.mode === 'single' ? '单点' : '多点',
    fc: `${carbonResult.fc} ${carbon.mode === 'multi' ? 'kg' : 'kg/h'}`,
    fcVol: `${carbonResult.fcVol} ${carbon.mode === 'multi' ? 'L' : 'L/h'}`,
    recoveryRate: carbonResult.recoveryRate,
    data: carbonResultText.value,
  }

  carbonSavedResults.value.push(entry)
  ElMessage.success('结果已保存')
}

function removeSavedCarbon(index: number) {
  carbonSavedResults.value.splice(index, 1)
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ================================================================
// Tab 5: O2 Reference Correction
// ================================================================

function onO2RefPresetChange(val: string) {
  if (val !== 'custom' && o2Presets[val] !== undefined) {
    o2Ref.customReferenceO2 = o2Presets[val]
  }
  recalcO2Ref()
}

function recalcO2Ref() {
  const steps: string[] = []

  const refO2 =
    o2Ref.referencePreset === 'custom'
      ? o2Ref.customReferenceO2
      : o2Presets[o2Ref.referencePreset] ?? 15

  o2RefResult.referenceO2 = refO2.toFixed(1)

  if (
    o2Ref.measuredConcentration === null ||
    o2Ref.measuredO2 === null ||
    o2Ref.measuredConcentration < 0 ||
    o2Ref.measuredO2 < 0 ||
    o2Ref.measuredO2 >= 21
  ) {
    o2RefResult.corrected = '--'
    o2RefResult.measuredDisplay = '--'
    o2RefResult.factor = '--'
    steps.push('请输入有效的实测浓度和 O₂ 浓度 (0 ≤ O₂ < 21)')
    o2RefSteps.value = steps
    return
  }

  const Cm = o2Ref.measuredConcentration
  const O2m = o2Ref.measuredO2

  // Factor calculation
  const numerator = 21 - refO2
  const denominator = 21 - O2m

  if (denominator <= 0) {
    o2RefResult.corrected = '--'
    o2RefResult.factor = '--'
    steps.push('错误: 21 - O₂_measured ≤ 0, 无法计算')
    o2RefSteps.value = steps
    return
  }

  const factor = numerator / denominator
  const corrected = Cm * factor

  o2RefResult.measuredDisplay = Cm.toFixed(2)
  o2RefResult.factor = factor.toFixed(6)
  o2RefResult.corrected = corrected.toFixed(4)

  steps.push(`实测浓度 Cm = ${Cm} ppm`)
  steps.push(`实测 O₂ = ${O2m}%`)
  steps.push(`基准 O₂ 参考值 = ${refO2}%`)
  steps.push(`修正因子 = (21 - ${refO2}) / (21 - ${O2m}) = ${numerator} / ${denominator} = ${factor.toFixed(6)}`)
  steps.push(`修正后浓度 = ${Cm} × ${factor.toFixed(6)} = ${corrected.toFixed(4)} ppm`)

  // Interpretation
  if (refO2 < O2m) {
    steps.push(`注: O₂基准(${refO2}%) < 实测O₂(${O2m}%), 修正后浓度降低 (稀释)`)
  } else if (refO2 > O2m) {
    steps.push(`注: O₂基准(${refO2}%) > 实测O₂(${O2m}%), 修正后浓度升高 (浓缩)`)
  } else {
    steps.push('注: O₂基准 = 实测O₂, 无需修正')
  }

  o2RefSteps.value = steps
}

function resetO2Ref() {
  o2Ref.measuredConcentration = 500
  o2Ref.measuredO2 = 15
  o2Ref.referencePreset = 'diesel'
  o2Ref.customReferenceO2 = 10
  o2RefSteps.value = []
  recalcO2Ref()
}

function setDefaultO2Ref() {
  o2Ref.measuredConcentration = 500
  o2Ref.measuredO2 = 13
  o2Ref.referencePreset = 'gasoline'
  o2Ref.customReferenceO2 = 13
  recalcO2Ref()
}

// ================================================================
// Shared utilities
// ================================================================

async function copyResult(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

function handleTabClick(tab: TabsPaneContext) {
  // Trigger recalculation when switching tabs to ensure results are fresh
  switch (tab.paneName) {
    case 'conversion':
      recalcConversion()
      break
    case 'specific':
      recalcSpecific()
      break
    case 'wetdry':
      recalcWetDry()
      break
    case 'carbon':
      recalcCarbon()
      break
    case 'o2ref':
      recalcO2Ref()
      break
  }
}

// ================================================================
// Initial calculations
// ================================================================

// Run initial calculations on mount
recalcConversion()
</script>

<style scoped>
/* ================================================================
   Asiimov Theme – Emission Calculator
   White:  #F5F5F0  |  Orange:  #FF8800  |  Black:  #1A1A1A
   ================================================================ */

.emission-calculator {
  background: #1A1A1A;
  color: #F5F5F0;
  min-height: 100%;
  padding: 0;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* ---- Header ---- */
.calc-header {
  background: linear-gradient(135deg, #1A1A1A 0%, #2a2a2a 100%);
  padding: 20px 24px 12px;
  border-bottom: 2px solid #FF8800;
  display: flex;
  align-items: center;
  gap: 16px;
}

.calc-title {
  font-size: 22px;
  font-weight: 700;
  color: #FF8800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 24px;
}

.calc-subtitle {
  color: #888;
  font-size: 13px;
  font-style: italic;
  margin-top: 4px;
}

/* ---- Tabs ---- */
.calc-tabs {
  margin: 0;
  padding: 12px 16px;
  background: #1A1A1A;
}

.calc-tabs :deep(.el-tabs__header) {
  margin: 0 0 12px 0;
  border-bottom: none;
}

.calc-tabs :deep(.el-tabs__nav) {
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
}

.calc-tabs :deep(.el-tabs__item) {
  background: #222;
  color: #999;
  border-right: 1px solid #333;
  font-size: 13px;
  font-weight: 600;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  transition: all 0.2s;
}

.calc-tabs :deep(.el-tabs__item:last-child) {
  border-right: none;
}

.calc-tabs :deep(.el-tabs__item:hover) {
  color: #FF8800;
  background: #2a2a2a;
}

.calc-tabs :deep(.el-tabs__item.is-active) {
  background: #FF8800;
  color: #1A1A1A;
  font-weight: 700;
}

.calc-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.calc-tabs :deep(.el-tabs__content) {
  padding: 0;
}

/* ---- Tab Content ---- */
.tab-content {
  padding: 4px 0;
}

.tab-intro {
  background: #222;
  border: 1px solid #333;
  border-left: 3px solid #FF8800;
  border-radius: 4px;
  padding: 10px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #ccc;
  line-height: 1.6;
}

.tab-intro p {
  margin: 0;
}

/* ---- Cards ---- */
.form-card,
.result-card,
.saved-results-card {
  background: #222 !important;
  border: 1px solid #333 !important;
  border-radius: 6px;
  color: #F5F5F0;
}

.saved-results-card :deep(.el-card__header) {
  border-bottom: 1px solid #333;
  background: #1e1e1e;
}

.form-card :deep(.el-card__header),
.result-card :deep(.el-card__header) {
  border-bottom: 1px solid #333;
  background: #1e1e1e;
  padding: 10px 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #FF8800;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-card :deep(.el-card__body),
.result-card :deep(.el-card__body) {
  padding: 16px;
}

/* ---- Form adjustments ---- */
.form-card :deep(.el-form-item__label) {
  color: #ccc !important;
  font-size: 13px;
  font-weight: 500;
}

.form-card :deep(.el-input-number) {
  width: 100%;
}

.form-card :deep(.el-input__wrapper) {
  background: #1A1A1A !important;
  border: 1px solid #444 !important;
  box-shadow: none !important;
  border-radius: 4px;
}

.form-card :deep(.el-input__wrapper:hover) {
  border-color: #FF8800 !important;
}

.form-card :deep(.el-input__wrapper.is-focus) {
  border-color: #FF8800 !important;
  box-shadow: 0 0 0 1px #FF8800 !important;
}

.form-card :deep(.el-input__inner) {
  color: #F5F5F0 !important;
  background: transparent !important;
}

.form-card :deep(.el-input-number__increase),
.form-card :deep(.el-input-number__decrease) {
  background: #2a2a2a !important;
  color: #999 !important;
  border-left: 1px solid #444 !important;
}

.form-card :deep(.el-input-number__increase:hover),
.form-card :deep(.el-input-number__decrease:hover) {
  color: #FF8800 !important;
  background: #333 !important;
}

.form-card :deep(.el-select .el-input__wrapper) {
  background: #1A1A1A !important;
}

.form-card :deep(.el-select-dropdown) {
  background: #222 !important;
  border: 1px solid #444 !important;
}

.form-card :deep(.el-select-dropdown__item) {
  color: #ccc !important;
}

.form-card :deep(.el-select-dropdown__item.hover) {
  background: #333 !important;
  color: #FF8800 !important;
}

.form-card :deep(.el-select-dropdown__item.selected) {
  color: #FF8800 !important;
  font-weight: 700;
}

.form-card :deep(.el-divider) {
  border-top: 1px solid #333;
  margin: 16px 0;
}

.form-card :deep(.el-radio) {
  color: #ccc !important;
  margin-right: 16px;
}

.form-card :deep(.el-radio__label) {
  color: #ccc !important;
  font-size: 13px;
}

.form-card :deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: #FF8800;
  background: #FF8800;
}

.form-card :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #FF8800 !important;
}

.form-help {
  font-size: 11px;
  color: #777;
  margin-top: 2px;
  line-height: 1.3;
}

/* ---- Buttons ---- */
.btn-group {
  display: flex;
  gap: 8px;
}

.form-card :deep(.el-button--primary) {
  background: #FF8800;
  border-color: #FF8800;
  color: #1A1A1A;
  font-weight: 600;
}

.form-card :deep(.el-button--primary:hover) {
  background: #e67a00;
  border-color: #e67a00;
}

.form-card :deep(.el-button--default) {
  background: #333;
  border-color: #444;
  color: #ccc;
}

.form-card :deep(.el-button--default:hover) {
  background: #444;
  border-color: #FF8800;
  color: #FF8800;
}

.copy-btn {
  width: 100%;
  background: #333 !important;
  border: 1px solid #444 !important;
  color: #ccc !important;
}

.copy-btn:hover {
  background: #FF8800 !important;
  border-color: #FF8800 !important;
  color: #1A1A1A !important;
}

/* ---- Results ---- */
.result-value-lg {
  text-align: center;
  padding: 12px 0;
}

.result-row {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 8px;
}

.result-label {
  font-size: 13px;
  color: #888;
}

.result-number {
  font-size: 28px;
  font-weight: 800;
  color: #FF8800;
  font-family: 'Consolas', 'Courier New', monospace;
}

.result-unit {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-item {
  background: #1A1A1A;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 10px 12px;
  text-align: center;
}

.result-item .ri-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.result-item .ri-value {
  font-size: 18px;
  font-weight: 700;
  color: #F5F5F0;
  font-family: 'Consolas', 'Courier New', monospace;
}

.result-item .ri-value-lg {
  font-size: 26px;
  font-weight: 800;
  color: #FF8800;
  font-family: 'Consolas', 'Courier New', monospace;
}

.result-item .ri-unit {
  font-size: 11px;
  color: #666;
}

.highlight-item {
  grid-column: 1 / -1;
  border-color: #FF8800;
  background: #1f1a10;
}

/* ---- Formula Box ---- */
.formula-box {
  background: #1A1A1A;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 12px;
}

.formula-title {
  font-size: 12px;
  font-weight: 700;
  color: #FF8800;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.formula {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  color: #ddd;
  line-height: 1.7;
}

.formula-note {
  font-size: 11px;
  color: #777;
  line-height: 1.6;
  margin-top: 6px;
}

/* ---- Calculation Steps ---- */
.calc-steps {
  max-height: 200px;
  overflow-y: auto;
}

.steps-title {
  font-size: 12px;
  font-weight: 700;
  color: #FF8800;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.step-item {
  display: flex;
  gap: 6px;
  padding: 3px 0;
  font-size: 12px;
  line-height: 1.5;
  color: #bbb;
}

.step-num {
  color: #FF8800;
  font-weight: 700;
  flex-shrink: 0;
  min-width: 18px;
}

.step-text {
  color: #bbb;
  word-break: break-all;
}

/* ---- Explanation Box ---- */
.explanation-box {
  background: #1A1A1A;
  border: 1px solid #333;
  border-left: 3px solid #FF8800;
  border-radius: 4px;
  padding: 12px;
}

.explanation-title {
  font-size: 13px;
  font-weight: 700;
  color: #FF8800;
  margin-bottom: 8px;
}

.explanation-box p {
  font-size: 12px;
  color: #aaa;
  line-height: 1.6;
  margin: 0 0 6px;
}

.explanation-box p:last-child {
  margin-bottom: 0;
}

/* ---- Carbon Recovery ---- */
.recovery-section {
  background: #1A1A1A;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 12px;
}

.recovery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #ccc;
}

.recovery-tip {
  font-size: 11px;
  color: #888;
  margin-top: 6px;
  text-align: center;
}

.recovery-section :deep(.el-progress-bar__outer) {
  background: #333 !important;
}

.recovery-section :deep(.el-progress__text) {
  display: none;
}

/* ---- Table overrides ---- */
.saved-results-card :deep(.el-table) {
  background: #1A1A1A !important;
  color: #ccc !important;
  --el-table-border-color: #333 !important;
  --el-table-header-bg-color: #222 !important;
  --el-table-tr-bg-color: #1A1A1A !important;
  --el-table-row-hover-bg-color: #2a2a2a !important;
}

.saved-results-card :deep(.el-table th) {
  background: #222 !important;
  color: #FF8800 !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #333 !important;
}

.saved-results-card :deep(.el-table td) {
  border-bottom: 1px solid #2a2a2a !important;
}

/* Carbon multi-point table */
.form-card :deep(.el-table) {
  background: #1A1A1A !important;
  color: #ccc !important;
  --el-table-border-color: #333 !important;
  --el-table-header-bg-color: #222 !important;
  --el-table-tr-bg-color: #1A1A1A !important;
  --el-table-row-hover-bg-color: #2a2a2a !important;
}

.form-card :deep(.el-table th) {
  background: #222 !important;
  color: #FF8800 !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #333 !important;
  padding: 4px !important;
}

.form-card :deep(.el-table td) {
  border-bottom: 1px solid #2a2a2a !important;
  padding: 2px 2px !important;
}

.form-card :deep(.el-table .el-input-number) {
  width: 100%;
}

.form-card :deep(.el-table .el-input-number .el-input__wrapper) {
  padding: 0 18px 0 4px !important;
  height: 28px !important;
}

/* ---- Alert overrides ---- */
.form-card :deep(.el-alert) {
  background: #1e2a1e !important;
  border: 1px solid #2a3a2a !important;
  border-radius: 4px;
}

.form-card :deep(.el-alert__title) {
  color: #8bc34a !important;
  font-size: 13px;
}

.form-card :deep(.el-alert__description) {
  color: #aaa !important;
  font-size: 12px;
}

/* ---- Scrollbar ---- */
.calc-steps::-webkit-scrollbar {
  width: 4px;
}

.calc-steps::-webkit-scrollbar-track {
  background: #1A1A1A;
}

.calc-steps::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

.calc-steps::-webkit-scrollbar-thumb:hover {
  background: #FF8800;
}

/* ---- Footer ---- */
.calc-footer {
  background: #1A1A1A;
  border-top: 1px solid #333;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #555;
}

/* ---- Tag overrides ---- */
.form-card :deep(.el-tag--warning) {
  background: #5a3a00 !important;
  border-color: #FF8800 !important;
  color: #FF8800 !important;
}

.form-card :deep(.el-tag--primary) {
  background: #003366 !important;
  border-color: #0066cc !important;
}

.form-card :deep(.el-tag--success) {
  background: #1a3a1a !important;
  border-color: #4caf50 !important;
}

/* ---- Progress Bar ---- */
.recovery-section :deep(.el-progress-bar__inner) {
  transition: width 0.4s ease;
}

/* ---- Responsive ---- */
@media (max-width: 900px) {
  .calc-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 12px;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
