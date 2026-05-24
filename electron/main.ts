import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import fs from 'fs'
import { createServer } from 'http'

let mainWindow: BrowserWindow | null = null
let httpServer: ReturnType<typeof createServer> | null = null
let serverPort: number | null = null

/**
 * ★ 启动本地 HTTP 服务器（生产模式）
 * 避免 ES Module 在 file:// 协议下被 Chromium 阻止加载
 * 以及自定义 app:// 协议的各种兼容性问题
 */
function startLocalServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const distPath = path.join(__dirname, '..', 'dist')

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
      '.map': 'application/json',
    }

    httpServer = createServer((req, res) => {
      let reqPath = req.url || '/'
      // SPA: 根路径或无后缀路径都返回 index.html
      if (reqPath === '/' || !path.extname(reqPath.split('?')[0])) {
        reqPath = '/index.html'
      }

      const filePath = path.join(distPath, reqPath)
      const ext = path.extname(filePath).toLowerCase()

      try {
        const data = fs.readFileSync(filePath)
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(data)
      } catch {
        // SPA fallback: 所有未匹配路径返回 index.html
        try {
          const data = fs.readFileSync(path.join(distPath, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(data)
        } catch {
          res.writeHead(500)
          res.end('Error loading application')
        }
      }
    })

    httpServer.listen(0, '127.0.0.1', () => {
      const addr = httpServer!.address()
      if (addr && typeof addr === 'object') {
        resolve(addr.port)
      } else {
        reject(new Error('Failed to get server port'))
      }
    })

    httpServer.on('error', reject)
  })
}

function createWindow(port?: number | null) {
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

  // ★ 加载页面
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else if (port) {
    mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`)
  }

  // Debug: 启动时自动打开 DevTools
  mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC 处理
ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('get-platform', () => process.platform)
ipcMain.handle('search-global', async (_event, query: string) => ({ query }))

// ★ 启动流程
app.whenReady().then(async () => {
  if (!process.env.VITE_DEV_SERVER_URL) {
    // 生产模式：先启动服务器，再创建窗口
    serverPort = await startLocalServer()
    console.log(`[EmissionCalibrator] HTTP server started on 127.0.0.1:${serverPort}`)
  }
  createWindow(serverPort)
})

app.on('window-all-closed', () => {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (!process.env.VITE_DEV_SERVER_URL && !httpServer) {
      app.whenReady().then(async () => {
        serverPort = await startLocalServer()
        createWindow(serverPort)
      })
    } else {
      createWindow(serverPort)
    }
  }
})
