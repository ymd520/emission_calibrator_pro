<template>
  <div class="encyclopedia-page">
    <div class="content-layout">
      <!-- Left Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>技术百科</span>
        </div>
        <nav class="tree-nav">
          <div
            v-for="(node, idx) in topicTree"
            :key="idx"
            class="tree-section"
          >
            <div
              class="tree-section-header"
              :class="{ expanded: node.expanded }"
              @click="node.expanded = !node.expanded"
            >
              <span class="section-arrow">{{ node.expanded ? '▼' : '▶' }}</span>
              <span class="section-icon">{{ node.icon }}</span>
              <span class="section-label">{{ node.label }}</span>
            </div>
            <div v-if="node.expanded" class="tree-section-children">
              <template v-for="(child, cIdx) in node.children" :key="cIdx">
                <!-- Leaf topic -->
                <div
                  v-if="!child.children"
                  class="tree-leaf"
                  :class="{ selected: selectedTopic === child.id }"
                  @click="selectTopic(child.id)"
                >
                  {{ child.label }}
                </div>
                <!-- Sub-section -->
                <div v-else class="tree-subsection">
                  <div
                    class="subsection-header"
                    :class="{ expanded: child.expanded }"
                    @click="child.expanded = !child.expanded"
                  >
                    <span class="subsection-arrow">{{ child.expanded ? '▼' : '▶' }}</span>
                    <span>{{ child.label }}</span>
                  </div>
                  <div v-if="child.expanded" class="subsection-children">
                    <div
                      v-for="(sub, sIdx) in child.children"
                      :key="sIdx"
                      class="tree-leaf tree-leaf-deep"
                      :class="{ selected: selectedTopic === sub.id }"
                      @click="selectTopic(sub.id)"
                    >
                      {{ sub.label }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Right Content -->
      <main class="main-content">
        <!-- Welcome state -->
        <div v-if="!selectedTopic" class="welcome-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <h2>欢迎查阅排放技术百科</h2>
          <p>请从左侧选择您感兴趣的技术主题</p>
          <div class="quick-links">
            <div
              v-for="topic in quickTopics"
              :key="topic.id"
              class="quick-link-card"
              @click="selectTopic(topic.id)"
            >
              <span class="ql-icon">{{ topic.icon }}</span>
              <span class="ql-label">{{ topic.label }}</span>
            </div>
          </div>
        </div>

        <!-- Article content -->
        <div v-if="selectedTopic && currentArticle" class="article">
          <div class="article-header">
            <h1 class="article-title">{{ currentArticle.title }}</h1>
            <p v-if="currentArticle.summary" class="article-summary">{{ currentArticle.summary }}</p>
          </div>

          <div class="article-body">
            <template v-for="(section, sIdx) in currentArticle.sections" :key="sIdx">
              <!-- Regular text section -->
              <div v-if="section.type === 'text'" class="text-section">
                <h2 v-if="section.heading" class="section-heading">{{ section.heading }}</h2>
                <p v-for="(para, pIdx) in section.content" :key="pIdx" class="section-text">{{ para }}</p>
              </div>

              <!-- Sub-section with expand/collapse -->
              <div v-if="section.type === 'expandable'" class="expandable-section">
                <div class="expandable-header" @click="toggleSection(sIdx)">
                  <span class="expandable-arrow">{{ expandedSections[sIdx] ? '▼' : '▶' }}</span>
                  <span class="expandable-title">{{ section.heading }}</span>
                </div>
                <div v-if="expandedSections[sIdx]" class="expandable-body">
                  <p v-for="(para, pIdx) in section.content" :key="pIdx" class="section-text">{{ para }}</p>
                </div>
              </div>

              <!-- Callout / Info box -->
              <div v-if="section.type === 'callout'" class="callout-box" :class="'callout-' + (section.variant || 'info')">
                <div class="callout-header">
                  <span v-if="section.icon" class="callout-icon">{{ section.icon }}</span>
                  <strong>{{ section.heading }}</strong>
                </div>
                <p class="callout-body">{{ section.content }}</p>
              </div>

              <!-- Table section -->
              <div v-if="section.type === 'table'" class="table-section">
                <h3 v-if="section.heading" class="section-heading-sm">{{ section.heading }}</h3>
                <div class="table-wrapper">
                  <table class="article-table">
                    <thead>
                      <tr>
                        <th v-for="(header, hIdx) in section.headers" :key="hIdx">{{ header }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, rIdx) in section.rows" :key="rIdx">
                        <td v-for="(cell, cIdx) in row" :key="cIdx">{{ cell }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Image placeholder -->
              <div v-if="section.type === 'image'" class="image-placeholder">
                <div class="placeholder-box">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <span class="placeholder-caption">{{ section.caption }}</span>
                </div>
              </div>

              <!-- Formula section -->
              <div v-if="section.type === 'formula'" class="formula-box">
                <div class="formula-content">{{ section.content }}</div>
                <p v-if="section.caption" class="formula-caption">{{ section.caption }}</p>
              </div>

              <!-- List section -->
              <div v-if="section.type === 'list'" class="list-section">
                <h3 v-if="section.heading" class="section-heading-sm">{{ section.heading }}</h3>
                <ul class="article-list">
                  <li v-for="(item, lIdx) in section.items" :key="lIdx">
                    <strong v-if="item.label">{{ item.label }}:</strong>
                    {{ item.text }}
                  </li>
                </ul>
              </div>
            </template>
          </div>

          <!-- Tags -->
          <div v-if="currentArticle.tags" class="article-tags">
            <span
              v-for="tag in currentArticle.tags"
              :key="tag"
              class="article-tag"
              @click="selectTopic(tag)"
            >{{ tag }}</span>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

/* ============================================================
   TYPES
   ============================================================ */
interface ArticleSection {
  type: 'text' | 'expandable' | 'callout' | 'table' | 'image' | 'formula' | 'list'
  heading?: string
  content?: string | string[]
  variant?: 'info' | 'tip' | 'warning' | 'danger'
  icon?: string
  caption?: string
  headers?: string[]
  rows?: string[][]
  items?: { label?: string; text: string }[]
}

interface Article {
  id: string
  title: string
  summary: string
  sections: ArticleSection[]
  tags?: string[]
}

interface TopicChild {
  id: string
  label: string
  children?: TopicChild[]
  expanded?: boolean
}

interface TopicSection {
  icon: string
  label: string
  expanded: boolean
  children: TopicChild[]
}

/* ============================================================
   STATE
   ============================================================ */
const selectedTopic = ref<string | null>(null)
const expandedSections = reactive<Record<number, boolean>>({})

function toggleSection(idx: number) {
  expandedSections[idx] = !expandedSections[idx]
}

/* ============================================================
   TOPIC TREE
   ============================================================ */
const topicTree = ref<TopicSection[]>([
  {
    icon: '🔧', label: '发动机原理', expanded: false,
    children: [
      { id: 'four-stroke', label: '四冲程发动机' },
      { id: 'diesel-vs-gasoline', label: '柴油机 vs 汽油机' },
      { id: 'lean-burn-gdi', label: '稀薄燃烧与直喷' },
    ]
  },
  {
    icon: '🌫️', label: '后处理系统', expanded: false,
    children: [
      { id: 'twc', label: 'TWC 三元催化器' },
      { id: 'dpf', label: 'DPF 颗粒捕集器' },
      { id: 'scr', label: 'SCR 选择性催化还原' },
      { id: 'doc', label: 'DOC 氧化催化器' },
      { id: 'lnt', label: 'LNT 稀燃NOx捕集器' },
      { id: 'asc', label: 'ASC 氨逃逸催化器' },
    ]
  },
  {
    icon: '📏', label: '排放测量设备', expanded: false,
    children: [
      { id: 'ndir', label: 'NDIR (CO/CO₂)' },
      { id: 'cld', label: 'CLD (NO/NOx)' },
      { id: 'fid', label: 'FID (THC)' },
      { id: 'combustion-analyzer', label: '燃烧分析仪', expanded: false, children: [
        { id: 'cylinder-pressure', label: '缸压传感器安装' },
        { id: 'crank-encoder', label: '曲柄转角编码器' },
        { id: 'hrr-analysis', label: '放热率分析' },
      ]},
      { id: 'fuel-flow-meter', label: '油耗仪', expanded: false, children: [
        { id: 'avl735', label: '质量法 (AVL 735)' },
        { id: 'volumetric-flow', label: '容积法' },
        { id: 'carbon-balance', label: '碳平衡法油耗测量' },
      ]},
      { id: 'smoke-meter', label: '烟度计', expanded: false, children: [
        { id: 'filter-smoke', label: '滤纸式 (Bosch)' },
        { id: 'opacimeter', label: '不透光式 (AVL)' },
        { id: 'pn-counter', label: 'PN 计数器' },
      ]},
      { id: 'cvs', label: 'CVS 稀释采样' },
      { id: 'particulate-weighing', label: '颗粒物称重法' },
      { id: 'pems', label: 'PEMS 便携式测量' },
    ]
  },
  {
    icon: '🔬', label: '传感器技术', expanded: false,
    children: [
      { id: 'thermocouple-types', label: '热电偶 (K/T/J/N/S/R型)', expanded: false, children: [
        { id: 'type-k', label: 'K型：-200~1260°C' },
        { id: 'cold-junction', label: '冷端补偿方法' },
        { id: 'thermocouple-install', label: '安装要求 (插入深度)' },
      ]},
      { id: 'pt100', label: 'PT100/PT1000' },
      { id: 'pressure-sensor', label: '压力传感器' },
      { id: 'o2-sensor', label: '氧传感器' },
      { id: 'flow-sensor', label: '流量传感器 (MAF/MAP)' },
      { id: 'sensor-calibration', label: '传感器校准总则' },
    ]
  },
  {
    icon: '🧪', label: '测试循环', expanded: false,
    children: [
      { id: 'wltc', label: 'WLTC (Class 1/2/3)' },
      { id: 'nedc', label: 'NEDC' },
      { id: 'ftp75', label: 'FTP-75' },
      { id: 'rde', label: 'RDE' },
      { id: 'whtc-whsc', label: 'WHTC/WHSC' },
      { id: 'nrtc-nrsc', label: 'NRTC/NRSC' },
    ]
  },
  {
    icon: '🔌', label: 'OBD 系统', expanded: false,
    children: [
      { id: 'obd1-2', label: 'OBD I / II' },
      { id: 'eobd-jobd', label: 'EOBD / JOBD' },
      { id: 'wwh-obd', label: 'WWH-OBD' },
      { id: 'monitor-iupr', label: '监控器与 IUPR' },
    ]
  },
  {
    icon: '⚡', label: 'ECU 调校', expanded: false,
    children: [
      { id: 'fuel-map', label: '燃油 MAP' },
      { id: 'ignition-map', label: '点火 MAP' },
      { id: 'open-vs-closed', label: '开环 vs 闭环' },
    ]
  },
  {
    icon: '📊', label: '测量不确定度', expanded: false,
    children: [
      { id: 'gum', label: 'GUM 方法' },
      { id: 'type-a-b', label: 'A类/B类评定' },
      { id: 'emission-uncertainty', label: '排放不确定度实例' },
    ]
  },
  {
    icon: '🏗️', label: '实验室建设', expanded: false,
    children: [
      { id: 'lab-environment', label: '环境要求' },
      { id: 'dynamometer-install', label: '测功机安装' },
      { id: 'lab-safety', label: '安全规范' },
    ]
  },
  {
    icon: '✅', label: 'QA/QC 与维护', expanded: false,
    children: [
      { id: 'daily-maintenance', label: '日常维护' },
      { id: 'interim-check', label: '期间核查' },
      { id: 'qc-chart', label: '质控图' },
    ]
  },
  {
    icon: '📋', label: '测试准备 Checklist', expanded: false,
    children: [
      { id: 'test-checklist', label: '测试准备 Checklist' },
    ]
  },
])

/* ============================================================
   ARTICLES DATA
   ============================================================ */
const articles: Record<string, Article> = {
  /* ============ 发动机原理 ============ */
  'four-stroke': {
    id: 'four-stroke',
    title: '四冲程发动机',
    summary: '四冲程发动机是汽车发动机的基本形式，通过进气、压缩、做功、排气四个活塞行程完成一次能量转换。',
    tags: ['engine-principle', 'thermocouple-types'],
    sections: [
      { type: 'text', heading: '概述', content: [
        '四冲程发动机（Four-stroke engine）由德国工程师尼古拉斯·奥托（Nikolaus Otto）于1876年发明，又称奥托循环发动机。它通过四个独立的活塞行程——进气、压缩、做功、排气——将燃料的化学能转化为机械能。曲轴每旋转两圈（720°）完成一个完整的工作循环。',
        '所有现代汽车用内燃机（包括汽油机和柴油机）均基于四冲程原理工作。其热效率通常在25%-45%之间，取决于具体设计和技术水平。',
      ]},
      { type: 'text', heading: '四个冲程详解', content: [
        '进气冲程（Intake Stroke）：活塞从上止点（TDC）向下止点（BDC）运动，进气门开启，排气门关闭。由于活塞下行产生的负压，新鲜空气（柴油机）或空气-燃料混合气（汽油机）被吸入气缸。曲轴旋转0°-180°。',
        '压缩冲程（Compression Stroke）：活塞从BDC向TDC运动，进排气门均关闭。气缸内的工质被压缩，压力和温度显著升高。汽油机压缩比约9:1-12:1，压缩终了温度约300-400°C；柴油机压缩比约15:1-22:1，终了温度可达500-700°C。曲轴旋转180°-360°。',
        '做功冲程（Power Stroke）：压缩冲程末，火花塞点燃（汽油机）或燃油喷入自燃（柴油机）引发燃烧。高温高压气体推动活塞从TDC向BDC运动，通过连杆驱动曲轴旋转做功。燃烧室压力峰值可达50-200 bar。曲轴旋转360°-540°。',
        '排气冲程（Exhaust Stroke）：活塞再次从BDC向TDC运动，排气门开启，进气门关闭。燃烧后的废气被活塞推出气缸，经排气歧管进入排气系统。曲轴旋转540°-720°。',
      ]},
      { type: 'callout', heading: '气门重叠角', content: '在排气冲程末和进气冲程初，排气门尚未完全关闭、进气门已提前开启，这段进排气门同时开启的曲轴转角称为气门重叠角。合理的气门重叠角可以利用废气惯性扫气，提高充气效率。涡轮增压发动机的气门重叠角通常小于自然吸气发动机，以避免废气倒灌。', variant: 'info', icon: '💡' },
      { type: 'expandable', heading: '配气相位优化', content: [
        '配气相位（Valve Timing）指进排气门开启和关闭的时刻，以曲轴转角表示。典型的配气相位参数包括：进气提前角（IVO，通常为上止点前10°-30°）、进气迟后角（IVC，下止点后30°-60°）、排气提前角（EVO，下止点前40°-70°）、排气迟后角（EVC，上止点后10°-30°）。',
        '可变气门正时（VVT）技术允许根据发动机转速和负荷动态调整配气相位。低速时减小气门重叠角以提高怠速稳定性，高速时增大以提升进气效率。连续可变气门升程（如BMW Valvetronic、本田i-VTEC）进一步优化了泵气损失。',
      ]},
      { type: 'table', heading: '四冲程发动机基本参数对比', headers: ['参数', '汽油机', '柴油机'], rows: [
        ['压缩比', '9:1 - 12:1', '15:1 - 22:1'],
        ['热效率', '25% - 37%', '35% - 45%'],
        ['转速范围', '600 - 7000 rpm', '600 - 4500 rpm'],
        ['点火方式', '火花塞点火', '压燃自燃'],
        ['燃油喷射', '进气道/缸内直喷', '缸内高压直喷'],
        ['排放特点', 'HC/CO较高, PM低', 'NOx/PM较高, HC低'],
      ]},
      { type: 'image', caption: '图：四冲程发动机工作循环示意图（曲轴转角-压力图）' },
    ]
  },
  'diesel-vs-gasoline': {
    id: 'diesel-vs-gasoline',
    title: '柴油机 vs 汽油机',
    summary: '柴油机和汽油机虽然同属内燃机，但在工作原理、燃料特性、性能和排放方面存在本质差异。',
    tags: ['four-stroke', 'lean-burn-gdi'],
    sections: [
      { type: 'text', heading: '基本原理差异', content: [
        '汽油机（Spark Ignition, SI）采用奥托循环，利用火花塞点燃预混合的可燃混合气。燃料与空气在进入气缸前（进气道喷射）或在缸内（直喷）预先混合，需要将空燃比控制在可燃范围（约12:1-18:1）内。',
        '柴油机（Compression Ignition, CI）采用狄塞尔循环，仅压缩纯空气，在压缩冲程末期将燃油高压喷入高温空气中使其自燃。柴油机始终在过量空气条件下工作（空燃比18:1-70:1），通过调节喷油量控制功率输出。',
        '这一根本差异导致了两者在结构、性能和控制策略上的全面分化。',
      ]},
      { type: 'table', heading: '核心性能对比', headers: ['指标', '汽油机', '柴油机'], rows: [
        ['热效率', '25-37%', '35-45%'],
        ['功率密度 (kW/L)', '50-130', '30-70'],
        ['扭矩特性', '高转速高扭矩', '低转速高扭矩'],
        ['燃油消耗率 (g/kWh)', '220-280', '180-230'],
        ['噪音水平', '较低', '较高（柴油爆震）'],
        ['制造成本', '较低', '较高（高压喷射系统）'],
        ['排放后处理', 'TWC（汽油）', 'DOC+DPF+SCR（柴油）'],
      ]},
      { type: 'callout', heading: '柴油机的NOx-PM权衡', content: '柴油机燃烧过程中存在经典的NOx-PM权衡关系（Trade-off）。当燃烧温度升高时，NOx生成增加但PM减少；反之，降低燃烧温度减少NOx但增加PM。这一矛盾使得柴油机排放控制极为复杂，需要同时应用EGR降低NOx和DPF捕集PM。', variant: 'warning', icon: '⚠️' },
      { type: 'text', heading: '燃烧过程特点', content: [
        '汽油机燃烧：火焰前锋从火花塞处向四周传播，燃烧速度受火焰传播速度限制。爆震（Knock）是汽油机特有的非正常燃烧现象，发生在火焰前锋到达之前末端混合气自燃，产生高频压力脉冲。爆震控制通过爆震传感器监测并推迟点火提前角来实现。',
        '柴油机燃烧：燃油喷入高温空气后经历物理延迟（雾化、蒸发）和化学延迟（预混合反应），随后发生预混合燃烧和扩散燃烧。预混合燃烧阶段决定压力升高率和噪音，扩散燃烧阶段决定碳烟生成。现代柴油机通过高压共轨（2000-2500 bar）和多段喷射优化燃烧过程。',
      ]},
      { type: 'expandable', heading: '燃料特性对比', content: [
        '汽油：馏程30-200°C，十六烷值（RON）90-98，自燃温度约350°C，低润滑性，挥发性高。汽油的抗爆性用辛烷值表征。',
        '柴油：馏程160-360°C，十六烷值（CN）40-55，自燃温度约250°C，具有润滑性，挥发性低。柴油的自燃性用十六烷值表征。',
        '能量密度：汽油约32 MJ/L，柴油约36 MJ/L。柴油体积能量密度高约12%，这也是柴油车油耗更低的原因之一。',
      ]},
    ]
  },
  'lean-burn-gdi': {
    id: 'lean-burn-gdi',
    title: '稀薄燃烧与直喷技术',
    summary: '稀薄燃烧和缸内直喷（GDI）是实现汽油机高效低排放的两大核心技术。',
    tags: ['four-stroke', 'diesel-vs-gasoline', 'fuel-map'],
    sections: [
      { type: 'text', heading: '稀薄燃烧原理', content: [
        '稀薄燃烧（Lean Burn）指发动机在空燃比大于理论空燃比（14.7:1）的条件下工作，通常可达22:1-40:1甚至更高。稀燃条件下，由于过量空气的存在，燃烧更充分，HC和CO排放降低；同时燃烧温度降低，减少了传热损失，热效率可提高10%-20%。',
        '但是，稀燃也带来挑战：过量空气降低了火焰传播速度，导致燃烧不稳定甚至失火；NOx排放反而因过量氧气存在而难以用TWC还原。',
      ]},
      { type: 'text', heading: '缸内直喷（GDI）技术', content: [
        '涡轮增压缸内直喷（TGDI）是目前主流汽油机技术。燃油直接喷入气缸内，利用燃油蒸发吸热冷却缸内混合气，有效抑制爆震，从而允许更高的压缩比（10:1-12:5:1）和涡轮增压，显著提升功率密度和热效率。',
        'GDI喷油器安装在气缸盖上，喷射压力可达200-500 bar。喷油策略包括：均质燃烧模式（早期喷射，形成均匀混合气，适合高负荷）、分层燃烧模式（压缩冲程后期喷射，火花塞周围形成浓混合气，外围稀薄，适合低负荷稀燃）。',
      ]},
      { type: 'table', heading: 'GDI关键技术参数', headers: ['参数', '进气道喷射 (PFI)', '缸内直喷 (GDI)'], rows: [
        ['燃油压力', '3-5 bar', '50-500 bar'],
        ['压缩比上限', '~10:1', '~12.5:1'],
        ['功率提升潜力', '基准', '+10-15%'],
        ['燃油经济性提升', '基准', '+10-20%'],
        ['PM排放', '很低', '较高（需GPF）'],
        ['进气门积碳', '较少（燃油清洁）', '较多（无燃油清洁）'],
      ]},
      { type: 'callout', heading: 'GDI的颗粒物排放问题', content: '与进气道喷射（PFI）相比，GDI发动机由于燃油与空气混合时间短，喷油器壁面油膜等原因，颗粒物（PM/PN）排放显著增加，可达PFI的10倍以上。因此装备GDI的车辆通常需要加装汽油颗粒捕集器（GPF）以满足国Ⅵb/Euro 6d的PN限值。', variant: 'danger', icon: '🔴' },
    ]
  },

  /* ============ 后处理系统 ============ */
  'twc': {
    id: 'twc',
    title: 'TWC 三元催化器',
    summary: '三元催化转化器（Three-Way Catalyst）是汽油车最重要的排放后处理装置，能同时净化CO、HC和NOx三种污染物。',
    tags: ['doc', 'o2-sensor', 'open-vs-closed'],
    sections: [
      { type: 'text', heading: '工作原理', content: [
        'TWC利用贵金属催化剂（铂Pt、钯Pd、铑Rh），在高温下同时促进三种反应：CO氧化为CO₂（2CO + O₂ → 2CO₂）、HC氧化为CO₂和H₂O（CxHy + (x+y/4)O₂ → xCO₂ + y/2 H₂O）、NOx还原为N₂（2NO + 2CO → N₂ + 2CO₂）。',
        'TWC的关键要求是必须在理论空燃比（λ=1.0，A/F=14.7:1）附近工作。当λ<1（浓混合气）时，CO和HC转化效率高但NOx还原不足；当λ>1（稀混合气）时，NOx还原效率高但CO和HC氧化不充分。只有在λ=1的狭窄窗口内（约±0.5%），三种污染物的转化效率均可达90%以上。',
      ]},
      { type: 'callout', heading: 'λ控制窗口', content: 'TWC的转化效率窗口（Window）非常狭窄。氧传感器（λ传感器）安装在前端（前氧）和后端（后氧），通过闭环控制将空燃比精确维持在理论值附近。前氧信号用于短期燃油修正，后氧信号用于监控TWC的储氧能力和催化效率。', variant: 'info', icon: '💡' },
      { type: 'table', heading: 'TWC各污染物转化效率', headers: ['空燃比', 'CO转化率', 'HC转化率', 'NOx转化率'], rows: [
        ['λ=0.95 (浓)', '~60%', '~70%', '~30%'],
        ['λ=1.00', '>95%', '>95%', '>95%'],
        ['λ=1.05 (稀)', '~70%', '~75%', '~60%'],
        ['λ=1.15', '<50%', '<50%', '~85%'],
      ]},
      { type: 'expandable', heading: 'TWC老化与失效', content: [
        'TWC的使用寿命通常为8-10万公里（原厂件）。主要失效模式包括：热老化（>900°C导致贵金属烧结，比表面积降低）、化学中毒（铅、磷、硫等元素覆盖活性位点）、物理损坏（振动导致陶瓷载体碎裂）、油污堵塞（机油燃烧产生的积碳）。',
        'TWC失效的诊断：OBD通过后氧传感器信号波动频率判断TWC转换效率。当后氧信号波动幅度接近前氧时（储氧能力下降），触发催化器效率低于阈值的故障码（如P0420）。',
      ]},
    ]
  },
  'dpf': {
    id: 'dpf',
    title: 'DPF 颗粒捕集器',
    summary: '柴油颗粒捕集器（Diesel Particulate Filter）是捕集柴油机排气中颗粒物（PM）的关键后处理装置，捕集效率可达99%以上。',
    tags: ['doc', 'scr', 'pn-counter'],
    sections: [
      { type: 'text', heading: '结构与原理', content: [
        'DPF通常采用壁流式（Wall-Flow）陶瓷蜂窝结构，由堇青石（Cordierite）或碳化硅（SiC）制成。相邻通道交替堵塞两端，迫使排气通过多孔壁面进入相邻通道，颗粒物被捕集在壁面上。过滤效率极高，可捕集粒径小至10nm的颗粒。',
        'DPF载体壁面的孔隙率、平均孔径和微观结构是决定过滤效率和背压的关键参数。典型的壁面厚度为0.3-0.5mm，孔隙率约50%-65%，平均孔径10-30μm。',
      ]},
      { type: 'text', heading: '再生技术', content: [
        '捕集的颗粒物必须定期清除以防止DPF堵塞，这一过程称为再生（Regeneration）。再生方式分为三种：',
        '被动再生：在正常排气温度（200-350°C）下，利用NO₂与碳烟发生连续氧化反应（C + NO₂ → CO + NO），需要前置DOC将NO氧化为NO₂。低速运行时机较少。',
        '主动再生：当DPF背压达到设定阈值时，ECU主动提高排气温度至550-650°C，通过后喷（Post Injection）或额外燃油喷射在DOC中氧化放热，使DPF入口温度达到再生要求。碳烟与O₂反应（C + O₂ → CO₂）。',
        '强制再生：在维修站使用专用设备进行的离线再生，通过控制喷油量和进气量精确控制DPF温度和再生速率。',
      ]},
      { type: 'callout', heading: '再生引发的机油稀释问题', content: '频繁的后喷再生会导致未燃烧的燃油沿缸壁进入油底壳，造成机油稀释（Fuel Dilution）。研究表明，过度的主动再生可使机油燃油稀释率超过5%，导致机油润滑性能严重下降，甚至引发拉缸等严重发动机故障。', variant: 'warning', icon: '⚠️' },
      { type: 'table', heading: 'DPF常见故障', headers: ['故障', '原因', '诊断方法'], rows: [
        ['DPF堵塞', '再生不充分，低负荷运行', '背压传感器读数异常，>300 mbar'],
        ['DPF破裂', '热冲击，温差过大', '目视检查，排气烟度异常'],
        ['灰分堆积', '机油燃烧产物的不可燃残留', 'DPF重量法分析，不可再生'],
        ['再生失败', '喷油器故障，传感器故障', '诊断仪读取再生计数器'],
      ]},
    ]
  },
  'scr': {
    id: 'scr',
    title: 'SCR 选择性催化还原',
    summary: '选择性催化还原（Selective Catalytic Reduction）是降低柴油机NOx排放最有效的技术，通过向排气中喷入尿素水溶液将NOx还原为N₂。',
    tags: ['asc', 'doc', 'dpf', 'o2-sensor'],
    sections: [
      { type: 'text', heading: '工作原理', content: [
        'SCR系统向排气管中喷入AdBlue（32.5%尿素水溶液，又称DEF），尿素在高温下水解产生氨气（NH₃），然后在SCR催化剂表面将NO和NO₂选择性还原为N₂和H₂O。',
        '主要化学反应：4NO + 4NH₃ + O₂ → 4N₂ + 6H₂O（标准SCR反应）；NO + NO₂ + 2NH₃ → 2N₂ + 3H₂O（快速SCR反应，速度更快）；2NO₂ + 4NH₃ + O₂ → 3N₂ + 6H₂O（NO₂-SCR反应，速率较慢）。',
        '快速SCR反应速率比标准SCR反应快约10倍，因此DOC将部分NO氧化为NO₂（使NO:NO₂≈1:1）可显著提升SCR在低温（200-300°C）下的转化效率。',
      ]},
      { type: 'table', heading: 'SCR系统关键组件', headers: ['组件', '功能', '典型参数'], rows: [
        ['尿素箱', '储存AdBlue', '容量5-30L，加热防冻'],
        ['尿素泵', '加压输送尿素', '压力5-9 bar'],
        ['尿素喷嘴', '计量喷射', '流量50-300 ml/h'],
        ['SCR催化剂', '催化还原反应', 'V₂O₅-WO₃/TiO₂ 或 Cu-CHA'],
        ['NOx传感器', '监测NOx浓度', '测量范围0-1500 ppm'],
        ['氨逃逸催化剂(ASC)', '防止NH₃泄漏', '位于SCR下游'],
      ]},
      { type: 'callout', heading: '尿素消耗量', content: 'AdBlue消耗量约为柴油消耗量的4-6%（质量比），即每消耗100升柴油约消耗4-6升AdBlue。实际消耗取决于发动机NOx原始排放和SCR转化效率。NOx转化效率每提高10%，尿素消耗约增加15%。', variant: 'info', icon: '💡' },
      { type: 'expandable', heading: 'SCR催化剂材料', content: [
        '钒基催化剂（V₂O₅-WO₃/TiO₂）：工作温度窗口250-450°C，低温活性较差，抗硫性好，成本较低。但V₂O₅有生物毒性，且高温（>650°C）下不稳定。多用于早期重型车系统。',
        'Cu-CHA分子筛催化剂（Cu-SAPO-34 / Cu-SSZ-13）：工作温度窗口150-550°C，低温活性优异，水热稳定性好（>750°C），SCR选择性高。缺点是抗硫性和抗HC中毒能力较差。已成为重型柴油车和轻型柴油车的主流选择。',
        'Fe-分子筛催化剂（Fe-ZSM-5）：高温活性好（>400°C），但低温活性不如Cu-CHA。常用于双SCR系统（前Cu-CHA + 后Fe-ZSM-5）以拓宽温度窗口。',
      ]},
    ]
  },
  'doc': {
    id: 'doc',
    title: 'DOC 氧化催化器',
    summary: '柴油氧化催化器（Diesel Oxidation Catalyst）用于氧化CO、HC和颗粒物中的可溶性有机组分（SOF），并产生NO₂用于DPF再生。',
    tags: ['dpf', 'scr', 'twc'],
    sections: [
      { type: 'text', heading: '功能与原理', content: [
        'DOC通常安装在柴油发动机排气管的最前端（紧耦合或近耦合位置），是排气进入DPF和SCR系统前的第一道后处理装置。其核心功能包括：',
        '1. 氧化CO和HC：2CO + O₂ → 2CO₂；CxHy + (x+y/4)O₂ → xCO₂ + y/2 H₂O。CO转化率通常>90%，HC转化率>85%。',
        '2. 氧化NO为NO₂：2NO + O₂ → 2NO₂。产生的NO₂用于DPF被动再生（氧化碳烟）和快速SCR反应。',
        '3. 氧化SOF（可溶性有机组分）：颗粒物中的可溶性有机成分在DOC中被氧化，降低PM排放。',
      ]},
      { type: 'callout', heading: 'DOC的低温性能', content: 'DOC的转化效率高度依赖排气温度。Light-off温度约200-250°C（起燃温度），低于此温度时几乎无催化活性。冷启动阶段大量污染物未经处理直接排放。催化剂配方的优化目标之一是降低起燃温度至150°C以下。', variant: 'warning', icon: '⚠️' },
      { type: 'table', heading: 'DOC技术参数', headers: ['参数', '典型值', '说明'], rows: [
        ['载体材料', '堇青石/金属', '陶瓷或金属蜂窝'],
        ['涂层', 'Pt/Pd/Al₂O₃', '铂族金属负载量10-150 g/ft³'],
        ['空速', '30,000-100,000 h⁻¹', '排气体积流量/催化剂体积'],
        ['转化效率CO', '>90% @250°C', '起燃温度后急剧上升'],
        ['转化效率HC', '85-95% @300°C', '取决于HC组分和空速'],
        ['NO₂生成率', '30-60%', '受排气温度和Pt含量影响'],
      ]},
      { type: 'expandable', heading: 'DOC的硫中毒', content: [
        '柴油中的硫含量虽然已经降至10ppm以下（国Ⅵ/欧Ⅵ标准），但DOC中的Pt基催化剂对硫极为敏感。SO₂在DOC中被氧化为SO₃，进而与H₂O反应生成硫酸（H₂SO₄），在低温下形成硫酸盐颗粒，既增加PM排放又降低催化剂活性。',
        '硫中毒可通过高温脱硫再生（通常>500°C，稀燃条件下约30分钟）部分恢复。但频繁的硫中毒-脱硫循环会加速催化剂老化。',
      ]},
    ]
  },
  'lnt': {
    id: 'lnt',
    title: 'LNT 稀燃NOx捕集器',
    summary: '稀燃NOx捕集器（Lean NOx Trap）在稀燃条件下吸附NOx，在短暂的浓燃条件下释放并还原为N₂。主要用于汽油稀燃直喷发动机。',
    tags: ['scr', 'twc', 'fuel-map'],
    sections: [
      { type: 'text', heading: '工作原理', content: [
        'LNT（又称NSR - NOx Storage Reduction）在稀燃阶段（λ>1）将NO氧化为NO₂，然后以硝酸盐（Ba(NO₃)₂）形式储存在涂层中的碱土金属（通常为BaO或BaCO₃）上。当NOx储存接近饱和时（30-90秒周期），ECU短时加浓混合气（λ≈0.8-0.9，持续2-5秒），使排气中产生大量还原性气体（CO、HC、H₂），将硝酸盐还原为N₂。',
        '这一工作模式需要精确的浓稀切换控制，包括对储存时间和再生时间的优化。再生时间过短会导致NOx释放不完全，过长则造成燃油经济性损失。',
      ]},
      { type: 'table', heading: 'LNT vs SCR 对比', headers: ['特性', 'LNT', 'SCR'], rows: [
        ['NOx转化效率', '60-85%', '85-98%'],
        ['适用温度', '200-450°C', '150-550°C'],
        ['燃油经济性影响', '-3%~-6%', '几乎无影响'],
        ['额外消耗品', '无', '需要AdBlue'],
        ['系统成本', '中等', '较高'],
        ['硫敏感性', '极高', '较低'],
      ]},
      { type: 'callout', heading: 'LNT的硫再生', content: 'LNT对硫极为敏感，BaSO₄比Ba(NO₃)₂更稳定，导致硫中毒后储存容量急剧下降。脱硫再生需要在600-700°C的浓燃条件下运行，过程复杂且会加速催化剂老化。因此LNT技术仅适用于低硫燃料（<10ppm）。', variant: 'danger', icon: '🔴' },
    ]
  },
  'asc': {
    id: 'asc',
    title: 'ASC 氨逃逸催化器',
    summary: '氨逃逸催化器（Ammonia Slip Catalyst）安装在SCR下游，用于氧化未反应的逃逸氨（NH₃），防止氨泄漏到大气中。',
    tags: ['scr', 'doc'],
    sections: [
      { type: 'text', heading: '工作原理', content: [
        'ASC位于SCR系统的末端，其作用是将SCR反应后残余的NH₃选择性氧化为N₂和H₂O，而非产生有害的NOx或N₂O。',
        '理想反应：4NH₃ + 3O₂ → 2N₂ + 6H₂O。但副反应不可避免：4NH₃ + 5O₂ → 4NO + 6H₂O（生成NO）、2NH₃ + 2O₂ → N₂O + 3H₂O（生成温室气体N₂O）。新型ASC催化剂通过优化Pt负载量和底层扩散层设计，将N₂选择性控制在80%以上。',
      ]},
      { type: 'table', heading: 'ASC主要性能指标', headers: ['指标', '目标值', '说明'], rows: [
        ['NH₃转化效率', '>95%', '排气尾管NH₃<10ppm'],
        ['N₂选择性', '>80%', '避免生成NO/N₂O'],
        ['工作温度窗口', '200-500°C', '低温时水解为主'],
        ['Pt负载量', '5-30 g/ft³', '低于DOC的Pt用量'],
        ['压降', '<5 mbar', '低背压设计'],
      ]},
    ]
  },

  /* ============ 排放测量设备 ============ */
  'ndir': {
    id: 'ndir',
    title: 'NDIR 非色散红外分析 (CO/CO₂)',
    summary: '非色散红外（NDIR）分析仪利用气体分子对特定波长红外光的吸收特性，定量测量排气中的CO和CO₂浓度。',
    tags: ['cld', 'fid', 'sensor-calibration'],
    sections: [
      { type: 'text', heading: '测量原理', content: [
        'NDIR基于朗伯-比尔定律（Lambert-Beer Law）：I = I₀ × e^(-αcl)。当红外光穿过气室时，特定波长的光被气体分子吸收，剩余光强与气体浓度呈指数关系。CO在4.67μm、CO₂在4.26μm处有强吸收峰。',
        '分析仪由红外光源、旋转滤光轮（或光栅）、测量气室、参考气室和检测器组成。检测器通常采用双通道气动检测器（Luft型检测器）或热电堆传感器。',
      ]},
      { type: 'callout', heading: 'NDIR的干扰问题', content: 'NDIR测量中主要干扰包括：H₂O在CO₂吸收波段附近有吸收，需用冷凝器除水或进行数学补偿；CO₂对CO测量有交叉干扰，需使用干扰补偿算法。日常校准需使用零气（N₂）和量程气进行零点/量程校准。', variant: 'warning', icon: '⚠️' },
      { type: 'table', heading: 'NDIR分析仪技术规格', headers: ['参数', '典型范围', '精度'], rows: [
        ['CO测量范围', '0-5000 ppm (低) / 0-10% (高)', '±1% F.S.'],
        ['CO₂测量范围', '0-20%', '±1% F.S.'],
        ['响应时间 (T90)', '<2.5秒', '含气室置换时间'],
        ['零点漂移', '<±1% F.S./24h', '需定期校准'],
        ['气室温度', '185°C (加热型)', '防止水汽冷凝'],
      ]},
    ]
  },
  'cld': {
    id: 'cld',
    title: 'CLD 化学发光法 (NO/NOx)',
    summary: '化学发光检测器（CLD）是目前最准确的NOx测量方法，利用NO与O₃反应产生的化学发光进行定量分析。',
    tags: ['ndir', 'fid'],
    sections: [
      { type: 'text', heading: '测量原理', content: [
        'CLD的基本反应：NO + O₃ → NO₂* + O₂ → NO₂ + hν（发光），产生的光子数量与NO浓度成正比。检测器使用光电倍增管（PMT）测量发光强度。',
        'NOx测量模式：先将样气通过转换器（钼基或碳基，350°C以上）将NO₂还原为NO，然后测量总NOx浓度，减去NO浓度得到NO₂浓度。转换效率需定期验证。',
      ]},
      { type: 'table', heading: 'CLD技术参数', headers: ['参数', '典型值', '说明'], rows: [
        ['测量范围', '0-10 ppm 到 0-10000 ppm', '宽量程可切换'],
        ['检测下限', '<0.02 ppm', '高灵敏度'],
        ['线性度', '<±1% F.S.', '全程线性'],
        ['T90响应', '0.5-2秒', '取决于气路设计'],
        ['臭氧源', '内置臭氧发生器', '通过高压放电产生O₃'],
        ['转换器效率', '>95%', '定期使用NO₂气体验证'],
      ]},
      { type: 'callout', heading: 'CLD使用注意事项', content: 'CLD需在正压下运行的真空模式下工作（约1-3 torr），以抑制激发态NO₂的猝灭效应。样气必须充分过滤（<2μm）以防止颗粒物进入反应室。使用高纯氧（>99.5%）产生臭氧，确保NO₂转换器效率每月检查一次。', variant: 'info', icon: '💡' },
    ]
  },
  'fid': {
    id: 'fid',
    title: 'FID 氢火焰离子化检测器 (THC)',
    summary: '氢火焰离子化检测器（FID）利用碳氢化合物在氢火焰中燃烧产生离子的原理，精确测量总碳氢（THC）浓度。',
    tags: ['ndir', 'cld'],
    sections: [
      { type: 'text', heading: '测量原理', content: [
        'FID基于以下原理：当碳氢化合物（HC）进入氢-空气火焰（约2000°C）时，发生热化学电离，产生的离子流与进入火焰的碳原子数成正比。离子流被极化电极收集后，通过高灵敏度静电计放大器转换为浓度信号。',
        'FID的响应值直接与样品中碳原子数量相关，因此可直接测量THC（以碳当量计）。对于CH₄，1ppm产生1个单位信号；对于C₃H₈，1ppm产生3个单位信号。FID对含氧化合物（如甲醇、甲醛）的响应较低。',
      ]},
      { type: 'table', heading: 'FID测量参数', headers: ['参数', '典型值', '说明'], rows: [
        ['测量范围', '0-4 ppm 到 0-50000 ppmC', '多量程可选'],
        ['检测下限', '<0.02 ppmC', '高灵敏度FID'],
        ['线性度', '<±1% F.S.', '可调节'],
        ['响应因子差异', '±3% (烷烃)', '含氧化合物差异较大'],
        ['燃料气体', 'H₂/He (40/60%)', '纯度>99.999%'],
        ['燃烧空气', '高纯合成空气', 'HC<0.1 ppmC'],
      ]},
    ]
  },

  /* ============ 测试循环 ============ */
  'wltc': {
    id: 'wltc',
    title: 'WLTC 全球轻型车测试循环',
    summary: '全球轻型车测试循环（WLTC）是WLTP的核心部分，涵盖四种速度区间，替代了早期的NEDC循环。',
    tags: ['nedc', 'rde'],
    sections: [
      { type: 'text', heading: '循环结构', content: [
        'WLTC由联合国WP.29工作组制定，分为三个功率质量比（PMR）等级：Class 1（PMR≤22 W/kg，低速车辆）、Class 2（22<PMR≤34）、Class 3（PMR>34，覆盖绝大多数乘用车）。',
        'Class 3 WLTC包含四个速度阶段：低速段（Low）：589秒，最高速度56.5 km/h，平均速度18.9 km/h；中速段（Medium）：433秒，最高速度76.6 km/h，平均速度39.5 km/h；高速段（High）：455秒，最高速度97.4 km/h，平均速度56.5 km/h；超高速段（Extra High）：323秒，最高速度131.3 km/h，平均速度91.7 km/h。',
        '总时长1800秒（30分钟），总里程23.27 km，平均速度46.5 km/h，最高速度131.3 km/h。相比NEDC（1180秒，11 km），WLTC更动态、更具代表性。',
      ]},
      { type: 'callout', heading: 'WLTC vs NEDC关键差异', content: 'WLTC最高车速131km/h vs NEDC 120km/h；平均速度46.5km/h vs 33.6km/h；怠速比例13% vs 25%；加速度变化更剧烈（最大加速度1.67 m/s² vs 1.04 m/s²）。这些差异导致WLTC下油耗通常比NEDC高10-25%。', variant: 'info', icon: '💡' },
      { type: 'table', heading: 'WLTC (Class 3) 阶段参数', headers: ['参数', '低速', '中速', '高速', '超高速'], rows: [
        ['时长 (s)', '589', '433', '455', '323'],
        ['里程 (km)', '3.09', '4.76', '7.16', '8.26'],
        ['最高车速 (km/h)', '56.5', '76.6', '97.4', '131.3'],
        ['平均车速 (km/h)', '18.9', '39.5', '56.5', '91.7'],
        ['怠速时间比', '26.5%', '11.5%', '6.8%', '2.2%'],
        ['最大加速度 (m/s²)', '1.47', '1.57', '1.58', '1.67'],
      ]},
    ]
  },
  'nedc': {
    id: 'nedc',
    title: 'NEDC 新欧洲驾驶循环',
    summary: 'NEDC曾是欧洲、中国和许多其他国家使用的认证测试循环，已被WLTC逐步替代。',
    tags: ['wltc', 'ftp75'],
    sections: [
      { type: 'text', heading: '循环结构', content: [
        'NEDC（New European Driving Cycle）由四个相同的城市驾驶循环（UDC，每个195秒）和一个市郊驾驶循环（EUDC，400秒）组成。城市阶段模拟典型城市行驶条件（最高50km/h），市郊阶段模拟高速公路工况（最高120km/h）。',
        '总时长1180秒，总里程11.007 km，平均速度33.6 km/h，最高速度120 km/h。循环在城市阶段有大量等速和怠速段，加速度变化平缓，与实际驾驶行为差异较大。',
      ]},
      { type: 'callout', heading: 'NEDC的局限性', content: 'NEDC被广泛批评为"过于理想化"——加速曲线平滑、换挡点固定、环境温度恒定、辅助设备关闭。大众排放门（Dieselgate）暴露了实验室循环与实际排放的巨大差距，直接推动了WLTP和RDE的引入。', variant: 'warning', icon: '⚠️' },
      { type: 'table', heading: 'NEDC阶段参数', headers: ['参数', 'UDC (4×)', 'EUDC (1×)'], rows: [
        ['时长 (s)', '780 (4×195)', '400'],
        ['里程 (km)', '4.052', '6.955'],
        ['最高车速 (km/h)', '50', '120'],
        ['平均车速 (km/h)', '18.7', '62.6'],
        ['怠速时间', '~30%', '~10%'],
      ]},
    ]
  },
  'ftp75': {
    id: 'ftp75',
    title: 'FTP-75 美国联邦测试程序',
    summary: 'FTP-75是美国EPA用于轻型车排放认证的核心测试循环，模拟城市驾驶条件。',
    tags: ['wltc', 'nedc'],
    sections: [
      { type: 'text', heading: '循环结构', content: [
        'FTP-75（Federal Test Procedure）由三个阶段组成：冷启动阶段（Cold Start Phase，0-505秒）、稳定阶段（Stabilized Phase，505-1372秒）、热启动阶段（Hot Start Phase，0-505秒，发动机熄火10分钟后重复）。',
        '总时长约1875秒（含10分钟熄火间隔），总里程17.77 km，平均车速34.1 km/h，最高车速91.2 km/h。循环包含大量加速、减速、怠速和巡航段。排放计算为冷启动和热启动的加权平均值。',
      ]},
      { type: 'table', heading: 'FTP-75 vs WLTC', headers: ['特性', 'FTP-75', 'WLTC Class 3'], rows: [
        ['总时长', '1875秒（含熄火间隔）', '1800秒'],
        ['总里程', '17.77 km', '23.27 km'],
        ['平均速度', '34.1 km/h', '46.5 km/h'],
        ['最高速度', '91.2 km/h', '131.3 km/h'],
        ['冷启动', '包含', '包含（20-30°C）'],
        ['使用地区', '美国', '欧盟/中国/日本等'],
      ]},
    ]
  },
  'rde': {
    id: 'rde',
    title: 'RDE 实际行驶排放',
    summary: '实际行驶排放（Real Driving Emissions）测试使用PEMS设备在公共道路上测量车辆的真实排放水平，弥补实验室循环的不足。',
    tags: ['wltc', 'pems'],
    sections: [
      { type: 'text', heading: 'RDE概述', content: [
        'RDE测试是排放法规的重大革新。它使用便携式排放测量系统（PEMS）在公共道路上进行测试，覆盖城市、乡村和高速公路三种道路类型。RDE不仅考核实验室认证结果，更关注车辆在实际使用中的排放表现。',
        'RDE测试需满足以下条件：城市段（<60km/h）占比约34%、乡村段（60-90km/h）约33%、高速段（>90km/h）约33%。总测试时长90-120分钟，总里程80-120km。测试包含正常驾驶条件和动态条件（更激进的加速）。',
      ]},
      { type: 'callout', heading: '符合性因子 (CF)', content: 'RDE引入符合性因子（Conformity Factor）概念，允许实际行驶排放值一定程度的超出实验室限值。Euro 6d-temp要求NOx CF≤2.1，Euro 6d要求CF≤1.43。国Ⅵb要求RDE NOx CF≤1.6。后续阶段CF将持续降低。', variant: 'info', icon: '💡' },
      { type: 'table', heading: 'RDE测试要求', headers: ['参数', '要求', '备注'], rows: [
        ['海拔', '<1300m（宽限至3000m）', '高海拔车辆性能下降'],
        ['环境温度', '-7°C ~ 35°C', '极端温度下允许扩展限值'],
        ['有效载荷', '90% + 驾驶员 + PEMS', '反映实际使用状态'],
        ['行程组成', '城市34% ± 10%, 乡村33%, 高速33%', '速度区段占比'],
        ['动态条件', '95百分位 v·a_pos ≤ [阈值]', '限制过度激烈驾驶'],
      ]},
    ]
  },
  'whtc-whsc': {
    id: 'whtc-whsc',
    title: 'WHTC/WHSC 全球重型车测试循环',
    summary: 'WHTC（瞬态）和WHSC（稳态）是全球统一的重型发动机排放认证测试循环，替代了ETC/ESC循环。',
    tags: ['nrtc-nrsc', 'wltc'],
    sections: [
      { type: 'text', heading: '循环结构', content: [
        'WHTC（World Harmonized Transient Cycle）是重型发动机的瞬态测试循环，持续1800秒，包含城市、乡村和高速公路驾驶工况。与WHSC（World Harmonized Stationary Cycle）稳态测试循环共同构成重型发动机认证体系。',
        'WHTC包含冷启动和热启动两个部分。冷启动排放占总排放结果的14%，热启动占86%。城市段约占测试的50%，包含多次怠速、加速和减速。',
        'WHSC由13个稳态工况点组成，每个工况点保持一定转速和扭矩，涵盖怠速到额定功率的整个运行范围。',
      ]},
      { type: 'table', heading: 'WHTC关键参数', headers: ['参数', '数值', '说明'], rows: [
        ['测试时长', '1800 秒', '30分钟'],
        ['冷启动占比', '14%', '加权计算'],
        ['热启动占比', '86%', '加权计算'],
        ['最高转速', '额定转速', '根据发动机确定'],
        ['最大扭矩', '100%', '归一化'],
        ['怠速占比', '~16%', '城市工况模拟'],
      ]},
    ]
  },
  'nrtc-nrsc': {
    id: 'nrtc-nrsc',
    title: 'NRTC/NRSC 非道路测试循环',
    summary: 'NRTC（瞬态）和NRSC（稳态）是用于非道路移动机械发动机排放认证的标准测试循环。',
    tags: ['whtc-whsc'],
    sections: [
      { type: 'text', heading: 'NRTC循环', content: [
        'NRTC（Non-Road Transient Cycle）是用于非道路柴油发动机排放认证的瞬态测试循环，持续约1238秒。该循环基于非道路机械（如挖掘机、拖拉机、发电机等）的实际使用工况数据开发。',
        'NRSC（Non-Road Stationary Cycle）包含多个稳态工况点（通常为8-10个），适用于不同功率段的非道路发动机。NRSC模式中包括怠速、25%、50%、75%、100%负荷点，每个工况持续5-10分钟。',
      ]},
      { type: 'table', heading: 'NRSC工况点（ISO 8178 C1, 8模式）', headers: ['工况编号', '转速', '负荷', '权重'], rows: [
        ['1', '额定', '100%', '0.15'],
        ['2', '额定', '75%', '0.15'],
        ['3', '额定', '50%', '0.15'],
        ['4', '额定', '10%', '0.1'],
        ['5', '中间', '100%', '0.1'],
        ['6', '中间', '75%', '0.1'],
        ['7', '中间', '50%', '0.1'],
        ['8', '怠速', '0%', '0.15'],
      ]},
    ]
  },

  /* ============ 传感器技术 ============ */
  'type-k': {
    id: 'type-k',
    title: 'K型热电偶：-200~1260°C',
    summary: 'K型热电偶（镍铬-镍硅）是最常用的温度传感器，广泛应用于排气温度测量（EGT）和发动机热力学测试。',
    tags: ['thermocouple-types', 'cold-junction'],
    sections: [
      { type: 'text', heading: 'K型热电偶原理', content: [
        'K型热电偶由镍铬合金（KP，正极）和镍硅合金（KN，负极）组成。基于塞贝克效应（Seebeck Effect），当测量端和参考端存在温差时，回路中产生热电势。K型热电偶的灵敏度约41 μV/°C，在-200°C到1260°C范围内具有良好的线性度和稳定性。',
        '在排放测试中，K型热电偶用于测量排气温度、催化剂床温度、DPF进出口温度、EGR系统温度等。其响应速度快（裸露端直径0.5mm时T90<0.5秒），抗氧化性好。',
      ]},
      { type: 'table', heading: 'K型热电偶技术参数', headers: ['参数', '数值', '说明'], rows: [
        ['测量范围', '-200~1260°C', '长期使用建议<1100°C'],
        ['精度（Class 1）', '±1.5°C 或 ±0.4%', '取较大值'],
        ['灵敏度', '~41 μV/°C', '0°C时'],
        ['响应时间 (T90)', '<0.5s (0.5mm丝径)', '裸露端'],
        ['绝缘电阻', '>100 MΩ @500V', '室温下'],
      ]},
    ]
  },
  'cold-junction': {
    id: 'cold-junction',
    title: '冷端补偿方法',
    summary: '热电偶测量需要精确的冷端（参考端）温度补偿以确保测量准确度。',
    tags: ['type-k', 'thermocouple-install'],
    sections: [
      { type: 'text', heading: '冷端补偿原理', content: [
        '热电偶测量的是测量端与参考端之间的温差电动势。因此参考端温度必须已知或补偿。冷端补偿方法包括：',
        '1. 冰点法（0°C参考）：将参考端浸入冰水混合物中，维持精确0°C。实验室最准确的方法。',
        '2. 补偿电桥法：使用热敏电阻或RTD测量参考端温度，通过电桥电路自动补偿。',
        '3. 软件补偿法（最常用）：用PT100或半导体温度传感器测量接线端子温度，由数据采集系统进行软件补偿。',
      ]},
      { type: 'callout', heading: '补偿精度的重要性', content: '冷端补偿误差1°C会导致测量误差约1°C（K型）或0.5°C（T型）。在排气温度测量（300-500°C）中，±2°C的冷端补偿误差会导致±2°C的测量误差，对于催化剂转化效率和热管理分析影响显著。建议使用PT100测量冷端温度。', variant: 'info', icon: '💡' },
    ]
  },
  'thermocouple-install': {
    id: 'thermocouple-install',
    title: '热电偶安装要求',
    summary: '正确的安装方式对热电偶测量准确性和响应速度至关重要。',
    tags: ['type-k', 'cold-junction'],
    sections: [
      { type: 'text', heading: '安装基本要求', content: [
        '热电偶安装需遵循以下关键原则：',
        '插入深度：为保证测量准确，热电偶插入管道内的长度应不小于管道直径的5倍（5D规则），特殊情况下至少3D。插入深度不足会导致散热误差，使测量值偏低。',
        '安装方向：排气管道中应逆流安装（探头朝向气流方向），以提高响应速度。对于垂直管道，应从侧面安装，避免冷凝水滴落影响测量。',
        '密封性：安装座需密封良好，防止排气泄漏。使用金属密封垫圈或锥形螺纹密封。',
      ]},
      { type: 'table', heading: '安装参数速查', headers: ['管道直径 (mm)', '最小插入深度 (mm)', '建议探头长度 (mm)'], rows: [
        ['50', '150-250', '200-300'],
        ['75', '225-375', '300-450'],
        ['100', '300-500', '400-600'],
        ['150', '450-750', '500-800'],
      ]},
    ]
  },
  'pt100': {
    id: 'pt100',
    title: 'PT100/PT1000 铂电阻温度传感器',
    summary: '铂电阻温度传感器（Pt100/Pt1000）利用铂的电阻随温度变化的特性进行精确测温。',
    tags: ['type-k', 'sensor-calibration'],
    sections: [
      { type: 'text', heading: '工作原理与特性', content: [
        'Pt100和Pt1000是IEC 60751标准定义的铂电阻温度传感器。Pt100在0°C时电阻为100Ω，Pt1000为1000Ω。铂电阻的电阻-温度关系在-200°C到850°C范围内可用Callendar-Van Dusen方程描述，具有优异的线性度和长期稳定性。',
        'Pt1000相比Pt100具有更高的灵敏度（约3.85Ω/°C vs 0.385Ω/°C），在远距离传输和低功耗应用中更有优势。但Pt100在测量仪表中更为普遍，兼容性更好。',
      ]},
      { type: 'table', heading: 'Pt100/Pt1000精度等级', headers: ['等级', '允许偏差 (°C)', '适用温度范围'], rows: [
        ['AA (1/3 DIN)', '±(0.1 + 0.0017|t|)', '-50~250°C'],
        ['A', '±(0.15 + 0.002|t|)', '-100~450°C'],
        ['B', '±(0.3 + 0.005|t|)', '-196~600°C'],
        ['C', '±(0.6 + 0.01|t|)', '-196~850°C'],
      ]},
      { type: 'callout', heading: '引线电阻消除', content: 'Pt100的电阻变化很小（0°C时100Ω，100°C时138.5Ω），引线电阻必须补偿。2线制误差最大（不可补偿），3线制可消除大部分引线电阻（最常见），4线制（开尔文连接）可完全消除引线电阻，用于精密测量。', variant: 'tip', icon: '💡' },
    ]
  },
  'pressure-sensor': {
    id: 'pressure-sensor',
    title: '压力传感器',
    summary: '压力传感器在排放测试中用于测量排气背压、DPF压差、进气歧管压力、缸压等关键参数。',
    tags: ['sensor-calibration', 'o2-sensor'],
    sections: [
      { type: 'text', heading: '主要类型与应用', content: [
        '压阻式压力传感器：基于半导体压阻效应，硅膜片上集成压阻电桥。精度高（±0.1% F.S.）、响应快、体积小，适用于进气歧管压力（MAP）和大气压力测量。',
        '电容式压力传感器：通过压力引起的膜片位移改变电容值。稳定性好、功耗低，适用于排气背压和DPF压差测量（量程0-5kPa到0-500kPa）。',
        '压电式压力传感器：利用石英晶体的压电效应，响应极快（μs级），专用于缸内压力测量。最高可承受200 bar和1000°C以上瞬态高温，需要水冷和特殊安装适配器。',
      ]},
      { type: 'table', heading: '排放测试用压力传感器选型', headers: ['测量对象', '量程', '精度要求', '传感器类型'], rows: [
        ['进气歧管压力', '0-300 kPa', '±0.5%', '压阻式/MEMS'],
        ['排气背压', '0-500 kPa', '±0.5%', '电容式/压阻式'],
        ['DPF压差', '0-100 kPa', '±0.2%', '差压电容式'],
        ['缸压（燃烧分析）', '0-250 bar', '±0.3%', '压电式'],
        ['AdBlue管路压力', '0-15 bar', '±1%', '陶瓷压阻式'],
      ]},
    ]
  },
  'o2-sensor': {
    id: 'o2-sensor',
    title: '氧传感器 (λ传感器)',
    summary: '氧传感器用于测量排气中残余氧浓度，是空燃比闭环控制和TWC效率监控的核心传感器。',
    tags: ['sensor-calibration', 'twc'],
    sections: [
      { type: 'text', heading: '类型与原理', content: [
        '开关式氧传感器（Narrow-band）：基于氧化锆（ZrO₂）固体电解质电池原理。在λ=1附近输出电压发生突变（从<100mV跳到>800mV），只能判断λ是大于还是小于1。通常作为前氧传感器用于燃油修正。',
        '宽域氧传感器（Wide-band / UEGO）：通过泵电流原理连续测量λ值，可从λ=0.7到λ=∞范围内精确测量。广泛应用于GDI发动机和柴油机的空燃比控制和EGR率估算。',
        'NOx传感器：类似于宽域氧传感器原理，在第二腔内通过改变泵电压选择性地测量NOx浓度，用于SCR控制。',
      ]},
      { type: 'table', heading: '氧传感器对比', headers: ['特性', '窄域 (ZrO₂)', '宽域 (UEGO)', 'NOx传感器'], rows: [
        ['测量参数', 'λ≈1切换点', 'λ 0.7~∞', 'NOx浓度+λ'],
        ['输出信号', '0~1V跳变', '泵电流', 'CAN/LIN数字'],
        ['响应时间', '~100ms', '~150ms', '~500ms'],
        ['使用寿命', '~100,000km', '~150,000km', '~120,000km'],
        ['应用', 'TWC闭环', 'GDI/柴油控制', 'SCR控制'],
      ]},
    ]
  },
  'flow-sensor': {
    id: 'flow-sensor',
    title: '流量传感器 (MAF/MAP)',
    summary: '空气质量流量传感器（MAF）和进气歧管压力传感器（MAP）是发动机进气量测量的两种主要方式。',
    tags: ['sensor-calibration', 'pressure-sensor'],
    sections: [
      { type: 'text', heading: 'MAF vs MAP', content: [
        'MAF（Mass Air Flow）传感器直接测量进入发动机的空气质量流量。热线式MAF利用惠斯通电桥保持热线温度恒定（比进气温度高约200°C），通过加热电流计算空气质量。热膜式MAF更耐用，但对污染物更敏感。MAF安装在空滤之后、节气门之前。',
        'MAP（Manifold Absolute Pressure）传感器结合进气温度（IAT）和转速信号，通过速度-密度法计算进气量。MAP信号还可用于诊断进气系统泄漏、EGR流量和增压压力监控。',
        '现代发动机常同时使用MAF和MAP，通过冗余测量和相互校验提高诊断能力。MAF信号用于燃油喷射量计算和EGR率控制，MAP信号用于增压压力控制和进气系统故障诊断。',
      ]},
      { type: 'callout', heading: 'MAF传感器污染问题', content: 'MAF传感器热线暴露在进气流中，长期使用后会被机油蒸汽和颗粒物污染。污染后测量值偏低，导致混合气过稀、怠速不稳和动力下降。建议每2万公里清洗MAF传感器（使用专用电子清洗剂，切勿触摸热线）。', variant: 'warning', icon: '⚠️' },
    ]
  },
  'sensor-calibration': {
    id: 'sensor-calibration',
    title: '传感器校准总则',
    summary: '传感器校准是确保排放测量数据准确可靠的基础，涵盖零点校准、量程校准和线性验证。',
    tags: ['type-k', 'pt100', 'pressure-sensor'],
    sections: [
      { type: 'text', heading: '校准基本概念', content: [
        '传感器校准（Calibration）是确定传感器输出值与标准量值之间关系的过程。校准不同于调整（Adjustment），校准确定误差，调整修正误差。排放实验室中，所有测量设备必须按照ISO 17025要求进行校准和期间核查。',
        '校准证书应包含：传感器型号、序列号、校准日期、校准方法、标准器信息、校准点数据、测量不确定度。校准间隔取决于传感器稳定性和使用频率，通常为6-12个月。',
      ]},
      { type: 'table', heading: '主要传感器校准间隔', headers: ['传感器类型', '校准间隔', '校准方法'], rows: [
        ['温度传感器（热电偶）', '12个月', '干体炉/油浴比较法'],
        ['Pt100电阻温度计', '12个月', '精密电阻箱+恒温槽'],
        ['压力传感器', '6-12个月', '活塞式压力计/数字压力控制器'],
        ['氧传感器', '6个月', '标准气体+λ基准法'],
        ['流量传感器', '12个月', '标准流量计比较法'],
      ]},
    ]
  },

  /* ============ OBD 系统 ============ */
  'obd1-2': {
    id: 'obd1-2',
    title: 'OBD I / II 车载诊断系统',
    summary: '车载诊断系统（On-Board Diagnostics）监测车辆排放相关系统的运行状态，及时发现和报告故障。',
    tags: ['eobd-jobd', 'monitor-iupr'],
    sections: [
      { type: 'text', heading: 'OBD发展历程', content: [
        'OBD I（1980s）：第一代车载诊断系统，由通用汽车等厂商率先应用。功能有限，主要监控部分传感器和系统的电路完整性，无标准化通信协议和诊断连接器。',
        'OBD II（1996年起）：美国加州空气资源委员会（CARB）和EPA强制要求。标准化了16针DLC诊断接口、SAE J1850/ISO 9141等通信协议、通用诊断故障码（DTC）格式。OBD II要求监控催化器效率、氧传感器、失火检测、蒸发系统、EGR系统、燃油系统和二次空气喷射系统。',
      ]},
      { type: 'table', heading: 'OBD II 标准化DTC', headers: ['代码范围', '系统', '示例'], rows: [
        ['P0xxx', '动力系统（通用）', 'P0300 随机失火'],
        ['P1xxx', '制造商自定义', 'P1135 氧传感器加热器'],
        ['P2xxx', '动力系统（扩展）', 'P242F DPF限制'],
        ['P3xxx', '动力系统（保留）', 'P3000 高压电池系统'],
        ['U0xxx', '网络通信', 'U0100 ECU通信丢失'],
      ]},
    ]
  },
  'eobd-jobd': {
    id: 'eobd-jobd',
    title: 'EOBD / JOBD',
    summary: 'EOBD（欧洲OBD）和JOBD（日本OBD）是OBD II在欧洲和日本的对应标准。',
    tags: ['obd1-2', 'wwh-obd'],
    sections: [
      { type: 'text', heading: '各地区OBD标准', content: [
        'EOBD：基于ISO 15031标准，与OBD II基本一致但增加柴油车专用监控要求。2003年起在欧盟强制实施。DTC格式和诊断接口与OBD II兼容。EOBD对柴油车要求监控：DPF再生、NOx后处理系统、增压压力、EGR流量等。',
        'JOBD：日本版OBD，基于ISO 15031和SAE J1979标准。2005年起在日本实施。与OBD II兼容但增加了特定于日本市场的要求，包括对稀燃NOx催化器和柴油颗粒捕集器的监控。',
      ]},
    ]
  },
  'wwh-obd': {
    id: 'wwh-obd',
    title: 'WWH-OBD 全球统一车载诊断',
    summary: '世界统一车载诊断（World-Wide Harmonized OBD）是UNECE推动的全球统一OBD标准。',
    tags: ['obd1-2', 'eobd-jobd'],
    sections: [
      { type: 'text', heading: 'WWH-OBD概述', content: [
        'WWH-OBD（UN GTR No. 5）是由UNECE WP.29制定的全球统一OBD法规。目标是建立适用于所有国家的统一OBD要求，促进技术和法规协调。WWH-OBD分两个阶段实施：第1阶段（基础监控）和第2阶段（扩展监控）。',
        'WWH-OBD与OBD II的主要差异：引入了更详细的监控器性能要求（最小监控频率）、基于OBD限值的诊断阈值（与非OBD排放限值不同）、扩展了柴油车后处理系统监控要求。',
      ]},
    ]
  },
  'monitor-iupr': {
    id: 'monitor-iupr',
    title: '监控器与 IUPR',
    summary: 'IUPR（In-Use Performance Ratio）衡量OBD监控器在实际使用中的运行频率。',
    tags: ['obd1-2', 'wwh-obd'],
    sections: [
      { type: 'text', heading: 'IUPR定义与要求', content: [
        'IUPR（In-Use Performance Ratio）是OBD系统的关键性能指标，定义为监控器的实际运行次数与车辆运行次数的比值。IUPR要求确保OBD监控器在实际驾驶条件下确实执行了诊断功能，而非仅在实验室条件下运行。',
        '各OBD监控器的IUPR分母条件：对于通用监控器，分母条件是车辆累计行驶至少600秒且海拔低于2500m；对于特定监控器（如催化器、氧传感器），分母条件还包括特定的发动机运行时间。IUPR必须达到0.1（即10%以上才可认为满足要求）。',
      ]},
      { type: 'table', heading: 'IUPR主要监控器', headers: ['监控器', 'IUPR目标', 'OBD II要求'], rows: [
        ['催化器效率', '≥0.1', 'P0420/P0430'],
        ['氧传感器', '≥0.1', 'P0130系列'],
        ['失火检测', '≥0.1', 'P0300-P0308'],
        ['蒸发系统', '≥0.1', 'P0440-P0457'],
        ['EGR系统', '≥0.1', 'P0400-P0406'],
        ['DPF/SCR监控', '≥0.1', 'P242F/P20EE'],
      ]},
    ]
  },

  /* ============ ECU 调校 ============ */
  'fuel-map': {
    id: 'fuel-map',
    title: '燃油 MAP',
    summary: '燃油MAP（Fuel Map）是ECU中控制喷油量的三维标定数据表，是发动机标定的核心内容。',
    tags: ['ignition-map', 'open-vs-closed'],
    sections: [
      { type: 'text', heading: '燃油MAP概述', content: [
        '燃油MAP是一个三维数据表，X轴为发动机转速（RPM），Y轴为发动机负荷（通常以进气量、进气歧管压力或节气门开度表示），Z轴为喷油脉宽（Injection Pulse Width）或空燃比目标值。标定时需要根据发动机在每个工况点的需求确定最优喷油量。',
        '燃油MAP的标定目标：稳态工况下确保空燃比准确（理论空燃比或目标空燃比），瞬态工况下补偿壁面油膜效应，各工况点平顺过渡。全负荷工况时加浓混合气（λ≈0.85-0.9）以抑制爆震和保护发动机。',
      ]},
      { type: 'callout', heading: '燃油MAP标定流程', content: '1. 稳态标定：在各转速-负荷点调整喷油量使λ=目标值，记录喷油脉宽。2. 瞬态补偿：通过油膜模型（如Aquino模型）补偿壁面油膜造成的混合气偏差。3. 全负荷保护：在全负荷区域加浓至λ≈0.85-0.88，降低排气温度保护TWC。4. 过渡平顺：在MAP相邻点间进行3D插值。', variant: 'info', icon: '💡' },
    ]
  },
  'ignition-map': {
    id: 'ignition-map',
    title: '点火 MAP',
    summary: '点火MAP（Ignition Map）定义发动机各工况下的最佳点火提前角，直接影响功率、燃油经济性和排放。',
    tags: ['fuel-map', 'open-vs-closed'],
    sections: [
      { type: 'text', heading: '点火MAP概述', content: [
        '点火提前角（Spark Advance）对发动机性能有决定性影响。MBT（Minimum spark advance for Best Torque）是最佳扭矩最小点火提前角，在此角度点火时燃烧最充分、扭矩最大。实际选择时通常比MBT推迟2-5°（安全余量），避免爆震。',
        '点火MAP的标定原则：低速低负荷时，点火提前角较大（20-40° BTDC），以提高燃烧效率和稳定性；高负荷时，点火提前角减小（5-15° BTDC），防止爆震；冷启动时，点火提前角也需调整以便快速加热TWC。',
        '爆震传感器（Knock Sensor）安装在缸体上，检测特定频率（5-15kHz）的振动信号。检测到爆震时，ECU逐度推迟点火提前角直至爆震消失，再缓慢恢复。',
      ]},
      { type: 'table', heading: '典型点火提前角范围', headers: ['工况', '转速 (rpm)', '负荷', '点火提前角 (°BTDC)'], rows: [
        ['怠速', '700-900', '低', '5-15'],
        ['部分负荷', '2000-3000', '中', '20-35'],
        ['全负荷', '4000-6000', '高', '10-25'],
        ['冷启动', '1000-1500', '低', '5-10'],
      ]},
    ]
  },
  'open-vs-closed': {
    id: 'open-vs-closed',
    title: '开环 vs 闭环控制',
    summary: 'ECU根据运行条件在开环和闭环控制之间切换，平衡控制精度和系统稳定性。',
    tags: ['fuel-map', 'o2-sensor'],
    sections: [
      { type: 'text', heading: '控制策略', content: [
        '闭环控制（Closed-loop）：使用氧传感器反馈信号实时调整喷油量，将空燃比精确控制在λ=1（或目标λ）。适用于稳态工况，精度高（±0.5%），能补偿老化、温度变化等干扰。',
        '开环控制（Open-loop）：不使用氧传感器反馈，直接根据燃油MAP查表确定喷油量。适用于：冷启动阶段（传感器未预热）、全负荷加浓（λ<1，传感器输出不准确）、传感器故障、燃油喷射切断（减速断油）等工况。',
        '从开环到闭环的切换条件：氧传感器信号正常（输出电压在0.1-0.9V之间变化）、冷却液温度高于设定阈值（通常60°C）、传感器加热器正常工作、发动机运行时间超过设定值。',
      ]},
    ]
  },

  /* ============ 测量不确定度 ============ */
  'gum': {
    id: 'gum',
    title: 'GUM 测量不确定度评定方法',
    summary: 'GUM（Guide to the Expression of Uncertainty in Measurement）是测量不确定度评定的国际标准指南。',
    tags: ['type-a-b', 'emission-uncertainty'],
    sections: [
      { type: 'text', heading: 'GUM基本框架', content: [
        'GUM（JCGM 100:2008）定义了评估和表达测量不确定度的标准方法。核心模型为：Y = f(X₁, X₂, ..., Xₙ)，其中Y为被测量，Xᵢ为输入量。标准不确定度u(y)通过各输入量标准不确定度的合成得到。',
        '基本流程：1. 建立测量模型；2. 识别所有不确定度来源；3. 量化各分量的标准不确定度（A类或B类评定）；4. 计算合成标准不确定度；5. 确定扩展不确定度（U = k × u(y)，k=2对应约95%置信水平）。',
      ]},
    ]
  },
  'type-a-b': {
    id: 'type-a-b',
    title: 'A类/B类不确定度评定',
    summary: 'A类评定基于统计分析，B类评定基于其他信息。',
    tags: ['gum', 'emission-uncertainty'],
    sections: [
      { type: 'table', heading: 'A类 vs B类评定', headers: ['特性', 'A类评定', 'B类评定'], rows: [
        ['信息来源', '重复测量数据', '校准证书/技术规范/经验'],
        ['统计方法', '标准差/贝塞尔公式', '概率分布假设'],
        ['自由度', '根据测量次数计算', '基于可靠性估计'],
        ['典型分布', '正态分布', '均匀/三角/正态/矩形'],
        ['校准领域', '重复性、精密度', '标准器精度、分辨率'],
      ]},
    ]
  },
  'emission-uncertainty': {
    id: 'emission-uncertainty',
    title: '排放测量不确定度实例',
    summary: '排放测试中不确定度计算的完整实例。',
    tags: ['gum', 'type-a-b'],
    sections: [
      { type: 'text', heading: '排放测量不确定度源', content: [
        '排放测量不确定度主要来源包括：分析仪自身精度（如NDIR/CLD/FID的线性误差和漂移）、气体标定标准物质的不确定度、CVS流量测量不确定度、采样系统条件（温度、压力）偏差、环境条件变化。',
        '以CO₂排放测量为例：CO₂浓度（CCO₂）的B类不确定度来自分析仪线性误差（±0.5%）和标准气（±1%），A类来自重复测量波动。CVS流量（V）的B类不确定度来自流量计校准（±0.5%）。合成后CO₂质量排放的相对扩展不确定度（k=2）通常为±3-5%。',
      ]},
      { type: 'table', heading: '排放量不确定度预算实例', headers: ['不确定度来源', '类型', '标准不确定度 (%)', '灵敏度系数'], rows: [
        ['CO₂浓度分析', 'B', '0.5', '1.0'],
        ['标准气浓度', 'B', '0.58', '1.0'],
        ['CVS流量', 'B', '0.29', '1.0'],
        ['测量重复性', 'A', '0.4', '1.0'],
        ['合成标准不确定度', '-', '-', '0.94'],
        ['扩展不确定度 (k=2)', '-', '-', '1.88'],
      ]},
    ]
  },

  /* ============ Quick topics for welcome ============ */
}

/* ============================================================
   COMPUTED & METHODS
   ============================================================ */
const currentArticle = computed(() => {
  if (!selectedTopic.value) return null
  return articles[selectedTopic.value] || null
})

const quickTopics = [
  { id: 'four-stroke', label: '四冲程发动机', icon: '🔧' },
  { id: 'twc', label: '三元催化器 (TWC)', icon: '🌫️' },
  { id: 'scr', label: 'SCR 选择性催化还原', icon: '🧪' },
  { id: 'dpf', label: 'DPF 颗粒捕集器', icon: '🛡️' },
  { id: 'wltc', label: 'WLTC 测试循环', icon: '📊' },
  { id: 'rde', label: 'RDE 实际行驶排放', icon: '🚗' },
  { id: 'type-k', label: 'K型热电偶', icon: '🌡️' },
  { id: 'obd1-2', label: 'OBD II 诊断系统', icon: '🔌' },
]

function selectTopic(id: string) {
  selectedTopic.value = id
  // Reset expanded sections
  Object.keys(expandedSections).forEach(k => { delete expandedSections[Number(k)] })
}
</script>

<style scoped lang="scss">
// Asiimov Theme
$white: #F5F5F0;
$orange: #FF8800;
$black: #1A1A1A;
$gray-100: #E8E8E0;
$gray-200: #D0D0C8;
$gray-300: #B0B0A8;
$gray-400: #909090;
$gray-600: #606060;
$gray-800: #333;
$bg-card: #FFFFFF;
$bg-sidebar: #F0F0EB;
$transition: all 0.2s ease;

.encyclopedia-page {
  display: flex;
  height: 100%;
  background: $white;
  color: $black;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.content-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ---- Sidebar ---- */
.sidebar {
  width: 270px;
  min-width: 270px;
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
    padding: 4px 0;
    font-size: 13px;
  }

  .tree-section {
    .tree-section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      cursor: pointer;
      font-weight: 500;
      color: $gray-800;
      transition: $transition;

      &:hover { color: $orange; }
      &.expanded { color: $black; }

      .section-arrow {
        width: 12px;
        font-size: 9px;
        color: $gray-400;
      }
      .section-icon { font-size: 14px; }
    }

    .tree-section-children {
      padding: 0;
    }

    .tree-leaf {
      padding: 5px 12px 5px 38px;
      cursor: pointer;
      color: $gray-600;
      transition: $transition;
      line-height: 1.5;

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

      &.tree-leaf-deep {
        padding-left: 56px;
      }
    }

    .tree-subsection {
      .subsection-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px 5px 38px;
        cursor: pointer;
        color: $gray-600;
        font-size: 12px;
        transition: $transition;

        &:hover { color: $orange; }
        &.expanded { color: $gray-800; font-weight: 500; }

        .subsection-arrow {
          width: 10px;
          font-size: 8px;
          color: $gray-400;
        }
      }

      .subsection-children {
        padding: 0;
      }
    }
  }
}

/* ---- Main Content ---- */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  max-width: 1100px;
}

/* ---- Welcome State ---- */
.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: $gray-400;

  svg { margin-bottom: 16px; opacity: 0.5; }

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
    color: $gray-600;
  }

  p { font-size: 14px; margin: 0 0 32px; }

  .quick-links {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    max-width: 650px;
    width: 100%;
  }

  .quick-link-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: $bg-card;
    border: 1px solid $gray-100;
    border-radius: 8px;
    cursor: pointer;
    transition: $transition;

    &:hover {
      border-color: $orange;
      box-shadow: 0 2px 6px rgba($orange, 0.15);
    }

    .ql-icon { font-size: 20px; }
    .ql-label { font-size: 13px; color: $gray-800; font-weight: 500; }
  }
}

/* ---- Article ---- */
.article {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.article-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid $gray-100;

  .article-title {
    font-size: 26px;
    font-weight: 700;
    margin: 0 0 4px;
    color: $black;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 6px;
      bottom: 6px;
      width: 4px;
      background: $orange;
      border-radius: 2px;
    }
  }

  .article-summary {
    font-size: 14px;
    color: $gray-400;
    margin: 10px 16px 0;
    line-height: 1.6;
  }
}

.article-body {
  > * { margin-bottom: 20px; }
}

/* Text section */
.text-section {
  .section-heading {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 12px;
    color: $black;
  }

  .section-text {
    font-size: 14px;
    line-height: 1.8;
    color: $gray-800;
    margin: 0 0 10px;
    text-align: justify;
  }
}

/* Expandable */
.expandable-section {
  border: 1px solid $gray-100;
  border-radius: 8px;
  overflow: hidden;
  background: $bg-card;

  .expandable-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    transition: $transition;

    &:hover { background: $gray-100; }

    .expandable-arrow {
      font-size: 10px;
      color: $orange;
      width: 14px;
    }

    .expandable-title {
      font-size: 14px;
      font-weight: 600;
      color: $gray-800;
    }
  }

  .expandable-body {
    padding: 4px 16px 16px;
    border-top: 1px solid $gray-100;

    .section-text {
      font-size: 13px;
      line-height: 1.7;
      color: $gray-800;
      margin: 8px 0;
    }
  }
}

/* Callout */
.callout-box {
  padding: 14px 18px;
  border-radius: 8px;
  border-left: 4px solid;

  .callout-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 14px;
  }

  .callout-body {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }

  &.callout-info {
    background: #F0F7FF;
    border-color: #2196F3;
    .callout-header { color: #1565C0; }
    .callout-body { color: #333; }
  }

  &.callout-tip {
    background: #FFFBF0;
    border-color: $orange;
    .callout-header { color: $orange; }
    .callout-body { color: #555; }
  }

  &.callout-warning {
    background: #FFF8E1;
    border-color: #FFA000;
    .callout-header { color: #E65100; }
    .callout-body { color: #555; }
  }

  &.callout-danger {
    background: #FFEBEE;
    border-color: #E53935;
    .callout-header { color: #C62828; }
    .callout-body { color: #555; }
  }
}

/* Table */
.table-section {
  .section-heading-sm {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 10px;
    color: $gray-800;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid $gray-100;
    border-radius: 8px;
  }
}

.article-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    padding: 10px 14px;
    background: $gray-100;
    color: $gray-600;
    font-weight: 600;
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  td {
    padding: 9px 14px;
    border-bottom: 1px solid $gray-100;
    color: $gray-800;
    line-height: 1.5;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: rgba($orange, 0.03);
  }
}

/* Image placeholder */
.image-placeholder {
  .placeholder-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px 20px;
    background: $gray-100;
    border: 2px dashed $gray-200;
    border-radius: 8px;
    color: $gray-400;

    svg { opacity: 0.4; }
  }

  .placeholder-caption {
    font-size: 12px;
    color: $gray-400;
    font-style: italic;
  }
}

/* Formula box */
.formula-box {
  background: $bg-card;
  border: 1px solid $gray-100;
  border-radius: 8px;
  padding: 20px;

  .formula-content {
    font-family: 'Courier New', Courier, monospace;
    font-size: 15px;
    text-align: center;
    color: $black;
    font-weight: 500;
    padding: 8px 0;
  }

  .formula-caption {
    text-align: center;
    font-size: 12px;
    color: $gray-400;
    margin: 8px 0 0;
  }
}

/* List section */
.list-section {
  .section-heading-sm {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 10px;
    color: $gray-800;
  }
}

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    position: relative;
    padding: 6px 0 6px 20px;
    font-size: 13px;
    line-height: 1.7;
    color: $gray-800;

    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 14px;
      width: 6px;
      height: 6px;
      background: $orange;
      border-radius: 50%;
    }

    strong {
      color: $black;
    }
  }
}

/* Tags */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid $gray-100;

  .article-tag {
    padding: 4px 12px;
    background: $gray-100;
    color: $gray-600;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: $transition;

    &:hover {
      background: rgba($orange, 0.15);
      color: $orange;
    }
  }
}

/* Scrollbar */
.sidebar::-webkit-scrollbar,
.main-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track,
.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb,
.main-content::-webkit-scrollbar-thumb {
  background: $gray-200;
  border-radius: 3px;
  &:hover { background: $gray-400; }
}
</style>
