import { app, BrowserWindow, ipcMain, Menu, protocol } from 'electron'
import path from 'path'
import fs from 'fs'

// ★ 修复白屏：注册自定义协议绕过 file:// 下 ES Module 限制
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: false } }
])

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const isDev = process.env.VITE_DEV_SERVER_URL

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 540,
    title: 'EmissionCalibrator Pro',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    show: false,
    backgroundColor: '#1A1A1A',
    titleBarStyle: 'default',
    frame: true
  })

  // 设置菜单栏
  const menu = Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        { label: '导入数据', accelerator: 'CmdOrCtrl+O' },
        { type: 'separator' },
        { label: '导出报告', accelerator: 'CmdOrCtrl+E' },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { label: '重置缩放', role: 'resetZoom' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于 EmissionCalibrator Pro' }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else {
    // ★ 修复：使用 app:// 协议替代 file://，使 ES Module 正常加载
    mainWindow.loadURL('app://./dist/index.html')
  }

  // Debug: auto-open DevTools on startup
  mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC 处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-platform', () => {
  return process.platform
})

// 全局搜索
ipcMain.handle('search-global', async (_event, query: string) => {
  // 搜索逻辑在渲染进程中处理
  return { query }
})

app.whenReady().then(() => {
  // ★ 修复：使用 fs.readFileSync（ASAR-aware）替代 net.fetch（不识别 ASAR）
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    let filePath = decodeURIComponent(url.pathname)
    // 处理 app://./dist/index.html 这类路径
    if (filePath.startsWith('/./')) filePath = filePath.substring(2)

    const fullPath = path.join(__dirname, '..', filePath)
    const ext = path.extname(fullPath).toLowerCase()

    const mimeTypes: Record<string, string> = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    }

    try {
      const data = fs.readFileSync(fullPath)
      return new Response(data, {
        headers: { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' }
      })
    } catch {
      // SPA fallback: 未匹配路径返回 index.html（支持 Vue Router history 模式）
      const data = fs.readFileSync(path.join(__dirname, '../dist/index.html'))
      return new Response(data, {
        headers: { 'Content-Type': 'text/html' }
      })
    }
  })
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
