<template>
  <div class="glossary">
    <div class="glossary__header">
      <h1 class="glossary__title">排放工程术语词典</h1>
      <p class="glossary__subtitle">Emission Engineering Glossary &mdash; {{ filteredTerms.length }} / {{ terms.length }} 词条</p>
    </div>

    <div class="glossary__search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="输入中文、英文或拼音搜索… Search by Chinese, English, or pinyin"
        clearable
        size="large"
        class="glossary__search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="glossary__categories">
      <el-tag
        v-for="cat in categories"
        :key="cat.key"
        :type="activeCategory === cat.key ? 'warning' : 'info'"
        :effect="activeCategory === cat.key ? 'dark' : 'plain'"
        @click="activeCategory = cat.key"
        class="glossary__category-tag"
      >
        {{ cat.label }}
      </el-tag>
    </div>

    <div class="glossary__body">
      <div class="glossary__list">
        <div
          v-for="term in pagedTerms"
          :key="term.en"
          class="glossary__term-card"
          :class="{ 'glossary__term-card--expanded': expandedTerm?.en === term.en }"
          @click="toggleTerm(term)"
        >
          <div class="glossary__term-header">
            <span class="glossary__term-en">{{ term.en }}</span>
            <span class="glossary__term-zh">{{ term.zh }}</span>
            <el-tag size="small" class="glossary__term-cat">{{ categoryLabel(term.category) }}</el-tag>
          </div>
          <div v-if="expandedTerm?.en === term.en" class="glossary__term-definition">
            <p>{{ term.definition }}</p>
          </div>
        </div>

        <div v-if="filteredTerms.length === 0" class="glossary__empty">
          <el-empty description="没有匹配的术语 / No matching terms" />
        </div>

        <div v-if="totalPages > 1" class="glossary__pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredTerms.length"
            layout="prev, pager, next"
            small
          />
        </div>
      </div>

      <div class="glossary__index">
        <button
          v-for="letter in alphabet"
          :key="letter"
          class="glossary__index-btn"
          :class="{ 'glossary__index-btn--active': activeLetter === letter }"
          @click="scrollToLetter(letter)"
        >
          {{ letter }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { pinyin } from 'pinyin-pro'

/* ---- Types ---- */
interface GlossaryTerm {
  en: string
  zh: string
  category: string
  definition: string
}

interface Category {
  key: string
  label: string
}

/* ---- Data ---- */
const categories: Category[] = [
  { key: 'all', label: '全部 All' },
  { key: 'engine', label: '发动机 Engine' },
  { key: 'emission', label: '排放 Emission' },
  { key: 'aftertreatment', label: '后处理 Aftertreatment' },
  { key: 'sensor', label: '传感器 Sensor' },
  { key: 'ecu', label: '电控 ECU' },
  { key: 'regulation', label: '法规 Regulation' },
  { key: 'measurement', label: '测量 Measurement' },
  { key: 'fuel', label: '燃料 Fuel' },
  { key: 'obd', label: 'OBD' },
]

const terms: GlossaryTerm[] = [
  // ==================== Engine (发动机) ====================
  { en: 'Cylinder', zh: '气缸', category: 'engine', definition: '发动机中活塞往复运动的空间，燃料燃烧做功的场所。通常多个气缸排列在一起构成发动机主体。' },
  { en: 'Piston', zh: '活塞', category: 'engine', definition: '在气缸内往复运动的部件，将燃气的压力通过连杆传递给曲轴。' },
  { en: 'Crankshaft', zh: '曲轴', category: 'engine', definition: '将活塞的往复运动转换为旋转运动的轴类零件，是发动机输出功率的关键部件。' },
  { en: 'Connecting rod', zh: '连杆', category: 'engine', definition: '连接活塞与曲轴的杆件，传递活塞的往复运动到曲轴。' },
  { en: 'Valve', zh: '气门', category: 'engine', definition: '控制进气和排气通道开闭的部件，包括进气门和排气门。' },
  { en: 'Camshaft', zh: '凸轮轴', category: 'engine', definition: '通过凸轮控制气门开启和关闭的轴，由曲轴通过正时系统驱动。' },
  { en: 'Turbocharger', zh: '涡轮增压器', category: 'engine', definition: '利用废气能量驱动涡轮，带动压气机增加进气压力的装置，可提高发动机功率和效率。' },
  { en: 'Intercooler', zh: '中冷器', category: 'engine', definition: '冷却经涡轮增压后高温进气空气的热交换器，提高进气密度和燃烧效率。' },
  { en: 'Throttle', zh: '节气门', category: 'engine', definition: '控制进入发动机空气量的阀门，汽油机中通过其开度调节发动机功率输出。' },
  { en: 'Intake manifold', zh: '进气歧管', category: 'engine', definition: '将空气/混合气分配到各气缸的管道系统。' },
  { en: 'Exhaust manifold', zh: '排气歧管', category: 'engine', definition: '收集各气缸排出的废气并将其引导至排气系统的管道集合。' },
  { en: 'Flywheel', zh: '飞轮', category: 'engine', definition: '安装在曲轴后端的大惯量圆盘，用于储存旋转动能、平抑转速波动。' },
  { en: 'Bore', zh: '缸径', category: 'engine', definition: '气缸的内径尺寸，是发动机基本设计参数之一，影响排量和功率。' },
  { en: 'Stroke', zh: '行程', category: 'engine', definition: '活塞从上止点到下止点移动的距离，与缸径共同决定单缸排量。' },
  { en: 'Displacement', zh: '排量', category: 'engine', definition: '所有气缸工作容积之和，是衡量发动机大小的基本参数。' },
  { en: 'Compression ratio', zh: '压缩比', category: 'engine', definition: '气缸最大容积与最小容积（燃烧室容积）之比，影响发动机热效率和爆震倾向。' },
  { en: 'Firing order', zh: '点火顺序', category: 'engine', definition: '多缸发动机各气缸依次点火的排列顺序，影响发动机平衡性和振动特性。' },
  { en: 'TDC (Top Dead Center)', zh: '上止点', category: 'engine', definition: '活塞在气缸内运动到最高位置时的曲轴位置，是点火/喷油正时的基准点。' },
  { en: 'BDC (Bottom Dead Center)', zh: '下止点', category: 'engine', definition: '活塞在气缸内运动到最低位置时的曲轴位置。' },
  { en: 'Valve timing', zh: '配气相位', category: 'engine', definition: '气门开启和关闭时刻相对于曲轴转角的关系，用曲轴角度表示。' },
  { en: 'Variable valve timing', zh: '可变气门正时', category: 'engine', definition: '根据发动机工况改变气门开启和关闭时刻的技术，可优化全工况性能。' },
  { en: 'EGR (Exhaust Gas Recirculation)', zh: '废气再循环', category: 'engine', definition: '将部分废气引回进气歧管，降低燃烧温度以减少NOx生成的技术。' },
  { en: 'PCV (Positive Crankcase Ventilation)', zh: '曲轴箱强制通风', category: 'engine', definition: '将曲轴箱内的窜气引入进气系统重新燃烧的系统，减少污染物排放。' },
  { en: 'Supercharger', zh: '机械增压器', category: 'engine', definition: '由发动机曲轴直接驱动的进气增压装置，可立即响应提升进气压力。' },
  { en: 'Wastegate', zh: '废气旁通阀', category: 'engine', definition: '控制涡轮增压器最大增压压力的阀门，通过旁通部分废气来调节增压压力。' },
  { en: 'Variable geometry turbocharger', zh: '可变截面涡轮增压器', category: 'engine', definition: '通过改变涡轮入口导向叶片角度来优化不同转速下增压效率的技术。' },
  { en: 'Knock / Detonation', zh: '爆震', category: 'engine', definition: '燃烧室内末端气体自燃产生的高频压力波，可能导致发动机损坏的非正常燃烧现象。' },
  { en: 'Pre-ignition', zh: '早燃', category: 'engine', definition: '在火花塞跳火之前混合气就被热点自燃点燃的非正常燃烧现象，危害极大。' },
  { en: 'Misfire', zh: '失火', category: 'engine', definition: '气缸内混合气未能正常燃烧的现象，会导致功率下降和排放恶化。' },
  { en: 'Idle speed', zh: '怠速转速', category: 'engine', definition: '发动机在不对外做功、仅克服自身摩擦时维持的最低稳定转速。' },
  { en: 'Redline', zh: '红线转速', category: 'engine', definition: '发动机允许连续运行的最高转速，超过此转速可能导致机械损坏。' },
  { en: 'Governor', zh: '调速器', category: 'engine', definition: '自动控制发动机转速在设定范围内稳定运行的装置，柴油机中常见。' },
  { en: 'Wet liner', zh: '湿式缸套', category: 'engine', definition: '外壁直接与冷却水接触的气缸套结构，散热效果好但密封性要求高。' },
  { en: 'Dry liner', zh: '干式缸套', category: 'engine', definition: '外壁不与冷却水直接接触的气缸套，通过缸体间接散热。' },
  { en: 'Head gasket', zh: '缸垫', category: 'engine', definition: '安装在气缸体与气缸盖之间的密封垫片，防止燃气、冷却液和机油互窜。' },
  { en: 'Oil pan', zh: '油底壳', category: 'engine', definition: '发动机底部的储油容器，储存机油并向润滑系统供油。' },
  { en: 'Oil pump', zh: '机油泵', category: 'engine', definition: '将机油从油底壳输送到发动机各润滑部位的泵。' },
  { en: 'Water pump', zh: '水泵', category: 'engine', definition: '使冷却液在发动机冷却系统中循环流动的泵，通常由曲轴驱动。' },
  { en: 'Thermostat', zh: '节温器', category: 'engine', definition: '根据冷却液温度自动调节冷却液循环路径和流量的温控阀门。' },
  { en: 'Radiator', zh: '散热器', category: 'engine', definition: '将冷却液携带的热量散发到空气中的热交换器，保持发动机在正常工作温度。' },
  { en: 'Balance shaft', zh: '平衡轴', category: 'engine', definition: '以特定转速旋转以抵消发动机二阶振动惯性的轴。' },
  { en: 'Harmonic balancer', zh: '谐波减振器', category: 'engine', definition: '安装在曲轴前端的扭转减振装置，降低曲轴扭转振动。' },
  { en: 'Pushrod', zh: '推杆', category: 'engine', definition: '在OHV气门机构中连接挺柱与摇臂的杆件，传递凸轮运动。' },
  { en: 'Rocker arm', zh: '摇臂', category: 'engine', definition: '将推杆或凸轮的运动转化为气门开启动作的杠杆机构。' },
  { en: 'Valve spring', zh: '气门弹簧', category: 'engine', definition: '使气门在关闭时紧密贴合气门座的弹簧，防止气门跳动。' },
  { en: 'Valve seat', zh: '气门座圈', category: 'engine', definition: '镶嵌在气缸盖上与气门锥面配合的环形密封面。' },
  { en: 'Valve guide', zh: '气门导管', category: 'engine', definition: '引导气门直线运动的管状零件，保证气门与气门座的同轴度。' },
  { en: 'Timing chain', zh: '正时链条', category: 'engine', definition: '连接曲轴和凸轮轴的传动链条，保证两者同步旋转。' },
  { en: 'Timing belt', zh: '正时皮带', category: 'engine', definition: '替代链条的正时传动带，噪音低但需定期更换。' },
  { en: 'Lifter / Tappet', zh: '挺柱', category: 'engine', definition: '安装在凸轮与推杆之间的圆柱形零件，传递凸轮升程。' },
  { en: 'Hydraulic lash adjuster', zh: '液压挺柱', category: 'engine', definition: '利用机油压力自动消除气门间隙的挺柱，无需手动调节。' },

  // ==================== Emission (排放) ====================
  { en: 'CO₂ (Carbon Dioxide)', zh: '二氧化碳', category: 'emission', definition: '完全燃烧产物，温室气体。机动车排放法规中目前不限制但受碳排放政策关注。' },
  { en: 'NOx (Nitrogen Oxides)', zh: '氮氧化物', category: 'emission', definition: '氮气和氧气在高温燃烧时生成的污染物，包括NO和NO₂，是形成光化学烟雾的前体物。' },
  { en: 'HC (Hydrocarbons)', zh: '碳氢化合物', category: 'emission', definition: '未完全燃烧的燃料和润滑油裂解产物，参与光化学反应生成臭氧。' },
  { en: 'CO (Carbon Monoxide)', zh: '一氧化碳', category: 'emission', definition: '不完全燃烧产生的有毒气体，通过氧化催化器可转化为CO₂。' },
  { en: 'PM (Particulate Matter)', zh: '颗粒物', category: 'emission', definition: '排气中固体和液体颗粒的总称，主要包括碳烟、可溶性有机物和硫酸盐。' },
  { en: 'PN (Particle Number)', zh: '颗粒物数量', category: 'emission', definition: '单位体积排气中颗粒物的数量，最新排放法规对PN有严格限制，尤其是超细颗粒。' },
  { en: 'SO₂ (Sulfur Dioxide)', zh: '二氧化硫', category: 'emission', definition: '燃料中含硫成分燃烧产生的污染物，会导致酸雨并毒化后处理催化剂。' },
  { en: 'THC (Total Hydrocarbons)', zh: '总碳氢', category: 'emission', definition: '排气中所有碳氢化合物的总称，包括甲烷和非甲烷碳氢。' },
  { en: 'NMHC (Non-Methane Hydrocarbons)', zh: '非甲烷碳氢', category: 'emission', definition: '总碳氢中除去甲烷后的部分，因甲烷光化学反应活性低而单独区分。' },
  { en: 'CH₄ (Methane)', zh: '甲烷', category: 'emission', definition: '最简单的碳氢化合物，温室效应强（GWP ≈ 28），天然气发动机的主要排放物。' },
  { en: 'NH₃ (Ammonia)', zh: '氨', category: 'emission', definition: 'SCR系统中尿素分解的副产物或在富燃条件下生成的排放物，过量排放会造成二次污染。' },
  { en: 'N₂O (Nitrous Oxide)', zh: '氧化亚氮', category: 'emission', definition: '强温室气体（GWP ≈ 265），可能在SCR系统低温运行或催化剂老化时生成。' },
  { en: 'O₂ (Oxygen)', zh: '氧气', category: 'emission', definition: '排气中的剩余氧含量，用于空燃比计算和氧传感器测量。' },
  { en: 'H₂O (Water Vapor)', zh: '水蒸气', category: 'emission', definition: '燃烧生成的水，在排气中以蒸汽形式存在。在干湿基修正计算中需扣除。' },
  { en: 'Particulate matter', zh: '颗粒物', category: 'emission', definition: '排入大气的固体和液体微小颗粒，直径从几纳米到几微米不等。' },
  { en: 'Black carbon', zh: '黑碳', category: 'emission', definition: '碳烟中主要吸收太阳辐射的成分，对气候变暖有显著贡献。' },
  { en: 'Soot', zh: '碳烟', category: 'emission', definition: '柴油机不完全燃烧产生的碳质颗粒，呈黑色絮状，是PM的主要成分。' },
  { en: 'Smoke', zh: '烟度', category: 'emission', definition: '排气中可见碳烟浓度的度量指标，常用滤纸式烟度计或不透光度计测量。' },
  { en: 'Opacity', zh: '不透光度', category: 'emission', definition: '光通过排气烟柱时被吸收或散射的比例，是烟度测量的物理量。' },
  { en: 'Absorption coefficient', zh: '吸收系数', category: 'emission', definition: '描述光在介质中传播时强度衰减的物理量，用于烟度定量分析。' },
  { en: 'Aldehyde', zh: '醛类', category: 'emission', definition: '含醛基的有机化合物，如甲醛和乙醛，是醇类燃料发动机的特征排放物。' },
  { en: 'PAH (Polycyclic Aromatic Hydrocarbons)', zh: '多环芳烃', category: 'emission', definition: '具有多个苯环的有机污染物，部分具有致癌性，存在于柴油机颗粒物中。' },
  { en: 'Dioxin', zh: '二噁英', category: 'emission', definition: '剧毒含氯有机化合物，在含氯燃料或废弃物燃烧时可能生成。' },
  { en: 'Formaldehyde', zh: '甲醛', category: 'emission', definition: '最简单的醛类，甲醇发动机的主要非常规排放物，具有刺激性气味和致癌性。' },
  { en: 'Benzene', zh: '苯', category: 'emission', definition: '芳香烃，已知致癌物，存在于汽油和未燃烧油中。排放法规严格限制。' },
  { en: 'Toluene', zh: '甲苯', category: 'emission', definition: '芳香烃化合物，汽油成分之一，光化学反应活性高。' },
  { en: 'Xylene', zh: '二甲苯', category: 'emission', definition: '芳香烃，汽油中常见成分，参与光化学烟雾形成。' },
  { en: '1,3-Butadiene', zh: '1,3-丁二烯', category: 'emission', definition: '不饱和烃，燃烧副产物，已知致癌物，受排放法规限制。' },
  { en: 'Acetaldehyde', zh: '乙醛', category: 'emission', definition: '乙醇发动机的特征排放物，具有刺激性气味和潜在健康风险。' },
  { en: 'Sulfate', zh: '硫酸盐', category: 'emission', definition: '燃料中硫氧化后与水结合形成的颗粒物成分，是PM的重要组成部分。' },
  { en: 'Ash', zh: '灰分', category: 'emission', definition: '燃料和润滑油中不可燃矿物质的氧化物，沉积在DPF中需定期清理。' },
  { en: 'Volatile Organic Compounds', zh: '挥发性有机化合物', category: 'emission', definition: '在常温下易挥发的有机化合物，参与大气光化学反应。' },
  { en: 'Greenhouse gas', zh: '温室气体', category: 'emission', definition: '吸收和发射红外辐射的气体，包括CO₂、CH₄、N₂O等，导致全球变暖。' },
  { en: 'Global Warming Potential', zh: '全球变暖潜势', category: 'emission', definition: '衡量不同温室气体相对于CO₂的温室效应强度，以100年时间尺度为基准。' },

  // ==================== Aftertreatment (后处理) ====================
  { en: 'TWC (Three-Way Catalyst)', zh: '三元催化转化器', category: 'aftertreatment', definition: '同时转化CO、HC和NOx三种污染物的催化装置，仅在理论空燃比附近工作。' },
  { en: 'DOC (Diesel Oxidation Catalyst)', zh: '柴油氧化催化器', category: 'aftertreatment', definition: '将CO和HC氧化为CO₂和H₂O的催化装置，也可氧化NO为NO₂及氧化SOF。' },
  { en: 'DPF (Diesel Particulate Filter)', zh: '柴油颗粒捕集器', category: 'aftertreatment', definition: '通过过滤壁捕集排气中颗粒物的装置，捕集效率可达99%以上。' },
  { en: 'SCR (Selective Catalytic Reduction)', zh: '选择性催化还原', category: 'aftertreatment', definition: '以氨或尿素为还原剂选择性将NOx还原为N₂的催化技术，是柴油机主流NOx控制方案。' },
  { en: 'LNT (Lean NOx Trap)', zh: '稀燃NOx捕集器', category: 'aftertreatment', definition: '在稀燃条件下吸附NOx、在富燃条件下释放并还原的周期性工作装置。' },
  { en: 'ASC (Ammonia Slip Catalyst)', zh: '氨逃逸催化器', category: 'aftertreatment', definition: '安装在SCR下游，氧化过量氨气的催化装置，防止氨泄漏到大气中。' },
  { en: 'DEF (Diesel Exhaust Fluid)', zh: '柴油排放处理液', category: 'aftertreatment', definition: '32.5%尿素水溶液的商品名，用于SCR系统作为氨源。' },
  { en: 'AdBlue', zh: '车用尿素溶液', category: 'aftertreatment', definition: 'DEF在欧盟的商品名，浓度为32.5%的尿素水溶液。' },
  { en: 'Urea', zh: '尿素', category: 'aftertreatment', definition: '化学式为(NH₂)₂CO的白色晶体，与水配制成DEF用于SCR系统提供氨。' },
  { en: 'Regeneration', zh: '再生', category: 'aftertreatment', definition: '清除DPF中积存的颗粒物以恢复其过滤功能的过程，分为被动再生和主动再生。' },
  { en: 'Passive regeneration', zh: '被动再生', category: 'aftertreatment', definition: '在正常排气温度下利用NO₂连续氧化碳烟的DPF再生方式，不需要额外的升温策略。' },
  { en: 'Active regeneration', zh: '主动再生', category: 'aftertreatment', definition: '通过提高排气温度（＞600°C）使碳烟与氧气反应的强制DPF再生方式。' },
  { en: 'Ash loading', zh: '灰分累积', category: 'aftertreatment', definition: 'DPF中不可燃灰分的逐渐积聚，最终需要离线清洗或更换DPF。' },
  { en: 'Catalyst poisoning', zh: '催化剂中毒', category: 'aftertreatment', definition: '催化剂因某些物质（硫、磷、硅等）覆盖活性位点而导致的活性丧失。' },
  { en: 'Light-off temperature', zh: '起燃温度', category: 'aftertreatment', definition: '催化剂达到50%转化效率所需的最低温度，是催化器性能的关键指标。' },
  { en: 'Space velocity', zh: '空速', category: 'aftertreatment', definition: '每小时流过催化剂的排气体积与催化剂体积之比，单位h⁻¹，影响转化效率。' },
  { en: 'Catalyst volume', zh: '催化剂体积', category: 'aftertreatment', definition: '催化转化器中催化载体的实际体积，与发动机排量匹配设计。' },
  { en: 'Substrate', zh: '载体', category: 'aftertreatment', definition: '涂覆催化剂涂层的基底材料，通常为陶瓷蜂窝体或金属箔。' },
  { en: 'Washcoat', zh: '涂覆层', category: 'aftertreatment', definition: '涂覆在载体表面的高比表面积涂层，用于分散贵金属催化活性组分。' },
  { en: 'Precious metal loading', zh: '贵金属负载量', category: 'aftertreatment', definition: '催化剂中铂、钯、铑等贵金属的含量，直接影响催化性能和成本。' },
  { en: 'Platinum (Pt)', zh: '铂', category: 'aftertreatment', definition: '广泛用于DOC和TWC的贵金属催化组分，对CO和HC氧化活性高。' },
  { en: 'Palladium (Pd)', zh: '钯', category: 'aftertreatment', definition: '替代铂的贵金属催化组分，对HC氧化活性好，成本低于铂。' },
  { en: 'Rhodium (Rh)', zh: '铑', category: 'aftertreatment', definition: '用于TWC中NOx还原的贵金属，是三元催化不可或缺的组分。' },
  { en: 'Zeolite', zh: '沸石', category: 'aftertreatment', definition: '具有分子筛结构的催化材料，用于SCR催化剂，尤其是Cu-沸石和Fe-沸石。' },
  { en: 'SCR conversion efficiency', zh: 'SCR转化效率', category: 'aftertreatment', definition: 'SCR系统实际还原的NOx量与进入系统的NOx量之比，通常要求＞90%。' },
  { en: 'DeNOx', zh: '脱硝', category: 'aftertreatment', definition: '从排气中去除氮氧化物（NO和NO₂）的过程，主要通过SCR技术实现。' },
  { en: 'Ammonia slip', zh: '氨逃逸', category: 'aftertreatment', definition: 'SCR系统中未参与反应的过量氨气随排气排出的现象，需控制在10ppm以下。' },
  { en: 'NO₂/NOx ratio', zh: 'NO₂/NOx比', category: 'aftertreatment', definition: '排气中NO₂占NOx总量的比例，影响DPF被动再生效率和SCR反应速率。' },
  { en: 'Thermal aging', zh: '热老化', category: 'aftertreatment', definition: '催化剂在高温下长期工作导致的贵金属颗粒烧结、比表面积降低等性能退化现象。' },
  { en: 'SCR catalyst deactivation', zh: 'SCR催化剂失活', category: 'aftertreatment', definition: '高温烧结、硫中毒、碱金属中毒、HC堵塞等多因素导致的活性下降。' },
  { en: 'PNA (Passive NOx Adsorber)', zh: '被动NOx吸附器', category: 'aftertreatment', definition: '低温时吸附NOx、高温时释放以供下游还原处理的冷启动NOx控制装置。' },
  { en: 'GPF (Gasoline Particulate Filter)', zh: '汽油颗粒捕集器', category: 'aftertreatment', definition: '用于汽油直喷发动机的颗粒物过滤装置，结构与DPF类似。' },
  { en: 'cDPF (Catalyzed DPF)', zh: '催化型DPF', category: 'aftertreatment', definition: '在DPF过滤器上涂覆催化剂涂层，兼具颗粒过滤和催化氧化功能。' },
  { en: 'SCR on Filter (SCRF)', zh: 'SCR涂覆过滤器', category: 'aftertreatment', definition: '将SCR催化剂涂覆在DPF上的集成式后处理装置，节省空间。' },
  { en: 'Urea injection', zh: '尿素喷射', category: 'aftertreatment', definition: '将DEF喷入排气管中使其分解产生氨的喷射系统，精度要求高。' },
  { en: 'Dosing strategy', zh: '喷射策略', category: 'aftertreatment', definition: 'SCR系统控制尿素喷射量和时机的算法，需平衡NOx转化和氨逃逸。' },
  { en: 'Urea deposit', zh: '尿素沉积物', category: 'aftertreatment', definition: '低温或喷射不当导致尿素未完全分解形成的固体沉积物，可堵塞排气系统。' },
  { en: 'NOx sensor', zh: 'NOx传感器', category: 'aftertreatment', definition: '测量排气中NOx浓度的传感器，用于SCR闭环控制和OBD监控。' },
  { en: 'PM sensor', zh: 'PM传感器', category: 'aftertreatment', definition: '用于监测DPF下游颗粒物浓度的传感器，检测DPF失效或泄漏。' },

  // ==================== Sensor (传感器) ====================
  { en: 'O₂ sensor', zh: '氧传感器', category: 'sensor', definition: '测量排气中残余氧含量的传感器，用于空燃比闭环控制和催化器效率监测。' },
  { en: 'Lambda sensor', zh: 'λ传感器', category: 'sensor', definition: '与O₂传感器同义，检测过量空气系数λ的宽域或开关型传感器。' },
  { en: 'Wideband / LSU sensor', zh: '宽域氧传感器', category: 'sensor', definition: '可连续测量λ在0.65-∞范围的氧传感器，基于极限电流原理工作。' },
  { en: 'Oxygen storage capacity', zh: '氧存储能力', category: 'sensor', definition: '催化剂存储和释放氧的能力，用于监测三元催化器老化状态。' },
  { en: 'MAP sensor', zh: '进气压力传感器', category: 'sensor', definition: '测量进气歧管绝对压力的传感器，用于计算进气量和负荷。' },
  { en: 'MAF sensor', zh: '空气质量流量传感器', category: 'sensor', definition: '直接测量进入发动机空气质量流量的传感器，常用于汽油机。' },
  { en: 'ECT sensor', zh: '发动机冷却液温度传感器', category: 'sensor', definition: '测量发动机冷却液温度的热敏电阻传感器，用于冷启动加浓和风扇控制。' },
  { en: 'IAT sensor', zh: '进气温度传感器', category: 'sensor', definition: '测量进气温度的传感器，用于进气密度修正和空燃比计算。' },
  { en: 'CKP sensor', zh: '曲轴位置传感器', category: 'sensor', definition: '检测曲轴转速和位置的传感器，是ECU控制点火和喷油正时的核心信号源。' },
  { en: 'CMP sensor', zh: '凸轮轴位置传感器', category: 'sensor', definition: '检测凸轮轴位置以确定各缸工作顺序，配合CKP实现精确的缸序识别。' },
  { en: 'Knock sensor', zh: '爆震传感器', category: 'sensor', definition: '检测发动机爆震产生的高频振动信号的压电传感器，用于爆震闭环控制。' },
  { en: 'TPS (Throttle Position Sensor)', zh: '节气门位置传感器', category: 'sensor', definition: '检测节气门开度位置的传感器，反映驾驶员加速意图。' },
  { en: 'EGT sensor', zh: '排气温度传感器', category: 'sensor', definition: '测量排气温度的传感器，用于后处理系统热管理保护。' },
  { en: 'Fuel pressure sensor', zh: '燃油压力传感器', category: 'sensor', definition: '测量燃油系统中压力的传感器，用于喷油压力闭环控制。' },
  { en: 'NTC (Negative Temperature Coefficient) sensor', zh: '负温度系数传感器', category: 'sensor', definition: '电阻值随温度升高而降低的热敏电阻，广泛用于温度测量。' },
  { en: 'Piezoresistive pressure sensor', zh: '压阻式压力传感器', category: 'sensor', definition: '利用硅压阻效应测量压力的传感器，精度高、响应快，用于MAP和共轨压力测量。' },
  { en: 'Piezoelectric sensor', zh: '压电传感器', category: 'sensor', definition: '利用压电效应将机械应变转换为电信号的传感器，用于爆震检测和缸压测量。' },
  { en: 'Hall effect sensor', zh: '霍尔传感器', category: 'sensor', definition: '基于霍尔效应的磁电传感器，用于CKP和CMP位置检测。' },
  { en: 'Thermocouple', zh: '热电偶', category: 'sensor', definition: '利用热电效应（塞贝克效应）测量温度的传感器，K型热电偶可用于排气温度测量。' },
  { en: 'PT100 / PT1000', zh: '铂电阻温度传感器', category: 'sensor', definition: '利用铂电阻随温度变化的特性测量温度的传感器，PT100在0°C时阻值为100Ω。' },
  { en: 'Ion current sensor', zh: '离子电流传感器', category: 'sensor', definition: '利用火花塞电极间的电离电流信号测量燃烧参数的技术。' },
  { en: 'Cylinder pressure sensor', zh: '缸压传感器', category: 'sensor', definition: '直接测量气缸内燃烧压力的传感器，用于闭环燃烧控制和爆震检测。' },
  { en: 'Lambda (λ)', zh: '过量空气系数', category: 'sensor', definition: '实际空燃比与理论空燃比的比值，λ＜1为浓混气，λ＞1为稀混气。' },
  { en: 'Air-fuel ratio (AFR)', zh: '空燃比', category: 'sensor', definition: '空气质量与燃料质量的混合比例，是发动机控制的核心参数。' },
  { en: 'Stoichiometric AFR', zh: '理论空燃比', category: 'sensor', definition: '燃料完全燃烧所需的化学计量空燃比，汽油约为14.7:1。' },

  // ==================== ECU (电控) ====================
  { en: 'ECU (Engine Control Unit)', zh: '发动机控制单元', category: 'ecu', definition: '发动机电控系统的核心计算机，控制喷油、点火、气门、增压等所有发动机功能。' },
  { en: 'PWM (Pulse Width Modulation)', zh: '脉宽调制', category: 'ecu', definition: '通过调节脉冲信号的占空比来控制执行器（喷油器、EGR阀等）的驱动方式。' },
  { en: 'Open loop control', zh: '开环控制', category: 'ecu', definition: '不依赖反馈信号的控制方式，在暖机或大负荷工况下使用。' },
  { en: 'Closed loop control', zh: '闭环控制', category: 'ecu', definition: '基于传感器反馈信号进行实时调整的控制方式，如氧传感器反馈空燃比控制。' },
  { en: 'PID controller', zh: 'PID控制器', category: 'ecu', definition: '比例-积分-微分控制算法，广泛用于发动机转速、空燃比、增压压力等参数的闭环控制。' },
  { en: 'ECU calibration', zh: 'ECU标定', category: 'ecu', definition: '通过各种试验优化ECU中控制参数和MAP数据的过程。' },
  { en: 'MAP (lookup table)', zh: '脉谱图', category: 'ecu', definition: '以转速和负荷为坐标的二维数据表格，存储喷油量、点火角等控制参数。' },
  { en: 'Fuel injection timing', zh: '喷油正时', category: 'ecu', definition: '柴油机喷油器开始喷油的曲轴角度，直接影响燃烧过程和排放。' },
  { en: 'Injection pressure', zh: '喷油压力', category: 'ecu', definition: '燃油从喷油器喷出的压力，高压喷射可改善雾化质量。' },
  { en: 'Injection duration', zh: '喷油脉宽', category: 'ecu', definition: '喷油器开启持续的时间，决定每次循环的喷油量。' },
  { en: 'Pilot injection', zh: '预喷射', category: 'ecu', definition: '在主喷油之前喷入少量燃油以缩短着火延迟、降低燃烧噪声和NOx。' },
  { en: 'Main injection', zh: '主喷射', category: 'ecu', definition: '提供主要输出功量的喷油过程。' },
  { en: 'Post injection', zh: '后喷射', category: 'ecu', definition: '在主喷射之后喷入少量燃油用于DPF再生或DOC中产生反应热。' },
  { en: 'Common rail', zh: '共轨系统', category: 'ecu', definition: '高压油泵向共轨管持续供油，各喷油器从共轨管取油的电控高压喷油系统。' },
  { en: 'Unit injector', zh: '泵喷嘴', category: 'ecu', definition: '喷油泵和喷油器集成为一体的喷油系统，每个气缸独立控制。' },
  { en: 'Ignition timing', zh: '点火正时', category: 'ecu', definition: '火花塞跳火的曲轴角度，影响燃烧相位和发动机性能。' },
  { en: 'Spark advance', zh: '点火提前角', category: 'ecu', definition: '点火时刻相对于压缩上止点的提前角度。' },
  { en: 'Dwell time', zh: '点火闭合角时间', category: 'ecu', definition: '点火线圈初级电路通电储能的时间，影响点火能量。' },
  { en: 'CAN bus', zh: 'CAN总线', category: 'ecu', definition: '控制器局域网络，用于ECU与各子系统之间高速数据传输的通信协议。' },
  { en: 'OBD-II', zh: '车载诊断系统二代', category: 'ecu', definition: '标准化车载诊断系统，监控排放相关部件并通过DTC报告故障。' },
  { en: 'DTC (Diagnostic Trouble Code)', zh: '诊断故障码', category: 'ecu', definition: 'OBD系统在检测到故障时存储的标准化故障代码。' },
  { en: 'MIL (Malfunction Indicator Lamp)', zh: '故障指示灯', category: 'ecu', definition: '仪表盘上的发动机故障警示灯，当OBD检测到排放超标时点亮。' },
  { en: 'Freeze frame', zh: '冻结帧', category: 'ecu', definition: 'OBD系统在检测到故障时记录的车辆运行状态快照，用于故障分析。' },
  { en: 'Drive cycle', zh: '驾驶循环', category: 'ecu', definition: 'OBD系统完成所有监控器检查所需的特定运行工况序列。' },
  { en: 'Adaptive learning', zh: '自适应学习', category: 'ecu', definition: 'ECU根据传感器反馈长期修正控制参数的功能，补偿部件老化和制造公差。' },
  { en: 'Flash / ECU reprogramming', zh: 'ECU刷写', category: 'ecu', definition: '通过诊断接口更新ECU中固件或标定数据的过程。' },
  { en: 'XCP / CCP protocol', zh: 'XCP/CCP标定协议', category: 'ecu', definition: '用于ECU标定和数据采集的标准通信协议，ASAM组织制定。' },
  { en: 'ETAS INCA', zh: 'ETAS INCA标定软件', category: 'ecu', definition: 'ETAS公司开发的ECU标定工具，广泛应用于发动机标定开发。' },
  { en: 'Vector CANape', zh: 'Vector CANape标定软件', category: 'ecu', definition: 'Vector公司开发的ECU测量、标定和诊断工具。' },

  // ==================== Regulation (法规) ====================
  { en: 'Euro 7', zh: '欧7标准', category: 'regulation', definition: '欧洲最新机动车排放法规，2025年起执行，对NOx、PN和制动颗粒物提出更严格限制。' },
  { en: 'China 6', zh: '国六标准', category: 'regulation', definition: '中国第六阶段机动车排放标准，分为6a和6b两个阶段，对NOx和PM要求严格。' },
  { en: 'EPA', zh: '美国环保署', category: 'regulation', definition: '美国环境保护署，制定并执行机动车排放法规的联邦机构。' },
  { en: 'CARB', zh: '加州空气资源委员会', category: 'regulation', definition: '制定加州排放标准（通常比联邦标准更严格）的政府机构。' },
  { en: 'RDE (Real Driving Emissions)', zh: '实际行驶排放', category: 'regulation', definition: '在公共道路上使用便携式排放测量系统测试的车辆实际排放，不得超出实验室测试结果太多。' },
  { en: 'WLTP (Worldwide Harmonized Light Vehicles Test Procedure)', zh: '全球轻型车测试规程', category: 'regulation', definition: '取代NEDC的新测试规程，更贴近实际驾驶工况。' },
  { en: 'NEDC (New European Driving Cycle)', zh: '新欧洲驾驶循环', category: 'regulation', definition: '欧洲旧的排放认证测试循环，由4个城市循环和1个市郊循环组成，被WLTP取代。' },
  { en: 'Conformity factor', zh: '一致性因子', category: 'regulation', definition: 'RDE测试中允许的排放限值相对于实验室限值的倍数。' },
  { en: 'Not-to-exceed (NTE)', zh: '不可超越限值', category: 'regulation', definition: '重型发动机在任何工况下都不得超过的排放限值。' },
  { en: 'Certification', zh: '认证', category: 'regulation', definition: '新型式车辆或发动机在上市前需完成的排放达标验证过程。' },
  { en: 'In-service conformity', zh: '在用符合性', category: 'regulation', definition: '在车辆正常使用寿命期间必须持续满足排放标准的要求。' },
  { en: 'OBD threshold', zh: 'OBD限值', category: 'regulation', definition: '触发OBD故障报警的排放劣化阈值，高于认证限值但低于法规定义的最大值。' },
  { en: 'Durability period', zh: '耐久性期限', category: 'regulation', definition: '排放控制系统必须保持有效工作的时间或里程要求。' },
  { en: 'Off-cycle emissions', zh: '非循环排放', category: 'regulation', definition: '在认证测试循环之外的实际驾驶工况下产生的排放。' },
  { en: 'Defeat device', zh: '失效装置', category: 'regulation', definition: '可感知测试工况并降低排放控制水平的装置或策略，被法规严禁。' },
  { en: 'PEMS (Portable Emissions Measurement System)', zh: '便携式排放测量系统', category: 'regulation', definition: '安装在车辆上的移动排放测试设备，用于RDE测试。' },
  { en: 'Accumulated mileage', zh: '累积里程', category: 'regulation', definition: '耐久性测试中车辆累计行驶的里程数。' },
  { en: 'Taiwan Stage 6', zh: '台湾六期', category: 'regulation', definition: '台湾地区第六阶段机动车排放标准，参考Euro 6制定。' },
  { en: 'Bharat Stage VI (BS VI)', zh: '印度Bharat第六阶段', category: 'regulation', definition: '印度第六阶段机动车排放标准，基于Euro 6制定，2019年起实施。' },
  { en: 'Post-Euro 6', zh: '后欧六阶段', category: 'regulation', definition: '针对Euro 6之后未来排放法规发展方向的研究和讨论。' },
  { en: 'CO₂ fleet target', zh: '车队CO₂目标', category: 'regulation', definition: '汽车制造商各车型平均CO₂排放须满足的法规限值。' },
  { en: 'ZEV mandate', zh: '零排放车强制令', category: 'regulation', definition: '要求制造商销售一定比例零排放车辆的法规要求。' },

  // ==================== Measurement (测量) ====================
  { en: 'NDIR (Non-Dispersive Infrared)', zh: '非色散红外分析', category: 'measurement', definition: '利用气体对特定红外波长吸收原理测量CO、CO₂、HC浓度的光学方法。' },
  { en: 'CLD (Chemiluminescence Detector)', zh: '化学发光检测器', category: 'measurement', definition: '利用NO与O₃反应产生化学发光的原理测量NO/NOx浓度的标准方法。' },
  { en: 'FID (Flame Ionization Detector)', zh: '火焰离子化检测器', category: 'measurement', definition: '利用氢火焰中有机物电离产生电流的原理测量总碳氢浓度的标准方法。' },
  { en: 'PMD (Paramagnetic Detector)', zh: '顺磁检测器', category: 'measurement', definition: '利用氧的顺磁性测量排气中O₂浓度的方法。' },
  { en: 'FTIR (Fourier Transform Infrared)', zh: '傅里叶变换红外光谱', category: 'measurement', definition: '同时测量多种气体成分的红外光谱分析方法，可同时分析NO、NO₂、CO、CO₂、HC、N₂O等。' },
  { en: 'Gravimetric method', zh: '称重法', category: 'measurement', definition: '通过称量滤纸采集前后质量差来测量颗粒物质量的标准方法。' },
  { en: 'HFID (Heated FID)', zh: '加热型FID', category: 'measurement', definition: '加热到191°C的FID检测器，防止高沸点HC冷凝。' },
  { en: 'Dilution tunnel', zh: '稀释通道', category: 'measurement', definition: '用洁净空气稀释排气以模拟大气混合过程的测量通道，用于PM采样。' },
  { en: 'Partial flow dilution', zh: '部分流稀释', category: 'measurement', definition: '只取部分排气进行稀释的PM采样系统，结构紧凑但精度低于全流稀释。' },
  { en: 'Full flow dilution', zh: '全流稀释', category: 'measurement', definition: '将所有排气通入稀释通道的PM采样系统，是基准参考方法。' },
  { en: 'CVS (Constant Volume Sampling)', zh: '定容采样', category: 'measurement', definition: '用恒定流量稀释排气的采样系统，确保采样条件一致。' },
  { en: 'Modal analysis', zh: '模态分析', category: 'measurement', definition: '逐秒分析排放浓度和流量的原始数据，用于排放特性研究。' },
  { en: 'Bag sampling', zh: '袋采样', category: 'measurement', definition: '将稀释排气收集到采样袋中，测试循环结束后统一分析的方法。' },
  { en: 'Modal mass', zh: '模态质量', category: 'measurement', definition: '逐秒累加计算的污染物质量排放量。' },
  { en: 'Carbon balance method', zh: '碳平衡法', category: 'measurement', definition: '根据排气中含碳气体（CO₂、CO、HC）的排放量反算燃料消耗量的方法。' },
  { en: 'Opacity meter', zh: '不透光度计', category: 'measurement', definition: '通过测量光穿过排气烟柱后的衰减来测定烟度的仪器。' },
  { en: 'Smoke meter', zh: '烟度计', category: 'measurement', definition: '包括滤纸式和不透光式在内的烟度测量仪器。' },
  { en: 'Particle counter', zh: '颗粒计数器', category: 'measurement', definition: '测量排气中颗粒物数量的仪器，使用凝聚核粒子计数原理。' },
  { en: 'CPC (Condensation Particle Counter)', zh: '凝聚核粒子计数器', category: 'measurement', definition: '使微小颗粒长大到可光学检测尺寸的颗粒计数装置。' },
  { en: 'ELPI (Electrical Low Pressure Impactor)', zh: '电低压冲击器', category: 'measurement', definition: '实时测量颗粒物粒径分布和数量的仪器。' },
  { en: 'Particle size distribution', zh: '粒径分布', category: 'measurement', definition: '不同直径颗粒物的数量或质量分布特性，影响健康效应和测量方法选择。' },
  { en: 'SMPS (Scanning Mobility Particle Sizer)', zh: '扫描电迁移率粒径谱仪', category: 'measurement', definition: '高分辨率测量纳米级颗粒物粒径分布的仪器。' },
  { en: 'VOC analyzer', zh: 'VOC分析仪', category: 'measurement', definition: '测量挥发性有机化合物浓度的分析仪器，常用GC-FID或PID方法。' },
  { en: 'Gas chromatograph', zh: '气相色谱仪', category: 'measurement', definition: '分离和分析混合气体中各组分浓度的实验室仪器。' },
  { en: 'Mass spectrometer', zh: '质谱仪', category: 'measurement', definition: '根据质荷比分离和检测不同分子量的气体组分，可快速多组分测量。' },
  { en: 'T90 response time', zh: 'T90响应时间', category: 'measurement', definition: '分析仪从输入气体浓度阶跃变化到指示值达到最终值90%所需的时间。' },
  { en: 'Wet-to-dry correction', zh: '湿干基修正', category: 'measurement', definition: '将含水的湿基测量值修正为扣除水蒸气后的干基值的计算过程。' },
  { en: 'Zero drift', zh: '零点漂移', category: 'measurement', definition: '分析仪在零点校准后随时间逐渐偏离零点的现象。' },
  { en: 'Span drift', zh: '量程漂移', category: 'measurement', definition: '分析仪在量程校准后随时间逐渐偏离校准值的现象。' },
  { en: 'Cross interference', zh: '交叉干扰', category: 'measurement', definition: '测量气体时其他共存气体对测量结果产生的干扰效应。' },
  { en: 'Linearity', zh: '线性度', category: 'measurement', definition: '分析仪输出信号与真实浓度之间的线性相关程度。' },
  { en: 'Repeatability', zh: '重复性', category: 'measurement', definition: '同一条件下多次测量同一浓度气体时结果的一致性。' },
  { en: 'Precision', zh: '精密度', category: 'measurement', definition: '测量结果的重复性和分散程度，反映随机误差大小。' },
  { en: 'Accuracy', zh: '准确度', category: 'measurement', definition: '测量值与真实值的接近程度，反映系统误差与随机误差的综合。' },
  { en: 'Detection limit', zh: '检测限', category: 'measurement', definition: '分析仪能够可靠检测到的最低浓度水平。' },

  // ==================== Fuel (燃料) ====================
  { en: 'Gasoline', zh: '汽油', category: 'fuel', definition: '石油分馏获得的轻质燃料，主要用于点燃式发动机，辛烷值是重要品质指标。' },
  { en: 'Diesel', zh: '柴油', category: 'fuel', definition: '石油分馏获得的中质燃料，主要用于压燃式发动机，十六烷值是重要品质指标。' },
  { en: 'LPG (Liquefied Petroleum Gas)', zh: '液化石油气', category: 'fuel', definition: '主要成分为丙烷和丁烷的石油气燃料，储存在压力容器中。' },
  { en: 'CNG (Compressed Natural Gas)', zh: '压缩天然气', category: 'fuel', definition: '压缩至20-25MPa的天然气燃料，主要成分为甲烷。' },
  { en: 'LNG (Liquefied Natural Gas)', zh: '液化天然气', category: 'fuel', definition: '冷却至-162°C液化的天然气燃料，能量密度高于CNG。' },
  { en: 'Ethanol', zh: '乙醇', category: 'fuel', definition: '可再生生物燃料，可由玉米、甘蔗等发酵生产，通常作为汽油掺混组分使用。' },
  { en: 'Methanol', zh: '甲醇', category: 'fuel', definition: '可由煤或天然气制取的醇类燃料，在甲醇燃料汽车或甲醇-汽油混燃中使用。' },
  { en: 'Biodiesel', zh: '生物柴油', category: 'fuel', definition: '由植物油或动物脂肪通过酯交换反应制备的可再生柴油替代燃料。' },
  { en: 'Hydrogen', zh: '氢气', category: 'fuel', definition: '零碳燃料，燃烧产物只有水，可通过电解水或重整天然气生产。' },
  { en: 'Ammonia', zh: '氨', category: 'fuel', definition: '无碳燃料，可通过可再生能源生产，作为氢的载体用于船舶或发电。' },
  { en: 'Dimethyl Ether (DME)', zh: '二甲醚', category: 'fuel', definition: '由煤或天然气制取的含氧燃料，十六烷值高，适合压燃式发动机。' },
  { en: 'E85', zh: 'E85乙醇汽油', category: 'fuel', definition: '含85%乙醇和15%汽油的混合燃料，用于灵活燃料车辆。' },
  { en: 'Cetane number', zh: '十六烷值', category: 'fuel', definition: '衡量柴油自燃特性的指标，数值越高越容易压燃。' },
  { en: 'Octane number', zh: '辛烷值', category: 'fuel', definition: '衡量汽油抗爆震特性的指标，数值越高抗爆性越好。' },
  { en: 'RON (Research Octane Number)', zh: '研究法辛烷值', category: 'fuel', definition: '在低转速工况下测定的汽油辛烷值。' },
  { en: 'MON (Motor Octane Number)', zh: '马达法辛烷值', category: 'fuel', definition: '在高转速工况下测定的汽油辛烷值，更接近高速工况。' },
  { en: 'AKI (Anti-Knock Index)', zh: '抗爆指数', category: 'fuel', definition: 'RON和MON的平均值，美国常用辛烷值标号。' },
  { en: 'Lower heating value (LHV)', zh: '低位热值', category: 'fuel', definition: '燃料完全燃烧时扣除水蒸气汽化潜热后的发热量。' },
  { en: 'Higher heating value (HHV)', zh: '高位热值', category: 'fuel', definition: '燃料完全燃烧时包括水蒸气汽化潜热在内的总发热量。' },
  { en: 'Oxygenate', zh: '含氧燃料', category: 'fuel', definition: '分子中含有氧元素的燃料，如乙醇、甲醇、MTBE等，可减少PM排放。' },
  { en: 'Sulfur content', zh: '硫含量', category: 'fuel', definition: '燃料中硫元素的质量分数，低硫燃料对保护后处理系统至关重要。' },
  { en: 'Vapor pressure', zh: '蒸气压', category: 'fuel', definition: '燃料在指定温度下的饱和蒸气压，影响冷启动和蒸发排放。' },
  { en: 'Cloud point', zh: '浊点', category: 'fuel', definition: '柴油开始析出蜡晶体的温度，影响低温流动性。' },
  { en: 'Pour point', zh: '倾点', category: 'fuel', definition: '柴油还能流动的最低温度，低于此温度时会凝固。' },
  { en: 'Flash point', zh: '闪点', category: 'fuel', definition: '可燃液体蒸气与空气混合遇火源可闪燃的最低温度，是安全指标。' },
  { en: 'GDI (Gasoline Direct Injection)', zh: '汽油直喷', category: 'fuel', definition: '将汽油直接喷入气缸内的供油方式，提高功率和燃油经济性但增加PN排放。' },
  { en: 'PFI (Port Fuel Injection)', zh: '进气道喷射', category: 'fuel', definition: '将汽油喷入进气歧管的供油方式，混合充分但响应不如直喷。' },
  { en: 'HCCI (Homogeneous Charge Compression Ignition)', zh: '均质压燃', category: 'fuel', definition: '利用压缩自燃的均质混合气燃烧方式，兼具汽油机PM低和柴油机效率高的优点。' },
  { en: 'RCCI (Reactivity Controlled Compression Ignition)', zh: '活性控制压燃', category: 'fuel', definition: '使用不同活性燃料控制燃烧过程的双燃料压燃方式。' },
  { en: 'Flexible fuel vehicle', zh: '灵活燃料车辆', category: 'fuel', definition: '可使用任意比例乙醇汽油混合燃料的车辆。' },

  // ==================== OBD (车载诊断) ====================
  { en: 'OBD (On-Board Diagnostics)', zh: '车载诊断系统', category: 'obd', definition: '车辆自诊断系统，实时监控排放控制系统的运行状态。' },
  { en: 'MIL (Malfunction Indicator Light)', zh: '故障指示灯', category: 'obd', definition: '仪表盘上的报警灯，当OBD系统检测到排放相关故障时点亮。' },
  { en: 'DTC (Diagnostic Trouble Code)', zh: '诊断故障码', category: 'obd', definition: 'OBD系统存储的标准化故障编码，用于定位具体故障。' },
  { en: 'Freeze frame data', zh: '冻结帧数据', category: 'obd', definition: '故障发生瞬间记录的车辆运行参数快照，帮助诊断故障原因。' },
  { en: 'Readiness monitor', zh: '就绪监控器', category: 'obd', definition: 'OBD系统中各排放相关系统的自检状态标识。' },
  { en: 'Catalyst monitor', zh: '催化器监控器', category: 'obd', definition: '通过氧传感器信号评估催化转化器效率的OBD功能。' },
  { en: 'Misfire monitor', zh: '失火监控器', category: 'obd', definition: '通过曲轴转速波动检测气缸失火的OBD功能。' },
  { en: 'EGR monitor', zh: 'EGR监控器', category: 'obd', definition: '监测EGR系统流量和功能的OBD诊断功能。' },
  { en: 'Fuel system monitor', zh: '燃油系统监控器', category: 'obd', definition: '监测燃油系统闭环控制状态和修正量的OBD功能。' },
  { en: 'O₂ sensor monitor', zh: '氧传感器监控器', category: 'obd', definition: '监测氧传感器性能和老化状态的OBD功能。' },
  { en: 'Comprehensive component monitor', zh: '综合部件监控器', category: 'obd', definition: '监控所有与排放相关的电气元件（传感器/执行器）的OBD功能。' },
  { en: 'EVAP monitor', zh: '蒸发排放监控器', category: 'obd', definition: '监测燃油蒸发控制系统密封性和功能的OBD诊断。' },
  { en: 'Secondary air monitor', zh: '二次空气监控器', category: 'obd', definition: '监测二次空气喷射系统功能的OBD诊断。' },
  { en: 'NOx adsorber monitor', zh: 'NOx吸附器监控器', category: 'obd', definition: '监测LNT或SCR系统的NOx转化效率的OBD功能。' },
  { en: 'PM filter monitor', zh: '颗粒过滤器监控器', category: 'obd', definition: '监测DPF/GPF的颗粒物捕集效率和再生功能的OBD诊断。' },
  { en: 'OBD scan tool', zh: 'OBD诊断仪', category: 'obd', definition: '通过标准化接口（DLC）读取车辆OBD数据的诊断工具。' },
  { en: 'DLC (Diagnostic Link Connector)', zh: '诊断接口', category: 'obd', definition: 'OBD系统与外部诊断工具连接的标准化16针接口。' },
  { en: 'ISO 15031 / SAE J1979', zh: 'OBD通信标准', category: 'obd', definition: 'OBD系统标准化的诊断服务请求和响应协议。' },
  { en: 'ISO 15765 (CAN-based OBD)', zh: '基于CAN的OBD协议', category: 'obd', definition: '在CAN总线上实现OBD诊断服务的通信协议。' },
  { en: 'Mode $01-$0A', zh: 'OBD模式', category: 'obd', definition: 'OBD标准中定义的诊断服务模式，包括数据请求、冻结帧、故障码等。' },
  { en: 'PID (Parameter ID)', zh: '参数标识符', category: 'obd', definition: 'OBD标准中定义的车辆运行参数编码，通过PID请求可获取实时数据。' },
  { en: 'Warm-up cycle', zh: '暖机循环', category: 'obd', definition: '冷却液温度从启动到上升超过规定值（通常22°C）的运行过程。' },
  { en: 'Trip', zh: '行程', category: 'obd', definition: '从车辆启动到熄火之间包含足够的运行条件以完成OBD监控器检查的过程。' },
  { en: 'Continuous monitor', zh: '连续监控器', category: 'obd', definition: '在发动机运行期间持续诊断的OBD功能，如失火监控和燃油系统监控。' },
  { en: 'Non-continuous monitor', zh: '非连续监控器', category: 'obd', definition: '仅在特定工况条件下执行的OBD诊断功能。' },
  { en: 'Enabling conditions', zh: '使能条件', category: 'obd', definition: '执行OBD非连续监控器所需的特定运行工况条件集合。' },
  { en: 'Threshold limit', zh: '阈值限值', category: 'obd', definition: 'OBD系统触发故障记录的排放劣化水平阈值。' },
  { en: 'Permanent DTC', zh: '永久故障码', category: 'obd', definition: '修理后清除DTC后仍保留在ECU中的故障码，主要用于诊断维修完整性。' },
  { en: 'Pending DTC', zh: '待定故障码', category: 'obd', definition: '故障首次检测到但尚未达到确认条件的临时故障码。' },
  { en: 'Stored DTC', zh: '已存储故障码', category: 'obd', definition: '故障确认后存储在ECU中的正式故障码。' },
  { en: 'I/M readiness', zh: '检查/维护就绪状态', category: 'obd', definition: '车辆年检时检查OBD监控器就绪状态以判断排放系统是否正常。' },
  { en: 'Rationality check', zh: '合理性检查', category: 'obd', definition: '验证传感器信号是否在合理范围内的OBD诊断方法。' },
  { en: 'Functional check', zh: '功能性检查', category: 'obd', definition: '验证执行器或系统功能是否正常的OBD诊断方法。' },
  { en: 'Electrical check', zh: '电气检查', category: 'obd', definition: '验证传感器/执行器电路是否存在开路、短路等电气故障的OBD诊断。' },
  { en: 'ISO 14229 (UDS)', zh: '统一诊断服务', category: 'obd', definition: '超越OBD的标准诊断协议，支持更丰富的诊断服务，用于售后诊断。' },
]

/* ---- State ---- */
const searchQuery = ref('')
const activeCategory = ref('all')
const expandedTerm = ref<GlossaryTerm | null>(null)
const activeLetter = ref('')
const currentPage = ref(1)
const pageSize = 15
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/* ---- Computed ---- */
const filteredTerms = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return terms.filter((t) => {
    // category filter
    if (activeCategory.value !== 'all' && t.category !== activeCategory.value) return false

    // search filter
    if (!q) return true
    const en = t.en.toLowerCase()
    const zh = t.zh
    const def = t.definition.toLowerCase()
    // Try pinyin conversion of the Chinese term
    let py = ''
    try {
      py = pinyin(zh, { toneType: 'none', type: 'string' }).toLowerCase()
    } catch {
      py = ''
    }
    let pyDef = ''
    try {
      pyDef = pinyin(def.substring(0, 60), { toneType: 'none', type: 'string' }).toLowerCase()
    } catch {
      pyDef = ''
    }
    return en.includes(q) || zh.includes(q) || def.includes(q) || py.includes(q) || pyDef.includes(q)
  })
})

const totalPages = computed(() => Math.ceil(filteredTerms.value.length / pageSize))

const pagedTerms = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTerms.value.slice(start, start + pageSize)
})

/* ---- Methods ---- */
function toggleTerm(term: GlossaryTerm) {
  if (expandedTerm.value?.en === term.en) {
    expandedTerm.value = null
  } else {
    expandedTerm.value = term
  }
}

function categoryLabel(key: string): string {
  return categories.find((c) => c.key === key)?.label ?? key
}

function scrollToLetter(letter: string) {
  activeLetter.value = letter
  const idx = terms.findIndex((t) => t.en.toUpperCase().startsWith(letter))
  if (idx >= 0) {
    const found = terms[idx]
    const globalIndex = filteredTerms.value.findIndex((t) => t.en === found.en)
    if (globalIndex >= 0) {
      currentPage.value = Math.floor(globalIndex / pageSize) + 1
    }
  }
}

// Reset page when search or category changes
watch([searchQuery, activeCategory], () => {
  currentPage.value = 1
  expandedTerm.value = null
})
</script>

<style scoped lang="scss">
$white: #f5f5f0;
$orange: #ff8800;
$black: #1a1a1a;

.glossary {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
  background: $white;
  color: $black;

  &__header {
    text-align: center;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    color: $orange;
    margin: 0 0 4px;
    letter-spacing: 1px;
  }

  &__subtitle {
    font-size: 13px;
    color: lighten($black, 40%);
    margin: 0;
  }

  &__search-bar {
    margin-bottom: 20px;
  }

  &__search-input {
    :deep(.el-input__wrapper) {
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      &:hover,
      &.is-focus {
        box-shadow: 0 2px 12px rgba($orange, 0.2);
      }
    }
    :deep(.el-input__inner) {
      font-size: 15px;
    }
  }

  &__categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    justify-content: center;
  }

  &__category-tag {
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
    &:hover {
      transform: translateY(-1px);
    }
  }

  &__body {
    display: flex;
    gap: 20px;
  }

  &__list {
    flex: 1;
    min-width: 0;
  }

  &__term-card {
    background: #fff;
    border: 1px solid darken($white, 8%);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $orange;
      box-shadow: 0 2px 8px rgba($orange, 0.12);
    }

    &--expanded {
      border-color: $orange;
      border-left: 4px solid $orange;
      background: rgba($orange, 0.03);
    }
  }

  &__term-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__term-en {
    font-weight: 600;
    font-size: 14px;
    min-width: 200px;
    color: $black;
  }

  &__term-zh {
    font-size: 14px;
    color: lighten($black, 20%);
    min-width: 100px;
  }

  &__term-cat {
    margin-left: auto;
    flex-shrink: 0;
  }

  &__term-definition {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid darken($white, 8%);
    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.7;
      color: lighten($black, 15%);
    }
  }

  &__empty {
    padding: 60px 0;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  &__index {
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: sticky;
    top: 24px;
    align-self: flex-start;
  }

  &__index-btn {
    width: 28px;
    height: 22px;
    border: none;
    background: transparent;
    color: lighten($black, 40%);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s;

    &:hover {
      background: rgba($orange, 0.1);
      color: $orange;
    }

    &--active {
      background: $orange;
      color: #fff;
    }
  }
}
</style>
