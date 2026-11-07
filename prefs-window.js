// The Settings window: a normal, focusable window.
const path = require('path');
const { BrowserWindow, ipcMain } = require('electron');
const features = require('./features');

let win = null;
let prefsDummy = null;
function getPrefsDummy() {
  if (!prefsDummy || prefsDummy.isDestroyed()) {
    prefsDummy = new BrowserWindow({
      show: false,
      width: 0,
      height: 0,
      skipTaskbar: true,
      focusable: false,
    });
  }
  return prefsDummy;
}

function open() {
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    return;
  }
  win = new BrowserWindow({
    parent: getPrefsDummy(),
    width: 780,
    height: 580,
    minWidth: 640,
    minHeight: 480,
    frame: false,
    show: false,
    backgroundColor: '#101016',
    title: 'HyperNova — Dynamic Island for Desktop',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    skipTaskbar: features.get().skipTaskbar !== false,
    webPreferences: {
      preload: path.join(__dirname, 'prefs', 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.setMenu(null);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadFile(path.join(__dirname, 'prefs', 'index.html'));
  
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });
  // Fallback show in case ready-to-show event had race
  win.webContents.once('did-finish-load', () => {
    if (win && !win.isVisible()) win.show();
  });
  win.on('closed', () => { win = null; });
}

function send(channel, data) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data);
    if (channel === 'features' && data && typeof data.skipTaskbar !== 'undefined') {
      win.setSkipTaskbar(data.skipTaskbar !== false);
    }
  }
}

ipcMain.on('prefs-window', (e, action) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w || w !== win) return;
  if (action === 'close') w.close();
  else if (action === 'minimize') w.minimize();
});

module.exports = { open, send };
