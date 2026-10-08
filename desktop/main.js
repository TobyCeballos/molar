const { app, BrowserWindow, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let backend;
let logDir;
let mainWindow;
let splashWindow;

const molarRoot = process.env.APPDATA ? path.join(process.env.APPDATA, 'Molar') : path.join(app.getPath('userData'), 'Molar');
fs.mkdirSync(path.join(molarRoot, 'desktop'), { recursive: true });
app.setPath('userData', path.join(molarRoot, 'desktop'));

function isBackendReady() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:8080/api/health', res => { res.resume(); resolve(res.statusCode === 200); });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

async function waitForBackend() {
  for (let i = 0; i < 40; i++) { if (await isBackendReady()) return true; await new Promise(resolve => setTimeout(resolve, 500)); }
  return false;
}

function createSplash() {
  const logoFile = path.join(process.resourcesPath, 'molar-logo.png');
  const logoData = fs.existsSync(logoFile) ? fs.readFileSync(logoFile).toString('base64') : '';
  splashWindow = new BrowserWindow({ width: 420, height: 260, show: false, frame: false, resizable: false, fullscreen: false, alwaysOnTop: true, backgroundColor: '#0D1B33', webPreferences: { contextIsolation: true } });
  const splash = encodeURIComponent(`<!doctype html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box}body{margin:0;height:100vh;display:grid;place-items:center;background:#0D1B33;color:#fff;font-family:Segoe UI,Arial,sans-serif}.content{text-align:center}.logo{width:210px;height:105px;object-fit:cover;border-radius:10px;display:block;margin:0 auto 14px}.brand{font-size:28px;font-weight:800;letter-spacing:.22em}.message{margin-top:18px;color:#dce9e8;font-size:14px}.spinner{width:30px;height:30px;margin:20px auto 0;border:3px solid #ffffff45;border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="content"><img class="logo" src="data:image/png;base64,${logoData}" alt="Molar"><div class="brand">MOLAR</div><div class="message">Cargando tu espacio de trabajo…</div><div class="spinner"></div></div></body></html>`);
  splashWindow.loadURL(`data:text/html;charset=utf-8,${splash}`);
  splashWindow.once('ready-to-show', () => splashWindow.show());
  splashWindow.on('closed', () => { splashWindow = null; });
}

function closeSplash() { if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close(); }

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1280, height: 800, show: false, fullscreen: false, autoHideMenuBar: true, webPreferences: { contextIsolation: true } });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('https://wa.me/')) shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.loadFile(path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'), { query: { version: app.getVersion() } });
  mainWindow.once('ready-to-show', () => { mainWindow.maximize(); closeSplash(); mainWindow.show(); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function configureAutoUpdater() {
  if (!app.isPackaged) return;
  const isBeta = app.getVersion().includes('-beta') || app.getVersion().includes('-alpha');
  if (isBeta) { autoUpdater.channel = app.getVersion().includes('-alpha') ? 'alpha' : 'beta'; autoUpdater.allowPrerelease = true; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', error => fs.appendFileSync(path.join(logDir, 'updater.log'), `\n${new Date().toISOString()} ${error.stack || error.message}\n`));
  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox({ type: 'info', title: 'Actualización lista', message: `Molar ${autoUpdater.currentVersion.version} descargó una actualización.`, detail: 'Podés reiniciar ahora o continuar trabajando. Si elegís “Más tarde”, se instalará automáticamente al cerrar Molar.', buttons: ['Reiniciar ahora', 'Más tarde'], defaultId: 0 });
    if (result.response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.checkForUpdatesAndNotify();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.whenReady().then(async () => {
    createSplash();
    const dataRoot = molarRoot;
    logDir = path.join(dataRoot, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(dataRoot, 'logs', 'backend.log');
    const logFd = fs.openSync(logPath, 'a');
    const java = path.join(process.resourcesPath, 'jre', 'bin', 'java.exe');
    backend = spawn(java, ['-jar', path.join(process.resourcesPath, 'molar-backend.jar')], { windowsHide: true, stdio: ['ignore', logFd, logFd] });
    backend.on('error', error => fs.appendFileSync(logPath, `\n${new Date().toISOString()} ${error.stack}\n`));
    if (await waitForBackend()) { createWindow(); configureAutoUpdater(); }
    else { closeSplash(); await dialog.showMessageBox({ type: 'error', title: 'Molar no pudo iniciar', message: 'El backend no respondió. Revisá el log en %APPDATA%\\Molar\\logs\\backend.log.' }); app.quit(); }
  });
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  app.on('before-quit', () => { if (backend && !backend.killed) backend.kill(); });
}
