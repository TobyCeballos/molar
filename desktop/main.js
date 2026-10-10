const { app, BrowserWindow, dialog, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let backend;
let logDir;
let mainWindow;
let splashWindow;
let updateDownloaded = false;
let updaterState = { status: 'current', message: 'Molar está actualizado.', currentVersion: app.getVersion(), availableVersion: null };

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

function storedLicenseEnvironment() {
  try {
    const licenseFile = path.join(molarRoot, 'data', 'license.json');
    const license = JSON.parse(fs.readFileSync(licenseFile, 'utf8'));
    return {
      MOLAR_TENANT_ID: license.tenantId || '',
      MOLAR_INSTALLATION_ID: license.installationId || '',
      MOLAR_INSTALLATION_TOKEN: license.installationToken || ''
    };
  } catch (_) {
    return {};
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({ icon: path.join(process.resourcesPath, 'molar.ico'), width: 1280, height: 800, show: false, fullscreen: false, autoHideMenuBar: true, webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') } });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('https://wa.me/')) shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.loadFile(path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'), { query: { version: app.getVersion() } });
  mainWindow.once('ready-to-show', () => { mainWindow.maximize(); closeSplash(); mainWindow.show(); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function sendUpdaterStatus(status, message, progress, version) { updaterState = { status, message, progress, currentVersion: app.getVersion(), availableVersion: version || updaterState.availableVersion || null }; if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) mainWindow.webContents.send('updater-status', updaterState); }

function configureAutoUpdater() {
  if (!app.isPackaged) return;
  const isBeta = app.getVersion().includes('-beta') || app.getVersion().includes('-alpha');
  if (isBeta) { autoUpdater.channel = app.getVersion().includes('-alpha') ? 'alpha' : 'beta'; autoUpdater.allowPrerelease = true; }
  autoUpdater.autoDownload = true;
  autoUpdater.on('checking-for-update', () => sendUpdaterStatus('checking', 'Buscando actualizaciones…'));
  autoUpdater.on('update-available', info => sendUpdaterStatus('downloading', `Descargando Molar ${info.version} en segundo plano…`, 0, info.version));
  autoUpdater.on('download-progress', progress => sendUpdaterStatus('downloading', `Descargando actualización: ${Math.round(progress.percent)}%`, progress.percent));
  autoUpdater.on('update-not-available', () => sendUpdaterStatus('current', 'Molar está actualizado.'));
  mainWindow.webContents.on('did-finish-load', () => sendUpdaterStatus('checking', 'Buscando actualizaciones…'));
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', error => { sendUpdaterStatus('error', 'No se pudo verificar la actualización. Molar seguirá funcionando.'); fs.appendFileSync(path.join(logDir, 'updater.log'), `\n${new Date().toISOString()} ${error.stack || error.message}\n`); });
  autoUpdater.on('update-downloaded', info => { updateDownloaded = true; sendUpdaterStatus('ready', `Molar ${info.version} está listo para instalar.`, 100, info.version); dialog.showMessageBox(mainWindow, { type: 'info', title: 'Actualización lista', message: `Molar ${info.version} está listo para instalar.`, detail: 'Podés instalarla ahora o hacerlo al cerrar la aplicación.', buttons: ['Instalar ahora', 'Más tarde'], defaultId: 0, cancelId: 1 }).then(result => { if (result.response === 0 && updateDownloaded) autoUpdater.quitAndInstall(); }); });
  ipcMain.handle('updater:status', () => updaterState);
  ipcMain.handle('updater:check', async () => { if (!app.isPackaged) return { status: 'development', message: 'Actualizaciones disponibles en la versión instalada.' }; try { await autoUpdater.checkForUpdates(); return { status: updateDownloaded ? 'ready' : 'checking' }; } catch (_) { return { status: 'error', message: 'No se pudo verificar la actualización.' }; } });
  ipcMain.handle('updater:install', () => { if (updateDownloaded) autoUpdater.quitAndInstall(); return updateDownloaded; });
  setInterval(() => { if (!updateDownloaded) autoUpdater.checkForUpdates().catch(() => {}); }, 10 * 60 * 1000);
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
    backend = spawn(java, ['-jar', path.join(process.resourcesPath, 'molar-backend.jar')], { windowsHide: true, env: { ...process.env, ...storedLicenseEnvironment() }, stdio: ['ignore', logFd, logFd] });
    backend.on('error', error => fs.appendFileSync(logPath, `\n${new Date().toISOString()} ${error.stack}\n`));
    if (await waitForBackend()) { createWindow(); configureAutoUpdater(); }
    else { closeSplash(); await dialog.showMessageBox({ type: 'error', title: 'Molar no pudo iniciar', message: 'El backend no respondió. Revisá el log en %APPDATA%\\Molar\\logs\\backend.log.' }); app.quit(); }
  });
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  app.on('before-quit', () => { if (backend && !backend.killed) backend.kill(); });
}
