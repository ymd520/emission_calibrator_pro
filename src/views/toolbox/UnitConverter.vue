<template>
  <div class="unit-converter">
    <!-- Page header -->
    <div class="converter-header">
      <div class="header-left">
        <h1>单位转换器</h1>
        <span class="header-subtitle">12 类单位 · 实时换算 · 专业精度</span>
      </div>
      <div class="header-actions">
        <div class="decimal-control">
          <label>小数位</label>
          <el-select v-model="decimalPlaces" size="small" style="width: 72px">
            <el-option v-for="n in 6" :key="n - 1" :label="String(n - 1)" :value="n - 1" />
          </el-select>
        </div>
        <input
          v-model="searchQuery"
          class="asiimov-input"
          placeholder="搜索单位类别..."
          style="width: 160px; padding: 5px 10px; font-size: 12px"
        />
      </div>
    </div>

    <!-- Favorites bar -->
    <div v-if="favorites.length > 0" class="favorites-bar asiimov-card">
      <div class="fav-header">
        <span class="fav-label">&#9733; 收藏夹</span>
        <button class="btn-asiimov btn-asiimov-ghost" style="padding: 2px 8px; font-size: 11px" @click="clearFavorites">清空</button>
      </div>
      <div class="fav-items">
        <button
          v-for="fav in favorites"
          :key="fav.id"
          class="fav-chip"
          :class="{ active: activeIndex === fav.categoryIndex }"
          @click="selectFavorite(fav)"
        >
          <span class="fav-icon">{{ categories[fav.categoryIndex].icon }}</span>
          <span class="fav-text">{{ fav.label }}</span>
          <span class="fav-remove" @click.stop="removeFavorite(fav.id)">&times;</span>
        </button>
      </div>
    </div>

    <!-- Main layout -->
    <div class="converter-body" :class="{ 'is-narrow': isNarrow }">
      <!-- Left: category sidebar -->
      <aside class="category-sidebar" :class="{ 'is-tabs': isNarrow }">
        <div
          v-for="(cat, idx) in filteredCategories"
          :key="idx"
          class="category-item"
          :class="{ active: activeIndex === cat.index }"
          @click="switchCategory(cat.index)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ cat.units }}</span>
        </div>
        <div v-if="filteredCategories.length === 0" class="no-search-match">无匹配类别</div>
      </aside>

      <!-- Right: conversion panel -->
      <div class="conversion-panel">
        <div class="panel-header">
          <div class="panel-title-row">
            <span class="panel-icon">{{ currentCategory.icon }}</span>
            <span class="panel-title">{{ currentCategory.name }}</span>
            <span class="panel-base">基准单位: {{ currentCategory.baseLabel }}</span>
          </div>
          <button class="btn-asiimov btn-asiimov-ghost" style="padding: 4px 12px; font-size: 12px" @click="addCurrentToFavorites">
            &#9733; 收藏
          </button>
        </div>

        <!-- Group labels and fields -->
        <div
          v-for="(group, gIdx) in currentGroups"
          :key="gIdx"
          class="unit-group"
        >
          <div v-if="group.label" class="group-label">{{ group.label }}</div>
          <div class="unit-grid">
            <div
              v-for="unit in group.units"
              :key="unit.value"
              class="unit-field"
              :class="{ 'is-source': activeSource === unit.value }"
            >
              <div class="unit-label">
                <span class="unit-name">{{ unit.label }}</span>
                <span class="unit-suffix">({{ unit.suffix }})</span>
              </div>
              <div class="unit-input-wrap">
                <input
                  :ref="(el) => { if (el) inputRefs[unit.value] = el as HTMLInputElement }"
                  :value="formatValue(values[unit.value])"
                  :placeholder="unit.label"
                  class="unit-input"
                  :class="{ 'is-cross': values[unit.value] === null }"
                  :disabled="values[unit.value] === null"
                  @input="onInput(unit.value, ($event.target as HTMLInputElement).value, gIdx)"
                  @focus="onFocus(unit.value)"
                />
                <button
                  v-if="values[unit.value] !== null && values[unit.value] !== undefined"
                  class="copy-btn"
                  title="复制数值"
                  @click="copyValue(values[unit.value], unit.label)"
                >
                  &#128203;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

// ============================================================
// Types
// ============================================================
interface UnitDef {
  label: string
  value: string
  suffix: string
  group?: string
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

interface UnitGroup {
  label: string
  units: UnitDef[]
}

interface Category {
  name: string
  icon: string
  baseLabel: string
  groups: UnitGroup[]
}

interface Favorite {
  id: string
  categoryIndex: number
  label: string
}

// ============================================================
// Utility
// ============================================================
function safe(v: number, decimals: number): number {
  if (!isFinite(v) || isNaN(v)) return 0
  const f = Math.pow(10, decimals)
  return Math.round(v * f) / f
}

function fmt(v: number | null, decimals: number): string {
  if (v === null || v === undefined) return ''
  return safe(v, decimals).toFixed(decimals)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ============================================================
// Category Definitions — ALL 12 categories with full unit lists
// ============================================================
const categories: Category[] = [
  // 1. Pressure
  {
    name: '压力',
    icon: '&#9881;',
    baseLabel: 'Pa',
    groups: [
      {
        label: '',
        units: [
          { label: '帕斯卡', value: 'Pa', suffix: 'Pa', toBase: v => v, fromBase: v => v },
          { label: '千帕', value: 'kPa', suffix: 'kPa', toBase: v => v * 1000, fromBase: v => v / 1000 },
          { label: '兆帕', value: 'MPa', suffix: 'MPa', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
          { label: '百帕', value: 'hPa', suffix: 'hPa', toBase: v => v * 100, fromBase: v => v / 100 },
          { label: '巴', value: 'bar', suffix: 'bar', toBase: v => v * 1e5, fromBase: v => v / 1e5 },
          { label: 'PSI', value: 'psi', suffix: 'psi', toBase: v => v * 6894.76, fromBase: v => v / 6894.76 },
          { label: '标准大气压', value: 'atm', suffix: 'atm', toBase: v => v * 101325, fromBase: v => v / 101325 },
          { label: '毫米汞柱', value: 'mmHg', suffix: 'mmHg', toBase: v => v * 133.322, fromBase: v => v / 133.322 },
          { label: '英寸汞柱', value: 'inHg', suffix: 'inHg', toBase: v => v * 3386.39, fromBase: v => v / 3386.39 },
          { label: '米水柱', value: 'mH2O', suffix: 'mH₂O', toBase: v => v * 9806.65, fromBase: v => v / 9806.65 },
        ]
      }
    ]
  },
  // 2. Temperature
  {
    name: '温度',
    icon: '&#127777;',
    baseLabel: 'K',
    groups: [
      {
        label: '',
        units: [
          { label: '摄氏度', value: 'C', suffix: '°C', toBase: v => v + 273.15, fromBase: v => v - 273.15 },
          { label: '华氏度', value: 'F', suffix: '°F', toBase: v => (v + 459.67) * 5 / 9, fromBase: v => v * 9 / 5 - 459.67 },
          { label: '开尔文', value: 'K', suffix: 'K', toBase: v => v, fromBase: v => v },
          { label: '兰氏度', value: 'R', suffix: '°R', toBase: v => v * 5 / 9, fromBase: v => v * 9 / 5 },
        ]
      }
    ]
  },
  // 3. Flow
  {
    name: '流量',
    icon: '&#128167;',
    baseLabel: 'm³/s / kg/s',
    groups: [
      {
        label: '体积流量',
        units: [
          { label: '升/分钟', value: 'Lmin', suffix: 'L/min', group: 'vol', toBase: v => v / 60000, fromBase: v => v * 60000 },
          { label: 'CFM', value: 'CFM', suffix: 'CFM', group: 'vol', toBase: v => v * 0.000471947, fromBase: v => v / 0.000471947 },
          { label: '立方米/小时', value: 'm3h', suffix: 'm³/h', group: 'vol', toBase: v => v / 3600, fromBase: v => v * 3600 },
          { label: '立方米/秒', value: 'm3s', suffix: 'm³/s', group: 'vol', toBase: v => v, fromBase: v => v },
          { label: '升/秒', value: 'Ls', suffix: 'L/s', group: 'vol', toBase: v => v / 1000, fromBase: v => v * 1000 },
        ]
      },
      {
        label: '质量流量',
        units: [
          { label: '克/秒', value: 'gs', suffix: 'g/s', group: 'mass', toBase: v => v / 1000, fromBase: v => v * 1000 },
          { label: '千克/小时', value: 'kgh', suffix: 'kg/h', group: 'mass', toBase: v => v / 3600, fromBase: v => v * 3600 },
          { label: '千克/秒', value: 'kgs', suffix: 'kg/s', group: 'mass', toBase: v => v, fromBase: v => v },
          { label: '磅/小时', value: 'lbh', suffix: 'lb/h', group: 'mass', toBase: v => v * 0.453592 / 3600, fromBase: v => v / 0.453592 * 3600 },
        ]
      }
    ]
  },
  // 4. Torque
  {
    name: '扭矩',
    icon: '&#9881;',
    baseLabel: 'Nm',
    groups: [
      {
        label: '',
        units: [
          { label: '牛顿米', value: 'Nm', suffix: 'Nm', toBase: v => v, fromBase: v => v },
          { label: '磅-英尺', value: 'lbft', suffix: 'lb-ft', toBase: v => v * 1.35582, fromBase: v => v / 1.35582 },
          { label: '千克-米', value: 'kgm', suffix: 'kg-m', toBase: v => v * 9.80665, fromBase: v => v / 9.80665 },
          { label: '英寸-磅', value: 'inlb', suffix: 'in-lb', toBase: v => v * 0.112985, fromBase: v => v / 0.112985 },
          { label: '千牛米', value: 'kNm', suffix: 'kNm', toBase: v => v * 1000, fromBase: v => v / 1000 },
        ]
      }
    ]
  },
  // 5. Power
  {
    name: '功率',
    icon: '&#9889;',
    baseLabel: 'W',
    groups: [
      {
        label: '',
        units: [
          { label: '瓦特', value: 'W', suffix: 'W', toBase: v => v, fromBase: v => v },
          { label: '千瓦', value: 'kW', suffix: 'kW', toBase: v => v * 1000, fromBase: v => v / 1000 },
          { label: '兆瓦', value: 'MW', suffix: 'MW', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
          { label: '英制马力', value: 'hp', suffix: 'hp(英)', toBase: v => v * 745.7, fromBase: v => v / 745.7 },
          { label: '公制马力', value: 'PS', suffix: 'PS(公)', toBase: v => v * 735.5, fromBase: v => v / 735.5 },
          { label: '制动马力', value: 'bhp', suffix: 'bhp', toBase: v => v * 745.7, fromBase: v => v / 745.7 },
        ]
      }
    ]
  },
  // 6. Concentration
  {
    name: '浓度',
    icon: '&#128300;',
    baseLabel: 'ppm / mg/m³ / g/kWh',
    groups: [
      {
        label: '体积浓度',
        units: [
          { label: 'PPM', value: 'ppm', suffix: 'ppm', group: 'vol', toBase: v => v, fromBase: v => v },
          { label: '%VOL', value: 'pctvol', suffix: '%VOL', group: 'vol', toBase: v => v * 10000, fromBase: v => v / 10000 },
          { label: 'PPB', value: 'ppb', suffix: 'ppb', group: 'vol', toBase: v => v / 1000, fromBase: v => v * 1000 },
        ]
      },
      {
        label: '质量浓度',
        units: [
          { label: '毫克/立方米', value: 'mgm3', suffix: 'mg/m³', group: 'mass', toBase: v => v, fromBase: v => v },
          { label: '微克/立方米', value: 'ugm3', suffix: 'μg/m³', group: 'mass', toBase: v => v / 1000, fromBase: v => v * 1000 },
        ]
      },
      {
        label: '排放因子',
        units: [
          { label: '克/千瓦时', value: 'gkwh', suffix: 'g/kWh', group: 'energy', toBase: v => v, fromBase: v => v },
          { label: '克/马力时', value: 'ghph', suffix: 'g/hp-h', group: 'energy', toBase: v => v * 1.34102, fromBase: v => v / 1.34102 },
        ]
      }
    ]
  },
  // 7. Fuel Economy
  {
    name: '油耗',
    icon: '&#9981;',
    baseLabel: 'L/100km',
    groups: [
      {
        label: '燃油经济性',
        units: [
          { label: '升/百公里', value: 'L100km', suffix: 'L/100km', group: 'economy', toBase: v => v, fromBase: v => v },
          { label: 'MPG(美制)', value: 'MPGus', suffix: 'MPG(US)', group: 'economy', toBase: v => v <= 0 ? 0 : 235.214 / v, fromBase: v => v <= 0 ? 0 : 235.214 / v },
          { label: 'MPG(英制)', value: 'MPGuk', suffix: 'MPG(UK)', group: 'economy', toBase: v => v <= 0 ? 0 : 282.481 / v, fromBase: v => v <= 0 ? 0 : 282.481 / v },
          { label: '公里/升', value: 'kmL', suffix: 'km/L', group: 'economy', toBase: v => v <= 0 ? 0 : 100 / v, fromBase: v => v <= 0 ? 0 : 100 / v },
        ]
      },
      {
        label: '消耗率',
        units: [
          { label: '克/千瓦时', value: 'fuel_gkwh', suffix: 'g/kWh', group: 'rate_e', toBase: v => v, fromBase: v => v },
          { label: '升/小时', value: 'Lh', suffix: 'L/h', group: 'rate_vol', toBase: v => v, fromBase: v => v },
        ]
      }
    ]
  },
  // 8. Length
  {
    name: '长度',
    icon: '&#128207;',
    baseLabel: 'm',
    groups: [
      {
        label: '',
        units: [
          { label: '米', value: 'm', suffix: 'm', toBase: v => v, fromBase: v => v },
          { label: '千米', value: 'km', suffix: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
          { label: '厘米', value: 'cm', suffix: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
          { label: '毫米', value: 'mm', suffix: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
          { label: '英寸', value: 'in', suffix: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
          { label: '英尺', value: 'ft', suffix: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
          { label: '码', value: 'yd', suffix: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
          { label: '英里', value: 'mile', suffix: 'mile', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
          { label: '海里', value: 'nmi', suffix: 'nmi(海里)', toBase: v => v * 1852, fromBase: v => v / 1852 },
        ]
      }
    ]
  },
  // 9. Volume
  {
    name: '体积',
    icon: '&#128051;',
    baseLabel: 'L',
    groups: [
      {
        label: '',
        units: [
          { label: '升', value: 'L', suffix: 'L', toBase: v => v, fromBase: v => v },
          { label: '毫升', value: 'mL', suffix: 'mL', toBase: v => v / 1000, fromBase: v => v * 1000 },
          { label: '立方米', value: 'm3_vol', suffix: 'm³', toBase: v => v * 1000, fromBase: v => v / 1000 },
          { label: '加仑(美制)', value: 'galUS', suffix: 'gal(US)', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
          { label: '加仑(英制)', value: 'galUK', suffix: 'gal(UK)', toBase: v => v * 4.54609, fromBase: v => v / 4.54609 },
          { label: '夸脱', value: 'qt', suffix: 'qt', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
          { label: '品脱', value: 'pt', suffix: 'pt', toBase: v => v * 0.473176, fromBase: v => v / 0.473176 },
          { label: '液量盎司', value: 'floz', suffix: 'fl oz', toBase: v => v * 0.0295735, fromBase: v => v / 0.0295735 },
          { label: '立方英寸', value: 'in3_vol', suffix: 'in³', toBase: v => v * 0.0163871, fromBase: v => v / 0.0163871 },
          { label: '立方英尺', value: 'ft3_vol', suffix: 'ft³', toBase: v => v * 28.3168, fromBase: v => v / 28.3168 },
        ]
      }
    ]
  },
  // 10. Mass
  {
    name: '质量',
    icon: '&#9878;',
    baseLabel: 'kg',
    groups: [
      {
        label: '',
        units: [
          { label: '千克', value: 'kg', suffix: 'kg', toBase: v => v, fromBase: v => v },
          { label: '克', value: 'g', suffix: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
          { label: '毫克', value: 'mg', suffix: 'mg', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
          { label: '吨', value: 't', suffix: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
          { label: '磅', value: 'lb', suffix: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
          { label: '盎司', value: 'oz', suffix: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
          { label: '格令', value: 'grain', suffix: 'grain', toBase: v => v * 0.0000647989, fromBase: v => v / 0.0000647989 },
          { label: '斯勒格', value: 'slug', suffix: 'slug', toBase: v => v * 14.5939, fromBase: v => v / 14.5939 },
        ]
      }
    ]
  },
  // 11. Angular Velocity / Frequency
  {
    name: '角速度/频率',
    icon: '&#128260;',
    baseLabel: 'rad/s',
    groups: [
      {
        label: '',
        units: [
          { label: '转/分钟', value: 'rpm', suffix: 'rpm', toBase: v => v * Math.PI / 30, fromBase: v => v / Math.PI * 30 },
          { label: '弧度/秒', value: 'rads', suffix: 'rad/s', toBase: v => v, fromBase: v => v },
          { label: '赫兹', value: 'Hz', suffix: 'Hz', toBase: v => v * 2 * Math.PI, fromBase: v => v / (2 * Math.PI) },
          { label: '度/秒', value: 'degs', suffix: '°/s', toBase: v => v * Math.PI / 180, fromBase: v => v / Math.PI * 180 },
          { label: '转/秒', value: 'rps', suffix: 'rps', toBase: v => v * 2 * Math.PI, fromBase: v => v / (2 * Math.PI) },
        ]
      }
    ]
  },
  // 12. Viscosity
  {
    name: '粘度',
    icon: '&#128130;',
    baseLabel: 'Pa·s / m²/s',
    groups: [
      {
        label: '动力粘度',
        units: [
          { label: '帕·秒', value: 'Pas', suffix: 'Pa·s', group: 'dynamic', toBase: v => v, fromBase: v => v },
          { label: '厘泊', value: 'cP', suffix: 'cP', group: 'dynamic', toBase: v => v * 0.001, fromBase: v => v / 0.001 },
          { label: '泊', value: 'P', suffix: 'P', group: 'dynamic', toBase: v => v * 0.1, fromBase: v => v / 0.1 },
          { label: '磅/(英尺·秒)', value: 'lbfts', suffix: 'lb/(ft·s)', group: 'dynamic', toBase: v => v * 1.48816, fromBase: v => v / 1.48816 },
        ]
      },
      {
        label: '运动粘度',
        units: [
          { label: '厘斯托克斯', value: 'cSt', suffix: 'cSt', group: 'kinematic', toBase: v => v * 1e-6, fromBase: v => v / 1e-6 },
          { label: '平方米/秒', value: 'm2s_visc', suffix: 'm²/s', group: 'kinematic', toBase: v => v, fromBase: v => v },
          { label: '斯托克斯', value: 'St', suffix: 'St', group: 'kinematic', toBase: v => v * 0.0001, fromBase: v => v / 0.0001 },
        ]
      }
    ]
  }
]

// ============================================================
// State
// ============================================================
const activeIndex = ref(0)
const decimalPlaces = ref(4)
const searchQuery = ref('')
const activeSource = ref('')
const values = reactive<Record<string, number | null>>({})
const inputRefs = reactive<Record<string, HTMLInputElement>>({})
const favorites = ref<Favorite[]>([])
const isNarrow = ref(window.innerWidth < 800)

// ============================================================
// Computed
// ============================================================
const currentCategory = computed(() => categories[activeIndex.value])
const currentGroups = computed(() => currentCategory.value.groups)

const filteredCategories = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) {
    return categories.map((c, i) => ({ index: i, name: c.name, icon: c.icon, units: countAllUnits(c) }))
  }
  return categories
    .map((c, i) => ({ index: i, name: c.name, icon: c.icon, units: countAllUnits(c), match: c.name.toLowerCase().includes(q) }))
    .filter(c => c.match)
    .map(({ index, name, icon, units }) => ({ index, name, icon, units }))
})

function countAllUnits(cat: Category): string {
  const count = cat.groups.reduce((sum, g) => sum + g.units.length, 0)
  return String(count)
}

// ============================================================
// Initialization
// ============================================================
function initValues() {
  const cat = categories[activeIndex.value]
  for (const group of cat.groups) {
    for (const unit of group.units) {
      values[unit.value] = null
    }
  }
}

// Initialize with the first unit's toBase being 1
function setInitialExample() {
  const cat = categories[activeIndex.value]
  const firstGroup = cat.groups[0]
  if (!firstGroup || firstGroup.units.length === 0) return
  const first = firstGroup.units[0]
  const grp = first.group || ''
  values[first.value] = 1
  activeSource.value = first.value
  recalculate(first.value, 1, grp)
}

function recalculate(source: string, val: number, sourceGroup: string) {
  const cat = categories[activeIndex.value]
  // Find the source unit def
  let sourceUnit: UnitDef | undefined
  for (const g of cat.groups) {
    const found = g.units.find(u => u.value === source)
    if (found) { sourceUnit = found; break }
  }
  if (!sourceUnit) return

  const baseVal = sourceUnit.toBase(val)
  const grp = sourceUnit.group || ''

  for (const group of cat.groups) {
    for (const unit of group.units) {
      const uGrp = unit.group || ''
      if (uGrp !== grp) {
        values[unit.value] = null
      } else {
        values[unit.value] = unit.fromBase(baseVal)
      }
    }
  }
}

// ============================================================
// Event handlers
// ============================================================
function onInput(unitValue: string, raw: string, groupIdx: number) {
  const cat = categories[activeIndex.value]
  const group = cat.groups[groupIdx]
  const unitDef = group.units.find(u => u.value === unitValue)
  if (!unitDef) return

  const parsed = parseFloat(raw)
  if (isNaN(parsed) || raw.trim() === '') {
    // Clear only this group
    const grp = unitDef.group || ''
    for (const g of cat.groups) {
      for (const u of g.units) {
        const uGrp = u.group || ''
        if (uGrp === grp) {
          values[u.value] = null
        }
      }
    }
    activeSource.value = unitValue
    return
  }

  activeSource.value = unitValue
  const grp = unitDef.group || ''
  recalculate(unitValue, parsed, grp)
}

function onFocus(unitValue: string) {
  activeSource.value = unitValue
}

function switchCategory(idx: number) {
  activeIndex.value = idx
  activeSource.value = ''
  initValues()
  setInitialExample()
}

function formatValue(v: number | null): string {
  if (v === null || v === undefined) return ''
  return fmt(v, decimalPlaces.value)
}

// ============================================================
// Copy
// ============================================================
async function copyValue(v: number | null, label: string) {
  if (v === null || v === undefined) return
  const text = safe(v, decimalPlaces.value).toString()
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success({ message: `已复制 ${label}: ${text}`, duration: 1500 })
  } catch {
    ElMessage.warning({ message: '复制失败', duration: 1500 })
  }
}

// ============================================================
// Favorites
// ============================================================
const FAVORITES_KEY = 'unit-converter-favorites'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (raw) favorites.value = JSON.parse(raw)
  } catch { /* ignore */ }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
}

function addCurrentToFavorites() {
  const cat = currentCategory.value
  const idx = activeIndex.value
  const exists = favorites.value.some(f => f.categoryIndex === idx)
  if (exists) {
    ElMessage.info({ message: `"${cat.name}" 已在收藏夹中`, duration: 1500 })
    return
  }
  const fav: Favorite = {
    id: generateId(),
    categoryIndex: idx,
    label: cat.name
  }
  favorites.value.push(fav)
  saveFavorites()
  ElMessage.success({ message: `已收藏 "${cat.name}"`, duration: 1500 })
}

function removeFavorite(id: string) {
  favorites.value = favorites.value.filter(f => f.id !== id)
  saveFavorites()
}

function clearFavorites() {
  favorites.value = []
  saveFavorites()
}

function selectFavorite(fav: Favorite) {
  switchCategory(fav.categoryIndex)
}

// ============================================================
// Keyboard shortcut handling
// ============================================================
function handleKeydown(e: KeyboardEvent) {
  // Tab to cycle through input fields left-to-right within active group
}

// ============================================================
// Resize observer
// ============================================================
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  loadFavorites()
  initValues()
  setInitialExample()

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      isNarrow.value = entry.contentRect.width < 800
    }
  })
  const el = document.querySelector('.unit-converter')
  if (el) resizeObserver.observe(el)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped lang="scss">
/* ============================================================
   Unit Converter — Asiimov Theme
   ============================================================ */

.unit-converter {
  max-width: 1200px;
  margin: 0 auto;
}

// ---------- Header ----------
.converter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;

  .header-left {
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }
    .header-subtitle {
      font-size: 12px;
      color: var(--text-muted);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .decimal-control {
    display: flex;
    align-items: center;
    gap: 6px;
    label {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
    }
  }
}

// ---------- Favorites ----------
.favorites-bar {
  margin-bottom: 16px;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .fav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .fav-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--asiimov-primary);
      letter-spacing: 0.5px;
    }
  }

  .fav-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .fav-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 14px;
    border: 1px solid var(--border-color);
    background: var(--asiimov-white);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s;

    &:hover {
      border-color: var(--asiimov-primary);
      background: var(--asiimov-primary-glow);
    }

    &.active {
      border-color: var(--asiimov-primary);
      background: var(--asiimov-primary);
      color: white;

      .fav-remove {
        color: rgba(255,255,255,0.7);
        &:hover { color: white; }
      }
    }

    .fav-icon { font-size: 14px; }
    .fav-text { font-weight: 500; }
    .fav-remove {
      margin-left: 2px;
      font-size: 14px;
      line-height: 1;
      color: var(--text-muted);
      &:hover { color: var(--color-danger); }
    }
  }
}

// ---------- Body ----------
.converter-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;

  &.is-narrow {
    flex-direction: column;
  }
}

// ---------- Category sidebar ----------
.category-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
  position: sticky;
  top: 0;
  max-height: calc(100vh - 200px);
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }

  &.is-tabs {
    width: 100%;
    position: static;
    max-height: none;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 4px;
    overflow-y: visible;

    .category-item {
      flex: 0 0 auto;
      border-bottom: none;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      margin: 0;

      .cat-count { display: none; }
    }
  }

  .category-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    cursor: pointer;
    transition: all 0.15s;
    border-bottom: 1px solid var(--border-color);
    gap: 8px;

    &:hover {
      background: var(--bg-hover);
    }

    &.active {
      background: var(--asiimov-primary);
      color: white;

      .cat-count {
        background: rgba(255,255,255,0.2);
        color: white;
      }
    }

    .cat-icon {
      font-size: 16px;
      width: 22px;
      text-align: center;
      flex-shrink: 0;
    }

    .cat-name {
      font-size: 13px;
      font-weight: 500;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cat-count {
      font-size: 10px;
      color: var(--text-muted);
      background: var(--asiimov-gray-light);
      padding: 1px 6px;
      border-radius: 8px;
      flex-shrink: 0;
    }
  }

  .no-search-match {
    padding: 20px;
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
  }
}

// ---------- Conversion panel ----------
.conversion-panel {
  flex: 1;
  min-width: 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background: var(--asiimov-white);

    .panel-title-row {
      display: flex;
      align-items: center;
      gap: 8px;

      .panel-icon { font-size: 20px; }
      .panel-title {
        font-size: 15px;
        font-weight: 600;
      }
      .panel-base {
        font-size: 11px;
        color: var(--text-muted);
        background: var(--asiimov-gray-light);
        padding: 1px 8px;
        border-radius: 4px;
      }
    }
  }
}

// ---------- Unit groups ----------
.unit-group {
  padding: 16px 20px;

  &:not(:last-child) {
    border-bottom: 1px solid var(--asiimov-gray-light);
  }

  .group-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    margin-bottom: 12px;
  }
}

.unit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

// ---------- Unit field ----------
.unit-field {
  position: relative;
  transition: all 0.15s;

  &.is-source {
    .unit-input {
      border-color: var(--asiimov-primary);
      background: rgba(255, 136, 0, 0.04);
    }
    .unit-name {
      color: var(--asiimov-primary);
    }
  }

  .unit-label {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 4px;

    .unit-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }
    .unit-suffix {
      font-size: 11px;
      color: var(--text-muted);
    }
  }

  .unit-input-wrap {
    position: relative;
    display: flex;
    align-items: center;

    .unit-input {
      width: 100%;
      padding: 7px 36px 7px 10px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-family: 'Consolas', 'Menlo', 'Courier New', monospace;
      color: var(--text-primary);
      background: var(--bg-input);
      outline: none;
      transition: all 0.15s;

      &:focus {
        border-color: var(--asiimov-primary);
        box-shadow: 0 0 0 3px var(--asiimov-primary-glow);
      }

      &::placeholder {
        color: var(--text-muted);
        font-family: inherit;
      }

      &:disabled {
        background: var(--asiimov-gray-light);
        color: var(--text-muted);
        cursor: not-allowed;
      }

      &.is-cross {
        color: var(--text-muted);
        font-style: italic;
      }
    }

    .copy-btn {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-muted);
      transition: all 0.15s;
      opacity: 0;

      &:hover {
        background: var(--asiimov-primary-glow);
        color: var(--asiimov-primary);
      }
    }

    &:hover .copy-btn {
      opacity: 1;
    }
  }
}

// ---------- Responsive ----------
@media (max-width: 800px) {
  .unit-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  .converter-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .unit-grid {
    grid-template-columns: 1fr;
  }
  .conversion-panel .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
