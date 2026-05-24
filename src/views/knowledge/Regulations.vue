<template>
  <div class="regulations-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">排放法规库</h1>
      <p class="page-subtitle">全球机动车排放标准与技术法规综合参考</p>
      <div class="header-actions">
        <button
          class="action-btn"
          :class="{ active: showTimeline }"
          @click="showTimeline = !showTimeline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          时间线
        </button>
        <button
          class="action-btn"
          :class="{ active: compareMode }"
          @click="toggleCompareMode"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="6" height="18"/><rect x="10" y="6" width="6" height="15"/><rect x="18" y="9" width="4" height="12"/>
          </svg>
          对比
        </button>
      </div>
    </div>

    <!-- Timeline slider -->
    <div v-if="showTimeline" class="timeline-bar">
      <div class="timeline-label">时间筛选：{{ timelineYear }}</div>
      <input
        type="range"
        class="timeline-slider"
        min="1990"
        max="2026"
        v-model.number="timelineYear"
      />
      <div class="timeline-markers">
        <span>1990</span>
        <span>2000</span>
        <span>2010</span>
        <span>2020</span>
        <span>2026</span>
      </div>
    </div>

    <div class="content-layout">
      <!-- Left Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>排放法规库</span>
        </div>
        <nav class="tree-nav">
          <div
            v-for="(node, idx) in regionTree"
            :key="idx"
            class="tree-item"
            :class="{
              expanded: node.expanded,
              selected: selectedRegion === node.region
            }"
          >
            <div class="tree-node" @click="toggleRegion(node)">
              <span class="node-arrow">{{ node.expanded ? '▼' : '▶' }}</span>
              <span class="node-icon">{{ node.icon }}</span>
              <span class="node-label">{{ node.label }}</span>
            </div>
            <div v-if="node.expanded" class="tree-children">
              <div
                v-for="(cat, cIdx) in node.categories"
                :key="cIdx"
                class="tree-leaf"
                :class="{ selected: selectedCategory === cat.key }"
                @click="selectCategory(node.region, cat.key)"
              >
                <span class="leaf-label">{{ cat.label }}</span>
                <span class="leaf-count">{{ getRegulationCount(node.region, cat.key) }}</span>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Right Content -->
      <main class="main-content">
        <!-- Compare Panel -->
        <div v-if="compareMode" class="compare-panel">
          <div class="compare-header">
            <h3>
              对比模式
              <span class="compare-count">{{ compareList.length }} / 3 已选择</span>
            </h3>
            <div class="compare-actions">
              <button
                class="btn btn-primary"
                :disabled="compareList.length < 2"
                @click="showComparison = true"
              >
                查看对比
              </button>
              <button class="btn btn-ghost" @click="toggleCompareMode">退出</button>
            </div>
          </div>
          <div class="compare-selection">
            <div
              v-for="reg in compareList"
              :key="reg.id"
              class="compare-chip"
            >
              <span>{{ reg.standardNumber }}</span>
              <button class="chip-remove" @click="removeFromCompare(reg.id)">×</button>
            </div>
          </div>
        </div>

        <!-- Regulation Cards -->
        <div v-if="filteredRegulations.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <p>请从左侧选择法规类别以查看详情</p>
        </div>

        <div v-else class="regulations-list">
          <div
            v-for="reg in filteredRegulations"
            :key="reg.id"
            class="regulation-card"
          >
            <div class="card-header">
              <div class="card-title-row">
                <div v-if="compareMode" class="card-checkbox">
                  <input
                    type="checkbox"
                    :checked="isInCompare(reg.id)"
                    :disabled="compareList.length >= 3 && !isInCompare(reg.id)"
                    @change="toggleCompare(reg)"
                  />
                </div>
                <div>
                  <h2 class="card-standard">{{ reg.standardNumber }}</h2>
                  <p class="card-name">{{ reg.fullName }}</p>
                </div>
              </div>
              <div class="card-tags">
                <span
                  v-for="tag in reg.tags"
                  :key="tag"
                  class="tag"
                  :class="tagClass(tag)"
                >{{ tag }}</span>
              </div>
            </div>

            <div class="card-body">
              <div class="card-meta">
                <div class="meta-item">
                  <span class="meta-label">生效日期</span>
                  <span class="meta-value">{{ reg.effectiveDate }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">测试循环</span>
                  <span class="meta-value">{{ reg.testCycle }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">燃料类型</span>
                  <span class="meta-value">{{ reg.fuelType }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">车辆类别</span>
                  <span class="meta-value">{{ reg.vehicleCategory }}</span>
                </div>
              </div>

              <div class="limits-table-wrapper">
                <table class="limits-table">
                  <thead>
                    <tr>
                      <th>污染物</th>
                      <th>限值</th>
                      <th>单位</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(limit, key) in reg.limits" :key="key">
                      <td class="pollutant-name">{{ pollutantLabel(key as string) }}</td>
                      <td class="pollutant-value">{{ limit.value }}</td>
                      <td class="pollutant-unit">{{ limit.unit }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="reg.notes" class="card-notes">
                <p>{{ reg.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Comparison Modal -->
        <div v-if="showComparison" class="comparison-overlay" @click.self="showComparison = false">
          <div class="comparison-modal">
            <div class="comparison-modal-header">
              <h2>法规对比</h2>
              <button class="btn-close" @click="showComparison = false">×</button>
            </div>

            <div class="comparison-tabs">
              <button
                class="tab-btn"
                :class="{ active: comparisonTab === 'table' }"
                @click="comparisonTab = 'table'"
              >表格对比</button>
              <button
                class="tab-btn"
                :class="{ active: comparisonTab === 'chart' }"
                @click="comparisonTab = 'chart'"
              >柱状图</button>
            </div>

            <div v-if="comparisonTab === 'table'" class="comparison-table-wrapper">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th v-for="reg in compareList" :key="reg.id">{{ reg.standardNumber }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>名称</td>
                    <td v-for="reg in compareList" :key="reg.id">{{ reg.fullName }}</td>
                  </tr>
                  <tr>
                    <td>生效日期</td>
                    <td v-for="reg in compareList" :key="reg.id">{{ reg.effectiveDate }}</td>
                  </tr>
                  <tr>
                    <td>测试循环</td>
                    <td v-for="reg in compareList" :key="reg.id">{{ reg.testCycle }}</td>
                  </tr>
                  <tr v-for="pollutant in pollutants" :key="pollutant">
                    <td>{{ pollutantLabel(pollutant) }}</td>
                    <td v-for="reg in compareList" :key="reg.id">
                      {{ getLimitValue(reg, pollutant) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="comparisonTab === 'chart'" class="comparison-chart-wrapper">
              <svg
                :width="chartWidth"
                :height="chartHeight"
                class="comparison-chart"
              >
                <g v-for="(p, pIdx) in pollutants" :key="p">
                  <!-- Axis labels -->
                  <text
                    :x="30"
                    :y="60 + pIdx * barGroupHeight + barGroupHeight / 2"
                    class="chart-axis-label"
                    text-anchor="end"
                    dominant-baseline="middle"
                  >{{ pollutantLabel(p) }}</text>

                  <!-- Bars -->
                  <g v-for="(reg, rIdx) in compareList" :key="reg.id">
                    <rect
                      :x="80 + rIdx * (barWidth + barGap) + pIdx * pollutantGroupOffset"
                      :y="80 + pIdx * barGroupHeight + (barGroupHeight - barHeight(reg, p)) / 2"
                      :width="barWidth"
                      :height="barHeight(reg, p)"
                      :fill="chartColors[rIdx % chartColors.length]"
                      :opacity="0.85"
                      rx="2"
                    />
                    <!-- Value label -->
                    <text
                      :x="80 + rIdx * (barWidth + barGap) + pIdx * pollutantGroupOffset + barWidth / 2"
                      :y="70 + pIdx * barGroupHeight"
                      class="chart-value-label"
                      text-anchor="middle"
                      dominant-baseline="middle"
                    >{{ getLimitValue(reg, p) }}</text>
                  </g>
                </g>
              </svg>
              <div class="chart-legend">
                <div
                  v-for="(reg, idx) in compareList"
                  :key="reg.id"
                  class="legend-item"
                >
                  <span
                    class="legend-color"
                    :style="{ background: chartColors[idx % chartColors.length] }"
                  ></span>
                  <span>{{ reg.standardNumber }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/* ============================================================
   TYPES
   ============================================================ */
interface EmissionLimit {
  value: number | string
  unit: string
}

interface Regulation {
  id: string
  standardNumber: string
  fullName: string
  region: string
  category: string
  effectiveDate: string
  fuelType: string
  vehicleCategory: string
  testCycle: string
  notes: string
  tags: string[]
  limits: Record<string, EmissionLimit>
}

interface CategoryNode {
  label: string
  key: string
}

interface RegionNode {
  region: string
  label: string
  icon: string
  expanded: boolean
  categories: CategoryNode[]
}

/* ============================================================
   COLOR PALETTE (Asiimov)
   ============================================================ */
const chartColors = ['#FF8800', '#1A1A1A', '#888']

/* ============================================================
   STATE
   ============================================================ */
const selectedRegion = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)
const compareMode = ref(false)
const compareList = ref<Regulation[]>([])
const showComparison = ref(false)
const showTimeline = ref(false)
const timelineYear = ref(2025)
const comparisonTab = ref<'table' | 'chart'>('table')

const barWidth = 22
const barGap = 6
const pollutantGroupOffset = 90
const barGroupHeight = 90
const chartWidth = 780
const chartHeight = 600

const pollutants = ['NOx', 'PM', 'HC', 'CO', 'PN']

/* ============================================================
   TREE DATA
   ============================================================ */
const regionTree = ref<RegionNode[]>([
  {
    region: 'china',
    label: '中国',
    icon: '🇨🇳',
    expanded: true,
    categories: [
      { label: '轻型车 (国Ⅰ→国Ⅶ)', key: 'china-light' },
      { label: '重型车 (国Ⅲ→国Ⅵ)', key: 'china-heavy' },
      { label: '非道路机械 NRMM', key: 'china-nrmm' },
      { label: '船舶发动机', key: 'china-marine' },
      { label: '摩托车', key: 'china-motorcycle' },
    ]
  },
  {
    region: 'europe',
    label: '欧洲',
    icon: '🇪🇺',
    expanded: false,
    categories: [
      { label: '轻型车 (Euro 1→7)', key: 'euro-light' },
      { label: '重型车 (Euro I→VI)', key: 'euro-heavy' },
      { label: '非道路 (Stage I→V)', key: 'euro-nrmm' },
      { label: '船机 (IMO Tier)', key: 'euro-marine' },
    ]
  },
  {
    region: 'usa',
    label: '美国',
    icon: '🇺🇸',
    expanded: false,
    categories: [
      { label: '轻型车 (Tier 1→3)', key: 'usa-light' },
      { label: '重型车 (EPA GHG)', key: 'usa-heavy' },
      { label: '加州 CARB', key: 'usa-carb' },
      { label: '非道路 (Tier 1→4)', key: 'usa-nrmm' },
    ]
  },
  {
    region: 'intl',
    label: '国际/其他',
    icon: '🌐',
    expanded: false,
    categories: [
      { label: 'UN R83 / R49', key: 'intl-un' },
      { label: '日本 / 韩国 / 印度', key: 'intl-asia' },
      { label: '全球法规协调', key: 'intl-harmony' },
    ]
  }
])

/* ============================================================
   REGULATION DATA - Hardcoded with actual limit values
   ============================================================ */
const regulations = ref<Regulation[]>([
  // === CHINA LIGHT-DUTY ===
  {
    id: 'cn-6a-light',
    standardNumber: 'GB 18352.6-2016 国Ⅵa',
    fullName: '轻型汽车污染物排放限值及测量方法（中国第六阶段）6a阶段',
    region: 'china',
    category: 'china-light',
    effectiveDate: '2020-07-01',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, M2, N1 I类',
    testCycle: 'WLTC',
    notes: '国Ⅵa为过渡阶段，2020年7月起全国实施。相比国Ⅴ新增PN限值和RDE要求。增加了实际行驶排放（RDE）测试要求，要求NOx不超过2.1倍限值。',
    tags: ['轻型车', '汽油', '柴油', '国Ⅵ', 'WLTC'],
    limits: {
      NOx: { value: 60, unit: 'mg/km' },
      PM:  { value: 4.5, unit: 'mg/km' },
      HC:  { value: 100, unit: 'mg/km' },
      CO:  { value: 700, unit: 'mg/km' },
      PN:  { value: '6.0×10¹¹', unit: '/km' },
    }
  },
  {
    id: 'cn-6b-light',
    standardNumber: 'GB 18352.6-2016 国Ⅵb',
    fullName: '轻型汽车污染物排放限值及测量方法（中国第六阶段）6b阶段',
    region: 'china',
    category: 'china-light',
    effectiveDate: '2023-07-01',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, M2, N1 I类',
    testCycle: 'WLTC + RDE',
    notes: '国Ⅵb为最终阶段，2023年7月起全国实施。限值较6a阶段大幅加严，NOx降低42%，HC降低50%。RDE要求NOx不超过1.6倍限值。PN限值适用于所有车辆。',
    tags: ['轻型车', '汽油', '柴油', '国Ⅵ', 'WLTC', 'RDE'],
    limits: {
      NOx: { value: 35, unit: 'mg/km' },
      PM:  { value: 3.0, unit: 'mg/km' },
      HC:  { value: 50, unit: 'mg/km' },
      CO:  { value: 500, unit: 'mg/km' },
      PN:  { value: '6.0×10¹¹', unit: '/km' },
    }
  },
  {
    id: 'cn-5-light',
    standardNumber: 'GB 18352.5-2013 国Ⅴ',
    fullName: '轻型汽车污染物排放限值及测量方法（中国第五阶段）',
    region: 'china',
    category: 'china-light',
    effectiveDate: '2017-01-01 (全国)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, M2, N1 I类',
    testCycle: 'NEDC',
    notes: '国Ⅴ阶段开始全国供应国Ⅴ标准汽柴油。汽油车与柴油车采用统一限值。OBD要求加严。',
    tags: ['轻型车', '汽油', '柴油', '国Ⅴ', 'NEDC'],
    limits: {
      NOx: { value: 60, unit: 'mg/km' },
      PM:  { value: 4.5, unit: 'mg/km' },
      HC:  { value: 100, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
    }
  },
  {
    id: 'cn-4-light',
    standardNumber: 'GB 18352.3-2005 国Ⅳ',
    fullName: '轻型汽车污染物排放限值及测量方法（中国第四阶段）',
    region: 'china',
    category: 'china-light',
    effectiveDate: '2011-07-01 (全国)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, M2, N1 I类',
    testCycle: 'NEDC',
    notes: '国Ⅳ首次全面实施。柴油车需加装DPF才能满足PM限值。北京2008年率先实施国Ⅳ。汽油车与柴油车限值首次趋于一致。',
    tags: ['轻型车', '汽油', '柴油', '国Ⅳ', 'NEDC'],
    limits: {
      NOx: { value: 80, unit: 'mg/km' },
      PM:  { value: 25, unit: 'mg/km' },
      HC:  { value: 100, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
    }
  },
  // === CHINA HEAVY-DUTY ===
  {
    id: 'cn-6-heavy',
    standardNumber: 'GB 17691-2018 国Ⅵ',
    fullName: '重型柴油车污染物排放限值及测量方法（中国第六阶段）',
    region: 'china',
    category: 'china-heavy',
    effectiveDate: '2021-07-01 (a阶段)',
    fuelType: '柴油',
    vehicleCategory: '重型柴油车 (最大总质量>3500kg)',
    testCycle: 'WHTC/WHSC',
    notes: '重型车国Ⅵ采用WHTC/WHSC测试循环替代ETC/ESC。增加PN限值和WWH-OBD要求。PEMS测试要求在整车道路试验中进行。新增NO₂排放占比控制要求。',
    tags: ['重型车', '柴油', '国Ⅵ', 'WHTC', 'PEMS'],
    limits: {
      NOx: { value: 0.46, unit: 'g/kWh' },
      PM:  { value: 0.01, unit: 'g/kWh' },
      HC:  { value: 0.16, unit: 'g/kWh' },
      CO:  { value: 1.5, unit: 'g/kWh' },
      PN:  { value: '8.0×10¹¹', unit: '/kWh' },
    }
  },
  {
    id: 'cn-5-heavy',
    standardNumber: 'GB 17691-2005 国Ⅴ',
    fullName: '车用压燃式、气体燃料点燃式发动机与汽车排气污染物排放限值及测量方法（中国第五阶段）',
    region: 'china',
    category: 'china-heavy',
    effectiveDate: '2017-07-01',
    fuelType: '柴油',
    vehicleCategory: '重型柴油车',
    testCycle: 'ETC/ESC',
    notes: '重型车国Ⅴ要求SCR后处理系统全面应用，对NOx限值大幅加严。部分地区提前实施（如北京2015年）。',
    tags: ['重型车', '柴油', '国Ⅴ', 'ETC'],
    limits: {
      NOx: { value: 2.0, unit: 'g/kWh' },
      PM:  { value: 0.02, unit: 'g/kWh' },
      HC:  { value: 0.46, unit: 'g/kWh' },
      CO:  { value: 1.5, unit: 'g/kWh' },
    }
  },
  // === EUROPE LIGHT-DUTY ===
  {
    id: 'eu-6d-light',
    standardNumber: 'EC 715/2007 Euro 6d',
    fullName: 'Euro 6d — 轻型车排放法规最终阶段（实际行驶排放）',
    region: 'europe',
    category: 'euro-light',
    effectiveDate: '2020-01-01 (强制)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, M2, N1',
    testCycle: 'WLTC + RDE',
    notes: 'Euro 6d引入RDE符合性因子（CF），要求NOx CF≤1.43（2020年1月起）和CF≤1.34（2023年1月起）。PN限值适用于汽油直喷和柴油车。',
    tags: ['轻型车', '汽油', '柴油', 'Euro 6', 'WLTC', 'RDE'],
    limits: {
      NOx: { value: 60, unit: 'mg/km' },
      PM:  { value: 4.5, unit: 'mg/km' },
      THC: { value: 100, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
      PN:  { value: '6.0×10¹¹', unit: '/km' },
    }
  },
  {
    id: 'eu-6c-light',
    standardNumber: 'EC 715/2007 Euro 6c',
    fullName: 'Euro 6c — WLTP过渡阶段（无RDE符合性）',
    region: 'europe',
    category: 'euro-light',
    effectiveDate: '2017-09-01 (新车型)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, N1',
    testCycle: 'WLTC',
    notes: 'Euro 6c从NEDC过渡到WLTP测试循环，暂不包含RDE符合性要求。是Euro 6d之前的关键过渡阶段。',
    tags: ['轻型车', '汽油', '柴油', 'Euro 6', 'WLTC'],
    limits: {
      NOx: { value: 60, unit: 'mg/km' },
      PM:  { value: 4.5, unit: 'mg/km' },
      THC: { value: 100, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
      PN:  { value: '6.0×10¹¹', unit: '/km' },
    }
  },
  {
    id: 'eu-6b-light',
    standardNumber: 'EC 715/2007 Euro 6b',
    fullName: 'Euro 6b — 基于NEDC的初始Euro 6阶段',
    region: 'europe',
    category: 'euro-light',
    effectiveDate: '2014-09-01 (新车型)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, N1',
    testCycle: 'NEDC',
    notes: 'Euro 6b相比Euro 5大幅加严NOx限值（柴油车从180降至80mg/km）。首次引入PN限值（6.0×10¹¹/km）用于柴油车。',
    tags: ['轻型车', '汽油', '柴油', 'Euro 6', 'NEDC'],
    limits: {
      NOx: { value: 80, unit: 'mg/km' },
      PM:  { value: 4.5, unit: 'mg/km' },
      THC: { value: 100, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
      PN:  { value: '6.0×10¹¹', unit: '/km' },
    }
  },
  // === EUROPE HEAVY-DUTY ===
  {
    id: 'eu-6-heavy',
    standardNumber: 'EC 595/2009 Euro VI',
    fullName: 'Euro VI — 重型车排放法规',
    region: 'europe',
    category: 'euro-heavy',
    effectiveDate: '2013-12-31 (新车型)',
    fuelType: '柴油',
    vehicleCategory: '重型车 (>2610kg GVW)',
    testCycle: 'WHTC/WHSC',
    notes: 'Euro VI采用WHTC/WHSC替代ETC/ESC。相比Euro V，NOx限值降低约80%。引入PN限值（8.0×10¹¹/kWh）。要求OBD和NOx控制监测。',
    tags: ['重型车', '柴油', 'Euro VI', 'WHTC'],
    limits: {
      NOx: { value: 0.46, unit: 'g/kWh' },
      PM:  { value: 0.01, unit: 'g/kWh' },
      HC:  { value: 0.13, unit: 'g/kWh' },
      CO:  { value: 1.5, unit: 'g/kWh' },
      PN:  { value: '8.0×10¹¹', unit: '/kWh' },
    }
  },
  // === USA LIGHT-DUTY ===
  {
    id: 'us-tier3-light',
    standardNumber: 'EPA Tier 3 (Bin 30)',
    fullName: 'EPA Tier 3 Light-Duty Vehicle Emission Standards',
    region: 'usa',
    category: 'usa-light',
    effectiveDate: '2017-2025 (逐步实施)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'LDV, LDT, MDV',
    testCycle: 'FTP-75 + US06',
    notes: 'Tier 3采用Bin体系，制造商可选择不同Bin级别满足企业平均NMOG+NOx标准。Bin 30为最低标准。要求硫含量降至10ppm。',
    tags: ['轻型车', '汽油', '柴油', 'Tier 3', 'FTP-75'],
    limits: {
      NOx: { value: 30, unit: 'mg/km' },
      PM:  { value: 3.0, unit: 'mg/km' },
      NMOG: { value: 30, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
      HCHO: { value: 4, unit: 'mg/km' },
    }
  },
  {
    id: 'us-tier2-light',
    standardNumber: 'EPA Tier 2 (Bin 5)',
    fullName: 'EPA Tier 2 Light-Duty Vehicle Emission Standards',
    region: 'usa',
    category: 'usa-light',
    effectiveDate: '2004-2009 (逐步实施)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'LDV, LDT, MDV',
    testCycle: 'FTP-75',
    notes: 'Tier 2首次要求汽油车和柴油车适用统一限值体系。Bin 5为最常用的认证标准。从Tier 1到Tier 2，NOx限值降低约75%。',
    tags: ['轻型车', '汽油', '柴油', 'Tier 2', 'FTP-75'],
    limits: {
      NOx: { value: 40, unit: 'mg/km' },
      PM:  { value: 10, unit: 'mg/km' },
      NMOG: { value: 55, unit: 'mg/km' },
      CO:  { value: 2000, unit: 'mg/km' },
      HCHO: { value: 9, unit: 'mg/km' },
    }
  },
  // === USA HEAVY-DUTY ===
  {
    id: 'us-2027-heavy',
    standardNumber: 'EPA GHG Phase 2 / 2027',
    fullName: 'EPA Heavy-Duty Greenhouse Gas Phase 2 Standards (2027+)',
    region: 'usa',
    category: 'usa-heavy',
    effectiveDate: '2027-01-01',
    fuelType: '柴油',
    vehicleCategory: 'HDV (Class 8)',
    testCycle: 'FTP-Transient + SET',
    notes: 'EPA 2027标准大幅加严NOx限值至0.02 g/hp-hr，降低超过90%。引入更严格的全生命周期温室气体要求。推动电动化和混动化。延长质保和OBD要求。',
    tags: ['重型车', '柴油', 'EPA', 'GHG'],
    limits: {
      NOx: { value: 0.02, unit: 'g/hp-hr' },
      PM:  { value: 0.005, unit: 'g/hp-hr' },
      HC:  { value: 0.14, unit: 'g/hp-hr' },
      CO:  { value: 15.5, unit: 'g/hp-hr' },
    }
  },
  // === CHINA NRMM ===
  {
    id: 'cn-nrmm-4',
    standardNumber: 'GB 20891-2014 非道路国Ⅳ',
    fullName: '非道路移动机械用柴油机排气污染物排放限值及测量方法（中国第四阶段）',
    region: 'china',
    category: 'china-nrmm',
    effectiveDate: '2022-12-01',
    fuelType: '柴油',
    vehicleCategory: '非道路移动机械',
    testCycle: 'NRTC/NRSC',
    notes: '非道路国Ⅳ大幅加严，首次要求安装DPF和DOC后处理系统。PN限值首次引入。37-560kW功率段限值最为严格。',
    tags: ['非道路', '柴油', '国Ⅳ', 'NRTC'],
    limits: {
      NOx: { value: 0.4, unit: 'g/kWh' },
      PM:  { value: 0.015, unit: 'g/kWh' },
      HC:  { value: 0.19, unit: 'g/kWh' },
      CO:  { value: 3.5, unit: 'g/kWh' },
      PN:  { value: '1.0×10¹²', unit: '/kWh' },
    }
  },
  // === CHINA MARINE ===
  {
    id: 'cn-marine-2',
    standardNumber: 'GB 15097-2016 船舶国Ⅱ',
    fullName: '船舶发动机排气污染物排放限值及测量方法（中国第二阶段）',
    region: 'china',
    category: 'china-marine',
    effectiveDate: '2018-07-01',
    fuelType: '柴油',
    vehicleCategory: '船用发动机',
    testCycle: 'E3/E2 (ISO 8178)',
    notes: '适用于内河船舶和近海船舶发动机。参照CIMAC和IMO Tier II/III标准制定。第二阶段相比第一阶段NOx限值降低约20%。',
    tags: ['船舶', '柴油', '国Ⅱ', 'E3'],
    limits: {
      NOx: { value: 9.8, unit: 'g/kWh' },
      PM:  { value: 0.24, unit: 'g/kWh' },
      CO:  { value: 3.5, unit: 'g/kWh' },
      HC:  { value: 1.2, unit: 'g/kWh' },
    }
  },
  // === EUROPE NRMM ===
  {
    id: 'eu-stage5',
    standardNumber: 'EU 2016/1628 Stage V',
    fullName: 'Regulation on requirements relating to gaseous and particulate pollutant emission limits for non-road mobile machinery',
    region: 'europe',
    category: 'euro-nrmm',
    effectiveDate: '2019-01-01 (56-130kW)',
    fuelType: '柴油',
    vehicleCategory: 'NRMM',
    testCycle: 'NRTC/NRSC',
    notes: 'Stage V为目前非道路最新标准，涵盖56-560kW功率段。首次引入PN限值（1.0×10¹²/kWh）。新增对火花点火发动机的限值要求。',
    tags: ['非道路', '柴油', 'Stage V', 'NRTC'],
    limits: {
      NOx: { value: 0.4, unit: 'g/kWh' },
      PM:  { value: 0.015, unit: 'g/kWh' },
      HC:  { value: 0.19, unit: 'g/kWh' },
      CO:  { value: 3.5, unit: 'g/kWh' },
      PN:  { value: '1.0×10¹²', unit: '/kWh' },
    }
  },
  // === CARB ===
  {
    id: 'us-carb-lev3',
    standardNumber: 'CARB LEV III (ULEV50)',
    fullName: 'California Low-Emission Vehicle III Standards',
    region: 'usa',
    category: 'usa-carb',
    effectiveDate: '2015-2025 (逐步实施)',
    fuelType: '汽油/柴油',
    vehicleCategory: 'LDV, LDT',
    testCycle: 'FTP-75 + US06',
    notes: 'CARB标准为全美最严格。LEV III要求NMOG+NOx从目标值逐步降低至30 mg/km。加州还要求零排放车（ZEV）积分。美国多个州遵循CARB标准。',
    tags: ['加州', 'CARB', 'LEV III', '轻型车'],
    limits: {
      NOx: { value: 20, unit: 'mg/km' },
      PM:  { value: 3.0, unit: 'mg/km' },
      NMOG: { value: 10, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
    }
  },
  // === USA NRMM ===
  {
    id: 'us-tier4-nrmm',
    standardNumber: 'EPA Tier 4 Final (NRMM)',
    fullName: 'EPA Control of Emissions of Air Pollution from Nonroad Diesel Engines - Tier 4',
    region: 'usa',
    category: 'usa-nrmm',
    effectiveDate: '2014-2015 (130-560kW)',
    fuelType: '柴油',
    vehicleCategory: '非道路机械',
    testCycle: 'NRTC/NRSC',
    notes: 'Tier 4 Final为美国非道路柴油发动机排放标准最终阶段。要求使用DPF和SCR后处理技术对NOx和PM进行深度处理。PM限值较Tier 3降低约90%。',
    tags: ['非道路', '柴油', 'Tier 4', 'EPA'],
    limits: {
      NOx: { value: 0.4, unit: 'g/kWh' },
      PM:  { value: 0.02, unit: 'g/kWh' },
      HC:  { value: 0.19, unit: 'g/kWh' },
      CO:  { value: 3.5, unit: 'g/kWh' },
    }
  },
  // === UN REGULATIONS ===
  {
    id: 'intl-unr83',
    standardNumber: 'UN R83',
    fullName: 'UN Regulation No. 83 — Emissions of M1 and N1 vehicles',
    region: 'intl',
    category: 'intl-un',
    effectiveDate: '持续更新',
    fuelType: '汽油/柴油',
    vehicleCategory: 'M1, N1',
    testCycle: 'WLTC (07系列修订)',
    notes: 'UN R83是联合国欧洲经济委员会（UNECE）关于轻型车排放的法规。采用系列修订（Series of Amendments）方式逐步加严。包括对OBD、蒸发排放和RDE的要求。',
    tags: ['UNECE', '国际', '轻型车', '协调'],
    limits: {
      NOx: { value: 60, unit: 'mg/km' },
      PM:  { value: 4.5, unit: 'mg/km' },
      HC:  { value: 100, unit: 'mg/km' },
      CO:  { value: 1000, unit: 'mg/km' },
      PN:  { value: '6.0×10¹¹', unit: '/km' },
    }
  },
  {
    id: 'intl-unr49',
    standardNumber: 'UN R49',
    fullName: 'UN Regulation No. 49 — Emissions of compression ignition and positive-ignition engines',
    region: 'intl',
    category: 'intl-un',
    effectiveDate: '持续更新',
    fuelType: '柴油/汽油',
    vehicleCategory: '重型发动机',
    testCycle: 'WHTC/WHSC',
    notes: 'UN R49涉及重型发动机排放的全球技术法规。包括气态和颗粒物污染物限值，采用WHTC/WHSC测试循环。是众多国家重型车法规的参考蓝本。',
    tags: ['UNECE', '国际', '重型车', '协调'],
    limits: {
      NOx: { value: 0.46, unit: 'g/kWh' },
      PM:  { value: 0.01, unit: 'g/kWh' },
      HC:  { value: 0.13, unit: 'g/kWh' },
      CO:  { value: 1.5, unit: 'g/kWh' },
      PN:  { value: '8.0×10¹¹', unit: '/kWh' },
    }
  },
  // === JAPAN ===
  {
    id: 'intl-japan',
    standardNumber: '日本 Post New Long-term (PNLT)',
    fullName: '日本重型车排放标准 — 后新长期规制',
    region: 'intl',
    category: 'intl-asia',
    effectiveDate: '2016-10-01',
    fuelType: '柴油',
    vehicleCategory: '重型车',
    testCycle: 'JE05',
    notes: '日本采用独特JE05瞬态测试循环。后新长期规制对NOx和PM限值进一步加严，与Euro VI水平相当。日本还要求超低PM排放（0.005 g/kWh）。',
    tags: ['日本', '重型车', 'JE05', 'PNLT'],
    limits: {
      NOx: { value: 0.4, unit: 'g/kWh' },
      PM:  { value: 0.005, unit: 'g/kWh' },
      HC:  { value: 0.17, unit: 'g/kWh' },
      CO:  { value: 2.22, unit: 'g/kWh' },
    }
  },
  // === GLOBAL HARMONIZATION ===
  {
    id: 'intl-wltp',
    standardNumber: 'WLTP / GTR 15',
    fullName: 'Worldwide Harmonized Light Vehicles Test Procedure (UN GTR No. 15)',
    region: 'intl',
    category: 'intl-harmony',
    effectiveDate: '2017 (GTR 15 第1阶段)',
    fuelType: '汽油/柴油/电动',
    vehicleCategory: '轻型车',
    testCycle: 'WLTC',
    notes: 'WLTP为全球统一的轻型车测试规程，由UNECE WP.29制定。替代NEDC作为认证测试基础。涵盖Class 1/2/3三个功率/质量等级。中国、欧盟、日本、韩国、印度已采用或宣布采用。',
    tags: ['国际', 'WLTP', 'GTR 15', '协调'],
    limits: {
      NOx: { value: '-', unit: '参考法规' },
      PM:  { value: '-', unit: '参考法规' },
      HC:  { value: '-', unit: '参考法规' },
      CO:  { value: '-', unit: '参考法规' },
    }
  },
])

/* ============================================================
   COMPUTED
   ============================================================ */
const filteredRegulations = computed(() => {
  let result = regulations.value
  if (selectedCategory.value) {
    result = result.filter(r => r.category === selectedCategory.value)
  }
  if (showTimeline.value) {
    result = result.filter(r => {
      const yearMatch = r.effectiveDate.match(/(\d{4})/)
      if (!yearMatch) return true
      return parseInt(yearMatch[1]) <= timelineYear.value
    })
  }
  return result
})

/* ============================================================
   METHODS
   ============================================================ */
function toggleRegion(node: RegionNode) {
  node.expanded = !node.expanded
}

function selectCategory(region: string, category: string) {
  selectedRegion.value = region
  selectedCategory.value = category
  // Auto-expand the parent
  regionTree.value.forEach(n => {
    n.expanded = n.region === region ? true : n.expanded
  })
}

function getRegulationCount(region: string, category: string): number {
  return regulations.value.filter(r => r.region === region && r.category === category).length
}

function toggleCompareMode() {
  compareMode.value = !compareMode.value
  compareList.value = []
  showComparison.value = false
}

function toggleCompare(reg: Regulation) {
  const idx = compareList.value.findIndex(r => r.id === reg.id)
  if (idx >= 0) {
    compareList.value.splice(idx, 1)
  } else if (compareList.value.length < 3) {
    compareList.value.push(reg)
  }
}

function isInCompare(id: string): boolean {
  return compareList.value.some(r => r.id === id)
}

function removeFromCompare(id: string) {
  const idx = compareList.value.findIndex(r => r.id === id)
  if (idx >= 0) compareList.value.splice(idx, 1)
}

function getLimitValue(reg: Regulation, pollutant: string): string {
  const limit = reg.limits[pollutant]
  if (!limit) return '-'
  return `${limit.value} ${limit.unit}`
}

function pollutantLabel(key: string): string {
  const labels: Record<string, string> = {
    NOx: 'NOx',
    PM: 'PM',
    HC: 'HC',
    CO: 'CO',
    PN: 'PN',
    THC: 'THC (总碳氢)',
    NMOG: 'NMOG',
    HCHO: 'HCHO (甲醛)'
  }
  return labels[key] || key
}

function barHeight(reg: Regulation, pollutant: string): number {
  const limit = reg.limits[pollutant]
  if (!limit || typeof limit.value !== 'number') return 0
  return Math.min(limit.value * 0.8, 60)
}

function tagClass(tag: string): string {
  const map: Record<string, string> = {
    '汽油': 'tag-fuel-gasoline',
    '柴油': 'tag-fuel-diesel',
    '轻型车': 'tag-vehicle-light',
    '重型车': 'tag-vehicle-heavy',
    '非道路': 'tag-nrmm',
    'EPA': 'tag-epa',
    'CARB': 'tag-carb',
    'RDE': 'tag-rde',
    'WLTC': 'tag-wltc',
  }
  for (const [key, cls] of Object.entries(map)) {
    if (tag === key) return cls
  }
  return 'tag-default'
}
</script>

<style scoped lang="scss">
// Asiimov Theme Colors
$white: #F5F5F0;
$orange: #FF8800;
$black: #1A1A1A;
$gray-100: #E8E8E0;
$gray-200: #D0D0C8;
$gray-400: #909090;
$gray-600: #606060;
$gray-800: #333;
$bg-card: #FFFFFF;
$bg-sidebar: #F0F0EB;
$transition: all 0.2s ease;

.regulations-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: $white;
  color: $black;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ---- Header ---- */
.page-header {
  padding: 24px 32px 0;
  flex-shrink: 0;

  .page-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    color: $black;
  }

  .page-subtitle {
    margin: 4px 0 16px;
    color: $gray-400;
    font-size: 14px;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border: 1px solid $gray-200;
    border-radius: 6px;
    background: $bg-card;
    color: $gray-600;
    cursor: pointer;
    font-size: 13px;
    transition: $transition;

    &:hover {
      border-color: $orange;
      color: $orange;
    }

    &.active {
      background: $orange;
      color: #fff;
      border-color: $orange;
    }
  }
}

/* ---- Timeline ---- */
.timeline-bar {
  padding: 12px 32px;
  border-bottom: 1px solid $gray-100;
  flex-shrink: 0;

  .timeline-label {
    font-size: 13px;
    color: $gray-600;
    margin-bottom: 6px;
  }

  .timeline-slider {
    width: 100%;
    max-width: 400px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: $gray-200;
    border-radius: 2px;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: $orange;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
  }

  .timeline-markers {
    display: flex;
    max-width: 400px;
    justify-content: space-between;
    font-size: 11px;
    color: $gray-400;
    margin-top: 4px;
  }
}

/* ---- Layout ---- */
.content-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ---- Sidebar ---- */
.sidebar {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid $gray-100;
  background: $bg-sidebar;
  overflow-y: auto;
  flex-shrink: 0;

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    font-size: 14px;
    font-weight: 600;
    color: $black;
    border-bottom: 1px solid $gray-100;
  }

  .tree-nav {
    padding: 8px 0;
  }

  .tree-item {
    user-select: none;

    .tree-node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 13px;
      color: $gray-800;
      transition: $transition;

      &:hover {
        background: rgba($orange, 0.08);
        color: $orange;
      }

      .node-arrow {
        width: 12px;
        font-size: 9px;
        color: $gray-400;
      }

      .node-icon {
        font-size: 15px;
      }

      .node-label {
        font-weight: 500;
      }
    }

    &.selected > .tree-node {
      color: $orange;
    }

    .tree-children {
      .tree-leaf {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 16px 6px 48px;
        cursor: pointer;
        font-size: 13px;
        color: $gray-600;
        transition: $transition;

        &:hover {
          background: rgba($orange, 0.06);
          color: $orange;
        }

        &.selected {
          background: rgba($orange, 0.12);
          color: $orange;
          font-weight: 500;
          border-right: 3px solid $orange;
        }

        .leaf-label {
          line-height: 1.4;
        }

        .leaf-count {
          font-size: 11px;
          color: $gray-400;
          background: $gray-100;
          padding: 1px 7px;
          border-radius: 10px;
        }
      }
    }
  }
}

/* ---- Main Content ---- */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

/* ---- Empty State ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: $gray-400;

  svg { margin-bottom: 16px; }
  p { font-size: 14px; }
}

/* ---- Regulation Cards ---- */
.regulations-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.regulation-card {
  background: $bg-card;
  border: 1px solid $gray-100;
  border-radius: 12px;
  overflow: hidden;
  transition: $transition;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);

  &:hover {
    border-color: $gray-200;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .card-header {
    padding: 20px 24px 12px;
    border-bottom: 1px solid $gray-100;

    .card-title-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .card-checkbox {
      margin-top: 4px;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: $orange;
        cursor: pointer;
      }
    }

    .card-standard {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      color: $black;
      line-height: 1.3;
    }

    .card-name {
      font-size: 13px;
      color: $gray-400;
      margin: 2px 0 0;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.6;

      &.tag-default { background: $gray-100; color: $gray-600; }
      &.tag-fuel-gasoline { background: #FFF3E0; color: #E65100; }
      &.tag-fuel-diesel { background: #E8EAF6; color: #283593; }
      &.tag-vehicle-light { background: #E0F2F1; color: #00695C; }
      &.tag-vehicle-heavy { background: #F3E5F5; color: #6A1B9A; }
      &.tag-nrmm { background: #EFEBE9; color: #4E342E; }
      &.tag-epa { background: #E3F2FD; color: #0D47A1; }
      &.tag-carb { background: #FCE4EC; color: #880E4F; }
      &.tag-rde { background: #FFF8E1; color: #F57F17; }
      &.tag-wltc { background: #E8F5E9; color: #1B5E20; }
    }
  }

  .card-body {
    padding: 16px 24px 20px;
  }

  .card-meta {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
    margin-bottom: 16px;

    .meta-item {
      display: flex;
      flex-direction: column;

      .meta-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: $gray-400;
      }

      .meta-value {
        font-size: 13px;
        color: $black;
        font-weight: 500;
      }
    }
  }

  .limits-table-wrapper {
    margin-bottom: 14px;
    overflow-x: auto;
  }

  .limits-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th {
      text-align: left;
      padding: 8px 12px;
      background: $gray-100;
      color: $gray-600;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &:first-child { border-radius: 6px 0 0 0; }
      &:last-child { border-radius: 0 6px 0 0; }
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid $gray-100;
    }

    .pollutant-name { font-weight: 600; color: $gray-800; }
    .pollutant-value { font-weight: 700; color: $orange; font-size: 14px; }
    .pollutant-unit { color: $gray-400; font-size: 12px; }
  }

  .card-notes {
    padding: 10px 14px;
    background: #FFFBF0;
    border-left: 3px solid $orange;
    border-radius: 0 6px 6px 0;
    font-size: 13px;
    line-height: 1.6;
    color: $gray-800;

    p {
      margin: 0;
    }
  }
}

/* ---- Compare Panel ---- */
.compare-panel {
  background: $bg-card;
  border: 1px solid $orange;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 20px;

  .compare-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 10px;

      .compare-count {
        font-size: 12px;
        color: $gray-400;
        font-weight: 400;
      }
    }
  }

  .compare-selection {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .compare-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: $orange;
    color: #fff;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;

    .chip-remove {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 0 2px;
      opacity: 0.7;

      &:hover { opacity: 1; }
    }
  }

  .compare-actions {
    display: flex;
    gap: 8px;
  }
}

/* ---- Buttons ---- */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: $transition;
  border: 1px solid transparent;

  &.btn-primary {
    background: $orange;
    color: #fff;
    border-color: $orange;

    &:hover:not(:disabled) { background: darken($orange, 8%); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  &.btn-ghost {
    background: transparent;
    color: $gray-600;
    border-color: $gray-200;

    &:hover { border-color: $gray-400; color: $black; }
  }
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: $gray-400;
  cursor: pointer;
  line-height: 1;

  &:hover { color: $black; }
}

/* ---- Comparison Modal ---- */
.comparison-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  .comparison-modal {
    background: $bg-card;
    border-radius: 16px;
    width: 90%;
    max-width: 900px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);

    .comparison-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid $gray-100;

      h2 { margin: 0; font-size: 18px; }
    }

    .comparison-tabs {
      display: flex;
      gap: 0;
      padding: 0 24px;
      border-bottom: 1px solid $gray-100;

      .tab-btn {
        padding: 10px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 13px;
        color: $gray-400;
        border-bottom: 2px solid transparent;
        transition: $transition;

        &:hover { color: $gray-800; }

        &.active {
          color: $orange;
          border-bottom-color: $orange;
          font-weight: 600;
        }
      }
    }

    .comparison-table-wrapper {
      padding: 20px 24px;
      overflow-x: auto;
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th {
        background: $gray-100;
        padding: 10px 14px;
        text-align: left;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        color: $gray-600;
      }

      td {
        padding: 10px 14px;
        border-bottom: 1px solid $gray-100;
        color: $gray-800;

        &:first-child {
          font-weight: 600;
          color: $gray-600;
          background: $gray-100;
        }
      }
    }

    .comparison-chart-wrapper {
      padding: 24px;
    }

    .comparison-chart {
      display: block;
      margin: 0 auto;
    }

    .chart-axis-label {
      font-size: 12px;
      fill: $gray-600;
      font-weight: 500;
    }

    .chart-value-label {
      font-size: 10px;
      fill: $gray-800;
      font-weight: 600;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: $gray-800;

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
      }
    }
  }
}

/* ---- Scrollbar ---- */
.sidebar::-webkit-scrollbar,
.main-content::-webkit-scrollbar,
.comparison-modal::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track,
.main-content::-webkit-scrollbar-track,
.comparison-modal::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb,
.main-content::-webkit-scrollbar-thumb,
.comparison-modal::-webkit-scrollbar-thumb {
  background: $gray-200;
  border-radius: 3px;

  &:hover { background: $gray-400; }
}
</style>
