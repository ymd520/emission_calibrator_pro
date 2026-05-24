import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      // 工具箱
      {
        path: 'tool/unit-converter',
        name: 'UnitConverter',
        component: () => import('@/views/toolbox/UnitConverter.vue'),
        meta: { title: '单位转换器' }
      },
      {
        path: 'tool/emission-calculator',
        name: 'EmissionCalculator',
        component: () => import('@/views/toolbox/EmissionCalculator.vue'),
        meta: { title: '排放计算器' }
      },
      {
        path: 'tool/tuning-calculator',
        name: 'TuningCalculator',
        component: () => import('@/views/toolbox/TuningCalculator.vue'),
        meta: { title: '调校参数计算器' }
      },
      {
        path: 'tool/fuel-chemistry',
        name: 'FuelChemistry',
        component: () => import('@/views/toolbox/FuelChemistry.vue'),
        meta: { title: '燃料与燃烧化学' }
      },
      {
        path: 'tool/pid-tuner',
        name: 'PIDTuner',
        component: () => import('@/views/toolbox/PIDTuner.vue'),
        meta: { title: 'PID 调参工具箱' }
      },
      {
        path: 'tool/rde-processor',
        name: 'RDEProcessor',
        component: () => import('@/views/toolbox/RDEProcessor.vue'),
        meta: { title: 'RDE 道路排放数据处理' }
      },
      {
        path: 'tool/data-processor',
        name: 'DataProcessor',
        component: () => import('@/views/toolbox/DataProcessor.vue'),
        meta: { title: '数据后处理工具箱' }
      },
      {
        path: 'tool/diagnostic-assistant',
        name: 'DiagnosticAssistant',
        component: () => import('@/views/toolbox/DiagnosticAssistant.vue'),
        meta: { title: '排放超标诊断助手' }
      },
      {
        path: 'tool/obd-tools',
        name: 'OBDTools',
        component: () => import('@/views/toolbox/OBDTools.vue'),
        meta: { title: 'OBD 诊断工具' }
      },
      {
        path: 'tool/file-tools',
        name: 'FileTools',
        component: () => import('@/views/toolbox/FileTools.vue'),
        meta: { title: '文件工具' }
      },
      {
        path: 'tool/music-generator',
        name: 'MusicGenerator',
        component: () => import('@/views/toolbox/MusicGenerator.vue'),
        meta: { title: '排放音乐生成器' }
      },
      // 知识库
      {
        path: 'knowledge/regulations',
        name: 'Regulations',
        component: () => import('@/views/knowledge/Regulations.vue'),
        meta: { title: '排放法规库' }
      },
      {
        path: 'knowledge/encyclopedia',
        name: 'Encyclopedia',
        component: () => import('@/views/knowledge/Encyclopedia.vue'),
        meta: { title: '技术百科' }
      },
      {
        path: 'knowledge/glossary',
        name: 'Glossary',
        component: () => import('@/views/knowledge/Glossary.vue'),
        meta: { title: '术语词典' }
      },
      {
        path: 'knowledge/formula-handbook',
        name: 'FormulaHandbook',
        component: () => import('@/views/knowledge/FormulaHandbook.vue'),
        meta: { title: '公式手册' }
      },
      {
        path: 'knowledge/data-tables',
        name: 'DataTables',
        component: () => import('@/views/knowledge/DataTables.vue'),
        meta: { title: '数据表' }
      },
      // 工作流向导
      {
        path: 'wizard/emission-test',
        name: 'EmissionTestWizard',
        component: () => import('@/views/wizard/EmissionTestWizard.vue'),
        meta: { title: '排放测试向导' }
      },
      {
        path: 'wizard/diagnosis',
        name: 'DiagnosisWizard',
        component: () => import('@/views/wizard/DiagnosisWizard.vue'),
        meta: { title: '超标诊断向导' }
      },
      {
        path: 'wizard/tuning',
        name: 'TuningWizard',
        component: () => import('@/views/wizard/TuningWizard.vue'),
        meta: { title: '调校参数向导' }
      },
      {
        path: 'wizard/sensor-calibration',
        name: 'SensorCalibrationWizard',
        component: () => import('@/views/wizard/SensorCalibrationWizard.vue'),
        meta: { title: '传感器安装校准向导' }
      },
      // 设置
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
